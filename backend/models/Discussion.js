const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },
  userModel: { type: String, enum: ['User', 'Organizer'], required: true },
  emoji: { type: String, required: true }, // '👍','❤️','😂','😮','👏'
}, { _id: false });

const messageSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },

  // Author — either a participant (User) or organizer
  author: { type: mongoose.Schema.Types.ObjectId, refPath: 'authorModel', required: true },
  authorModel: { type: String, enum: ['User', 'Organizer'], required: true },
  authorName: { type: String, required: true }, // denormalized for speed

  content: { type: String, required: true, maxlength: 2000 },

  // Threading: replies reference parent message
  parentMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', default: null },

  // Moderation
  isPinned: { type: Boolean, default: false },
  isAnnouncement: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

  reactions: [reactionSchema],

  // Read receipts — track who has seen the message for notification purposes
  readBy: [{ type: mongoose.Schema.Types.ObjectId }],
}, {
  timestamps: true,
});

// Index for fast event feed queries
messageSchema.index({ event: 1, createdAt: -1 });
messageSchema.index({ event: 1, isPinned: -1, createdAt: -1 });
messageSchema.index({ parentMessage: 1 });

module.exports = mongoose.model('Discussion', messageSchema);