const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organizer = require('../models/Organizer');

const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const generateRefreshToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
          message: 'Account has been disabled',
        });
      }
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
        code: 'TOKEN_EXPIRED',
      });
    }
    
    return res.status(401).json({
      success: false,
      message: 'Not authorized, invalid token',
    });
  }
};

const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.role === 'participant' || decoded.role === 'admin') {
      req.user = await User.findById(decoded.id).select('-password');
    } else if (decoded.role === 'organizer') {
      req.organizer = await Organizer.findById(decoded.id).select('-password');
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    next();
  }
};

module.exports = { 
  generateToken, 
  generateRefreshToken, 
  protect,
  optionalProtect
};