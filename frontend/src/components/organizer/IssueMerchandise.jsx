import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { eventAPI, registrationAPI, merchandiseAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiPackage, FiUser, FiX, FiCheck } from 'react-icons/fi';

const IssueMerchandise = () => {
  const { id } = useParams();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [issuing, setIssuing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, regsRes, purchasesRes] = await Promise.all([
        eventAPI.getById(id),
        registrationAPI.getEventRegistrations(id),
        merchandiseAPI.getEventPurchases(id),
      ]);

      setEvent(eventRes.data.event);
      setRegistrations(regsRes.data.registrations || []);
      setPurchases(purchasesRes.data.purchases || []);

      // Set first item as default
      if (eventRes.data.event.merchandiseItems?.length > 0) {
        setSelectedItem(eventRes.data.event.merchandiseItems[0]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueClick = (registration) => {
    // Check if already issued
    const existingPurchase = purchases.find(
      p => p.participant._id === registration.participant._id
    );

    if (existingPurchase) {
      alert('Merchandise already issued to this participant');
      return;
    }

    setSelectedParticipant(registration);
    setShowIssueModal(true);
  };

  const handleSubmitIssue = async () => {
    if (!selectedVariant) {
      alert('Please select a variant');
      return;
    }

    if (quantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    try {
      setIssuing(true);

      await merchandiseAPI.issueMerchandise(id, {
        participantId: selectedParticipant.participant._id,
        itemId: selectedItem.itemId,
        variant: selectedVariant,
        quantity: quantity,
      });

      alert('Merchandise issued successfully!');
      setShowIssueModal(false);
      setSelectedParticipant(null);
      setSelectedVariant('');
      setQuantity(1);

      // Refresh data
      await fetchData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to issue merchandise');
    } finally {
      setIssuing(false);
    }
  };

  const getParticipantStatus = (participantId) => {
    const purchase = purchases.find(p => p.participant._id === participantId);
    if (!purchase) return { claimed: false };
    
    return {
      claimed: true,
      claimType: purchase.claimType,
      variant: purchase.variant?.name,
      quantity: purchase.quantity,
      ticketId: purchase.ticketId,
    };
  };

  const filteredRegistrations = registrations.filter(reg => {
    if (!searchTerm) return true;
    const fullName = `${reg.participant.firstName} ${reg.participant.lastName}`.toLowerCase();
    const email = reg.participant.email.toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || email.includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Loader text="Loading..." />
      </div>
    );
  }

  if (!event || event.eventType !== 'merchandise') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">This is not a merchandise event</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Issue Merchandise</h1>
          <p className="text-gray-600 mt-2">{event.name}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="text-sm text-gray-600">Total Registered</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{registrations.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Merchandise Issued</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{purchases.length}</div>
          </div>
          <div className="card">
            <div className="text-sm text-gray-600">Pending</div>
            <div className="text-3xl font-bold text-yellow-600 mt-2">
              {registrations.length - purchases.length}
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="card mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input"
          />
        </div>

        {/* Participants List */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Registered Participants</h2>
          
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12">
              <FiUser className="mx-auto text-6xl text-gray-300 mb-4" />
              <p className="text-gray-600">
                {searchTerm ? 'No participants found' : 'No registrations yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Participant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map((registration) => {
                    const status = getParticipantStatus(registration.participant._id);
                    
                    return (
                      <tr key={registration._id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {registration.participant.firstName} {registration.participant.lastName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {registration.ticketId}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {registration.participant.email}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {status.claimed ? (
                            <div>
                              <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                <FiCheck className="mr-1" /> Issued
                              </span>
                              <div className="text-xs text-gray-500 mt-1">
                                {status.variant} (x{status.quantity})
                              </div>
                              <div className="text-xs text-gray-400">
                                {status.claimType === 'participant' ? 'Self-claimed' : 'Issued by organizer'}
                              </div>
                            </div>
                          ) : (
                            <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {!status.claimed ? (
                            <button
                              onClick={() => handleIssueClick(registration)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              Issue Merch
                            </button>
                          ) : (
                            <span className="text-gray-400">Already issued</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Issue Merchandise Modal */}
      {showIssueModal && selectedParticipant && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Issue Merchandise</h2>
              <button
                onClick={() => setShowIssueModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={issuing}
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              {/* Participant Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {selectedParticipant.participant.firstName} {selectedParticipant.participant.lastName}
                </h3>
                <p className="text-sm text-blue-700">{selectedParticipant.participant.email}</p>
                <p className="text-sm text-blue-700">Ticket: {selectedParticipant.ticketId}</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitIssue(); }} className="space-y-6">
                {/* Item Selection (if multiple items) */}
                {event.merchandiseItems && event.merchandiseItems.length > 1 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Item <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedItem.itemId}
                      onChange={(e) => {
                        const item = event.merchandiseItems.find(i => i.itemId === e.target.value);
                        setSelectedItem(item);
                        setSelectedVariant('');
                      }}
                      className="input"
                      required
                    >
                      {event.merchandiseItems.map((item) => (
                        <option key={item.itemId} value={item.itemId}>
                          {item.itemName}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Variant Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Variant <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedVariant}
                    onChange={(e) => setSelectedVariant(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">Choose size/color...</option>
                    {selectedItem.variants && selectedItem.variants.map((variant) => (
                      <option 
                        key={variant.variantId} 
                        value={variant.variantId}
                        disabled={variant.stock === 0}
                      >
                        {variant.name} - ₹{variant.price} 
                        {variant.stock === 0 ? ' (Out of Stock)' : ` (${variant.stock} available)`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedItem.purchaseLimit || 10}
                    value={quantity}
                    onChange={(e) => setQuantity(parseInt(e.target.value))}
                    className="input"
                    required
                  />
                </div>

                {/* Total */}
                {selectedVariant && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{(selectedItem.variants.find(v => v.variantId === selectedVariant)?.price || 0) * quantity}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowIssueModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={issuing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={issuing || !selectedVariant}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {issuing ? 'Issuing...' : 'Issue Merchandise'}
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

export default IssueMerchandise;