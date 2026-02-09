const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { isOrganizer } = require('../middleware/roleCheck');
const {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  getOrganizerEvents,
  getTrendingEvents,
} = require('../controllers/eventController');

router.get('/', getAllEvents);
router.get('/trending', getTrendingEvents);
router.get('/:id', getEvent);
router.post('/', protect, isOrganizer, createEvent);
router.put('/:id', protect, isOrganizer, updateEvent);
router.delete('/:id', protect, isOrganizer, deleteEvent);
router.get('/organizer/my-events', protect, isOrganizer, getOrganizerEvents);

module.exports = router;