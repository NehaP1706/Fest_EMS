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
  },
  
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'completed', 
  },
  amountPaid: {
    type: Number,
    default: 0,
  },
  
  ticketId: {
    type: String,
    unique: true,
    required: true,
  },
  qrCode: {
    type: String, 
  },
  
  attended: {
    type: Boolean,
    default: false,
  },
  attendedAt: Date,
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
  },
  
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

registrationSchema.index({ ticketId: 1 }, { unique: true });
registrationSchema.index({ event: 1, participant: 1 });
registrationSchema.index({ participant: 1 });

module.exports = mongoose.model('Registration', registrationSchema);