const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const {
  createOrganizer,
  getAllOrganizersAdmin,
  deleteOrganizer,
  getPasswordResetRequests,
  approvePasswordReset,
  rejectPasswordReset,
} = require('../controllers/adminController');

router.post('/organizers', protect, isAdmin, createOrganizer);
router.get('/organizers', protect, isAdmin, getAllOrganizersAdmin);
router.delete('/organizers/:id', protect, isAdmin, deleteOrganizer);

router.get('/password-resets', protect, isAdmin, getPasswordResetRequests);
router.post('/password-resets/:id/approve', protect, isAdmin, approvePasswordReset);
router.post('/password-resets/:id/reject', protect, isAdmin, rejectPasswordReset);

module.exports = router;