const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  participant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  // Feedback content
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  
  // Anonymous flag
  isAnonymous: {
    type: Boolean,
    default: true,
  },
  
  submittedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index - one feedback per participant per event
feedbackSchema.index({ event: 1, participant: 1 }, { unique: true });
feedbackSchema.index({ event: 1, rating: 1 });

module.exports = mongoose.model('Feedback', feedbackSchema);