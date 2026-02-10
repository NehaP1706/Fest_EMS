const User = require('../models/User');
const Organizer = require('../models/Organizer');
const bcrypt = require('bcryptjs');
const { sendEmail } = require('../config/email');
const crypto = require('crypto');

const otpStore = new Map();

exports.changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    
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

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Password Changed Successfully',
      html: `
        <h2>Password Changed</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your password has been changed successfully.</p>
        <p>If you did not make this change, please contact us immediately.</p>
        <br>
        <p>Best regards,<br>Felicity EMS Team</p>
      `,
    });

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

exports.requestPasswordResetOTP = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    
    // Store OTP with expiry (5 minutes)
    const otpData = {
      otp,
      userId: user._id.toString(),
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    };
    otpStore.set(user.email, otpData);

    // Send OTP via email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset OTP - Felicity EMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6366f1;">Password Reset Request</h2>
          <p>Hi ${user.firstName},</p>
          <p>You requested to reset your password. Use the OTP below to proceed:</p>
          
          <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h1 style="color: #6366f1; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
          </div>
          
          <p><strong>This OTP will expire in 5 minutes.</strong></p>
          
          <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
          
          <br>
          <p>Best regards,<br>Felicity EMS Team</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: 'OTP sent to your email',
    });
  } catch (error) {
    next(error);
  }
};

// Reset password with OTP
exports.resetPasswordWithOTP = async (req, res, next) => {
  try {
    const { otp, newPassword } = req.body;

    if (!otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide OTP and new password',
      });
    }

    if (otp.length !== 6) {
      return res.status(400).json({
        success: false,
        message: 'OTP must be 6 digits',
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Get stored OTP
    const otpData = otpStore.get(user.email);
    
    if (!otpData) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found. Please request a new one.',
      });
    }

    // Check if OTP expired
    if (Date.now() > otpData.expiresAt) {
      otpStore.delete(user.email);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Verify OTP
    if (otpData.otp !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP',
      });
    }

    // Hash and update new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    // Delete used OTP
    otpStore.delete(user.email);

    // Send confirmation email
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Successful',
      html: `
        <h2>Password Reset Successful</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your password has been reset successfully.</p>
        <p>You can now log in with your new password.</p>
        <p>If you did not make this change, please contact us immediately.</p>
        <br>
        <p>Best regards,<br>Felicity EMS Team</p>
      `,
    });

    res.json({
      success: true,
      message: 'Password reset successfully',
    });
  } catch (error) {
    next(error);
  }
};

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