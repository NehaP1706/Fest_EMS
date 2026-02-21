const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isOrganizer } = require('../middleware/roleCheck');
const {
  scanQRCode,
  getEventAttendance,
  manualAttendance,
  exportAttendance,
  removeAttendance,
} = require('../controllers/attendanceController');

router.post('/scan', protect, isOrganizer, scanQRCode);
router.get('/:eventId', protect, isOrganizer, getEventAttendance);
router.post('/manual', protect, isOrganizer, manualAttendance);
router.get('/:eventId/export', protect, isOrganizer, exportAttendance);
router.delete('/:eventId/participant/:participantId', protect, isOrganizer, removeAttendance);

module.exports = router;