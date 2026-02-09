const Organizer = require('../models/Organizer');
const bcrypt = require('bcryptjs');

exports.getAllOrganizers = async (req, res, next) => {
  try {
    const organizers = await Organizer.find({ isActive: true })
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