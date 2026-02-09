import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import DiscussionForum from '../shared/DiscussionForum';
import { FiCalendar, FiClock, FiUsers, FiDollarSign, FiTag } from 'react-icons/fi';

const EventDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const response = await eventAPI.getById(id);
      setEvent(response.data.event);
    } catch (error) {
      console.error('Error fetching event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    try {
      setRegistering(true);
      await registrationAPI.register(id, { formResponses: formData });
      alert('Registration successful! Check your email for the ticket.');
      navigate('/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Registration failed');
    } finally {
      setRegistering(false);
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
    const now = new Date();
    const deadline = new Date(event.registrationDeadline);
    if (now > deadline) return false;
    if (event.registrationLimit && event.currentRegistrations >= event.registrationLimit) {
      return false;
    }
    return true;
  };

  if (loading) return <Loader />;

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
              {event.eventType}
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

          {/* Register Button */}
          {canRegister() ? (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="w-full btn-primary py-3 text-lg disabled:opacity-50"
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
    </div>
  );
};

export default EventDetails;