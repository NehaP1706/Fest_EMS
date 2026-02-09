const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { registerParticipant, login, getMe } = require('../controllers/authController');

router.post('/register', registerParticipant);
router.post('/login', login);
router.get('/me', protect, getMe);

module.exports = router;