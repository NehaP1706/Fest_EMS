import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { organizerAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiSave, FiEdit, FiLock, FiAlertCircle } from 'react-icons/fi';

const OrganizerProfile = () => {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [organizerData, setOrganizerData] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    contactEmail: '',
    contactNumber: '',
    discordWebhookUrl: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Password reset request states
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetReason, setResetReason] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetRequests, setResetRequests] = useState([]);

  useEffect(() => {
    fetchOrganizerProfile();
    fetchResetRequests();
  }, []);

  const fetchOrganizerProfile = async () => {
    try {
      setLoading(true);
      const response = await organizerAPI.getById(user._id);
      const orgData = response.data.organizer;
      
      setOrganizerData(orgData);
      setFormData({
        name: orgData.name || '',
        category: orgData.category || '',
        description: orgData.description || '',
        contactEmail: orgData.contactEmail || '',
        contactNumber: orgData.contactNumber || '',
        discordWebhookUrl: orgData.discordWebhookUrl || '',
      });
    } catch (error) {
      console.error('Error fetching organizer profile:', error);
      if (user) {
        setFormData({
          name: user.name || '',
          category: user.category || '',
          description: user.description || '',
          contactEmail: user.contactEmail || '',
          contactNumber: user.contactNumber || '',
          discordWebhookUrl: user.discordWebhookUrl || '',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchResetRequests = async () => {
    try {
      const response = await organizerAPI.getMyResetRequests();
      setResetRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching reset requests:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await organizerAPI.updateProfile(formData);
      alert('Profile updated successfully!');
      setEditing(false);
      await fetchOrganizerProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestReset = async (e) => {
    e.preventDefault();
    
    if (!resetReason.trim()) {
      alert('Please provide a reason for the password reset request');
      return;
    }

    if (resetReason.trim().length < 10) {
      alert('Please provide a more detailed reason (at least 10 characters)');
      return;
    }

    try {
      setResetLoading(true);
      await organizerAPI.requestPasswordReset({ reason: resetReason });
      
      alert('Password reset request submitted! An admin will review it soon.');
      setShowResetModal(false);
      setResetReason('');
      await fetchResetRequests();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setResetLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      approved: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
    };
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-300';
  };

  const hasPendingRequest = resetRequests.some(r => r.status === 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Loader text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Profile Card */}
        <div className="card mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Organization Profile</h1>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-secondary flex items-center"
            >
              <FiEdit className="mr-2" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Organization Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="input"
                disabled={!editing}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="input"
                disabled={!editing}
              >
                <option value="">Select Category</option>
                <option value="Technical">Technical</option>
                <option value="Cultural">Cultural</option>
                <option value="Sports">Sports</option>
                <option value="Literary">Literary</option>
                <option value="Arts">Arts</option>
                <option value="Council">Council</option>
                <option value="Fest Team">Fest Team</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="input"
                rows={4}
                disabled={!editing}
                placeholder="Enter organization description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Login Email (Non-editable)
              </label>
              <input
                type="email"
                value={organizerData?.email || user?.email || ''}
                className="input bg-gray-100 cursor-not-allowed"
                disabled
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="input"
                disabled={!editing}
                placeholder="contact@organization.com"
              />
            </div>

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
                Discord Webhook URL (Optional)
              </label>
              <input
                type="url"
                value={formData.discordWebhookUrl}
                onChange={(e) => setFormData({ ...formData, discordWebhookUrl: e.target.value })}
                className="input"
                placeholder="https://discord.com/api/webhooks/..."
                disabled={!editing}
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-post new events to your Discord server
              </p>
            </div>

            {editing && (
              <button
                type="submit"
                disabled={saving}
                className="btn-primary w-full flex items-center justify-center disabled:opacity-50"
              >
                <FiSave className="mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>
        </div>

        {/* Password Reset Card */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4 pb-2 border-b">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FiLock className="mr-2 text-gray-700" />
              Password Reset
            </h2>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            If you've forgotten your password or need to reset it, submit a request to the admin.
          </p>

          {hasPendingRequest && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start">
              <FiAlertCircle className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  You have a pending password reset request
                </p>
                <p className="text-xs text-yellow-700 mt-1">
                  Please wait for admin approval before submitting another request
                </p>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowResetModal(true)}
            disabled={hasPendingRequest}
            className="btn-secondary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FiLock className="mr-2" />
            Request Password Reset
          </button>
        </div>

        {/* Reset Request History */}
        {resetRequests.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b">
              Reset Request History
            </h2>
            <div className="space-y-3">
              {resetRequests.slice(0, 5).map((request) => (
                <div
                  key={request._id}
                  className={`p-4 border-2 rounded-lg ${getStatusColor(request.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-1">
                        Requested: {new Date(request.requestedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reason:</span> {request.reason}
                      </p>
                      {request.status === 'approved' && request.reviewedAt && (
                        <p className="text-xs text-green-700 mt-2">
                          ✓ Approved on {new Date(request.reviewedAt).toLocaleDateString()}
                        </p>
                      )}
                      {request.status === 'rejected' && (
                        <div className="mt-2">
                          <p className="text-xs text-red-700">
                            ✗ Rejected on {new Date(request.reviewedAt).toLocaleDateString()}
                          </p>
                          {request.adminComments && (
                            <p className="text-xs text-red-600 mt-1">
                              Admin: {request.adminComments}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <span className={`ml-4 px-3 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Password Reset Request Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Request Password Reset
                </h3>
                <button
                  onClick={() => {
                    setShowResetModal(false);
                    setResetReason('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Password Reset *
                  </label>
                  <textarea
                    value={resetReason}
                    onChange={(e) => setResetReason(e.target.value)}
                    className="input"
                    rows={5}
                    placeholder="Please provide a detailed reason for requesting a password reset (min 10 characters)..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {resetReason.length}/10 characters minimum
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Your request will be reviewed by an admin. Once approved, you'll receive a new password via email.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetModal(false);
                      setResetReason('');
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading || resetReason.length < 10}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {resetLoading ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerProfile;