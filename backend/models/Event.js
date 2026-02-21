const mongoose = require('mongoose');

const customFieldSchema = new mongoose.Schema({
  fieldId: {
    type: String,
    required: true,
  },
  fieldType: {
    type: String,
    enum: ['text', 'email', 'number', 'textarea', 'dropdown', 'checkbox', 'radio', 'file', 'date'],
    required: true,
  },
  label: {
    type: String,
    required: true,
  },
  placeholder: String,
  options: [String], // For dropdown, checkbox, radio
  required: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
});

// NEW: Merchandise item schema
const merchandiseItemSchema = new mongoose.Schema({
  itemId: {
    type: String,
    required: true,
  },
  itemName: {
    type: String,
    required: true,
  },
  description: String,
  purchaseLimit: {
    type: Number,
    default: 1, // per participant
  },
  variants: [{
    variantId: String,
    name: String, // e.g., "Large - Black"
    size: String,
    color: String,
    stock: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: true,
    },
  }],
});

const eventSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Event name is required'],
    trim: true,
  },
  description: {
    type: String,
    required: [true, 'Event description is required'],
  },
  eventType: {
    type: String,
    enum: ['normal', 'merchandise'],
    required: [true, 'Event type is required'],
  },
  eligibility: {
    type: String,
    enum: ['iiit-only', 'non-iiit-only', 'all'],
    default: 'all',
  },
  
  // Dates
  registrationDeadline: {
    type: Date,
    required: [true, 'Registration deadline is required'],
  },
  eventStartDate: {
    type: Date,
    required: [true, 'Event start date is required'],
  },
  eventEndDate: {
    type: Date,
    required: [true, 'Event end date is required'],
  },

  registrationsClosed: {
    type: Boolean,
    default: false,
  },
  
  // Limits
  registrationLimit: {
    type: Number,
    default: null, // null means unlimited
  },
  currentRegistrations: {
    type: Number,
    default: 0,
  },
  
  // Pricing (for normal events)
  registrationFee: {
    type: Number,
    default: 0,
  },
  
  // Organizer
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true,
  },
  
  // Tags
  tags: [{
    type: String,
    trim: true,
  }],
  
  // Status
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'closed'],
    default: 'draft',
  },
  
  // Custom Registration Form (for normal events)
  customForm: {
    fields: [customFieldSchema],
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  
  // NEW: Merchandise items (array of items, each with variants)
  merchandiseItems: [merchandiseItemSchema],
  
  // Analytics
  totalRevenue: {
    type: Number,
    default: 0,
  },
  totalAttendance: {
    type: Number,
    default: 0,
  },
  
  // View count for trending
  viewCount: {
    type: Number,
    default: 0,
  },
  lastViewedAt: Date,
  
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes
eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ eventStartDate: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ name: 'text', description: 'text' });

// Update timestamp
eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Check if registration is allowed
eventSchema.methods.canRegister = function() {
  const now = new Date();
  
  if (this.status !== 'published') return { allowed: false, reason: 'Event not published' };
  if (now > this.registrationDeadline) return { allowed: false, reason: 'Registration deadline passed' };
  if (this.registrationLimit && this.currentRegistrations >= this.registrationLimit) {
    return { allowed: false, reason: 'Registration limit reached' };
  }
  
  return { allowed: true };
};

module.exports = mongoose.model('Event', eventSchema);