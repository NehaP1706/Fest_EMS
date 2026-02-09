const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Organizer = require('../models/Organizer');
const { generateToken } = require('../middleware/auth');

exports.registerParticipant = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, participantType, collegeName, contactNumber } = req.body;

    if (participantType === 'iiit' && !email.endsWith('@iiit.ac.in')) {
      return res.status(400).json({ success: false, message: 'IIIT participants must use @iiit.ac.in email' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName, lastName, email,
      password: hashedPassword,
      role: 'participant',
      participantType, collegeName, contactNumber,
      isEmailVerified: participantType === 'iiit',
    });

    const token = generateToken(user._id, 'participant');
    res.status(201).json({ success: true, token, user: user.getPublicProfile() });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    let user = await User.findOne({ email });
    let organizer = null;
    let role = null;

    if (user) {
      role = user.role;
    } else {
      organizer = await Organizer.findOne({ email });
      if (organizer) {
        role = 'organizer';
        if (!organizer.isActive) {
          return res.status(403).json({ success: false, message: 'Account disabled' });
        }
      }
    }

    if (!user && !organizer) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const passwordMatch = await bcrypt.compare(password, user ? user.password : organizer.password);
    if (!passwordMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const id = user ? user._id : organizer._id;
    const token = generateToken(id, role);

    res.json({
      success: true,
      token,
      role,
      user: user ? user.getPublicProfile() : {
        _id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        category: organizer.category,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    if (req.userRole === 'participant' || req.userRole === 'admin') {
      res.json({ success: true, user: req.user.getPublicProfile(), role: req.userRole });
    } else if (req.userRole === 'organizer') {
      res.json({
        success: true,
        organizer: {
          _id: req.organizer._id,
          name: req.organizer.name,
          email: req.organizer.email,
          category: req.organizer.category,
        },
        role: 'organizer',
      });
    }
  } catch (error) {
    next(error);
  }
};