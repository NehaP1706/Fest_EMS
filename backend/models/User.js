const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: 6,
  },
  role: {
    type: String,
    enum: ['participant', 'admin'],
    default: 'participant',
  },
  participantType: {
    type: String,
    enum: ['iiit', 'non-iiit', 'admin'],
    required: true,
  },
  collegeName: {
    type: String,
    trim: true,
  },
  contactNumber: {
    type: String,
    trim: true,
  },
  
  // Preferences
  areasOfInterest: [{
    type: String,
    enum: ['Technical', 'Cultural', 'Sports', 'Literary', 'Arts', 'Gaming', 'Music', 'Dance', 'Drama', 'Photography', 'Other'],
  }],
  followedOrganizers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
  }],
  
  // Metadata
  isEmailVerified: {
    type: Boolean,
    default: false,
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

// Update timestamp on save
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get public profile
userSchema.methods.getPublicProfile = function() {
  return {
    _id: this._id,
    firstName: this.firstName,
    lastName: this.lastName,
    email: this.email,
    role: this.role,
    participantType: this.participantType,
    collegeName: this.collegeName,
    contactNumber: this.contactNumber,
    areasOfInterest: this.areasOfInterest,
    followedOrganizers: this.followedOrganizers,
  };
};

module.exports = mongoose.model('User', userSchema);