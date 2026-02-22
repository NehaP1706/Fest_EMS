// REPLACE YOUR ENTIRE auth.js middleware file with this:

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organizer = require('../models/Organizer');

// Generate access token (7 days)
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate refresh token (30 days)
const generateRefreshToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// Protect routes - verify JWT token (REQUIRED AUTH)
const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
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
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log('🔐 Token decoded:', { id: decoded.id, role: decoded.role });

    // Attach user/organizer to request based on role
    if (decoded.role === 'participant' || decoded.role === 'admin') {
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
        });
      }
      console.log('✅ User loaded:', req.user.email, req.user.participantType);
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
      console.log('✅ Organizer loaded:', req.organizer.name);
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    console.error('❌ Token verification error:', error.message);
    
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

// Optional protect - loads user if token exists, continues if not (OPTIONAL AUTH)
const optionalProtect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // No token? Continue as guest
  if (!token) {
    console.log('⚠️ optionalProtect: No token, continuing as guest');
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('🔐 optionalProtect: Token decoded:', { id: decoded.id, role: decoded.role });

    // Load user based on role - NOTE THE ROLE VALUES!
    if (decoded.role === 'participant' || decoded.role === 'admin') {
      req.user = await User.findById(decoded.id).select('-password');
      if (req.user) {
        console.log('✅ optionalProtect: User loaded:', req.user.email, req.user.participantType);
      } else {
        console.log('⚠️ optionalProtect: User not found in DB');
      }
    } else if (decoded.role === 'organizer') {
      req.organizer = await Organizer.findById(decoded.id).select('-password');
      if (req.organizer) {
        console.log('✅ optionalProtect: Organizer loaded:', req.organizer.name);
      } else {
        console.log('⚠️ optionalProtect: Organizer not found in DB');
      }
    } else {
      console.log('⚠️ optionalProtect: Unknown role:', decoded.role);
    }

    req.userRole = decoded.role;
    next();
  } catch (error) {
    // Token invalid? Continue anyway as guest
    console.log('⚠️ optionalProtect: Token invalid, continuing as guest:', error.message);
    next();
  }
};

module.exports = { 
  generateToken, 
  generateRefreshToken, 
  protect,
  optionalProtect
};