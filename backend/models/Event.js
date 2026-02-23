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
  options: [String], 
  required: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
});

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
    default: 1, 
  },
  variants: [{
    variantId: String,
    name: String, 
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
  
  registrationLimit: {
    type: Number,
    default: null, 
  },
  currentRegistrations: {
    type: Number,
    default: 0,
  },
  
  registrationFee: {
    type: Number,
    default: 0,
  },
  
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true,
  },
  
  tags: [{
    type: String,
    trim: true,
  }],
  
  status: {
    type: String,
    enum: ['draft', 'published', 'ongoing', 'completed', 'closed'],
    default: 'draft',
  },
  
  customForm: {
    fields: [customFieldSchema],
    isLocked: {
      type: Boolean,
      default: false,
    },
  },
  
  merchandiseItems: [merchandiseItemSchema],
  
  totalRevenue: {
    type: Number,
    default: 0,
  },
  totalAttendance: {
    type: Number,
    default: 0,
  },
  
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

eventSchema.index({ organizer: 1, status: 1 });
eventSchema.index({ eventStartDate: 1 });
eventSchema.index({ tags: 1 });
eventSchema.index({ name: 'text', description: 'text' });

eventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

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