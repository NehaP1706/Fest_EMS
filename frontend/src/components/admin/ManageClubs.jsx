import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiPlus, FiTrash2, FiEye, FiEyeOff } from 'react-icons/fi';

const ManageClubs = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Technical',
    description: '',
    contactEmail: '',
    contactNumber: '',
  });
  const [newCredentials, setNewCredentials] = useState(null);

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await adminAPI.getAllOrganizers();
      setOrganizers(response.data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await adminAPI.createOrganizer(formData);
      setNewCredentials({
        name: formData.name,
        email: response.data.organizer.email,
        password: response.data.organizer.temporaryPassword,
      });
      setFormData({
        name: '',
        category: 'Technical',
        description: '',
        contactEmail: '',
        contactNumber: '',
      });
      setShowAddForm(false);
      fetchOrganizers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to create organizer');
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to disable/remove ${name}?`)) return;

    try {
      await adminAPI.deleteOrganizer(id);
      alert('Organizer disabled successfully');
      fetchOrganizers();
    } catch (error) {
      alert('Failed to delete organizer');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Manage Clubs & Organizers</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-primary flex items-center"
          >
            <FiPlus className="mr-2" />
            Add New Club
          </button>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Club/Organizer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Organization Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                  >
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                    className="input"
                    required
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
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="btn-primary">
                  Create Organizer
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* New Credentials Display */}
        {newCredentials && (
          <div className="card mb-6 bg-green-50 border-2 border-green-200">
            <h2 className="text-xl font-semibold text-green-900 mb-4">
              ✓ Organizer Created Successfully!
            </h2>
            <div className="bg-white p-4 rounded border border-green-200">
              <p className="text-sm text-gray-600 mb-3">
                Share these credentials with the organizer:
              </p>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Organization:</span>
                  <span className="font-semibold">{newCredentials.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Login Email:</span>
                  <span className="font-semibold">{newCredentials.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Password:</span>
                  <span className="font-semibold text-primary-600">
                    {newCredentials.password}
                  </span>
                </div>
              </div>
              <p className="text-xs text-orange-600 mt-3">
                ⚠️ Save these credentials now! They won't be shown again.
              </p>
            </div>
            <button
              onClick={() => setNewCredentials(null)}
              className="btn-secondary mt-4"
            >
              Close
            </button>
          </div>
        )}

        {/* Organizers List */}
        {loading ? (
          <Loader />
        ) : (
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">All Organizers</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Category</th>
                    <th className="text-left py-3 px-4">Contact Email</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {organizers.map((org) => (
                    <tr key={org._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{org.name}</td>
                      <td className="py-3 px-4">
                        <span className="bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded">
                          {org.category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">{org.contactEmail}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            org.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {org.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(org._id, org.name)}
                          className="text-red-600 hover:text-red-800"
                          title="Disable/Remove"
                        >
                          <FiTrash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageClubs;