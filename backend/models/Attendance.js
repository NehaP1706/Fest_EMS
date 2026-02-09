const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
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
  ticketId: {
    type: String,
    required: true,
  },
  
  // Attendance details
  scannedAt: {
    type: Date,
    default: Date.now,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true,
  },
  
  // Manual override
  isManualEntry: {
    type: Boolean,
    default: false,
  },
  manualEntryReason: String,
  
  // Audit
  scannerDevice: String, // Browser/device info
  scanLocation: String, // Optional
});

// Prevent duplicate scans
attendanceSchema.index({ event: 1, participant: 1 }, { unique: true });
attendanceSchema.index({ ticketId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);