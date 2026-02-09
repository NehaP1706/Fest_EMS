const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isParticipant } = require('../middleware/roleCheck');
const {
  setPreferences,
  updateProfile,
  changePassword,
  toggleFollowOrganizer,
} = require('../controllers/userController');

router.put('/preferences', protect, isParticipant, setPreferences);
router.put('/profile', protect, isParticipant, updateProfile);
router.put('/change-password', protect, isParticipant, changePassword);
router.post('/follow/:organizerId', protect, isParticipant, toggleFollowOrganizer);

module.exports = router;