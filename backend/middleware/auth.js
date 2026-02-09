const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organizer = require('../models/Organizer');

// Protect routes - verify JWT token
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this route',
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request based on role
      if (decoded.role === 'participant' || decoded.role === 'admin') {
        req.user = await User.findById(decoded.id).select('-password');
        if (!req.user) {
          return res.status(401).json({
            success: false,
            message: 'User not found',
          });
        }
      } else if (decoded.role === 'organizer') {
        req.organizer = await Organizer.findById(decoded.id).select('-password');
        if (!req.organizer) {
          return res.status(401).json({
            success: false,
            message: 'Organizer not found',
          });
        }
        if (!req.organizer.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Organizer account is disabled',
          });
        }
      }

      req.userRole = decoded.role;
      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Token is invalid or expired',
      });
    }
  } catch (error) {
    next(error);
  }
};

// Generate JWT Token
exports.generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};