import { useState, useEffect } from 'react';
import { merchandiseAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiCheck, FiX, FiImage } from 'react-icons/fi';

const MerchandiseApproval = () => {
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    try {
      const response = await merchandiseAPI.getPendingApprovals();
      setPurchases(response.data.purchases || []);
    } catch (error) {
      console.error('Error fetching purchases:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (purchaseId) => {
    if (!confirm('Approve this payment?')) return;

    try {
      await merchandiseAPI.approve(purchaseId);
      alert('Payment approved successfully!');
      fetchPurchases();
    } catch (error) {
      alert('Failed to approve payment');
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      await merchandiseAPI.reject(selectedPurchase._id, {
        reason: rejectionReason,
      });
      alert('Payment rejected');
      setSelectedPurchase(null);
      setRejectionReason('');
      fetchPurchases();
    } catch (error) {
      alert('Failed to reject payment');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Merchandise Payment Approvals
        </h1>

        {loading ? (
          <Loader />
        ) : purchases.length === 0 ? (
          <div className="card text-center py-12">
            <FiImage className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No pending approvals</h3>
            <p className="text-gray-600 mt-2">
              Payment proofs will appear here for approval
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {purchases.map((purchase) => (
              <div key={purchase._id} className="card">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900">
                    {purchase.event?.name}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Participant: {purchase.participant?.firstName}{' '}
                    {purchase.participant?.lastName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Email: {purchase.participant?.email}
                  </p>
                </div>

                <div className="mb-4 pb-4 border-b">
                  <p className="text-sm text-gray-600">
                    Variant: <span className="font-medium">{purchase.variant?.name}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Quantity: <span className="font-medium">{purchase.quantity}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Amount: <span className="font-medium text-green-600">
                      ₹{purchase.totalAmount}
                    </span>
                  </p>
                </div>

                {/* Payment Proof Image */}
                {purchase.paymentProof && (
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Payment Proof:
                    </p>
                    <img
                      src={`${import.meta.env.VITE_API_URL.replace('/api', '')}/${purchase.paymentProof.path}`}
                      alt="Payment Proof"
                      className="w-full h-48 object-cover rounded border cursor-pointer hover:opacity-90"
                      onClick={() => window.open(`${import.meta.env.VITE_API_URL.replace('/api', '')}/${purchase.paymentProof.path}`, '_blank')}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Click to view full size
                    </p>
                  </div>
                )}

                <p className="text-xs text-gray-500 mb-4">
                  Uploaded: {new Date(purchase.paymentProof?.uploadedAt).toLocaleString()}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(purchase._id)}
                    className="flex-1 bg-green-50 text-green-700 px-4 py-2 rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center font-medium"
                  >
                    <FiCheck className="mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => setSelectedPurchase(purchase)}
                    className="flex-1 bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center font-medium"
                  >
                    <FiX className="mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rejection Modal */}
        {selectedPurchase && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Reject Payment
              </h2>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this payment:
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input mb-4"
                rows={4}
                placeholder="e.g., Payment proof is unclear, incorrect amount shown, etc."
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelectedPurchase(null);
                    setRejectionReason('');
                  }}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
                <button onClick={handleReject} className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
                  Reject Payment
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchandiseApproval;