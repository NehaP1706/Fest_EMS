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
  
  scannedAt: {
    type: Date,
    default: Date.now,
  },
  scannedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    required: true,
  },
  
  isManualEntry: {
    type: Boolean,
    default: false,
  },
  manualEntryReason: String,
  
  scannerDevice: String, 
  scanLocation: String, 
});

attendanceSchema.index({ event: 1, participant: 1 }, { unique: true });
attendanceSchema.index({ ticketId: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);