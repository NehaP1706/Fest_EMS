const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const { sendDiscordNotification } = require('../utils/DiscordWebhook');

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
      followedOnly,
      organizer 
    } = req.query;

    let query = { status: { $in: ['published', 'ongoing'] } };

    // Apply filters
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    if (eventType) {
      query.eventType = eventType;
    }

    if (eligibility) {
      query.eligibility = eligibility;
    }

    if (dateFrom || dateTo) {
      query.eventStartDate = {};
      if (dateFrom) query.eventStartDate.$gte = new Date(dateFrom);
      if (dateTo) query.eventStartDate.$lte = new Date(dateTo);
    }

    if (organizer) {
      query.organizer = organizer;
    }

    // Filter by followed organizers if requested
    if (followedOnly === 'true' && req.user) {
      const user = await require('../models/User').findById(req.user._id);
      query.organizer = { $in: user.followedOrganizers };
    }

    let events = await Event.find(query)
      .populate('organizer', 'name category')
      .sort({ eventStartDate: 1 });

    // RECOMMENDATION LOGIC - Sort based on user preferences
    if (req.user) {
      const user = await require('../models/User').findById(req.user._id);
      
      events = events.map(event => {
        let relevanceScore = 0;

        // Score based on areas of interest (match with tags or organizer category)
        if (user.areasOfInterest && user.areasOfInterest.length > 0) {
          const eventTags = event.tags || [];
          const organizerCategory = event.organizer?.category || '';
          
          // Check if event tags match user interests
          const tagMatches = eventTags.filter(tag => 
            user.areasOfInterest.some(interest => 
              tag.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(tag.toLowerCase())
            )
          ).length;
          
          // Check if organizer category matches user interests
          const categoryMatch = user.areasOfInterest.some(interest =>
            organizerCategory.toLowerCase().includes(interest.toLowerCase())
          ) ? 1 : 0;
          
          relevanceScore += (tagMatches * 10) + (categoryMatch * 5);
        }

        // Higher score for events from followed organizers
        if (user.followedOrganizers && user.followedOrganizers.length > 0) {
          const isFollowed = user.followedOrganizers.some(
            followedId => followedId.toString() === event.organizer?._id?.toString()
          );
          if (isFollowed) {
            relevanceScore += 20; // Highest priority
          }
        }

        // Add relevance score to event object
        return {
          ...event.toObject(),
          relevanceScore
        };
      });

      // Sort by relevance score (descending), then by date
      events.sort((a, b) => {
        if (b.relevanceScore !== a.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return new Date(a.eventStartDate) - new Date(b.eventStartDate);
      });
    }

    res.json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

exports.getRecommendedEvents = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const user = await require('../models/User').findById(req.user._id)
      .populate('followedOrganizers', 'category');

    // Build query for published/ongoing events
    const query = { status: { $in: ['published', 'ongoing'] } };

    // Get events
    let events = await Event.find(query)
      .populate('organizer', 'name category')
      .sort({ eventStartDate: 1 })
      .limit(20); // Limit to top 20 for performance

    // Calculate relevance scores
    const scoredEvents = events.map(event => {
      let score = 0;
      const eventObj = event.toObject();

      // Interest matching (tags and category)
      if (user.areasOfInterest?.length > 0) {
        const tags = eventObj.tags || [];
        const category = eventObj.organizer?.category || '';
        
        user.areasOfInterest.forEach(interest => {
          // Tag matches
          if (tags.some(tag => 
            tag.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(tag.toLowerCase())
          )) {
            score += 15;
          }
          
          // Category match
          if (category.toLowerCase().includes(interest.toLowerCase())) {
            score += 10;
          }
        });
      }

      // Followed organizer boost
      if (user.followedOrganizers?.length > 0) {
        const isFollowed = user.followedOrganizers.some(
          org => org._id.toString() === eventObj.organizer?._id?.toString()
        );
        if (isFollowed) score += 30;
      }

      // Recency bonus (newer events get slight boost)
      const daysUntilEvent = Math.ceil(
        (new Date(eventObj.eventStartDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilEvent > 0 && daysUntilEvent <= 7) {
        score += 5; // Bonus for events in the next week
      }

      return { ...eventObj, relevanceScore: score };
    });

    // Sort by relevance
    scoredEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Return top 10 recommendations
    const recommendations = scoredEvents.slice(0, 10);

    res.json({
      success: true,
      count: recommendations.length,
      events: recommendations,
      message: recommendations.length === 0 
        ? 'No recommendations yet. Update your preferences to get personalized suggestions!'
        : undefined
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
      status: req.body.status || 'draft',
    };

    const event = await Event.create(eventData);

    // If event is published immediately, send Discord notification
    if (event.status === 'published') {
      const organizer = await Organizer.findById(req.organizer._id);
      if (organizer.discordWebhookUrl) {
        // Send notification asynchronously (don't wait for it)
        sendDiscordNotification(
          organizer.discordWebhookUrl,
          event,
          organizer,
          'published'
        ).catch(err => console.error('Discord notification failed:', err));
      }
    }

    res.status(201).json({
      success: true,
      message: event.status === 'published' 
        ? 'Event published successfully' 
        : 'Event created as draft',
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

    const oldStatus = event.status;

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
      
      // Allow status change
      if (req.body.status) event.status = req.body.status;
    } else {
      // Only status change allowed
      if (req.body.status) event.status = req.body.status;
    }

    await event.save();

    // Send Discord notification for status changes
    const organizer = await Organizer.findById(req.organizer._id);
    if (organizer.discordWebhookUrl) {
      // Draft → Published
      if (oldStatus === 'draft' && event.status === 'published') {
        sendDiscordNotification(
          organizer.discordWebhookUrl,
          event,
          organizer,
          'published'
        ).catch(err => console.error('Discord notification failed:', err));
      }
      // Any → Closed/Cancelled
      else if (event.status === 'closed' && oldStatus !== 'closed') {
        sendDiscordNotification(
          organizer.discordWebhookUrl,
          event,
          organizer,
          'cancelled'
        ).catch(err => console.error('Discord notification failed:', err));
      }
      // Important updates to published events
      else if (event.status === 'published' && oldStatus === 'published') {
        // Only notify if deadline or description changed
        if (req.body.registrationDeadline || req.body.description) {
          sendDiscordNotification(
            organizer.discordWebhookUrl,
            event,
            organizer,
            'updated'
          ).catch(err => console.error('Discord notification failed:', err));
        }
      }
    }

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