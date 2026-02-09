const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isParticipant } = require('../middleware/roleCheck');
const {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
} = require('../controllers/registrationController');

router.post('/:eventId', protect, isParticipant, registerForEvent);
router.get('/my-registrations', protect, isParticipant, getMyRegistrations);
router.delete('/:registrationId', protect, isParticipant, cancelRegistration);

module.exports = router;