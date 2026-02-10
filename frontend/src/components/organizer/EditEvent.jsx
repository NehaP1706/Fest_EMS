import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiSave, FiAlertCircle } from 'react-icons/fi';

const EditEvent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Editable fields
  const [description, setDescription] = useState('');
  const [registrationDeadline, setRegistrationDeadline] = useState('');
  const [registrationLimit, setRegistrationLimit] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const response = await eventAPI.getById(id);
      const eventData = response.data.event;
      
      setEvent(eventData);
      setDescription(eventData.description || '');
      setRegistrationDeadline(eventData.registrationDeadline ? 
        new Date(eventData.registrationDeadline).toISOString().slice(0, 16) : '');
      setRegistrationLimit(eventData.registrationLimit || '');
      setStatus(eventData.status || 'draft');
    } catch (error) {
      console.error('Error fetching event:', error);
      alert('Failed to load event');
      navigate('/organizer/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!description.trim()) {
      alert('Description is required');
      return;
    }

    if (!registrationDeadline) {
      alert('Registration deadline is required');
      return;
    }

    // Build update data based on event status
    let updateData = {};

    if (event.status === 'draft') {
      // Draft events can change status
      updateData = {
        description,
        registrationDeadline,
        registrationLimit: registrationLimit || null,
        status,
      };
    } else if (event.status === 'published') {
      // Published events have limited edit permissions
      updateData = {
        description,
        registrationDeadline,
        registrationLimit: registrationLimit || null,
      };
      
      // Validate deadline extension (can't reduce)
      const currentDeadline = new Date(event.registrationDeadline);
      const newDeadline = new Date(registrationDeadline);
      if (newDeadline < currentDeadline) {
        alert('Registration deadline can only be extended, not reduced');
        return;
      }

      // Validate limit increase (can't reduce)
      if (registrationLimit && event.registrationLimit) {
        if (parseInt(registrationLimit) < parseInt(event.registrationLimit)) {
          alert('Registration limit can only be increased, not reduced');
          return;
        }
      }
    } else {
      // Ongoing/completed/closed events can only change status
      updateData = { status };
    }

    try {
      setSaving(true);
      await eventAPI.update(id, updateData);
      alert('Event updated successfully!');
      navigate(`/organizer/events/${id}`);
    } catch (error) {
      console.error('Error updating event:', error);
      alert(error.response?.data?.message || 'Failed to update event');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Loader text="Loading event..." />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="card text-center">
            <p className="text-gray-600">Event not found</p>
          </div>
        </div>
      </div>
    );
  }

  const isDraft = event.status === 'draft';
  const isPublished = event.status === 'published';
  const isRestrictedEdit = !isDraft;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">Edit Event</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === 'draft' ? 'bg-gray-200 text-gray-700' :
                event.status === 'published' ? 'bg-green-100 text-green-700' :
                event.status === 'ongoing' ? 'bg-blue-100 text-blue-700' :
                event.status === 'completed' ? 'bg-purple-100 text-purple-700' :
                'bg-red-100 text-red-700'
              }`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>
            </div>
            <p className="text-gray-600">{event.name}</p>
          </div>

          {/* Edit restrictions notice */}
          {isPublished && (
            <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
              <div className="flex items-start">
                <FiAlertCircle className="text-yellow-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-yellow-800 mb-1">Limited Editing</h3>
                  <p className="text-sm text-yellow-700">
                    Published events can only update: <strong>description</strong>, <strong>extend deadline</strong>, 
                    and <strong>increase registration limit</strong>. To make other changes, you must close registrations first.
                  </p>
                </div>
              </div>
            </div>
          )}

          {event.status === 'ongoing' && (
            <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
              <div className="flex items-start">
                <FiAlertCircle className="text-blue-600 mr-3 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h3 className="font-semibold text-blue-800 mb-1">Event Ongoing</h3>
                  <p className="text-sm text-blue-700">
                    This event is currently ongoing. You can only change its status to completed or closed.
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Non-editable info */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Event Information (Non-editable)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Event Name:</span>
                  <p className="font-medium text-gray-900">{event.name}</p>
                </div>
                <div>
                  <span className="text-gray-600">Event Type:</span>
                  <p className="font-medium text-gray-900">
                    {event.eventType === 'normal' ? 'Normal Event' : 'Merchandise Sale'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Eligibility:</span>
                  <p className="font-medium text-gray-900">
                    {event.eligibility === 'all' ? 'All Participants' :
                     event.eligibility === 'iiit-only' ? 'IIIT Only' : 'Non-IIIT Only'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Event Dates:</span>
                  <p className="font-medium text-gray-900">
                    {new Date(event.eventStartDate).toLocaleDateString()} - {new Date(event.eventEndDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Current Registrations:</span>
                  <p className="font-medium text-gray-900">{event.currentRegistrations || 0}</p>
                </div>
                {event.eventType === 'normal' && (
                  <div>
                    <span className="text-gray-600">Registration Fee:</span>
                    <p className="font-medium text-gray-900">₹{event.registrationFee || 0}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Editable fields */}
            <div className="space-y-6">
              <h3 className="font-semibold text-gray-900 border-b pb-2">Editable Fields</h3>

              {/* Description - Always editable */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="input"
                  placeholder="Update event description..."
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can update the event description at any time
                </p>
              </div>

              {/* Registration Deadline - Editable for draft and published */}
              {(isDraft || isPublished) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Deadline *
                  </label>
                  <input
                    type="datetime-local"
                    value={registrationDeadline}
                    onChange={(e) => setRegistrationDeadline(e.target.value)}
                    className="input"
                    required
                  />
                  {isPublished && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ For published events, deadline can only be extended (moved forward), not reduced
                    </p>
                  )}
                </div>
              )}

              {/* Registration Limit - Editable for draft and published */}
              {(isDraft || isPublished) && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Registration Limit
                  </label>
                  <input
                    type="number"
                    value={registrationLimit}
                    onChange={(e) => setRegistrationLimit(e.target.value)}
                    className="input"
                    placeholder="Leave empty for unlimited"
                    min={isPublished && event.registrationLimit ? event.registrationLimit : 0}
                  />
                  {isPublished && event.registrationLimit && (
                    <p className="text-xs text-yellow-600 mt-1">
                      ⚠️ For published events, limit can only be increased, not reduced (current: {event.registrationLimit})
                    </p>
                  )}
                  {isPublished && !event.registrationLimit && (
                    <p className="text-xs text-gray-500 mt-1">
                      Currently unlimited. You can set a limit if needed.
                    </p>
                  )}
                </div>
              )}

              {/* Status Control */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Event Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="input"
                >
                  {isDraft && (
                    <>
                      <option value="draft">Draft</option>
                      <option value="published">Publish Event</option>
                    </>
                  )}
                  {isPublished && (
                    <>
                      <option value="published">Published</option>
                      <option value="ongoing">Mark as Ongoing</option>
                      <option value="closed">Close Registrations</option>
                    </>
                  )}
                  {event.status === 'ongoing' && (
                    <>
                      <option value="ongoing">Ongoing</option>
                      <option value="completed">Mark as Completed</option>
                      <option value="closed">Close Event</option>
                    </>
                  )}
                  {(event.status === 'completed' || event.status === 'closed') && (
                    <option value={event.status}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </option>
                  )}
                </select>
                {isDraft && (
                  <p className="text-xs text-blue-600 mt-1">
                    💡 Publish the event to make it visible to participants
                  </p>
                )}
                {isPublished && (
                  <p className="text-xs text-gray-500 mt-1">
                    Change status to manage event lifecycle
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate(`/organizer/events/${id}`)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 btn-primary flex items-center justify-center disabled:opacity-50"
              >
                <FiSave className="mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>

        {/* Help Section */}
        <div className="card mt-6 bg-blue-50 border-2 border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">💡 Event Lifecycle</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>Draft:</strong> Full editing allowed. Not visible to participants.</li>
            <li>• <strong>Published:</strong> Visible to participants. Limited editing (description, deadline extension, limit increase).</li>
            <li>• <strong>Ongoing:</strong> Event is currently happening. Can only change status.</li>
            <li>• <strong>Completed:</strong> Event finished successfully.</li>
            <li>• <strong>Closed:</strong> Registrations closed. Event may still be ongoing.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EditEvent;