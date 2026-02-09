const Event = require('../models/Event');
const Organizer = require('../models/Organizer');

// @desc    Get all events with filters
// @route   GET /api/events
// @access  Public
exports.getAllEvents = async (req, res, next) => {
  try {
    const {
      search,
      eventType,
      eligibility,
      dateFrom,
      dateTo,
      organizer,
      tags,
      followedOnly,
    } = req.query;

    let query = { status: 'published' };

    // Search
    if (search) {
      query.$text = { $search: search };
    }

    // Filters
    if (eventType) query.eventType = eventType;
    if (eligibility) query.eligibility = eligibility;
    if (organizer) query.organizer = organizer;
    if (tags) query.tags = { $in: tags.split(',') };

    // Date range
    if (dateFrom || dateTo) {
      query.eventStartDate = {};
      if (dateFrom) query.eventStartDate.$gte = new Date(dateFrom);
      if (dateTo) query.eventStartDate.$lte = new Date(dateTo);
    }

    // Followed clubs (if user is logged in)
    if (followedOnly && req.user) {
      query.organizer = { $in: req.user.followedOrganizers };
    }

    const events = await Event.find(query)
      .populate('organizer', 'name category')
      .sort({ eventStartDate: 1 });

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get trending events (top 5 in last 24h)
// @route   GET /api/events/trending
// @access  Public
exports.getTrendingEvents = async (req, res, next) => {
  try {
    const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const events = await Event.find({
      status: 'published',
      lastViewedAt: { $gte: last24h },
    })
      .sort({ viewCount: -1 })
      .limit(5)
      .populate('organizer', 'name category');

    res.json({
      success: true,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single event
// @route   GET /api/events/:id
// @access  Public
exports.getEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name category description contactEmail');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Increment view count
    event.viewCount += 1;
    event.lastViewedAt = new Date();
    await event.save();

    res.json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new event
// @route   POST /api/events
// @access  Private (Organizer)
exports.createEvent = async (req, res, next) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.organizer._id,
      status: 'draft',
    };

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      message: 'Event created as draft',
      event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private (Organizer)
exports.updateEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    // Verify ownership
    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event',
      });
    }

    // Check edit permissions based on status
    if (event.status === 'draft') {
      // Full edit allowed
      Object.assign(event, req.body);
    } else if (event.status === 'published') {
      // Limited edit
      const allowedFields = ['description', 'registrationDeadline', 'registrationLimit'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) event[field] = req.body[field];
      });
    } else {
      // Only status change allowed
      if (req.body.status) event.status = req.body.status;
    }

    await event.save();

    res.json({
      success: true,
      message: 'Event updated successfully',
      event,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get organizer's events
// @route   GET /api/events/organizer/my-events
// @access  Private (Organizer)
exports.getOrganizerEvents = async (req, res, next) => {
  try {
    const events = await Event.find({ organizer: req.organizer._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private (Organizer)
exports.deleteEvent = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found',
      });
    }

    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    // Only delete if draft
    if (event.status !== 'draft') {
      return res.status(400).json({
        success: false,
        message: 'Can only delete draft events',
      });
    }

    await event.deleteOne();

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};