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
  
  registration: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registration',
  },
  
  merchandiseItem: {
    itemId: String,
    itemName: String,
  },
  
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
  
  paymentProof: {
    filename: String,
    path: String,
    uploadedAt: Date,
  },
  
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
  
  claimType: {
    type: String,
    enum: ['participant', 'organizer', 'payment'], 
    default: 'payment',
  },
  
  claimedAt: Date,    
  issuedBy: {          
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
  },
  issuedAt: Date,
  
  ticketId: {
    type: String,
    unique: true,
    sparse: true,
  },
  qrCode: {
    type: String, 
  },
  
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

merchandisePurchaseSchema.index({ event: 1, participant: 1 });
merchandisePurchaseSchema.index({ paymentStatus: 1 });
merchandisePurchaseSchema.index({ claimType: 1 });
merchandisePurchaseSchema.index({ registration: 1 });

module.exports = mongoose.model('MerchandisePurchase', merchandisePurchaseSchema);