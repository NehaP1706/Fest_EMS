const mongoose = require('mongoose');

const passwordResetRequestSchema = new mongoose.Schema({
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true,
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason for password reset'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  newPassword: {
    type: String,
    // Stored temporarily for admin to share, then cleared
  },
  adminComments: {
    type: String,
    trim: true,
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  reviewedAt: {
    type: Date,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for faster queries
passwordResetRequestSchema.index({ organizer: 1, requestedAt: -1 });
passwordResetRequestSchema.index({ status: 1 });

module.exports = mongoose.model('PasswordResetRequest', passwordResetRequestSchema);