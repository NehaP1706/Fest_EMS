const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getEventDiscussions,
  postMessage,
  deleteMessage,
  pinMessage,
  reactToMessage,
} = require('../controllers/discussionController');

router.get('/:eventId', protect, getEventDiscussions);
router.post('/:eventId', protect, postMessage);
router.delete('/:messageId', protect, deleteMessage);
router.post('/:messageId/pin', protect, pinMessage);
router.post('/:messageId/react', protect, reactToMessage);

module.exports = router;