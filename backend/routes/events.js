const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isOrganizer, isParticipant } = require('../middleware/roleCheck');
const {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  getTrendingEvents,
  getRecommendedEvents,
} = require('../controllers/eventController');

router.get('/', getAllEvents);
router.get('/trending', getTrendingEvents);
router.get('/recommended', protect, isParticipant, getRecommendedEvents);
router.get('/:id', getEvent);
router.post('/', protect, isOrganizer, createEvent);
router.put('/:id', protect, isOrganizer, updateEvent);
router.delete('/:id', protect, isOrganizer, deleteEvent);
router.get('/organizer/my-events', protect, isOrganizer, getOrganizerEvents);

module.exports = router;