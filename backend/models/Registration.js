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
  
  // Custom form responses
  formResponses: {
    type: Map,
    of: mongoose.Schema.Types.Mixed, // Can store strings, arrays, etc.
  },
  
  // Payment
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed', // Since no payment gateway in this version
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  
  // Ticket
  ticketId: {
    type: String,
    unique: true,
    required: true,
  },
  qrCode: {
    type: String, // Base64 encoded QR code
  },
  
  // Attendance
  attended: {
    type: Boolean,
    default: false,
  },
  attendedAt: Date,
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
  },
  
  // Status
  status: {
    type: String,
    enum: ['confirmed', 'cancelled', 'rejected'],
    default: 'confirmed',
  },
  
  registeredAt: {
    type: Date,
    default: Date.now,
  },
});

// ticketId must always be globally unique
registrationSchema.index({ ticketId: 1 }, { unique: true });

// Index for fast lookups (not unique — a participant can re-register after cancellation)
registrationSchema.index({ event: 1, participant: 1 });
registrationSchema.index({ participant: 1 });

module.exports = mongoose.model('Registration', registrationSchema);