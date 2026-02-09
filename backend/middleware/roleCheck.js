// Role-based access control middleware

exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.userRole}' is not authorized to access this route`,
      });
    }
    next();
  };
};

// Check if user is participant
exports.isParticipant = (req, res, next) => {
  if (req.userRole !== 'participant') {
    return res.status(403).json({
      success: false,
      message: 'This route is only accessible to participants',
    });
  }
  next();
};

// Check if user is organizer
exports.isOrganizer = (req, res, next) => {
  if (req.userRole !== 'organizer') {
    return res.status(403).json({
      success: false,
      message: 'This route is only accessible to organizers',
    });
  }
  next();
};

// Check if user is admin
exports.isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'This route is only accessible to administrators',
    });
  }
  next();
};