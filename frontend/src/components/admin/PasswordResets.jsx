import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiCheck, FiX, FiClock } from 'react-icons/fi';

const PasswordResets = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [comments, setComments] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await adminAPI.getPasswordResets();
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const response = await adminAPI.approveReset(requestId);
      setNewPassword(response.data.newPassword);
      alert('Password reset approved!');
      fetchRequests();
    } catch (error) {
      alert('Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!comments.trim()) {
      alert('Please provide comments for rejection');
      return;
    }

    try {
      await adminAPI.rejectReset(selectedRequest._id, { comments });
      alert('Request rejected');
      setSelectedRequest(null);
      setComments('');
      fetchRequests();
    } catch (error) {
      alert('Failed to reject request');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const processedRequests = requests.filter((r) => r.status !== 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Password Reset Requests
        </h1>

        {loading ? (
          <Loader />
        ) : (
          <>
            {/* Pending Requests */}
            {pendingRequests.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <FiClock className="mr-2 text-orange-600" />
                  Pending Requests ({pendingRequests.length})
                </h2>
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div key={request._id} className="card">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {request.organizer?.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Email: {request.organizer?.email}
                          </p>
                          <p className="text-sm text-gray-600">
                            Category: {request.organizer?.category}
                          </p>
                          <div className="mt-3 p-3 bg-gray-50 rounded">
                            <p className="text-sm font-medium text-gray-700">Reason:</p>
                            <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Requested: {new Date(request.requestedAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="ml-4 flex flex-col gap-2">
                          <button
                            onClick={() => handleApprove(request._id)}
                            className="bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center font-medium"
                          >
                            <FiCheck className="mr-2" />
                            Approve
                          </button>
                          <button
                            onClick={() => setSelectedRequest(request)}
                            className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center font-medium"
                          >
                            <FiX className="mr-2" />
                            Reject
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Password Display */}
            {newPassword && (
              <div className="card mb-8 bg-green-50 border-2 border-green-200">
                <h2 className="text-xl font-semibold text-green-900 mb-4">
                  ✓ Password Reset Successful!
                </h2>
                <div className="bg-white p-4 rounded border border-green-200">
                  <p className="text-sm text-gray-600 mb-3">
                    New password for the organizer:
                  </p>
                  <div className="font-mono text-lg text-primary-600 font-semibold bg-gray-50 p-3 rounded">
                    {newPassword}
                  </div>
                  <p className="text-xs text-orange-600 mt-3">
                    ⚠️ Share this password with the organizer. It won't be shown again!
                  </p>
                </div>
                <button
                  onClick={() => setNewPassword('')}
                  className="btn-secondary mt-4"
                >
                  Close
                </button>
              </div>
            )}

            {/* Processed Requests */}
            {processedRequests.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Processed Requests
                </h2>
                <div className="card overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4">Organizer</th>
                        <th className="text-left py-3 px-4">Reason</th>
                        <th className="text-left py-3 px-4">Status</th>
                        <th className="text-left py-3 px-4">Reviewed At</th>
                        <th className="text-left py-3 px-4">Comments</th>
                      </tr>
                    </thead>
                    <tbody>
                      {processedRequests.map((request) => (
                        <tr key={request._id} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">
                            {request.organizer?.name}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {request.reason.substring(0, 50)}...
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`text-xs px-2 py-1 rounded ${getStatusColor(
                                request.status
                              )}`}
                            >
                              {request.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {new Date(request.reviewedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {request.adminComments || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {requests.length === 0 && (
              <div className="card text-center py-12">
                <FiClock className="mx-auto text-6xl text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900">
                  No password reset requests
                </h3>
              </div>
            )}
          </>
        )}

        {/* Rejection Modal */}
        {selectedRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Reject Password Reset Request
              </h2>
              <p className="text-gray-600 mb-2">
                Organizer: <strong>{selectedRequest.organizer?.name}</strong>
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Reason: {selectedRequest.reason}
              </p>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="input mb-4"
                rows={4}
                placeholder="Provide reason for rejection..."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedRequest(null);
                    setComments('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  Reject Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordResets;