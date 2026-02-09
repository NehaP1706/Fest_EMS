import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiPlus, FiCalendar, FiUsers, FiDollarSign, FiTrendingUp } from 'react-icons/fi';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    ongoing: 0,
    completed: 0,
    totalRevenue: 0,
    totalParticipants: 0,
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await eventAPI.getMyEvents();
      const eventList = response.data.events || [];
      setEvents(eventList);
      calculateStats(eventList);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (eventList) => {
    const stats = {
      total: eventList.length,
      published: eventList.filter(e => e.status === 'published').length,
      ongoing: eventList.filter(e => e.status === 'ongoing').length,
      completed: eventList.filter(e => e.status === 'completed').length,
      totalRevenue: eventList.reduce((sum, e) => sum + (e.totalRevenue || 0), 0),
      totalParticipants: eventList.reduce((sum, e) => sum + (e.currentRegistrations || 0), 0),
    };
    setStats(stats);
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-blue-100 text-blue-800',
      ongoing: 'bg-green-100 text-green-800',
      completed: 'bg-purple-100 text-purple-800',
      closed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getChartData = () => {
    return events
      .filter(e => e.status === 'completed')
      .slice(0, 5)
      .map(e => ({
        name: e.name.substring(0, 15) + '...',
        registrations: e.currentRegistrations || 0,
        revenue: e.totalRevenue || 0,
        attendance: e.totalAttendance || 0,
      }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-2">Manage your events and track performance</p>
          </div>
          <Link to="/organizer/create-event" className="btn-primary flex items-center">
            <FiPlus className="mr-2" />
            Create Event
          </Link>
        </div>

        {loading ? (
          <Loader />
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Events</p>
                    <p className="text-4xl font-bold mt-2">{stats.total}</p>
                  </div>
                  <FiCalendar className="text-5xl text-blue-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Total Participants</p>
                    <p className="text-4xl font-bold mt-2">{stats.totalParticipants}</p>
                  </div>
                  <FiUsers className="text-5xl text-green-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
                    <p className="text-4xl font-bold mt-2">₹{stats.totalRevenue}</p>
                  </div>
                  <FiDollarSign className="text-5xl text-purple-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-orange-500 to-orange-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Completed Events</p>
                    <p className="text-4xl font-bold mt-2">{stats.completed}</p>
                  </div>
                  <FiTrendingUp className="text-5xl text-orange-200" />
                </div>
              </div>
            </div>

            {/* Analytics Chart */}
            {getChartData().length > 0 && (
              <div className="card mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Event Performance (Completed Events)
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="registrations" fill="#8b5cf6" name="Registrations" />
                    <Bar dataKey="attendance" fill="#10b981" name="Attendance" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Events Carousel */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Your Events</h2>

              {events.length === 0 ? (
                <div className="text-center py-12">
                  <FiCalendar className="mx-auto text-6xl text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">No events yet</h3>
                  <p className="text-gray-600 mt-2">Create your first event to get started!</p>
                  <Link to="/organizer/create-event" className="btn-primary mt-4 inline-block">
                    Create Event
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => (
                    <Link
                      key={event._id}
                      to={`/organizer/events/${event._id}`}
                      className="card hover:shadow-lg transition-shadow border-2 border-gray-100 p-0"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              event.status
                            )}`}
                          >
                            {event.status}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              event.eventType === 'merchandise'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {event.eventType}
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {event.name}
                        </h3>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {event.description}
                        </p>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center justify-between">
                            <span>Registrations:</span>
                            <span className="font-medium">
                              {event.currentRegistrations}
                              {event.registrationLimit && ` / ${event.registrationLimit}`}
                            </span>
                          </div>

                          {event.status === 'completed' && (
                            <>
                              <div className="flex items-center justify-between">
                                <span>Attendance:</span>
                                <span className="font-medium">{event.totalAttendance || 0}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span>Revenue:</span>
                                <span className="font-medium text-green-600">
                                  ₹{event.totalRevenue || 0}
                                </span>
                              </div>
                            </>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t">
                            <span>Start Date:</span>
                            <span className="font-medium">
                              {new Date(event.eventStartDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 px-6 py-3 border-t">
                        <button className="text-primary-600 font-medium text-sm hover:text-primary-700">
                          View Details →
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrganizerDashboard;