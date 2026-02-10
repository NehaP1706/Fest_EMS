const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const {
  createOrganizer,
  getAllOrganizersAdmin,
  disableOrganizer,
  enableOrganizer,
  archiveOrganizer,
  unarchiveOrganizer,
  deleteOrganizer,
  getPasswordResetRequests,
  approvePasswordReset,
  rejectPasswordReset,
} = require('../controllers/adminController');

// Organizer CRUD
router.post('/organizers', protect, isAdmin, createOrganizer);
router.get('/organizers', protect, isAdmin, getAllOrganizersAdmin);

// Organizer status management
router.patch('/organizers/:id/disable', protect, isAdmin, disableOrganizer);
router.patch('/organizers/:id/enable', protect, isAdmin, enableOrganizer);
router.patch('/organizers/:id/archive', protect, isAdmin, archiveOrganizer);
router.patch('/organizers/:id/unarchive', protect, isAdmin, unarchiveOrganizer);

// Hard delete (permanent)
router.delete('/organizers/:id', protect, isAdmin, deleteOrganizer);

// Password reset management
router.get('/password-resets', protect, isAdmin, getPasswordResetRequests);
router.post('/password-resets/:id/approve', protect, isAdmin, approvePasswordReset);
router.post('/password-resets/:id/reject', protect, isAdmin, rejectPasswordReset);

module.exports = router;