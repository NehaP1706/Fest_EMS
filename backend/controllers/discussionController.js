const Discussion = require('../models/Discussion');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

// Helper: determine if requester is organizer of the event
const isEventOrganizer = (event, req) => {
  if (!req.organizer) return false;
  return event.organizer.toString() === req.organizer._id.toString();
};

// Helper: populate author fields
const POPULATE = [
  { path: 'author', select: 'firstName lastName name email' },
];

// GET /api/discussions/:eventId
// Returns pinned messages first, then chronological. Includes reply counts.
exports.getMessages = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const messages = await Discussion.find({
      event: eventId,
      parentMessage: null, // top-level only
      isDeleted: false,
    })
      .populate(POPULATE)
      .sort({ isPinned: -1, isAnnouncement: -1, createdAt: 1 })
      .lean();

    // Attach reply counts and full replies
    const ids = messages.map(m => m._id);
    const replies = await Discussion.find({
      parentMessage: { $in: ids },
      isDeleted: false,
    })
      .populate(POPULATE)
      .sort({ createdAt: 1 })
      .lean();

    const replyMap = {};
    replies.forEach(r => {
      const key = r.parentMessage.toString();
      if (!replyMap[key]) replyMap[key] = [];
      replyMap[key].push(r);
    });

    const enriched = messages.map(m => ({
      ...m,
      replies: replyMap[m._id.toString()] || [],
      replyCount: (replyMap[m._id.toString()] || []).length,
    }));

    res.json({ success: true, messages: enriched });
  } catch (error) {
    next(error);
  }
};

// POST /api/discussions/:eventId
// Post a new top-level message
exports.postMessage = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { content, isAnnouncement } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message content is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    // Determine author type and permissions
    let authorModel, authorId, authorName;

    if (req.organizer) {
      authorModel = 'Organizer';
      authorId = req.organizer._id;
      authorName = req.organizer.name || 'Organizer';
    } else if (req.user) {
      authorModel = 'User';
      authorId = req.user._id;
      authorName = `${req.user.firstName} ${req.user.lastName}`;
    } else {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    // Only organizers can post announcements
    if (isAnnouncement && authorModel !== 'Organizer') {
      return res.status(403).json({ success: false, message: 'Only organizers can post announcements' });
    }

    const message = await Discussion.create({
      event: eventId,
      author: authorId,
      authorModel,
      authorName,
      content: content.trim(),
      isAnnouncement: isAnnouncement && authorModel === 'Organizer',
    });

    await message.populate(POPULATE);

    // Emit via socket.io
    const io = req.app.get('io');
    if (io) {
      io.to(`event-${eventId}`).emit('new-message', {
        ...message.toObject(),
        replies: [],
        replyCount: 0,
      });

      // Notification for announcements
      if (message.isAnnouncement) {
        io.to(`event-${eventId}`).emit('announcement', {
          messageId: message._id,
          content: message.content,
          authorName,
        });
      }
    }

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// POST /api/discussions/:messageId/reply
// Post a reply to an existing message
exports.postReply = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reply content is required' });
    }

    const parent = await Discussion.findById(messageId);
    if (!parent || parent.isDeleted) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    let authorModel, authorId, authorName;
    if (req.organizer) {
      authorModel = 'Organizer';
      authorId = req.organizer._id;
      authorName = req.organizer.name || 'Organizer';
    } else if (req.user) {
      authorModel = 'User';
      authorId = req.user._id;
      authorName = `${req.user.firstName} ${req.user.lastName}`;
    } else {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const reply = await Discussion.create({
      event: parent.event,
      author: authorId,
      authorModel,
      authorName,
      content: content.trim(),
      parentMessage: parent._id,
    });

    await reply.populate(POPULATE);

    const io = req.app.get('io');
    if (io) {
      io.to(`event-${parent.event}`).emit('new-reply', {
        parentId: parent._id,
        reply: reply.toObject(),
      });
    }

    res.status(201).json({ success: true, reply });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/discussions/:messageId
// Organizers can delete any message; users can delete their own
exports.deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    const message = await Discussion.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const isOrg = req.organizer;
    const isOwner = req.user && message.author.toString() === req.user._id.toString();

    if (!isOrg && !isOwner) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    message.isDeleted = true;
    message.deletedBy = req.organizer?._id || req.user?._id;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`event-${message.event}`).emit('message-deleted', { messageId });
    }

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

// POST /api/discussions/:messageId/pin
// Toggle pin — organizers only
exports.pinMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;

    if (!req.organizer) {
      return res.status(403).json({ success: false, message: 'Only organizers can pin messages' });
    }

    const message = await Discussion.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    const io = req.app.get('io');
    if (io) {
      io.to(`event-${message.event}`).emit('message-pinned', {
        messageId,
        isPinned: message.isPinned,
      });
    }

    res.json({ success: true, isPinned: message.isPinned });
  } catch (error) {
    next(error);
  }
};

// POST /api/discussions/:messageId/react
// Toggle a reaction emoji
exports.reactToMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    const ALLOWED = ['👍', '❤️', '😂', '😮', '👏'];
    if (!ALLOWED.includes(emoji)) {
      return res.status(400).json({ success: false, message: 'Invalid emoji' });
    }

    let userId, userModel;
    if (req.organizer) {
      userId = req.organizer._id;
      userModel = 'Organizer';
    } else if (req.user) {
      userId = req.user._id;
      userModel = 'User';
    } else {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const message = await Discussion.findById(messageId);
    if (!message || message.isDeleted) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Toggle: remove if already reacted with same emoji, else add
    const existingIdx = message.reactions.findIndex(
      r => r.user.toString() === userId.toString() && r.emoji === emoji
    );

    if (existingIdx >= 0) {
      message.reactions.splice(existingIdx, 1);
    } else {
      // Remove any other emoji from this user first (one reaction per user)
      const otherIdx = message.reactions.findIndex(
        r => r.user.toString() === userId.toString()
      );
      if (otherIdx >= 0) message.reactions.splice(otherIdx, 1);
      message.reactions.push({ user: userId, userModel, emoji });
    }

    await message.save();

    // Summarize reactions as { emoji: count }
    const summary = {};
    message.reactions.forEach(r => {
      summary[r.emoji] = (summary[r.emoji] || 0) + 1;
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`event-${message.event}`).emit('reaction-updated', {
        messageId,
        reactions: summary,
        userReaction: existingIdx >= 0 ? null : emoji, // null = removed
      });
    }

    res.json({ success: true, reactions: summary });
  } catch (error) {
    next(error);
  }
};

// POST /api/discussions/:eventId/mark-read
// Mark all messages as read for notification badge clearing
exports.markRead = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?._id || req.organizer?._id;
    if (!userId) return res.status(401).json({ success: false });

    await Discussion.updateMany(
      { event: eventId, readBy: { $ne: userId } },
      { $addToSet: { readBy: userId } }
    );

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// GET /api/discussions/:eventId/unread-count
exports.getUnreadCount = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const userId = req.user?._id || req.organizer?._id;
    if (!userId) return res.json({ success: true, count: 0 });

    const count = await Discussion.countDocuments({
      event: eventId,
      isDeleted: false,
      readBy: { $ne: userId },
    });

    res.json({ success: true, count });
  } catch (error) {
    next(error);
  }
};