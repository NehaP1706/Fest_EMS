const Organizer = require('../models/Organizer');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const bcrypt = require('bcryptjs');

exports.getAllOrganizers = async (req, res, next) => {
  try {
    const organizers = await Organizer.find({ status: 'active' })
      .select('-password -discordWebhookUrl')
      .sort({ name: 1 });

    res.json({ success: true, count: organizers.length, organizers });
  } catch (error) {
    next(error);
  }
};

exports.getOrganizer = async (req, res, next) => {
  try {
    const organizer = await Organizer.findById(req.params.id)
      .select('-password -discordWebhookUrl');

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    res.json({ success: true, organizer });
  } catch (error) {
    next(error);
  }
};

exports.updateOrganizerProfile = async (req, res, next) => {
  try {
    const { name, category, description, contactEmail, contactNumber, discordWebhookUrl } = req.body;
    const organizer = await Organizer.findById(req.organizer._id);

    if (name) organizer.name = name;
    if (category) organizer.category = category;
    if (description) organizer.description = description;
    if (contactEmail) organizer.contactEmail = contactEmail;
    if (contactNumber) organizer.contactNumber = contactNumber;
    if (discordWebhookUrl !== undefined) organizer.discordWebhookUrl = discordWebhookUrl;

    await organizer.save();
    res.json({ success: true, organizer });
  } catch (error) {
    next(error);
  }
};

exports.changeOrganizerPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const organizer = await Organizer.findById(req.organizer._id);

    const passwordMatch = await bcrypt.compare(currentPassword, organizer.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    organizer.password = await bcrypt.hash(newPassword, 10);
    await organizer.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a detailed reason (at least 10 characters)',
      });
    }

    const existingPending = await PasswordResetRequest.findOne({
      organizer: req.organizer._id,
      status: 'pending',
    });

    if (existingPending) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending password reset request. Please wait for admin review.',
      });
    }

    const resetRequest = await PasswordResetRequest.create({
      organizer: req.organizer._id,
      reason: reason.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Password reset request submitted successfully',
      request: resetRequest,
    });
  } catch (error) {
    next(error);
  }
};

exports.getMyResetRequests = async (req, res, next) => {
  try {
    const requests = await PasswordResetRequest.find({
      organizer: req.organizer._id,
    })
      .sort({ requestedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      requests,
    });
  } catch (error) {
    next(error);
  }
};