const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isParticipant, isOrganizer } = require('../middleware/roleCheck');
const {
  submitFeedback,
  getEventFeedback,
} = require('../controllers/feedbackController');

router.post('/:eventId', protect, isParticipant, submitFeedback);
router.get('/:eventId', protect, isOrganizer, getEventFeedback);

module.exports = router;