import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI, merchandiseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import DiscussionForum from '../shared/DiscussionForum';
import { FiCalendar, FiClock, FiUsers, FiDollarSign, FiTag, FiX, FiCheck, FiShoppingCart, FiUpload, FiAlertCircle, FiClock as FiPending } from 'react-icons/fi';

const MerchandisePurchaseSection = ({ event, item, variant, onPurchaseComplete }) => {
  const [quantity, setQuantity] = useState(1);
  const [paymentProof, setPaymentProof] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        alert('Please upload a JPEG, PNG, or PDF file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setPaymentProof(file);
      
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewUrl(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handlePurchase = async () => {
    if (!paymentProof) {
      alert('Please upload payment proof before proceeding');
      return;
    }

    if (quantity < 1) {
      alert('Quantity must be at least 1');
      return;
    }

    if (variant.stock < quantity) {
      alert(`Only ${variant.stock} items available in stock`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('paymentProof', paymentProof);
      formData.append('variantId', variant._id?.toString() || variant._id);
      formData.append('quantity', quantity);

      const response = await merchandiseAPI.purchase(event._id, formData);
      
      alert('Purchase order submitted successfully! Your payment proof is being reviewed by the organizer. You will receive a confirmation email once approved.');
      
      setPaymentProof(null);
      setPreviewUrl(null);
      setQuantity(1);
      
      if (onPurchaseComplete) {
        onPurchaseComplete();
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit purchase order');
    } finally {
      setUploading(false);
    }
  };

  const totalAmount = variant.price * quantity;

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-4">
      <h3 className="text-xl font-semibold mb-4 flex items-center">
        <FiShoppingCart className="mr-2" />
        Purchase {item.itemName}
      </h3>
      
      <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-4">
        <p className="text-sm text-blue-800">
          <strong>Variant:</strong> {variant.name}
        </p>
        <p className="text-sm text-blue-800">
          <strong>Price:</strong> ₹{variant.price} per unit
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <input
          type="number"
          min="1"
          max={variant.stock}
          value={quantity}
          onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-500 mt-1">
          Available stock: {variant.stock}
        </p>
      </div>

      <div className="mb-4">
        <p className="text-lg font-semibold">
          Total Amount: <span className="text-green-600">₹{totalAmount}</span>
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Upload Payment Proof * <span className="text-red-500">(Required)</span>
        </label>
        <p className="text-xs text-gray-500 mb-2">
          Please upload a screenshot or photo of your payment transaction
          (JPEG, PNG, or PDF, max 5MB)
        </p>
        
        <input
          type="file"
          accept="image/jpeg,image/jpg,image/png,application/pdf"
          onChange={handleFileChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />

        {previewUrl && (
          <div className="mt-3">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <img
              src={previewUrl}
              alt="Payment proof preview"
              className="max-w-full h-48 object-contain border rounded"
            />
          </div>
        )}

        {paymentProof && !previewUrl && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              {paymentProof.name} ({(paymentProof.size / 1024).toFixed(1)} KB)
            </p>
          </div>
        )}
      </div>

      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Your order will be submitted for approval. 
          The organizer will review your payment proof and approve or reject your purchase.
          You will receive a confirmation email with your QR ticket once your payment is approved.
        </p>
      </div>

      <button
        onClick={handlePurchase}
        disabled={!paymentProof || uploading}
        className={`w-full py-3 px-4 rounded-lg font-semibold transition-colors ${
          !paymentProof || uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
        }`}
      >
        {uploading ? 'Submitting Order...' : 'Submit Purchase Order'}
      </button>
    </div>
  );
};

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [formData, setFormData] = useState({});
  const [myRegistration, setMyRegistration] = useState(null);
  const [myMerchPurchase, setMyMerchPurchase] = useState(null);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  

  const [purchaseItem, setPurchaseItem] = useState(null);
  const [purchaseVariant, setPurchaseVariant] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentProofPreview, setPaymentProofPreview] = useState(null);
  const [uploadingPayment, setUploadingPayment] = useState(false);

  useEffect(() => {
    fetchEvent();
    checkExistingRegistration();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getById(id);
      setEvent(response.data.event);
      
      if (response.data.event.customForm?.fields) {
        const initialData = {};
        response.data.event.customForm.fields.forEach(field => {
          initialData[field.fieldId] = field.fieldType === 'checkbox' ? [] : '';
        });
        setFormData(initialData);
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
      
      // Find any non-cancelled registration for this event, regardless of paymentStatus
      const existingReg = registrations.find(reg => {
        const eventId = typeof reg.event === 'object' ? reg.event._id : reg.event;
        return eventId === id && reg.status !== 'cancelled';
      });
      
      // Normalize paymentStatus: old registrations created before this field existed
      // will have it as undefined — treat them as 'approved' since they already had tickets
      if (existingReg && !existingReg.paymentStatus) {
        existingReg.paymentStatus = 'approved';
      }
      setMyRegistration(existingReg || null);

      const merchResponse = await merchandiseAPI.getMyPurchases();
      const purchases = merchResponse.data.purchases || [];
      const existingPurchase = purchases.find(p => {
        const eventId = typeof p.event === 'object' ? p.event._id : p.event;
        return eventId === id;
      });
      setMyMerchPurchase(existingPurchase || null);
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

    const hasForm = event.customForm?.fields && event.customForm.fields.length > 0;
    const hasFee  = event.registrationFee > 0;

    if (hasForm || hasFee) {
      // Show modal so user sees the fee summary before confirming
      setShowRegistrationModal(true);
    } else {
      // Truly free + no form — register in one click
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
      setShowRegistrationModal(false);

      const reg = response.data.registration;
      const pendingPayment = reg?.paymentStatus === 'pending_payment';

      if (pendingPayment) {
        // Paid event: form accepted, now prompt for payment proof
        setMyRegistration({ ...reg, paymentStatus: 'pending_payment' });
        setShowPaymentModal(true);
      } else {
        // Free event: ticket issued immediately
        alert('Registration successful! Check your email for your ticket.');
        setMyRegistration({ ...reg, paymentStatus: reg?.paymentStatus || 'approved' });
      }

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


  const handleDirectPurchase = (item, variant) => {
    setPurchaseItem(item);
    setPurchaseVariant(variant);
    setShowPurchaseModal(true);
  };

  const handlePurchaseComplete = async () => {
    setShowPurchaseModal(false);
    setPurchaseItem(null);
    setPurchaseVariant(null);
    await Promise.all([
      checkExistingRegistration(),
      fetchEvent()
    ]);
  };

  const handlePaymentFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a JPEG, PNG, or PDF file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }
    setPaymentProofFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => setPaymentProofPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setPaymentProofPreview(null);
    }
  };

  const handleSubmitPaymentProof = async () => {
    if (!paymentProofFile) {
      alert('Please select a payment proof file');
      return;
    }
    if (!myRegistration?._id) {
      alert('Registration not found');
      return;
    }
    setUploadingPayment(true);
    try {
      const formData = new FormData();
      formData.append('paymentProof', paymentProofFile);
      const response = await registrationAPI.submitPaymentProof(myRegistration._id, formData);
      setShowPaymentModal(false);
      setPaymentProofFile(null);
      setPaymentProofPreview(null);
      await checkExistingRegistration();
      alert('Payment proof submitted! Awaiting organizer approval.');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit payment proof');
    } finally {
      setUploadingPayment(false);
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

          {myRegistration ? (
            <div className="space-y-3">
              {myRegistration.paymentStatus === 'approved' && (
                <div className="bg-green-50 border-2 border-green-200 text-green-800 px-4 py-4 rounded-lg flex items-center">
                  <FiCheck className="mr-3 flex-shrink-0" size={24} />
                  <div>
                    <p className="font-semibold">You're registered for this event!</p>
                    {myRegistration.ticketId && (
                      <p className="text-sm mt-1">
                        Ticket ID: <span className="font-mono">{myRegistration.ticketId}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {myRegistration.paymentStatus === 'pending_payment' && (
                <div className="space-y-3">
                  <div className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-4 py-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FiCheck className="mr-3 flex-shrink-0 text-green-600" size={20} />
                      <p className="font-semibold">Form submitted successfully!</p>
                    </div>
                    <p className="text-sm">
                      This event has a registration fee of <strong>₹{event.registrationFee}</strong>.
                      Please pay and upload your payment proof to complete registration.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    <FiUpload size={20} />
                    Pay ₹{event.registrationFee} & Upload Proof
                  </button>
                </div>
              )}

              {myRegistration.paymentStatus === 'pending_approval' && (
                <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-4 py-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <FiPending className="mr-3 flex-shrink-0" size={20} />
                    <p className="font-semibold">Payment proof submitted — awaiting approval</p>
                  </div>
                  <p className="text-sm">
                    The organizer is reviewing your payment. You'll receive an email with your ticket once approved.
                  </p>
                </div>
              )}

              {myRegistration.paymentStatus === 'rejected' && (
                <div className="space-y-3">
                  <div className="bg-red-50 border-2 border-red-200 text-red-800 px-4 py-4 rounded-lg">
                    <div className="flex items-center mb-2">
                      <FiAlertCircle className="mr-3 flex-shrink-0" size={20} />
                      <p className="font-semibold">Payment rejected</p>
                    </div>
                    {myRegistration.rejectionReason && (
                      <p className="text-sm mt-1">
                        <strong>Reason:</strong> {myRegistration.rejectionReason}
                      </p>
                    )}
                    <p className="text-sm mt-2">Please upload a valid payment proof to try again.</p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white py-3 rounded-lg text-lg font-semibold hover:bg-primary-700 transition-colors"
                  >
                    <FiUpload size={20} />
                    Re-upload Payment Proof
                  </button>
                </div>
              )}

              {/* Cancel button — only meaningful before approval */}
              {(myRegistration.paymentStatus === 'pending_payment' || myRegistration.paymentStatus === 'rejected') && (
                <button
                  onClick={handleCancelRegistration}
                  disabled={registering}
                  className="w-full btn-secondary py-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {registering ? 'Cancelling...' : 'Cancel Registration'}
                </button>
              )}
            </div>
          ) : canRegister() ? (
            <button
              onClick={handleRegisterClick}
              disabled={registering}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {registering ? 'Registering...' : `Register Now${event.registrationFee > 0 ? ` - ₹${event.registrationFee}` : ''}`}
            </button>
          ) : (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {new Date() > new Date(event.registrationDeadline)
                ? 'Registration deadline has passed'
                : 'Registration limit reached'}
            </div>
          )}
        </div>

        {event.eventType === 'merchandise' && event.merchandiseItems && event.merchandiseItems.length > 0 && (
          <div className="card mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <FiShoppingCart className="mr-2" />
              Available Merchandise
            </h2>
            <p className="text-gray-600 mb-6">
              Purchase merchandise by uploading your payment proof. Your order will be reviewed by the organizer.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {event.merchandiseItems.map((item) => (
                <div key={item._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-semibold text-lg text-gray-900 mb-2">{item.itemName}</h3>
                  <p className="text-sm text-gray-600 mb-4">{item.description}</p>
                  
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Available Variants:</p>
                    {item.variants && item.variants.map((variant) => (
                      <div key={variant._id} className="flex items-center justify-between bg-gray-50 p-3 rounded">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{variant.name}</p>
                          <p className="text-xs text-gray-600">
                            {variant.size && `Size: ${variant.size}`}
                            {variant.color && ` • Color: ${variant.color}`}
                          </p>
                          <p className="text-xs text-gray-500">Stock: {variant.stock}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">₹{variant.price}</p>
                          {variant.stock > 0 ? (
                            <button
                              onClick={() => handleDirectPurchase(item, variant)}
                              className="mt-2 px-4 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                              Purchase
                            </button>
                          ) : (
                            <p className="text-xs text-red-600 mt-2">Out of Stock</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {myMerchPurchase && myMerchPurchase.paymentStatus && (
          <div className="card mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Purchase Status</h2>
            <div className={`p-4 rounded-lg border-2 ${
              myMerchPurchase.paymentStatus === 'pending' 
                ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                : myMerchPurchase.paymentStatus === 'approved'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <p className="font-semibold mb-2">
                Status: {myMerchPurchase.paymentStatus.toUpperCase()}
              </p>
              <p className="text-sm">
                Item: {myMerchPurchase.merchandiseItem?.itemName} - {myMerchPurchase.variant?.name}
              </p>
              <p className="text-sm">
                Quantity: {myMerchPurchase.quantity} • Amount: ₹{myMerchPurchase.totalAmount}
              </p>
              {myMerchPurchase.paymentStatus === 'pending' && (
                <p className="text-sm mt-2">
                  Your payment proof is being reviewed. You will be notified once it's approved.
                </p>
              )}
              {myMerchPurchase.paymentStatus === 'rejected' && myMerchPurchase.rejectionReason && (
                <p className="text-sm mt-2">
                  <strong>Reason:</strong> {myMerchPurchase.rejectionReason}
                </p>
              )}
              {myMerchPurchase.paymentStatus === 'approved' && myMerchPurchase.ticketId && (
                <p className="text-sm mt-2">
                  Ticket ID: <span className="font-mono">{myMerchPurchase.ticketId}</span>
                </p>
              )}
            </div>
          </div>
        )}

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Discussion Forum</h2>
          <DiscussionForum eventId={id} />
        </div>
      </div>

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
                  <p>{formatDate(event.eventStartDate)}</p>
                  {event.registrationFee > 0 && (
                    <p className="font-medium"> Registration Fee: ₹{event.registrationFee}</p>
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

      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Upload Payment Proof</h2>
              <button
                onClick={() => { setShowPaymentModal(false); setPaymentProofFile(null); setPaymentProofPreview(null); }}
                className="text-gray-400 hover:text-gray-600"
                disabled={uploadingPayment}
              >
                <FiX size={24} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-sm text-blue-800">
                  <strong>Event:</strong> {event.name}
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Registration Fee:</strong>{' '}
                  <span className="text-lg font-bold">₹{event.registrationFee}</span>
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded text-sm text-yellow-800">
                Please pay <strong>₹{event.registrationFee}</strong> via UPI / bank transfer to the organizer,
                then upload a screenshot or photo of the transaction below.
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Screenshot / Receipt <span className="text-red-500">*</span>
                </label>
                <p className="text-xs text-gray-500 mb-2">JPEG, PNG, or PDF · max 5 MB</p>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,application/pdf"
                  onChange={handlePaymentFileChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 text-sm"
                />
                {paymentProofPreview && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-gray-600 mb-1">Preview:</p>
                    <img
                      src={paymentProofPreview}
                      alt="Payment proof preview"
                      className="max-w-full h-40 object-contain border rounded"
                    />
                  </div>
                )}
                {paymentProofFile && !paymentProofPreview && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
                     {paymentProofFile.name} ({(paymentProofFile.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowPaymentModal(false); setPaymentProofFile(null); setPaymentProofPreview(null); }}
                  className="flex-1 btn-secondary"
                  disabled={uploadingPayment}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitPaymentProof}
                  disabled={!paymentProofFile || uploadingPayment}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary-600 text-white py-2 px-4 rounded-lg font-semibold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {uploadingPayment ? (
                    <span className="animate-pulse">Uploading…</span>
                  ) : (
                    <><FiUpload size={16} /> Submit Proof</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPurchaseModal && purchaseItem && purchaseVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Purchase Merchandise</h2>
              <button
                onClick={() => setShowPurchaseModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6">
              <MerchandisePurchaseSection
                event={event}
                item={purchaseItem}
                variant={purchaseVariant}
                onPurchaseComplete={handlePurchaseComplete}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;