import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiPlus, FiMoreVertical, FiTrash2, FiArchive, FiPower, FiCheck } from 'react-icons/fi';

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
  const [statusFilter, setStatusFilter] = useState('all');
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ show: false, action: null, organizer: null });

  useEffect(() => {
    fetchOrganizers();
  }, [statusFilter]);

  const fetchOrganizers = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await adminAPI.getAllOrganizers(params);
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

  const openConfirmModal = (action, organizer) => {
    setConfirmModal({ show: true, action, organizer });
    setShowActionMenu(null);
  };

  const closeConfirmModal = () => {
    setConfirmModal({ show: false, action: null, organizer: null });
  };

  const executeAction = async () => {
    const { action, organizer } = confirmModal;

    try {
      switch (action) {
        case 'enable':
          await adminAPI.enableOrganizer(organizer._id);
          alert(`${organizer.name} has been enabled successfully`);
          break;
        case 'disable':
          await adminAPI.disableOrganizer(organizer._id);
          alert(`${organizer.name} has been disabled successfully`);
          break;
        case 'archive':
          await adminAPI.archiveOrganizer(organizer._id, { 
            reason: 'Archived by admin' 
          });
          alert(`${organizer.name} has been archived successfully`);
          break;
        case 'unarchive':
          await adminAPI.unarchiveOrganizer(organizer._id);
          alert(`${organizer.name} has been unarchived successfully`);
          break;
        case 'delete':
          await adminAPI.deleteOrganizer(organizer._id, { 
            confirmDelete: 'DELETE' 
          });
          alert(`${organizer.name} has been permanently deleted`);
          break;
        default:
          break;
      }
      fetchOrganizers();
      closeConfirmModal();
    } catch (error) {
      alert(error.response?.data?.message || `Failed to ${action} organizer`);
      closeConfirmModal();
    }
  };

  const getStatusBadge = (status) => {
    // Clean the status string by removing any literal quotes
    const cleanStatus = typeof status === 'string' 
      ? status.replace(/"/g, '').toLowerCase() 
      : status;

    const badges = {
      active: 'bg-green-100 text-green-800',
      disabled: 'bg-gray-100 text-gray-800',
      archived: 'bg-yellow-100 text-yellow-800',
    };
    return badges[cleanStatus] || 'bg-gray-100 text-gray-800';
  };

  const getAvailableActions = (organizer) => {
    const actions = [];

    const status = typeof organizer.status === 'string' 
      ? organizer.status.replace(/"/g, '').toLowerCase() 
      : organizer.status;
    
    if (status === 'active') {
      actions.push({ key: 'disable', label: 'Disable', icon: FiPower, color: 'text-orange-600' });
      actions.push({ key: 'archive', label: 'Archive', icon: FiArchive, color: 'text-blue-600' });
    }
    
    if (status === 'disabled') {
      actions.push({ key: 'enable', label: 'Enable', icon: FiCheck, color: 'text-green-600' });
      actions.push({ key: 'archive', label: 'Archive', icon: FiArchive, color: 'text-blue-600' });
    }
    
    if (status === 'archived') {
      actions.push({ key: 'unarchive', label: 'Unarchive', icon: FiArchive, color: 'text-blue-600' });
    }
    
    // Delete is always available (dangerous action)
    actions.push({ key: 'delete', label: 'Delete Permanently', icon: FiTrash2, color: 'text-red-600' });
    
    return actions;
  };

  const getConfirmationMessage = (action, organizerName) => {
    const messages = {
      enable: `Are you sure you want to enable "${organizerName}"? They will be able to log in and manage events.`,
      disable: `Are you sure you want to disable "${organizerName}"? They will not be able to log in.`,
      archive: `Are you sure you want to archive "${organizerName}"? Archived organizers are hidden from active lists but can be restored.`,
      unarchive: `Are you sure you want to unarchive "${organizerName}"? They will be restored to disabled status.`,
      delete: `⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE "${organizerName}"? This action CANNOT be undone. All data associated with this organizer will be lost forever.`,
    };
    return messages[action] || 'Are you sure?';
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
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">All Organizers</h2>
              
              {/* Status Filter */}
              <div className="flex gap-2">
                <button
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1 rounded text-sm ${
                    statusFilter === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  All ({organizers.length})
                </button>
                <button
                  onClick={() => setStatusFilter('active')}
                  className={`px-3 py-1 rounded text-sm ${
                    statusFilter === 'active'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Active
                </button>
                <button
                  onClick={() => setStatusFilter('disabled')}
                  className={`px-3 py-1 rounded text-sm ${
                    statusFilter === 'disabled'
                      ? 'bg-orange-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Disabled
                </button>
                <button
                  onClick={() => setStatusFilter('archived')}
                  className={`px-3 py-1 rounded text-sm ${
                    statusFilter === 'archived'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Archived
                </button>
              </div>
            </div>

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
                          className={`text-xs px-2 py-1 rounded ${getStatusBadge(org.status)}`}
                        >
                          {org.status.charAt(0).toUpperCase() + org.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(org.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right relative">
                        <button
                          onClick={() => setShowActionMenu(showActionMenu === org._id ? null : org._id)}
                          className="p-2 hover:bg-gray-200 rounded"
                          title="Actions"
                        >
                          <FiMoreVertical size={18} />
                        </button>

                        {/* Action Dropdown */}
                        {showActionMenu === org._id && (
                          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-10">
                            {getAvailableActions(org).map((action) => (
                              <button
                                key={action.key}
                                onClick={() => openConfirmModal(action.key, org)}
                                className={`w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center ${action.color} ${
                                  action.key === 'delete' ? 'border-t' : ''
                                }`}
                              >
                                <action.icon className="mr-2" size={16} />
                                {action.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {confirmModal.show && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">
                Confirm {confirmModal.action?.charAt(0).toUpperCase() + confirmModal.action?.slice(1)}
              </h3>
              <p className={`text-sm mb-6 ${confirmModal.action === 'delete' ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                {getConfirmationMessage(confirmModal.action, confirmModal.organizer?.name)}
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={closeConfirmModal}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={executeAction}
                  className={`px-4 py-2 rounded text-white ${
                    confirmModal.action === 'delete'
                      ? 'bg-red-600 hover:bg-red-700'
                      : confirmModal.action === 'enable'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-primary-600 hover:bg-primary-700'
                  }`}
                >
                  Confirm {confirmModal.action?.charAt(0).toUpperCase() + confirmModal.action?.slice(1)}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {showActionMenu && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setShowActionMenu(null)}
        />
      )}
    </div>
  );
};

export default ManageClubs;