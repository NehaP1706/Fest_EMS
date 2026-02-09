const mongoose = require('mongoose');

const merchandisePurchaseSchema = new mongoose.Schema({
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
  
  // Variant selected
  variant: {
    name: String,
    size: String,
    color: String,
    price: Number,
  },
  
  quantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  
  totalAmount: {
    type: Number,
    required: true,
  },
  
  // Payment Proof Upload
  paymentProof: {
    filename: String,
    path: String,
    uploadedAt: Date,
  },
  
  // Approval Workflow
  paymentStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
  },
  reviewedAt: Date,
  rejectionReason: String,
  
  // Ticket (generated only after approval)
  ticketId: {
    type: String,
    unique: true,
    sparse: true, // Allows null values
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
  
  purchasedAt: {
    type: Date,
    default: Date.now,
  },
});

// Compound index
merchandisePurchaseSchema.index({ event: 1, participant: 1 });
merchandisePurchaseSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('MerchandisePurchase', merchandisePurchaseSchema);