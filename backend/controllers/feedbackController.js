const Feedback = require('../models/Feedback');
const Event = require('../models/Event');
const Registration = require('../models/Registration');

exports.submitFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { rating, comment } = req.body;

    const registration = await Registration.findOne({
      event: eventId,
      participant: req.user._id,
      attended: true,
    });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message: 'You can only provide feedback for events you attended',
      });
    }

    const feedback = await Feedback.create({
      event: eventId,
      participant: req.user._id,
      rating,
      comment,
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted',
      feedback,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted feedback for this event',
      });
    }
    next(error);
  }
};

exports.getEventFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;

    const event = await Event.findById(eventId);
    if (!event || event.organizer.toString() !== req.organizer._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this feedback',
      });
    }

    const feedbacks = await Feedback.find({ event: eventId }).sort({ submittedAt: -1 });

    const stats = {
      totalFeedbacks: feedbacks.length,
      averageRating: feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length || 0,
      ratingDistribution: {
        5: feedbacks.filter(f => f.rating === 5).length,
        4: feedbacks.filter(f => f.rating === 4).length,
        3: feedbacks.filter(f => f.rating === 3).length,
        2: feedbacks.filter(f => f.rating === 2).length,
        1: feedbacks.filter(f => f.rating === 1).length,
      },
    };

    res.json({
      success: true,
      feedbacks: feedbacks.map(f => ({
        _id: f._id,
        rating: f.rating,
        comment: f.comment,
        submittedAt: f.submittedAt,
      })),
      stats,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyFeedback = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    
    const feedback = await Feedback.findOne({
      event: eventId,
      participant: req.user._id,
    });

    res.json({
      success: true,
      feedback,
    });
  } catch (error) {
    next(error);
  }
};