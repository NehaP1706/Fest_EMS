const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isOrganizer, isParticipant } = require('../middleware/roleCheck');
const { uploadPaymentProof } = require('../middleware/upload');
const {
  registerForEvent,
  getMyRegistrations,
  cancelRegistration,
  getEventRegistrations,
  submitPaymentProof,
  getPendingApprovals,
  approveRegistration,
  rejectRegistration,
} = require('../controllers/registrationController');

router.post('/:eventId', protect, isParticipant, registerForEvent);
router.get('/my-registrations', protect, isParticipant, getMyRegistrations);
router.delete('/:registrationId', protect, isParticipant, cancelRegistration);
router.post('/:registrationId/payment-proof', protect, isParticipant, uploadPaymentProof, submitPaymentProof);

router.get('/event/:eventId', protect, isOrganizer, getEventRegistrations);
router.get('/event/:eventId/pending-approvals', protect, isOrganizer, getPendingApprovals);
router.post('/:registrationId/approve', protect, isOrganizer, approveRegistration);
router.post('/:registrationId/reject', protect, isOrganizer, rejectRegistration);

module.exports = router;