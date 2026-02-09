const Discussion = require('../models/Discussion');
const Event = require('../models/Event');

exports.getEventDiscussions = async (req, res, next) => {
  try {
    const eventId = req.params.eventId;
    
    const discussions = await Discussion.find({ event: eventId, isDeleted: false })
      .sort({ isPinned: -1, createdAt: -1 })
      .lean();

    res.json({ success: true, discussions });
  } catch (error) {
    next(error);
  }
};

exports.postMessage = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { message, isAnnouncement } = req.body;

    let authorData;
    if (req.userRole === 'participant') {
      authorData = {
        authorType: 'participant',
        authorId: req.user._id,
        authorModel: 'User',
        authorName: `${req.user.firstName} ${req.user.lastName}`,
      };
    } else if (req.userRole === 'organizer') {
      authorData = {
        authorType: 'organizer',
        authorId: req.organizer._id,
        authorModel: 'Organizer',
        authorName: req.organizer.name,
      };
    }

    const discussion = await Discussion.create({
      event: eventId,
      author: authorData,
      message,
      isAnnouncement: isAnnouncement || false,
    });

    // Emit socket event
    const io = req.app.get('io');
    io.to(`event-${eventId}`).emit('new-message', discussion);

    res.status(201).json({ success: true, discussion });
  } catch (error) {
    next(error);
  }
};

exports.deleteMessage = async (req, res, next) => {
  try {
    const message = await Discussion.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only organizer can delete
    if (req.userRole !== 'organizer') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.isDeleted = true;
    message.deletedBy = req.organizer._id;
    await message.save();

    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    next(error);
  }
};

exports.pinMessage = async (req, res, next) => {
  try {
    const message = await Discussion.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (req.userRole !== 'organizer') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    message.isPinned = !message.isPinned;
    await message.save();

    res.json({ success: true, message: message.isPinned ? 'Message pinned' : 'Message unpinned' });
  } catch (error) {
    next(error);
  }
};

exports.reactToMessage = async (req, res, next) => {
  try {
    const { emoji } = req.body;
    const message = await Discussion.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    const existingReaction = message.reactions.find(r => r.user.toString() === req.user._id.toString());

    if (existingReaction) {
      message.reactions = message.reactions.filter(r => r.user.toString() !== req.user._id.toString());
    } else {
      message.reactions.push({ user: req.user._id, emoji });
    }

    await message.save();
    res.json({ success: true, reactions: message.reactions });
  } catch (error) {
    next(error);
  }
};