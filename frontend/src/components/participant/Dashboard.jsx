import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { registrationAPI, merchandiseAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiCalendar, FiClock, FiMapPin, FiPackage, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const ParticipantDashboard = () => {
  const { user } = useAuth();
  const [registrations, setRegistrations] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

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
        {/* Header */}
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
            {/* Quick Stats */}
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

            {/* Tabs */}
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

            {/* Content */}
            <div>
              {/* Upcoming Events */}
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
                              <span className="text-xs font-medium bg-primary-100 text-primary-800 px-3 py-1 rounded-full">
                                Ticket ID: {registration.ticketId}
                              </span>
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

              {/* Completed Events */}
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
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Merchandise */}
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
                                <span className="text-xs font-medium bg-primary-100 text-primary-800 px-3 py-1 rounded-full">
                                  Ticket: {purchase.ticketId}
                                </span>
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

              {/* Cancelled */}
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
    </div>
  );
};

export default ParticipantDashboard;