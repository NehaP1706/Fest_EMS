import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationAPI, merchandiseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiCalendar, FiClock, FiMapPin, FiPackage, FiCheckCircle, FiXCircle, FiStar, FiX, FiTag, FiUser, FiMail, FiHash } from 'react-icons/fi';
import FeedbackForm from '../shared/FeedbackForm';

const TicketModal = ({ ticket, user, onClose }) => {
  if (!ticket) return null;

  const isRegistration = ticket.type === 'registration';
  const event = ticket.event;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 z-10 bg-white rounded-full p-1.5 shadow-lg text-gray-500 hover:text-gray-800 transition-colors"
        >
          <FiX size={18} />
        </button>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">

          <div className="bg-gradient-to-r from-primary-600 to-primary-800 px-6 py-5 text-white">
            <p className="text-primary-200 text-xs font-semibold uppercase tracking-widest mb-1">
              {isRegistration ? 'Event Ticket' : 'Merchandise Ticket'}
            </p>
            <h2 className="text-xl font-bold leading-tight">{event?.name}</h2>
            {event?.organizer?.name && (
              <p className="text-primary-200 text-sm mt-0.5">by {event.organizer.name}</p>
            )}
          </div>

          <div className="flex items-center px-4">
            <div className="w-5 h-5 rounded-full bg-gray-50 -ml-7 border border-gray-200" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-2" />
            <div className="w-5 h-5 rounded-full bg-gray-50 -mr-7 border border-gray-200" />
          </div>

          <div className="px-6 py-5 space-y-5">

            {ticket.qrCode ? (
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl border-2 border-gray-100 shadow-inner inline-block">
                  <img
                    src={ticket.qrCode}
                    alt="QR Code"
                    className="w-44 h-44 object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-44 h-44 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200">
                  QR not available
                </div>
              </div>
            )}

            <div className="flex items-center justify-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-100">
              <FiHash className="text-primary-500 shrink-0" size={14} />
              <span className="font-mono text-sm font-semibold text-gray-800 tracking-wider break-all text-center">
                {ticket.ticketId}
              </span>
            </div>

            <div className="border-t border-gray-100" />

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Event Details</p>
              <div className="space-y-2 text-sm">
                {event?.eventStartDate && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiCalendar className="text-primary-400 shrink-0" size={14} />
                    <span>
                      {new Date(event.eventStartDate).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'long', day: 'numeric', year: 'numeric',
                      })}
                    </span>
                  </div>
                )}
                {event?.venue && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiMapPin className="text-primary-400 shrink-0" size={14} />
                    <span>{event.venue}</span>
                  </div>
                )}
                {event?.eventType && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiTag className="text-primary-400 shrink-0" size={14} />
                    <span className="capitalize">{event.eventType}</span>
                  </div>
                )}
                {!isRegistration && ticket.merchandiseItem?.itemName && (
                  <div className="flex items-center gap-2 text-gray-700">
                    <FiPackage className="text-primary-400 shrink-0" size={14} />
                    <span>{ticket.merchandiseItem.itemName} — {ticket.variant?.name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-100" />

            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">Participant</p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <FiUser className="text-primary-400 shrink-0" size={14} />
                  <span>{user?.firstName} {user?.lastName}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <FiMail className="text-primary-400 shrink-0" size={14} />
                  <span>{user?.email}</span>
                </div>
              </div>
            </div>

          </div>

          <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">Present this QR code at the venue for entry</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [selectedEventForFeedback, setSelectedEventForFeedback] = useState(null);

  const [selectedTicket, setSelectedTicket] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regResponse, purchaseResponse] = await Promise.all([
        registrationAPI.getMyRegistrations(),
        merchandiseAPI.getMyPurchases(),
      ]);
      setRegistrations(regResponse.data.registrations || []);
      setPurchases(purchaseResponse.data.purchases || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUpcomingEvents = () => {
    const now = new Date();
    return registrations.filter(
      (reg) => new Date(reg.event.eventStartDate) > now && reg.status === 'confirmed'
    );
  };

  const getCompletedEvents = () => {
    const now = new Date();
    return registrations.filter((reg) => new Date(reg.event.eventEndDate) < now);
  };

  const getCancelledEvents = () => {
    return registrations.filter((reg) => reg.status === 'cancelled' || reg.status === 'rejected');
  };

  const getStatusBadge = (status) => {
    const badges = {
      confirmed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your event registrations and track your participation
          </p>
        </div>

        {loading ? (
          <Loader text="Loading your events..." />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="card bg-gradient-to-br from-primary-500 to-primary-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-primary-100 text-sm font-medium">Upcoming Events</p>
                    <p className="text-4xl font-bold mt-2">{getUpcomingEvents().length}</p>
                  </div>
                  <FiCalendar className="text-5xl text-primary-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Completed</p>
                    <p className="text-4xl font-bold mt-2">{getCompletedEvents().length}</p>
                  </div>
                  <FiCheckCircle className="text-5xl text-green-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Merchandise Orders</p>
                    <p className="text-4xl font-bold mt-2">{purchases.length}</p>
                  </div>
                  <FiPackage className="text-5xl text-purple-200" />
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                  {['upcoming', 'completed', 'merchandise', 'cancelled'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-4 px-1 border-b-2 font-medium text-sm capitalize ${
                        activeTab === tab
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            <div>
              {activeTab === 'upcoming' && (
                <div className="space-y-4">
                  {getUpcomingEvents().length === 0 ? (
                    <div className="card text-center py-12">
                      <FiCalendar className="mx-auto text-6xl text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No upcoming events</h3>
                      <p className="text-gray-600 mt-2">
                        Browse events to register for exciting activities!
                      </p>
                      <Link to="/browse-events" className="btn-primary mt-4 inline-block">
                        Browse Events
                      </Link>
                    </div>
                  ) : (
                    getUpcomingEvents().map((registration) => (
                      <div key={registration._id} className="card hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {registration.event.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              by {registration.event.organizer?.name}
                            </p>
                            <div className="flex items-center space-x-4 mt-3 text-sm text-gray-600">
                              <div className="flex items-center">
                                <FiCalendar className="mr-2" />
                                {formatDate(registration.event.eventStartDate)}
                              </div>
                              <div className="flex items-center">
                                <FiClock className="mr-2" />
                                {registration.event.eventType}
                              </div>
                            </div>
                            <div className="mt-3">
                              <button
                                onClick={() => setSelectedTicket({ ...registration, type: 'registration' })}
                                className="text-xs font-medium bg-primary-100 text-primary-800 px-3 py-1 rounded-full hover:bg-primary-200 transition-colors cursor-pointer"
                                title="View ticket"
                              >
                                🎟 Ticket ID: {registration.ticketId}
                              </button>
                            </div>
                          </div>
                          <div className="ml-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                                registration.status
                              )}`}
                            >
                              {registration.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'completed' && (
                <div className="space-y-4">
                  {getCompletedEvents().length === 0 ? (
                    <div className="card text-center py-12">
                      <FiCheckCircle className="mx-auto text-6xl text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No completed events</h3>
                      <p className="text-gray-600 mt-2">
                        Events you've attended will appear here
                      </p>
                    </div>
                  ) : (
                    getCompletedEvents().map((registration) => (
                      <div key={registration._id} className="card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {registration.event.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {formatDate(registration.event.eventStartDate)}
                            </p>
                            <div className="mt-3">
                              {registration.attended ? (
                                <span className="text-xs font-medium bg-green-100 text-green-800 px-3 py-1 rounded-full">
                                  ✓ Attended
                                </span>
                              ) : (
                                <span className="text-xs font-medium bg-gray-100 text-gray-800 px-3 py-1 rounded-full">
                                  Not marked
                                </span>
                              )}
                            </div>
                            
                            {/* Feedback Button - Show if attended and event ended */}
                            {registration.attended && 
                             new Date() > new Date(registration.event.eventEndDate) && (
                              <button
                                onClick={() => {
                                  setSelectedEventForFeedback(registration.event);
                                  setShowFeedbackModal(true);
                                }}
                                className="mt-3 w-full flex items-center justify-center gap-2 bg-yellow-50 text-yellow-700 px-4 py-2 rounded-lg hover:bg-yellow-100 transition-colors font-medium border border-yellow-200"
                              >
                                <FiStar size={16} />
                                Leave Feedback
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'merchandise' && (
                <div className="space-y-4">
                  {purchases.length === 0 ? (
                    <div className="card text-center py-12">
                      <FiPackage className="mx-auto text-6xl text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No merchandise orders</h3>
                      <p className="text-gray-600 mt-2">
                        Your merchandise purchases will appear here
                      </p>
                    </div>
                  ) : (
                    purchases.map((purchase) => (
                      <div key={purchase._id} className="card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {purchase.event?.merchandiseDetails?.itemName || purchase.event?.name}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              Variant: {purchase.variant?.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              Quantity: {purchase.quantity} | Amount: ₹{purchase.totalAmount}
                            </p>
                            {purchase.ticketId && (
                              <div className="mt-3">
                                <button
                                  onClick={() => setSelectedTicket({ ...purchase, type: 'merchandise' })}
                                  className="text-xs font-medium bg-primary-100 text-primary-800 px-3 py-1 rounded-full hover:bg-primary-200 transition-colors cursor-pointer"
                                  title="View ticket"
                                >
                                  🎟 Ticket: {purchase.ticketId}
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(
                                purchase.paymentStatus
                              )}`}
                            >
                              {purchase.paymentStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'cancelled' && (
                <div className="space-y-4">
                  {getCancelledEvents().length === 0 ? (
                    <div className="card text-center py-12">
                      <FiXCircle className="mx-auto text-6xl text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No cancelled events</h3>
                    </div>
                  ) : (
                    getCancelledEvents().map((registration) => (
                      <div key={registration._id} className="card opacity-75">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {registration.event.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatDate(registration.event.eventStartDate)}
                        </p>
                        <span className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          {registration.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      
      {selectedTicket && (
        <TicketModal
          ticket={selectedTicket}
          user={user}
          onClose={() => setSelectedTicket(null)}
        />
      )}

      {showFeedbackModal && selectedEventForFeedback && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Leave Feedback</h2>
              <button
                onClick={() => {
                  setShowFeedbackModal(false);
                  setSelectedEventForFeedback(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              How was your experience at <strong>{selectedEventForFeedback.name}</strong>?
            </p>
            <FeedbackForm
              eventId={selectedEventForFeedback._id}
              onClose={() => {
                setShowFeedbackModal(false);
                setSelectedEventForFeedback(null);
                fetchData();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantDashboard;