const mongoose = require('mongoose');

const reactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, refPath: 'userModel', required: true },
  userModel: { type: String, enum: ['User', 'Organizer'], required: true },
  emoji: { type: String, required: true }, 
}, { _id: false });

const messageSchema = new mongoose.Schema({
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },

  author: { type: mongoose.Schema.Types.ObjectId, refPath: 'authorModel', required: true },
  authorModel: { type: String, enum: ['User', 'Organizer'], required: true },
  authorName: { type: String, required: true }, 

  content: { type: String, required: true, maxlength: 2000 },

  parentMessage: { type: mongoose.Schema.Types.ObjectId, ref: 'Discussion', default: null },

  isPinned: { type: Boolean, default: false },
  isAnnouncement: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedBy: { type: mongoose.Schema.Types.ObjectId, default: null },

  reactions: [reactionSchema],

  readBy: [{ type: mongoose.Schema.Types.ObjectId }],
}, {
  timestamps: true,
});

messageSchema.index({ event: 1, createdAt: -1 });
messageSchema.index({ event: 1, isPinned: -1, createdAt: -1 });
messageSchema.index({ parentMessage: 1 });

module.exports = mongoose.model('Discussion', messageSchema);