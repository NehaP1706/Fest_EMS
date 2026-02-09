const User = require('../models/User');
const Organizer = require('../models/Organizer');

// Set user preferences (onboarding or later)
exports.setPreferences = async (req, res, next) => {
  try {
    const { areasOfInterest, followedOrganizers } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update areas of interest
    if (areasOfInterest !== undefined) {
      user.areasOfInterest = areasOfInterest;
    }

    // Update followed organizers
    if (followedOrganizers !== undefined) {
      // Validate organizer IDs
      const validOrganizers = await Organizer.find({
        _id: { $in: followedOrganizers }
      }).select('_id');
      
      user.followedOrganizers = validOrganizers.map(org => org._id);
      
      // Update follower count in organizers
      // Remove user from all previous follows
      await Organizer.updateMany(
        { followers: user._id },
        { $pull: { followers: user._id } }
      );
      
      // Add user to new follows
      await Organizer.updateMany(
        { _id: { $in: user.followedOrganizers } },
        { $addToSet: { followers: user._id } }
      );
    }

    await user.save();

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
exports.updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, contactNumber, collegeName, areasOfInterest } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (contactNumber !== undefined) user.contactNumber = contactNumber;
    if (collegeName !== undefined) user.collegeName = collegeName;
    
    // Update areas of interest if provided
    if (areasOfInterest !== undefined) {
      user.areasOfInterest = areasOfInterest;
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: user.getPublicProfile(),
    });
  } catch (error) {
    next(error);
  }
};

// Change password
exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    const bcrypt = require('bcryptjs');
    
    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Toggle follow/unfollow organizer
exports.toggleFollowOrganizer = async (req, res, next) => {
  try {
    const { organizerId } = req.params;

    const organizer = await Organizer.findById(organizerId);
    if (!organizer) {
      return res.status(404).json({ success: false, message: 'Organizer not found' });
    }

    const user = await User.findById(req.user._id);
    const isFollowing = user.followedOrganizers.includes(organizerId);

    if (isFollowing) {
      // Unfollow
      user.followedOrganizers = user.followedOrganizers.filter(
        id => id.toString() !== organizerId
      );
      organizer.followers = organizer.followers.filter(
        id => id.toString() !== user._id.toString()
      );
    } else {
      // Follow
      user.followedOrganizers.push(organizerId);
      if (!organizer.followers.includes(user._id)) {
        organizer.followers.push(user._id);
      }
    }

    await user.save();
    await organizer.save();

    res.json({
      success: true,
      message: isFollowing ? 'Unfollowed successfully' : 'Followed successfully',
      isFollowing: !isFollowing,
      user: user.getPublicProfile(),
    });
  } catch (error) {
    next(error);
  }
};