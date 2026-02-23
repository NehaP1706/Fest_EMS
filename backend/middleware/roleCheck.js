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

exports.isParticipant = (req, res, next) => {
  if (req.userRole !== 'participant') {
    return res.status(403).json({
      success: false,
      message: 'This route is only accessible to participants',
    });
  }
  next();
};

exports.isOrganizer = (req, res, next) => {
  if (req.userRole !== 'organizer') {
    return res.status(403).json({
      success: false,
      message: 'This route is only accessible to organizers',
    });
  }
  next();
};

exports.isAdmin = (req, res, next) => {
  if (req.userRole !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'This route is only accessible to administrators',
    });
  }
  next();
};