const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isOrganizer } = require('../middleware/roleCheck');
const {
  getAllOrganizers,
  getOrganizer,
  updateOrganizerProfile,
  changeOrganizerPassword,
} = require('../controllers/organizerController');

router.get('/', getAllOrganizers);
router.get('/:id', getOrganizer);
router.put('/profile', protect, isOrganizer, updateOrganizerProfile);
router.put('/change-password', protect, isOrganizer, changeOrganizerPassword);

module.exports = router;