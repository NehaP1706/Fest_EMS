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
    const organizers = await Organizer.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, organizers });
  } catch (error) {
    next(error);
  }
};

exports.deleteOrganizer = async (req, res, next) => {
  try {
    const organizer = await Organizer.findById(req.params.id);

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    organizer.isActive = false;
    await organizer.save();

    res.json({ success: true, message: 'Organizer disabled' });
  } catch (error) {
    next(error);
  }
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