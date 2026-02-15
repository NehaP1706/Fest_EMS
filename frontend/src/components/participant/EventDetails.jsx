import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI, merchandiseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import DiscussionForum from '../shared/DiscussionForum';
import { FiCalendar, FiClock, FiUsers, FiDollarSign, FiTag, FiX, FiCheck, FiPackage } from 'react-icons/fi';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showMerchModal, setShowMerchModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [myRegistration, setMyRegistration] = useState(null);
  const [myMerchPurchase, setMyMerchPurchase] = useState(null);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  
  // Merch claim form
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [merchQuantity, setMerchQuantity] = useState(1);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    fetchEvent();
    checkExistingRegistration();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getById(id);
      setEvent(response.data.event);
      
      // Initialize form data with empty values
      if (response.data.event.customForm?.fields) {
        const initialData = {};
        response.data.event.customForm.fields.forEach(field => {
          initialData[field.fieldId] = field.fieldType === 'checkbox' ? [] : '';
        });
        setFormData(initialData);
      }

      // If merchandise event, set first item as default
      if (response.data.event.eventType === 'merchandise' && response.data.event.merchandiseItems?.length > 0) {
        setSelectedItem(response.data.event.merchandiseItems[0]);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkExistingRegistration = async () => {
    try {
      setCheckingRegistration(true);
      const response = await registrationAPI.getMyRegistrations();
      const registrations = response.data.registrations || [];
      
      const existingReg = registrations.find(reg => {
        const eventId = typeof reg.event === 'object' ? reg.event._id : reg.event;
        return eventId === id;
      });
      
      setMyRegistration(existingReg || null);

      // If registered for merch event, check if already claimed
      if (existingReg) {
        const merchResponse = await merchandiseAPI.getMyPurchases();
        const purchases = merchResponse.data.purchases || [];
        const existingPurchase = purchases.find(p => {
          const eventId = typeof p.event === 'object' ? p.event._id : p.event;
          return eventId === id;
        });
        setMyMerchPurchase(existingPurchase || null);
      }
    } catch (error) {
      console.error('Error checking registration:', error);
      setMyRegistration(null);
      setMyMerchPurchase(null);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const handleRegisterClick = () => {
    if (myRegistration) {
      alert('You are already registered for this event!');
      return;
    }

    if (event.customForm?.fields && event.customForm.fields.length > 0) {
      setShowRegistrationModal(true);
    } else {
      handleRegister();
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      
      if (event.customForm?.fields && event.customForm.fields.length > 0) {
        const errors = validateForm();
        if (errors.length > 0) {
          alert('Please fill in all required fields:\n' + errors.join('\n'));
          setRegistering(false);
          return;
        }
      }
      
      const response = await registrationAPI.register(id, { formResponses: formData });
      alert('Registration successful! Check your email for the ticket.');
      setShowRegistrationModal(false);
      
      setMyRegistration(response.data.registration);
      
      await Promise.all([
        checkExistingRegistration(),
        fetchEvent()
      ]);
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!myRegistration) return;

    if (!confirm('Are you sure you want to cancel your registration for this event? This action cannot be undone.')) {
      return;
    }

    try {
      setRegistering(true);
      await registrationAPI.cancel(myRegistration._id);
      
      setMyRegistration(null);
      alert('Registration cancelled successfully!');
      
      await Promise.all([
        checkExistingRegistration(),
        fetchEvent()
      ]);
    } catch (error) {
      console.error('Error cancelling registration:', error);
      alert(error.response?.data?.message || 'Failed to cancel registration');
      await checkExistingRegistration();
    } finally {
      setRegistering(false);
    }
  };

  const handleClaimMerch = () => {
    setShowMerchModal(true);
  };

  const handleSubmitMerchClaim = async () => {
    if (!selectedVariant) {
      alert('Please select a variant');
      return;
    }

    if (merchQuantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    try {
      setClaiming(true);
      
      const response = await merchandiseAPI.claimMerchandise(myRegistration._id, {
        itemId: selectedItem.itemId,
        variant: selectedVariant,
        quantity: merchQuantity,
      });

      alert('Merchandise claimed successfully! Check your email for the ticket.');
      setShowMerchModal(false);
      
      setMyMerchPurchase(response.data.purchase);
      await Promise.all([
        checkExistingRegistration(),
        fetchEvent()
      ]);
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to claim merchandise');
    } finally {
      setClaiming(false);
    }
  };

  const validateForm = () => {
    const errors = [];
    
    event.customForm.fields.forEach(field => {
      if (field.required) {
        const value = formData[field.fieldId];
        
        if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
          errors.push(`• ${field.label} is required`);
        }
      }
    });
    
    return errors;
  };

  const handleFormFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const renderFormField = (field) => {
    const value = formData[field.fieldId];

    switch (field.fieldType) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.fieldType}
            value={value || ''}
            onChange={(e) => handleFormFieldChange(field.fieldId, e.target.value)}
            className="input"
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <textarea
            value={value || ''}
            onChange={(e) => handleFormFieldChange(field.fieldId, e.target.value)}
            className="input"
            rows={4}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            required={field.required}
          />
        );

      case 'dropdown':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleFormFieldChange(field.fieldId, e.target.value)}
            className="input"
            required={field.required}
          >
            <option value="">Select {field.label.toLowerCase()}</option>
            {field.options.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name={field.fieldId}
                  value={option}
                  checked={value === option}
                  onChange={(e) => handleFormFieldChange(field.fieldId, e.target.value)}
                  className="mr-2"
                  required={field.required}
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options.map((option, index) => (
              <label key={index} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  value={option}
                  checked={Array.isArray(value) && value.includes(option)}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    const newValues = e.target.checked
                      ? [...currentValues, option]
                      : currentValues.filter(v => v !== option);
                    handleFormFieldChange(field.fieldId, newValues);
                  }}
                  className="mr-2"
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            value={value || ''}
            onChange={(e) => handleFormFieldChange(field.fieldId, e.target.value)}
            className="input"
            required={field.required}
          />
        );

      default:
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleFormFieldChange(field.fieldId, e.target.value)}
            className="input"
            placeholder={field.placeholder}
            required={field.required}
          />
        );
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const canRegister = () => {
    if (!event) return false;
    if (myRegistration) return false;
    
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    if (now > deadline) return false;
    
    if (event.registrationLimit && event.currentRegistrations >= event.registrationLimit) {
      return false;
    }
    
    return true;
  };

  const canClaimMerch = () => {
    if (!event || event.eventType !== 'merchandise') return false;
    if (!myRegistration) return false;
    if (myMerchPurchase) return false;
    
    const now = new Date();
    const eventEnd = new Date(event.eventEndDate);
    if (now > eventEnd) return false;
    
    return true;
  };

  if (loading || checkingRegistration) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Loader text="Loading event details..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Event not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Header */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <p className="text-gray-600 mt-2">by {event.organizer?.name}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              event.eventType === 'merchandise'
                ? 'bg-purple-100 text-purple-800'
                : 'bg-blue-100 text-blue-800'
            }`}>
              {event.eventType === 'merchandise' ? 'Merchandise' : 'Normal Event'}
            </span>
          </div>

          <p className="text-gray-700 mb-6">{event.description}</p>

          {/* Event Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-center text-gray-700">
              <FiCalendar className="mr-3 text-primary-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Start Date</p>
                <p className="font-medium">{formatDate(event.eventStartDate)}</p>
              </div>
            </div>

            <div className="flex items-center text-gray-700">
              <FiClock className="mr-3 text-primary-600" size={20} />
              <div>
                <p className="text-sm text-gray-600">Registration Deadline</p>
                <p className="font-medium">{formatDate(event.registrationDeadline)}</p>
              </div>
            </div>

            {event.registrationLimit && (
              <div className="flex items-center text-gray-700">
                <FiUsers className="mr-3 text-primary-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Participants</p>
                  <p className="font-medium">
                    {event.currentRegistrations} / {event.registrationLimit}
                  </p>
                </div>
              </div>
            )}

            {event.registrationFee > 0 && (
              <div className="flex items-center text-gray-700">
                <FiDollarSign className="mr-3 text-primary-600" size={20} />
                <div>
                  <p className="text-sm text-gray-600">Fee</p>
                  <p className="font-medium">₹{event.registrationFee}</p>
                </div>
              </div>
            )}
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="flex items-center flex-wrap gap-2 mb-6">
              <FiTag className="text-gray-400" />
              {event.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Registration Status / Actions */}
          {myRegistration ? (
            <div className="space-y-3">
              <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-4 rounded-lg flex items-center justify-between">
                <div className="flex items-center">
                  <FiCheck className="mr-3 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-semibold">You're registered for this event!</p>
                    <p className="text-sm mt-1">
                      Ticket ID: <span className="font-mono">{myRegistration.ticketId}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Merchandise Claim Section */}
              {event.eventType === 'merchandise' && (
                <div>
                  {myMerchPurchase ? (
                    <div className="bg-purple-50 border-2 border-purple-200 text-purple-800 px-4 py-4 rounded-lg">
                      <div className="flex items-center">
                        <FiPackage className="mr-3 flex-shrink-0" size={24} />
                        <div>
                          <p className="font-semibold">Merchandise Claimed!</p>
                          <p className="text-sm mt-1">
                            {myMerchPurchase.merchandiseItem?.itemName} - {myMerchPurchase.variant?.name} (x{myMerchPurchase.quantity})
                          </p>
                          <p className="text-sm">
                            Ticket ID: <span className="font-mono">{myMerchPurchase.ticketId}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : canClaimMerch() ? (
                    <button
                      onClick={handleClaimMerch}
                      disabled={claiming}
                      className="w-full btn-primary py-3 text-lg disabled:opacity-50 flex items-center justify-center"
                    >
                      <FiPackage className="mr-2" />
                      {claiming ? 'Claiming...' : 'Claim Merchandise'}
                    </button>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 text-gray-700 px-4 py-3 rounded-lg">
                      Event has ended or merchandise claim period has passed
                    </div>
                  )}
                </div>
              )}
              
              <button
                onClick={handleCancelRegistration}
                disabled={registering}
                className="w-full btn-danger py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {registering ? 'Cancelling...' : 'Cancel Registration'}
              </button>
            </div>
          ) : canRegister() ? (
            <button
              onClick={handleRegisterClick}
              disabled={registering}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? 'Registering...' : `Register Now ${event.registrationFee > 0 ? `- ₹${event.registrationFee}` : ''}`}
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {new Date() > new Date(event.registrationDeadline)
                ? 'Registration deadline has passed'
                : 'Registration limit reached'}
            </div>
          )}
        </div>

        {/* Discussion Forum */}
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Discussion Forum</h2>
          <DiscussionForum eventId={id} />
        </div>
      </div>

      {/* Registration Form Modal */}
      {showRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Complete Registration</h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={registering}
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-primary-900 mb-2">{event.name}</h3>
                <div className="text-sm text-primary-700 space-y-1">
                  <p>📅 {formatDate(event.eventStartDate)}</p>
                  {event.registrationFee > 0 && (
                    <p className="font-medium">💰 Registration Fee: ₹{event.registrationFee}</p>
                  )}
                </div>
              </div>

              {event.customForm?.fields && event.customForm.fields.length > 0 ? (
                <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }} className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-gray-900 text-lg mb-4">
                      Please fill in the following information:
                    </h3>
                    
                    {event.customForm.fields.map((field) => (
                      <div key={field.fieldId}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {renderFormField(field)}
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-4 pt-6 border-t">
                    <button
                      type="button"
                      onClick={() => setShowRegistrationModal(false)}
                      className="flex-1 btn-secondary"
                      disabled={registering}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={registering}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {registering ? 'Processing...' : 'Complete Registration'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">
                    No additional information required. Click below to confirm your registration.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setShowRegistrationModal(false)}
                      className="flex-1 btn-secondary"
                      disabled={registering}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRegister}
                      disabled={registering}
                      className="flex-1 btn-primary disabled:opacity-50"
                    >
                      {registering ? 'Processing...' : 'Confirm Registration'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Merchandise Claim Modal */}
      {showMerchModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Claim Merchandise</h2>
              <button
                onClick={() => setShowMerchModal(false)}
                className="text-gray-400 hover:text-gray-600"
                disabled={claiming}
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-purple-900 mb-2">{selectedItem.itemName}</h3>
                <p className="text-sm text-purple-700">{selectedItem.description}</p>
              </div>

              <form onSubmit={(e) => { e.preventDefault(); handleSubmitMerchClaim(); }} className="space-y-6">
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
                    value={merchQuantity}
                    onChange={(e) => setMerchQuantity(parseInt(e.target.value))}
                    className="input"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum {selectedItem.purchaseLimit || 10} per participant
                  </p>
                </div>

                {/* Total */}
                {selectedVariant && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900">Total Amount:</span>
                      <span className="text-2xl font-bold text-primary-600">
                        ₹{(selectedItem.variants.find(v => v.variantId === selectedVariant)?.price || 0) * merchQuantity}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-6 border-t">
                  <button
                    type="button"
                    onClick={() => setShowMerchModal(false)}
                    className="flex-1 btn-secondary"
                    disabled={claiming}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={claiming || !selectedVariant}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {claiming ? 'Claiming...' : 'Confirm Claim'}
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

export default EventDetails;