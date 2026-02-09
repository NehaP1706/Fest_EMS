import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI, merchandiseAPI, attendanceAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiEdit, FiTrash2, FiDownload, FiUsers, FiDollarSign, FiCheckCircle } from 'react-icons/fi';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const OrganizerEventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEventData();
  }, [id]);

  const fetchEventData = async () => {
    try {
      const [eventRes, attendanceRes] = await Promise.all([
        eventAPI.getById(id),
        attendanceAPI.getEventAttendance(id).catch(() => ({ data: { attendances: [] } })),
      ]);

      setEvent(eventRes.data.event);
      setAttendance(attendanceRes.data.attendances || []);

      // Fetch participants based on event type
      if (eventRes.data.event.eventType === 'merchandise') {
        const purchasesRes = await merchandiseAPI.getPendingApprovals();
        const eventPurchases = purchasesRes.data.purchases?.filter(
          p => p.event._id === id
        ) || [];
        setParticipants(eventPurchases);
      } else {
        const regsRes = await registrationAPI.getMyRegistrations();
        const eventRegs = regsRes.data.registrations?.filter(
          r => r.event._id === id
        ) || [];
        setParticipants(eventRegs);
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEvent = async (updates) => {
    try {
      await eventAPI.update(id, updates);
      alert('Event updated successfully!');
      fetchEventData();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update event');
    }
  };

  const handleDeleteEvent = async () => {
    if (!confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      return;
    }

    try {
      await eventAPI.delete(id);
      alert('Event deleted successfully');
      navigate('/organizer/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await attendanceAPI.exportAttendance(id);
      const data = response.data.data || [];
      
      // Convert to CSV
      const headers = Object.keys(data[0] || {});
      const csv = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header]).join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${event.name}_participants.csv`;
      a.click();
    } catch (error) {
      alert('Failed to export data');
    }
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

  const getAttendanceData = () => {
    const attended = attendance.length;
    const notAttended = (event?.currentRegistrations || 0) - attended;
    return [
      { name: 'Attended', value: attended, color: '#10b981' },
      { name: 'Not Attended', value: notAttended, color: '#ef4444' },
    ];
  };

  const filteredParticipants = participants.filter(p => {
    const searchLower = searchTerm.toLowerCase();
    const participant = p.participant || {};
    return (
      participant.firstName?.toLowerCase().includes(searchLower) ||
      participant.lastName?.toLowerCase().includes(searchLower) ||
      participant.email?.toLowerCase().includes(searchLower)
    );
  });

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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <div className="flex items-center gap-3 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                  {event.status}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  event.eventType === 'merchandise' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {event.eventType}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate(`/organizer/create-event?edit=${id}`)}
                className="btn-secondary flex items-center"
                disabled={event.status === 'completed'}
              >
                <FiEdit className="mr-2" />
                Edit
              </button>
              <button
                onClick={handleDeleteEvent}
                className="bg-red-50 text-red-700 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center"
                disabled={event.status !== 'draft'}
              >
                <FiTrash2 className="mr-2" />
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'analytics', 'participants'].map((tab) => (
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card bg-gradient-to-br from-blue-500 to-blue-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Registrations</p>
                    <p className="text-3xl font-bold mt-2">
                      {event.currentRegistrations}
                      {event.registrationLimit && `/${event.registrationLimit}`}
                    </p>
                  </div>
                  <FiUsers className="text-4xl text-blue-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Attendance</p>
                    <p className="text-3xl font-bold mt-2">{attendance.length}</p>
                  </div>
                  <FiCheckCircle className="text-4xl text-green-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-purple-500 to-purple-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Revenue</p>
                    <p className="text-3xl font-bold mt-2">₹{event.totalRevenue || 0}</p>
                  </div>
                  <FiDollarSign className="text-4xl text-purple-200" />
                </div>
              </div>

              <div className="card bg-gradient-to-br from-orange-500 to-orange-700 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">Fee</p>
                    <p className="text-3xl font-bold mt-2">₹{event.registrationFee}</p>
                  </div>
                  <FiDollarSign className="text-4xl text-orange-200" />
                </div>
              </div>
            </div>

            {/* Event Details */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Event Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Description</p>
                  <p className="font-medium mt-1">{event.description}</p>
                </div>
                <div>
                  <p className="text-gray-600">Eligibility</p>
                  <p className="font-medium mt-1 capitalize">{event.eligibility.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-gray-600">Registration Deadline</p>
                  <p className="font-medium mt-1">
                    {new Date(event.registrationDeadline).toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Event Date</p>
                  <p className="font-medium mt-1">
                    {new Date(event.eventStartDate).toLocaleDateString()} - {new Date(event.eventEndDate).toLocaleDateString()}
                  </p>
                </div>
                {event.tags && event.tags.length > 0 && (
                  <div className="md:col-span-2">
                    <p className="text-gray-600 mb-2">Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {event.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {event.status === 'published' && (
                  <button
                    onClick={() => handleUpdateEvent({ status: 'ongoing' })}
                    className="p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors text-left"
                  >
                    <h3 className="font-medium text-green-900">Mark as Ongoing</h3>
                    <p className="text-sm text-green-700">Event has started</p>
                  </button>
                )}
                {event.status === 'ongoing' && (
                  <button
                    onClick={() => handleUpdateEvent({ status: 'completed' })}
                    className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors text-left"
                  >
                    <h3 className="font-medium text-purple-900">Mark as Completed</h3>
                    <p className="text-sm text-purple-700">Event has ended</p>
                  </button>
                )}
                {(event.status === 'published' || event.status === 'ongoing') && (
                  <button
                    onClick={() => handleUpdateEvent({ status: 'closed' })}
                    className="p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-left"
                  >
                    <h3 className="font-medium text-red-900">Close Registration</h3>
                    <p className="text-sm text-red-700">Stop accepting registrations</p>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* Attendance Chart */}
            {event.status === 'completed' && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Attendance Overview</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={getAttendanceData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getAttendanceData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-gray-600 text-sm">Total Registered</p>
                    <p className="text-2xl font-bold text-gray-900">{event.currentRegistrations}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Attended</p>
                    <p className="text-2xl font-bold text-green-600">{attendance.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-sm">Attendance Rate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {event.currentRegistrations > 0
                        ? Math.round((attendance.length / event.currentRegistrations) * 100)
                        : 0}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Breakdown */}
            <div className="card">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Revenue Breakdown</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <span className="text-gray-700">Expected Revenue</span>
                  <span className="text-xl font-bold text-gray-900">
                    ₹{event.currentRegistrations * event.registrationFee}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                  <span className="text-green-700">Collected Revenue</span>
                  <span className="text-xl font-bold text-green-900">
                    ₹{event.totalRevenue || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="card">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Participants List</h2>
              <button
                onClick={handleExportCSV}
                className="btn-secondary flex items-center"
              >
                <FiDownload className="mr-2" />
                Export CSV
              </button>
            </div>

            {/* Search */}
            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search participants..."
                className="input"
              />
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Registered</th>
                    {event.eventType === 'merchandise' ? (
                      <>
                        <th className="text-left py-3 px-4">Payment Status</th>
                        <th className="text-left py-3 px-4">Amount</th>
                      </>
                    ) : (
                      <>
                        <th className="text-left py-3 px-4">Ticket ID</th>
                        <th className="text-left py-3 px-4">Attended</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredParticipants.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-8 text-gray-600">
                        No participants found
                      </td>
                    </tr>
                  ) : (
                    filteredParticipants.map((p) => (
                      <tr key={p._id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">
                          {p.participant?.firstName} {p.participant?.lastName}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {p.participant?.email}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {new Date(p.registeredAt || p.purchasedAt).toLocaleDateString()}
                        </td>
                        {event.eventType === 'merchandise' ? (
                          <>
                            <td className="py-3 px-4">
                              <span className={`text-xs px-2 py-1 rounded ${
                                p.paymentStatus === 'approved'
                                  ? 'bg-green-100 text-green-800'
                                  : p.paymentStatus === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {p.paymentStatus}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm font-medium text-green-600">
                              ₹{p.totalAmount}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 text-sm font-mono text-gray-600">
                              {p.ticketId}
                            </td>
                            <td className="py-3 px-4">
                              {p.attended ? (
                                <span className="text-green-600">✓ Yes</span>
                              ) : (
                                <span className="text-gray-400">No</span>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizerEventDetail;