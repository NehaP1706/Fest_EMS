const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isOrganizer, isParticipant } = require('../middleware/roleCheck');
const {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventRegistrations,
} = require('../controllers/registrationController');

router.post('/:eventId', protect, isParticipant, registerForEvent);
router.get('/my-registrations', protect, isParticipant, getMyRegistrations);
router.delete('/:registrationId', protect, isParticipant, cancelRegistration);
router.get('/event/:eventId', protect, isOrganizer, getEventRegistrations);

module.exports = router;