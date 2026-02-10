const Organizer = require('../models/Organizer');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../config/email');
const { organizerCredentialsEmail, passwordResetEmail } = require('../utils/emailTemplates');

function generatePassword() {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

exports.createOrganizer = async (req, res, next) => {
  try {
    const { name, category, description, contactEmail, contactNumber } = req.body;

    const email = `${name.toLowerCase().replace(/\s+/g, '.')}@felicity-org.com`;
    const password = generatePassword();
    const hashedPassword = await bcrypt.hash(password, 10);

    const organizer = await Organizer.create({
      name,
      email,
      password: hashedPassword,
      category,
      description,
      contactEmail,
      contactNumber,
      status: 'active',
      createdBy: req.user._id,
    });

    // Send credentials email
    await sendEmail({
      to: contactEmail,
      subject: 'Your Felicity Organizer Account',
      html: organizerCredentialsEmail({
        organizerName: name,
        email,
        password,
        category,
      }),
    });

    res.status(201).json({
      success: true,
      message: 'Organizer created',
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        temporaryPassword: password,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrganizersAdmin = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};

    if (status && ['active', 'disabled', 'archived'].includes(status)) {
      // Use a Regular Expression to match "active" OR "\"active\""
      filter.status = { $regex: new RegExp(`^"?${status}"?$`, 'i') };
    }

    const organizers = await Organizer.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ 
      success: true, 
      count: organizers.length,
      organizers 
    });
  } catch (error) {
    next(error);
  }
};

// Disable organizer (soft disable)
exports.disableOrganizer = async (req, res, next) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    if (organizer.status === 'disabled') {
      return res.status(400).json({ success: false, message: 'Organizer is already disabled' });
    }

    organizer.status = 'disabled';
    await organizer.save();

    res.json({ 
      success: true, 
      message: 'Organizer disabled successfully',
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        status: organizer.status,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Enable organizer
exports.enableOrganizer = async (req, res, next) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    if (organizer.status === 'active') {
      return res.status(400).json({ success: false, message: 'Organizer is already active' });
    }

    if (organizer.status === 'archived') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot enable archived organizer. Unarchive first.' 
      });
    }

    organizer.status = 'active';
    await organizer.save();

    res.json({ 
      success: true, 
      message: 'Organizer enabled successfully',
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        status: organizer.status,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Archive organizer
exports.archiveOrganizer = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    if (organizer.status === 'archived') {
      return res.status(400).json({ success: false, message: 'Organizer is already archived' });
    }

    organizer.status = 'archived';
    organizer.archivedAt = new Date();
    organizer.archivedBy = req.user._id;
    organizer.archiveReason = reason || 'No reason provided';
    await organizer.save();

    res.json({ 
      success: true, 
      message: 'Organizer archived successfully',
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        status: organizer.status,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Unarchive organizer
exports.unarchiveOrganizer = async (req, res, next) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    if (organizer.status !== 'archived') {
      return res.status(400).json({ success: false, message: 'Organizer is not archived' });
    }

    organizer.status = 'disabled'; // Unarchive to disabled state for safety
    organizer.archivedAt = undefined;
    organizer.archivedBy = undefined;
    organizer.archiveReason = undefined;
    await organizer.save();

    res.json({ 
      success: true, 
      message: 'Organizer unarchived successfully (status set to disabled)',
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        status: organizer.status,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Hard delete organizer (permanent deletion)
exports.deleteOrganizer = async (req, res, next) => {
  try {
    const { confirmDelete } = req.body;

    if (confirmDelete !== 'DELETE') {
      return res.status(400).json({ 
        success: false, 
        message: 'Please confirm deletion by sending confirmDelete: "DELETE"' 
      });
    }

    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    // Delete associated password reset requests
    await PasswordResetRequest.deleteMany({ organizer: organizer._id });

    // Hard delete the organizer
    await Organizer.findByIdAndDelete(req.params.id);

    res.json({ 
      success: true, 
      message: 'Organizer permanently deleted from database',
      deletedOrganizer: {
        _id: organizer._id,
        name: organizer.name,
      }
    });
  } catch (error) {
    next(error);
  }
};

// Legacy method - redirects to disable
exports.deleteOrganizerLegacy = async (req, res, next) => {
  return exports.disableOrganizer(req, res, next);
};

exports.getPasswordResetRequests = async (req, res, next) => {
  try {
    const requests = await PasswordResetRequest.find()
      .populate('organizer', 'name email category')
      .sort({ requestedAt: -1 });

    res.json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

exports.approvePasswordReset = async (req, res, next) => {
  try {
    const request = await PasswordResetRequest.findById(req.params.id).populate('organizer');

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const newPassword = generatePassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    request.status = 'approved';
    request.newPassword = newPassword;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Update organizer password
    request.organizer.password = hashedPassword;
    await request.organizer.save();

    // Send email
    await sendEmail({
      to: request.organizer.email,
      subject: 'Password Reset Approved',
      html: passwordResetEmail({
        organizerName: request.organizer.name,
        newPassword,
      }),
    });

    res.json({ success: true, message: 'Password reset approved', newPassword });
  } catch (error) {
    next(error);
  }
};

exports.rejectPasswordReset = async (req, res, next) => {
  try {
    const { comments } = req.body;
    const request = await PasswordResetRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    request.status = 'rejected';
    request.adminComments = comments;
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    await request.save();

    res.json({ success: true, message: 'Password reset rejected' });
  } catch (error) {
    next(error);
  }
};