const User = require('../models/User');
const bcrypt = require('bcryptjs');

exports.setPreferences = async (req, res, next) => {
  try {
    const { areasOfInterest, followedOrganizers } = req.body;
    const user = await User.findById(req.user._id);
    
    if (areasOfInterest) user.areasOfInterest = areasOfInterest;
    if (followedOrganizers) user.followedOrganizers = followedOrganizers;
    await user.save();

    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, contactNumber, collegeName, areasOfInterest, followedOrganizers } = req.body;
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (contactNumber) user.contactNumber = contactNumber;
    if (collegeName) user.collegeName = collegeName;
    if (areasOfInterest) user.areasOfInterest = areasOfInterest;
    if (followedOrganizers !== undefined) user.followedOrganizers = followedOrganizers;

    await user.save();
    res.json({ success: true, user: user.getPublicProfile() });
  } catch (error) {
    next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(400).json({ success: false, message: 'Current password incorrect' });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    next(error);
  }
};

exports.toggleFollowOrganizer = async (req, res, next) => {
  try {
    const Organizer = require('../models/Organizer');
    const organizerId = req.params.organizerId;
    const user = await User.findById(req.user._id);
    const organizer = await Organizer.findById(organizerId);

    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    const isFollowing = user.followedOrganizers.includes(organizerId);

    if (isFollowing) {
      user.followedOrganizers = user.followedOrganizers.filter(id => id.toString() !== organizerId);
      organizer.followers = organizer.followers.filter(id => id.toString() !== req.user._id.toString());
    } else {
      user.followedOrganizers.push(organizerId);
      organizer.followers.push(req.user._id);
    }

    await user.save();
    await organizer.save();

    res.json({ success: true, isFollowing: !isFollowing });
  } catch (error) {
    next(error);
  }
};