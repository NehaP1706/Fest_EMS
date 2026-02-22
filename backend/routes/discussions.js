const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isOrganizer } = require('../middleware/roleCheck');
const {
  getMessages,
  postMessage,
  postReply,
  deleteMessage,
  pinMessage,
  reactToMessage,
  markRead,
  getUnreadCount,
} = require('../controllers/discussionController');

router.get('/:eventId/unread-count', protect, getUnreadCount);
router.post('/:messageId/reply', protect, postReply);
router.post('/:messageId/react', protect, reactToMessage);
router.post('/:messageId/pin', protect, isOrganizer, pinMessage);
router.post('/:eventId/mark-read', protect, markRead);
router.delete('/:messageId', protect, deleteMessage);
router.get('/:eventId', protect, getMessages);
router.post('/:eventId', protect, postMessage);

module.exports = router;