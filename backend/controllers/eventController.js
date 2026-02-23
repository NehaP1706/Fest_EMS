const Event = require('../models/Event');
const Organizer = require('../models/Organizer');
const { sendDiscordNotification } = require('../utils/DiscordWebhook');

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

    if (req.user) {
      const participantType = req.user.participantType;
      
      if (participantType === 'Non-IIIT' || participantType === 'non-iiit') {
        query.eligibility = { $ne: 'iiit-only' };
      }
    } 

    if (followedOnly === 'true' && req.user) {
      const user = await require('../models/User').findById(req.user._id);
      
      if (!user.followedOrganizers || user.followedOrganizers.length === 0) {
        return res.json({ success: true, count: 0, events: [], message: 'You are not following any organizers yet.' });
      }
      
      query.organizer = { $in: user.followedOrganizers };
    } else if (organizer) {
      query.organizer = organizer;
    }
    
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

    let events = await Event.find(query)
      .populate('organizer', 'name category')
      .sort({ eventStartDate: 1 });

    if (req.user) {
      const user = await require('../models/User').findById(req.user._id);
      
      events = events.map(event => {
        let relevanceScore = 0;

        if (user.areasOfInterest && user.areasOfInterest.length > 0) {
          const eventTags = event.tags || [];
          const organizerCategory = event.organizer?.category || '';
          
          const tagMatches = eventTags.filter(tag => 
            user.areasOfInterest.some(interest => 
              tag.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(tag.toLowerCase())
            )
          ).length;
          
          const categoryMatch = user.areasOfInterest.some(interest =>
            organizerCategory.toLowerCase().includes(interest.toLowerCase())
          ) ? 1 : 0;
          
          relevanceScore += (tagMatches * 10) + (categoryMatch * 5);
        }

        if (user.followedOrganizers && user.followedOrganizers.length > 0) {
          const isFollowed = user.followedOrganizers.some(
            followedId => followedId.toString() === event.organizer?._id?.toString()
          );
          if (isFollowed) {
            relevanceScore += 20;
          }
        }

        return {
          ...event.toObject(),
          relevanceScore
        };
      });

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

    const query = { status: { $in: ['published', 'ongoing'] } };

    let events = await Event.find(query)
      .populate('organizer', 'name category')
      .sort({ eventStartDate: 1 })
      .limit(20); 

    const scoredEvents = events.map(event => {
      let score = 0;
      const eventObj = event.toObject();

      if (user.areasOfInterest?.length > 0) {
        const tags = eventObj.tags || [];
        const category = eventObj.organizer?.category || '';
        
        user.areasOfInterest.forEach(interest => {
          if (tags.some(tag => 
            tag.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(tag.toLowerCase())
          )) {
            score += 15;
          }
          
          if (category.toLowerCase().includes(interest.toLowerCase())) {
            score += 10;
          }
        });
      }

      if (user.followedOrganizers?.length > 0) {
        const isFollowed = user.followedOrganizers.some(
          org => org._id.toString() === eventObj.organizer?._id?.toString()
        );
        if (isFollowed) score += 30;
      }

      const daysUntilEvent = Math.ceil(
        (new Date(eventObj.eventStartDate) - new Date()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilEvent > 0 && daysUntilEvent <= 7) {
        score += 5;
      }

      return { ...eventObj, relevanceScore: score };
    });

    scoredEvents.sort((a, b) => b.relevanceScore - a.relevanceScore);

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

exports.createEvent = async (req, res, next) => {
  try {
    const body = { ...req.body };
    if (body.customRegistrationForm && !body.customForm) {
      body.customForm = { fields: body.customRegistrationForm };
      delete body.customRegistrationForm;
    }

    const eventData = {
      ...body,
      organizer: req.organizer._id,
      status: body.status || 'draft',
    };

    const event = await Event.create(eventData);

    if (event.status === 'published') {
      const organizer = await Organizer.findById(req.organizer._id);
      if (organizer.discordWebhookUrl) {
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

exports.updateEvent = async (req, res, next) => {
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
        message: 'Not authorized to update this event',
      });
    }

    const oldStatus = event.status;

    if (event.status === 'draft') {
      const updateBody = { ...req.body };
      if (updateBody.customRegistrationForm && !updateBody.customForm) {
        updateBody.customForm = { fields: updateBody.customRegistrationForm };
        delete updateBody.customRegistrationForm;
      }

      Object.assign(event, updateBody);
    } else if (event.status === 'published') {
      const allowedFields = ['description', 'registrationDeadline', 'registrationLimit'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) event[field] = req.body[field];
      });
      
      if (req.body.status) event.status = req.body.status;
    } else {
      if (req.body.status) event.status = req.body.status;
    }

    await event.save();

    const organizer = await Organizer.findById(req.organizer._id);
    if (organizer.discordWebhookUrl) {
      if (oldStatus === 'draft' && event.status === 'published') {
        sendDiscordNotification(
          organizer.discordWebhookUrl,
          event,
          organizer,
          'published'
        ).catch(err => console.error('Discord notification failed:', err));
      }
      else if (event.status === 'closed' && oldStatus !== 'closed') {
        sendDiscordNotification(
          organizer.discordWebhookUrl,
          event,
          organizer,
          'cancelled'
        ).catch(err => console.error('Discord notification failed:', err));
      }
      else if (event.status === 'published' && oldStatus === 'published') {
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

exports.toggleRegistrations = async (req, res, next) => {
  try {
    const event = await Event.findById(req.params.id);

    console.log('Current registrationsClosed:', event.registrationsClosed);

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    if (event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    event.registrationsClosed = !event.registrationsClosed;
    await event.save();

    res.json({
      success: true,
      registrationsClosed: event.registrationsClosed,
      message: event.registrationsClosed
        ? 'Registrations have been closed.'
        : 'Registrations have been reopened.',
    });
  } catch (error) {
    next(error);
  }
};