const mongoose = require('mongoose');

const discussionSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
  },
  author: {
    authorType: {
      type: String,
      enum: ['participant', 'organizer'],
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'author.authorModel',
    },
    authorModel: {
      type: String,
      enum: ['User', 'Organizer'],
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
  },
  
  message: {
    type: String,
    required: [true, 'Message cannot be empty'],
    trim: true,
    maxlength: 1000,
  },
  
  // Message type
  isAnnouncement: {
    type: Boolean,
    default: false,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  
  // Reactions
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    emoji: String,
  }],
  
  // Threading
  parentMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
  },
  replies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Discussion',
  }],
  
  // Moderation
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
  },
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

discussionSchema.index({ event: 1, createdAt: -1 });
discussionSchema.index({ event: 1, isPinned: 1 });

module.exports = mongoose.model('Discussion', discussionSchema);