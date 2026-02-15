const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isParticipant, isOrganizer } = require('../middleware/roleCheck');
const { uploadPaymentProof } = require('../middleware/upload');
const {
  purchaseMerchandise,
  claimMerchandise,
  issueMerchandise,
  getMyPurchases,
  getPendingApprovals,
  getEventPurchases,
  approvePurchase,
  rejectPurchase,
} = require('../controllers/merchandiseController');

// Participant routes
router.post('/:eventId/purchase', protect, isParticipant, uploadPaymentProof, purchaseMerchandise);
router.post('/:registrationId/claim', protect, isParticipant, claimMerchandise); // NEW
router.get('/my-purchases', protect, isParticipant, getMyPurchases);

// Organizer routes
router.get('/pending-approvals', protect, isOrganizer, getPendingApprovals);
router.get('/event/:eventId', protect, isOrganizer, getEventPurchases); // NEW
router.post('/:eventId/issue', protect, isOrganizer, issueMerchandise); // NEW
router.post('/:purchaseId/approve', protect, isOrganizer, approvePurchase);
router.post('/:purchaseId/reject', protect, isOrganizer, rejectPurchase);

module.exports = router;