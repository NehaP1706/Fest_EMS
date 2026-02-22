const express = require('express');
const router = express.Router();
const { protect, optionalProtect } = require('../middleware/auth');
const { isOrganizer, isParticipant } = require('../middleware/roleCheck');
const { toggleRegistrations } = require('../controllers/eventController');

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

router.get('/trending', getTrendingEvents);
router.get('/recommended', protect, isParticipant, getRecommendedEvents);
router.get('/organizer/my-events', protect, isOrganizer, getOrganizerEvents);
router.get('/', protect, getAllEvents);
router.get('/:id', getEvent);
router.post('/', protect, isOrganizer, createEvent);
router.put('/:id', protect, isOrganizer, updateEvent);
router.delete('/:id', protect, isOrganizer, deleteEvent);
router.patch('/:id/toggle-registrations', protect, isOrganizer, toggleRegistrations);

module.exports = router;