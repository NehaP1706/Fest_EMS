const mongoose = require('mongoose');

const organizerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Organizer name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
  },
  category: {
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Literary', 'Arts', 'Council', 'Fest Team', 'Other'],
    required: [true, 'Category is required'],
  },
  description: {
    type: String,
    default: '',
  },
  contactEmail: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    trim: true,
  },
  
  discordWebhookUrl: {
    type: String,
    default: '',
  },
  
  status: {
    type: String,
    enum: ['active', 'disabled', 'archived'],
    default: 'active',
  },
  
  isActive: {
    type: Boolean,
    default: true,
  },
  
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  
  archivedAt: {
    type: Date,
  },
  archivedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  archiveReason: {
    type: String,
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

organizerSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  this.isActive = this.status === 'active';
  
  next();
});

organizerSchema.virtual('canLogin').get(function() {
  return this.status === 'active';
});

module.exports = mongoose.model('Organizer', organizerSchema);