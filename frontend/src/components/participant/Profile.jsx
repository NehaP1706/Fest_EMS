import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI, organizerAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiSave, FiEdit, FiHeart, FiUsers, FiMail, FiExternalLink, FiLock, FiEye, FiEyeOff } from 'react-icons/fi';

const INTEREST_OPTIONS = [
  'Technical',
  'Cultural',
  'Sports',
  'Literary',
  'Arts',
  'Gaming',
  'Music',
  'Dance',
  'Drama',
  'Photography',
  'Other',
];

const ParticipantProfile = () => {
  const { user, checkAuth } = useAuth();
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    collegeName: '',
    areasOfInterest: [],
  });
  const [loading, setLoading] = useState(false);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [loadingOrganizers, setLoadingOrganizers] = useState(true);

  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordMode, setPasswordMode] = useState('change'); 
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [resetData, setResetData] = useState({
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [otpSent, setOtpSent] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        contactNumber: user.contactNumber || '',
        collegeName: user.collegeName || '',
        areasOfInterest: user.areasOfInterest || [],
      });
      fetchFollowedOrganizers();
    }
  }, [user]);

  const fetchFollowedOrganizers = async () => {
    try {
      setLoadingOrganizers(true);
      
      if (user?.followedOrganizers && user.followedOrganizers.length > 0) {
        const response = await organizerAPI.getAll();
        const allOrganizers = response.data.organizers || [];
        
        const followed = allOrganizers.filter(org => 
          user.followedOrganizers.some(followedId => 
            followedId.toString() === org._id.toString()
          )
        );
        
        setFollowedOrganizers(followed);
      } else {
        setFollowedOrganizers([]);
      }
    } catch (error) {
      console.error('Error fetching followed organizers:', error);
    } finally {
      setLoadingOrganizers(false);
    }
  };

  const toggleInterest = (interest) => {
    if (!editing) return;
    
    setFormData(prev => ({
      ...prev,
      areasOfInterest: prev.areasOfInterest.includes(interest)
        ? prev.areasOfInterest.filter(i => i !== interest)
        : [...prev.areasOfInterest, interest]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await userAPI.updateProfile(formData);
      
      await checkAuth();
      
      alert('Profile updated successfully!');
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      alert('Password changed successfully!');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    setPasswordError('');
    
    try {
      setPasswordLoading(true);
      await userAPI.requestPasswordResetOTP();
      
      setOtpSent(true);
      alert('OTP sent to your email! Please check your inbox.');
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to send OTP');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setPasswordError('');

    if (!resetData.otp || !resetData.newPassword || !resetData.confirmPassword) {
      setPasswordError('All fields are required');
      return;
    }

    if (resetData.otp.length !== 6) {
      setPasswordError('OTP must be 6 digits');
      return;
    }

    if (resetData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (resetData.newPassword !== resetData.confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      await userAPI.resetPasswordWithOTP({
        otp: resetData.otp,
        newPassword: resetData.newPassword,
      });

      alert('Password reset successfully!');
      setShowPasswordModal(false);
      setResetData({ otp: '', newPassword: '', confirmPassword: '' });
      setOtpSent(false);
    } catch (error) {
      setPasswordError(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetPasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordMode('change');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setResetData({ otp: '', newPassword: '', confirmPassword: '' });
    setOtpSent(false);
    setPasswordError('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-secondary flex items-center"
            >
              <FiEdit className="mr-2" />
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
                Personal Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="input"
                    disabled={!editing}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="input"
                    disabled={!editing}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Non-editable)
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  className="input bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contactNumber}
                    onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                    className="input"
                    disabled={!editing}
                    placeholder="1234567890"
                    maxLength="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    College/Organization
                  </label>
                  <input
                    type="text"
                    value={formData.collegeName}
                    onChange={(e) => setFormData({ ...formData, collegeName: e.target.value })}
                    className="input"
                    disabled={!editing}
                    placeholder={user?.participantType === 'iiit' ? 'IIIT Hyderabad' : 'Your College'}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Participant Type (Non-editable)
                </label>
                <input
                  type="text"
                  value={user?.participantType === 'iiit' ? 'IIIT Student' : 'Non-IIIT Participant'}
                  className="input bg-gray-100 cursor-not-allowed"
                  disabled
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Areas of Interest
                </h2>
                {!editing && (
                  <span className="text-sm text-gray-600">
                    {formData.areasOfInterest.length} selected
                  </span>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Your interests help us recommend relevant events to you
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {INTEREST_OPTIONS.map((interest) => {
                  const isSelected = formData.areasOfInterest.includes(interest);
                  
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      disabled={!editing}
                      className={`p-3 rounded-lg border-2 transition-all font-medium text-sm ${
                        isSelected
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 bg-white text-gray-700'
                      } ${
                        editing 
                          ? 'hover:border-primary-300 cursor-pointer' 
                          : 'cursor-default opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{interest}</span>
                        {isSelected && (
                          <svg className="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {formData.areasOfInterest.length === 0 && !editing && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>No interests selected.</strong> Add your interests to get personalized event recommendations!
                  </p>
                </div>
              )}
            </div>

           {editing && (
              <div className="pt-6 border-t">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center disabled:opacity-50"
                >
                  <FiSave className="mr-2" />
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>

        <div className="card mt-6">
          <div className="flex items-center justify-between mb-6 pb-2 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiLock className="mr-2 text-gray-700" />
              Security Settings
            </h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Keep your account secure by updating your password regularly
          </p>

          <button
            onClick={() => setShowPasswordModal(true)}
            className="btn-secondary flex items-center"
          >
            <FiLock className="mr-2" />
            Change Password
          </button>
        </div>

        <div className="card mt-6">
          <div className="flex items-center justify-between mb-6 pb-2 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiHeart className="mr-2 text-red-500" fill="currentColor" />
              Followed Clubs
            </h2>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {followedOrganizers.length} {followedOrganizers.length === 1 ? 'club' : 'clubs'}
              </span>
              <Link to="/clubs" className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center">
                Manage Follows
                <FiExternalLink className="ml-1" size={14} />
              </Link>
            </div>
          </div>

          {loadingOrganizers ? (
            <Loader text="Loading followed clubs..." />
          ) : followedOrganizers.length === 0 ? (
            <div className="p-8 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <FiHeart className="mx-auto text-5xl text-blue-300 mb-3" />
              <h3 className="text-lg font-medium text-blue-900 mb-2">
                No Followed Clubs Yet
              </h3>
              <p className="text-sm text-blue-800 mb-4">
                Follow clubs to get personalized event recommendations and stay updated with their activities!
              </p>
              <Link to="/clubs" className="btn-primary inline-block">
                Browse Clubs
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {followedOrganizers.map((org) => (
                <Link
                  key={org._id}
                  to={`/organizer/${org._id}`}
                  className="p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md transition-all bg-white group"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                        {org.name}
                      </h3>
                      <span className="inline-block mt-2 bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                        {org.category}
                      </span>
                    </div>
                    <div className="ml-2">
                      <FiHeart className="text-red-500" fill="currentColor" size={20} />
                    </div>
                  </div>
                  
                  {org.description && (
                    <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                      {org.description}
                    </p>
                  )}

                  <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                    {org.contactEmail && (
                      <div className="flex items-center text-xs text-gray-500">
                        <FiMail className="mr-2 flex-shrink-0" size={12} />
                        <span className="truncate">{org.contactEmail}</span>
                      </div>
                    )}
                    {org.followers && org.followers.length > 0 && (
                      <div className="flex items-center text-xs text-gray-500">
                        <FiUsers className="mr-2 flex-shrink-0" size={12} />
                        <span>{org.followers.length} followers</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-3 text-xs text-primary-600 font-medium group-hover:underline">
                    View Details →
                  </div>
                </Link>
              ))}
            </div>
          )}

          {followedOrganizers.length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-700">
               <strong>Tip:</strong> Events from these clubs will appear higher in your browse results and recommendations!
              </p>
            </div>
          )}
        </div>

        <div className="card mt-6 bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200">
          <h3 className="font-semibold text-gray-900 mb-2">How Preferences Work</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Areas of Interest:</strong> Events matching your interests appear higher in browse results</li>
            <li>• <strong>Followed Clubs:</strong> Get priority notifications for events from clubs you follow</li>
            <li>• <strong>Personalized Dashboard:</strong> Your dashboard shows recommended events based on your preferences</li>
          </ul>
        </div>
      </div>

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {passwordMode === 'change' ? 'Change Password' : 'Reset Password'}
                </h3>
                <button
                  onClick={resetPasswordModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => {
                    setPasswordMode('change');
                    setOtpSent(false);
                    setPasswordError('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    passwordMode === 'change'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  With Old Password
                </button>
                <button
                  onClick={() => {
                    setPasswordMode('reset');
                    setPasswordError('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                    passwordMode === 'reset'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Via Email OTP
                </button>
              </div>

              {passwordError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-700">{passwordError}</p>
                </div>
              )}

              {passwordMode === 'change' && (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                        className="input pr-10"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPasswords.current ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        className="input pr-10"
                        placeholder="Enter new password (min 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPasswords.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        className="input pr-10"
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                      >
                        {showPasswords.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="w-full btn-primary disabled:opacity-50"
                  >
                    {passwordLoading ? 'Changing Password...' : 'Change Password'}
                  </button>
                </form>
              )}

              {passwordMode === 'reset' && (
                <div className="space-y-4">
                  {!otpSent ? (
                    <div>
                      <p className="text-sm text-gray-600 mb-4">
                        We'll send a 6-digit OTP to <strong>{user?.email}</strong>
                      </p>
                      <button
                        onClick={handleRequestOTP}
                        disabled={passwordLoading}
                        className="w-full btn-primary disabled:opacity-50"
                      >
                        {passwordLoading ? 'Sending OTP...' : 'Send OTP to Email'}
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handlePasswordReset} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Enter 6-Digit OTP
                        </label>
                        <input
                          type="text"
                          value={resetData.otp}
                          onChange={(e) => setResetData({ ...resetData, otp: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                          className="input text-center text-2xl tracking-widest"
                          placeholder="000000"
                          maxLength="6"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Check your email for the OTP code
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            value={resetData.newPassword}
                            onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                            className="input pr-10"
                            placeholder="Enter new password (min 6 characters)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          >
                            {showPasswords.new ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            value={resetData.confirmPassword}
                            onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                            className="input pr-10"
                            placeholder="Re-enter new password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                          >
                            {showPasswords.confirm ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setOtpSent(false)}
                          className="flex-1 btn-secondary"
                        >
                          Resend OTP
                        </button>
                        <button
                          type="submit"
                          disabled={passwordLoading}
                          className="flex-1 btn-primary disabled:opacity-50"
                        >
                          {passwordLoading ? 'Resetting...' : 'Reset Password'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantProfile;