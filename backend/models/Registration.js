const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
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
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {},
  },

  paymentStatus: {
    type: String,
    enum: ['pending_payment', 'pending_approval', 'approved', 'rejected'],
    default: 'approved', 
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  paymentProof: {
    filename: String,
    path: String,
    uploadedAt: Date,
  },
  rejectionReason: String,
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
  },
  reviewedAt: Date,

  ticketId: {
    type: String,
    unique: true,
    sparse: true,
  },
  qrCode: String,

  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'attended'],
    default: 'confirmed',
  },
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

registrationSchema.index({ event: 1, participant: 1 }, { unique: true });
registrationSchema.index({ event: 1, paymentStatus: 1 });

module.exports = mongoose.model('Registration', registrationSchema);