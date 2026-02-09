import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { userAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import { FiSave, FiEdit, FiHeart } from 'react-icons/fi';

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

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        contactNumber: user.contactNumber || '',
        collegeName: user.collegeName || '',
        areasOfInterest: user.areasOfInterest || [],
      });
    }
  }, [user]);

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
      
      // Refresh user data in context
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
            {/* Personal Information Section */}
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
            </div>

            {/* Areas of Interest Section */}
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

            {/* Followed Clubs Section */}
            <div>
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <FiHeart className="mr-2 text-red-500" />
                  Followed Clubs
                </h2>
                <span className="text-sm text-gray-600">
                  {user?.followedOrganizers?.length || 0} clubs
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Manage your followed clubs from the{' '}
                <a href="/clubs" className="text-primary-600 hover:underline font-medium">
                  Clubs & Organizers
                </a>{' '}
                page
              </p>

              {(!user?.followedOrganizers || user.followedOrganizers.length === 0) && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    You're not following any clubs yet. Follow clubs to stay updated with their events!
                  </p>
                  <a 
                    href="/clubs" 
                    className="inline-block mt-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                  >
                    Browse Clubs →
                  </a>
                </div>
              )}
            </div>

            {/* Save Button */}
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

        {/* Additional Info Card */}
        <div className="card mt-6 bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200">
          <h3 className="font-semibold text-gray-900 mb-2">💡 How Preferences Work</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>Areas of Interest:</strong> Events matching your interests appear higher in browse results</li>
            <li>• <strong>Followed Clubs:</strong> Get priority notifications for events from clubs you follow</li>
            <li>• <strong>Personalized Dashboard:</strong> Your dashboard shows recommended events based on your preferences</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ParticipantProfile;