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
  
  // Discord Integration
  discordWebhookUrl: {
    type: String,
    default: '',
  },
  
  // Status
  isActive: {
    type: Boolean,
    default: true,
  },
  
  // Followers
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
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
  next();
});

module.exports = mongoose.model('Organizer', organizerSchema);