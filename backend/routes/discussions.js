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

// IMPORTANT: Specific sub-routes must be declared BEFORE wildcard /:id routes
// Otherwise Express matches /:eventId for everything

// GET routes
router.get('/:eventId/unread-count', protect, getUnreadCount);
router.get('/:eventId', protect, getMessages);

// Specific action routes on a message (must be before plain /:eventId POST)
router.post('/:messageId/reply', protect, postReply);
router.post('/:messageId/react', protect, reactToMessage);
router.post('/:messageId/pin', protect, isOrganizer, pinMessage);
router.post('/:eventId/mark-read', protect, markRead);

// Plain post to event (must be LAST among POST routes to avoid stealing /:id/action routes)
router.post('/:eventId', protect, postMessage);

// Delete
router.delete('/:messageId', protect, deleteMessage);

module.exports = router;