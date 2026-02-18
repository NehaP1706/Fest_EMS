const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isParticipant, isOrganizer } = require('../middleware/roleCheck');
const {
  submitFeedback,
  getEventFeedback,
  getMyFeedback,
} = require('../controllers/feedbackController');

// Participant routes
router.post('/:eventId', protect, isParticipant, submitFeedback);
router.get('/:eventId/my-feedback', protect, isParticipant, getMyFeedback);

// Organizer routes
router.get('/:eventId', protect, isOrganizer, getEventFeedback);

module.exports = router;