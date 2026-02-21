const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isOrganizer } = require('../middleware/roleCheck');
const {
  getAllOrganizers,
  getOrganizer,
  updateOrganizerProfile,
  changeOrganizerPassword,
  requestPasswordReset,
  getMyResetRequests,
} = require('../controllers/organizerController');

router.get('/', getAllOrganizers);
router.put('/profile', protect, isOrganizer, updateOrganizerProfile);
router.put('/change-password', protect, isOrganizer, changeOrganizerPassword);
router.post('/request-password-reset', protect, isOrganizer, requestPasswordReset);
router.get('/my-reset-requests', protect, isOrganizer, getMyResetRequests);
router.get('/:id', getOrganizer);

module.exports = router;