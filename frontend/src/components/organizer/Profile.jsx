import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { organizerAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiSave, FiEdit } from 'react-icons/fi';

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

  useEffect(() => {
    fetchOrganizerProfile();
  }, []);

  const fetchOrganizerProfile = async () => {
    try {
      setLoading(true);
      // Fetch the full organizer profile
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
      // Fallback to user data from context
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await organizerAPI.updateProfile(formData);
      alert('Profile updated successfully!');
      setEditing(false);
      // Refresh the profile data
      await fetchOrganizerProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

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
        <div className="card">
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
      </div>
    </div>
  );
};

export default OrganizerProfile;