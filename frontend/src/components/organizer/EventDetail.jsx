import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI, registrationAPI, merchandiseAPI, attendanceAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiEdit, FiTrash2, FiDownload, FiUsers, FiDollarSign, FiCheckCircle, FiClock, FiCalendar } from 'react-icons/fi';
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
      setLoading(true);
      
      // Fetch event details
      const eventRes = await eventAPI.getById(id);
      setEvent(eventRes.data.event);

      // Fetch attendance (if available)
      try {
        const attendanceRes = await attendanceAPI.getEventAttendance(id);
        setAttendance(attendanceRes.data.attendances || []);
      } catch (err) {
        console.log('No attendance data available');
        setAttendance([]);
      }

      // Fetch participants based on event type
      if (eventRes.data.event.eventType === 'merchandise') {
        // Fetch merchandise purchases for this event
        try {
          const purchasesRes = await merchandiseAPI.getEventPurchases(id);
          setParticipants(purchasesRes.data.purchases || []);
        } catch (err) {
          console.error('Error fetching purchases:', err);
          setParticipants([]);
        }
      } else {
        // Fetch registrations for this event
        try {
          const regsRes = await registrationAPI.getEventRegistrations(id);
          setParticipants(regsRes.data.registrations || []);
        } catch (err) {
          console.error('Error fetching registrations:', err);
          setParticipants([]);
        }
      }
    } catch (error) {
      console.error('Error fetching event data:', error);
      alert('Failed to load event details. You may not have permission to view this event.');
      navigate('/organizer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${event.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await eventAPI.delete(id);
      alert('Event deleted successfully!');
      navigate('/organizer/dashboard');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete event. Only draft events can be deleted.');
    }
  };

  const handleEdit = () => {
    navigate(`/organizer/events/${id}/edit`);
  };

  const handleExportAttendance = async () => {
    try {
      const response = await attendanceAPI.exportAttendance(id);
      // Create download link
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${event.name}_attendance.csv`;
      link.click();
    } catch (error) {
      alert('Failed to export attendance');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      published: 'bg-green-100 text-green-800',
      ongoing: 'bg-blue-100 text-blue-800',
      completed: 'bg-purple-100 text-purple-800',
      closed: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getAttendanceData = () => {
    const registered = participants.length;
    const attended = attendance.length;
    const notAttended = registered - attended;

    return [
      { name: 'Attended', value: attended, color: '#10b981' },
      { name: 'Not Attended', value: notAttended > 0 ? notAttended : 0, color: '#ef4444' },
    ];
  };

  const getPaymentStatusData = () => {
    if (event?.eventType === 'merchandise') {
      const approved = participants.filter(p => p.status === 'approved').length;
      const pending = participants.filter(p => p.status === 'pending').length;
      const rejected = participants.filter(p => p.status === 'rejected').length;

      return [
        { name: 'Approved', value: approved, color: '#10b981' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
        { name: 'Rejected', value: rejected, color: '#ef4444' },
      ];
    } else {
      const paid = participants.filter(p => p.paymentStatus === 'completed').length;
      const pending = participants.filter(p => p.paymentStatus === 'pending').length;

      return [
        { name: 'Paid', value: paid, color: '#10b981' },
        { name: 'Pending', value: pending, color: '#f59e0b' },
      ];
    }
  };

  const filteredParticipants = participants.filter(p => {
    const participant = p.participant || {};
    const searchLower = searchTerm.toLowerCase();
    return (
      participant.firstName?.toLowerCase().includes(searchLower) ||
      participant.lastName?.toLowerCase().includes(searchLower) ||
      participant.email?.toLowerCase().includes(searchLower)
    );
  });

  // Accept either legacy `customRegistrationForm` or new `customForm.fields`
  const formFields = event ? (event.customRegistrationForm || event.customForm?.fields || []) : [];

  if (loading) {
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
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card text-center">
            <p className="text-gray-600">Event not found or you don't have permission to view it.</p>
          </div>
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
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(event.status)}`}>
                  {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    event.eventType === 'merchandise'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {event.eventType === 'merchandise' ? 'Merchandise' : 'Normal Event'}
                </span>
              </div>
              <p className="text-gray-600">{event.description}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={handleEdit} className="btn-secondary flex items-center">
                <FiEdit className="mr-2" />
                Edit
              </button>
              {event.status === 'draft' && (
                <button onClick={handleDelete} className="btn-danger flex items-center">
                  <FiTrash2 className="mr-2" />
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Event Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="card bg-white">
              <div className="flex items-center">
                <FiCalendar className="text-primary-600 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Event Date</p>
                  <p className="font-semibold">
                    {new Date(event.eventStartDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-white">
              <div className="flex items-center">
                <FiClock className="text-primary-600 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Registration Deadline</p>
                  <p className="font-semibold">
                    {new Date(event.registrationDeadline).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-white">
              <div className="flex items-center">
                <FiUsers className="text-primary-600 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Registrations</p>
                  <p className="font-semibold">
                    {event.currentRegistrations || 0}
                    {event.registrationLimit && ` / ${event.registrationLimit}`}
                  </p>
                </div>
              </div>
            </div>

            <div className="card bg-white">
              <div className="flex items-center">
                <FiDollarSign className="text-primary-600 mr-3" size={24} />
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="font-semibold text-green-600">₹{event.totalRevenue || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="card mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {['overview', 'participants', 'form', 'analytics'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab
                      ? 'border-primary-600 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Event Details</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Eligibility:</dt>
                      <dd className="font-medium">
                        {event.eligibility === 'all'
                          ? 'All Participants'
                          : event.eligibility === 'iiit-only'
                          ? 'IIIT Only'
                          : 'Non-IIIT Only'}
                      </dd>
                    </div>
                    {event.eventType === 'normal' && (
                      <div className="flex justify-between">
                        <dt className="text-gray-600">Registration Fee:</dt>
                        <dd className="font-medium">₹{event.registrationFee || 0}</dd>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Total Attendance:</dt>
                      <dd className="font-medium">{attendance.length}</dd>
                    </div>
                  </dl>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Organizer</h3>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Name:</dt>
                      <dd className="font-medium">{event.organizer?.name}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Category:</dt>
                      <dd className="font-medium">{event.organizer?.category}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-600">Contact:</dt>
                      <dd className="font-medium">{event.organizer?.contactEmail}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {event.tags && event.tags.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-primary-100 text-primary-800 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Registration Form Preview */}
              {formFields && formFields.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Custom Registration Form ({formFields.length} field{formFields.length !== 1 ? 's' : ''})
                  </h3>
                  <div className="space-y-2">
                    {formFields.map((field, idx) => (
                      <div key={field.fieldId} className="flex items-center gap-3 text-sm p-2 bg-gray-50 rounded border">
                        <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-800 rounded font-mono">
                          {field.fieldType}
                        </span>
                        <span className="font-medium">{field.label}</span>
                        {field.required && <span className="text-red-500 text-xs">required</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {(!formFields || formFields.length === 0) && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Custom Registration Form</h3>
                  <p className="text-sm text-gray-500">No custom fields — only basic info is collected.</p>
                </div>
              )}
            </div>
          )}

          {/* Form Responses Tab */}
          {activeTab === 'form' && (
            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">
                Registration Form Responses ({participants.filter(p => p.formResponses && Object.keys(p.formResponses).length > 0).length} / {participants.length} with responses)
              </h3>
              {(!formFields || formFields.length === 0) ? (
                <div className="text-center py-12 text-gray-500">
                  <p className="text-gray-500">No custom registration form fields were added for this event.</p>
                  <p className="text-sm text-gray-400 mt-1">Only basic participant info is collected.</p>
                </div>
              ) : participants.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <p>No registrations yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Participant</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ticket ID</th>
                          {formFields.map((field) => (
                          <th key={field.fieldId} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            {field.label}{field.required ? ' *' : ''}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {participants.map((reg) => (
                        <tr key={reg._id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                            {reg.participant?.firstName} {reg.participant?.lastName}
                            <div className="text-xs text-gray-500">{reg.participant?.email}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-600">
                            {reg.ticketId || '—'}
                          </td>
                          {formFields.map((field) => {
                            const response = reg.formResponses?.[field.fieldId];
                            const displayValue = Array.isArray(response)
                              ? response.join(', ')
                              : response || <span className="text-gray-400">—</span>;
                            return (
                              <td key={field.fieldId} className="px-4 py-3 text-gray-700">
                                {displayValue}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">
                  {event.eventType === 'merchandise' ? 'Purchases' : 'Registrations'} ({participants.length})
                </h3>
                <input
                  type="text"
                  placeholder="Search participants..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input max-w-xs"
                />
              </div>

              {filteredParticipants.length === 0 ? (
                <div className="text-center py-12">
                  <FiUsers className="mx-auto text-6xl text-gray-300 mb-4" />
                  <p className="text-gray-600">No participants yet</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Type
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Date
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredParticipants.map((item) => (
                        <tr key={item._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.participant?.firstName} {item.participant?.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {item.participant?.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                item.participant?.participantType === 'iiit'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.participant?.participantType === 'iiit' ? 'IIIT' : 'Non-IIIT'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                (item.paymentStatus === 'completed' || item.status === 'approved')
                                  ? 'bg-green-100 text-green-800'
                                  : item.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {item.paymentStatus || item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {new Date(item.registeredAt || item.purchaseDate).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Attendance Chart */}
                {event.status !== 'draft' && participants.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">Attendance Overview</h3>
                    <ResponsiveContainer width="100%" height={250}>
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
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Payment Status Chart */}
                {participants.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-4">
                      {event.eventType === 'merchandise' ? 'Purchase Status' : 'Payment Status'}
                    </h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={getPaymentStatusData()}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getPaymentStatusData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>

              {/* Export Button */}
              {attendance.length > 0 && (
                <div className="mt-6">
                  <button onClick={handleExportAttendance} className="btn-secondary flex items-center">
                    <FiDownload className="mr-2" />
                    Export Attendance Report
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrganizerEventDetail;