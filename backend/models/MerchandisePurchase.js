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
  
  // Link to registration (for claim workflow)
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
  },
  
  // Merchandise item details
  merchandiseItem: {
    itemId: String,
    itemName: String,
  },
  
  // Variant selected
  variant: {
    variantId: String,
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
  
  // Payment Proof Upload (for old payment workflow)
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
  
  // NEW: Claim Type
  claimType: {
    type: String,
    enum: ['participant', 'organizer', 'payment'], // payment = old workflow
    default: 'payment',
  },
  
  // NEW: Claim/Issue timestamps
  claimedAt: Date,    // When participant claimed
  issuedBy: {          // If organizer issued
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
  },
  issuedAt: Date,
  
  // Ticket (generated after approval/claim/issue)
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

// Compound indexes
merchandisePurchaseSchema.index({ event: 1, participant: 1 });
merchandisePurchaseSchema.index({ paymentStatus: 1 });
merchandisePurchaseSchema.index({ claimType: 1 });
merchandisePurchaseSchema.index({ registration: 1 });

module.exports = mongoose.model('MerchandisePurchase', merchandisePurchaseSchema);