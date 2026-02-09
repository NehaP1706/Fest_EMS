import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { organizerAPI, eventAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';

const OrganizerDetail = () => {
  const { id } = useParams();
  const [organizer, setOrganizer] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [orgRes, eventsRes] = await Promise.all([
        organizerAPI.getById(id),
        eventAPI.getAll({ organizer: id }),
      ]);
      setOrganizer(orgRes.data.organizer);
      setEvents(eventsRes.data.events || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card mb-6">
          <h1 className="text-3xl font-bold text-gray-900">{organizer?.name}</h1>
          <p className="text-primary-600 mt-2">{organizer?.category}</p>
          <p className="text-gray-700 mt-4">{organizer?.description}</p>
          {organizer?.contactEmail && (
            <p className="text-gray-600 mt-2">
              Contact: {organizer.contactEmail}
            </p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Events by {organizer?.name}</h2>
          <div className="space-y-4">
            {events.length === 0 ? (
              <p className="text-gray-600">No events yet</p>
            ) : (
              events.map((event) => (
                <div key={event._id} className="border-b pb-4 last:border-0">
                  <h3 className="font-semibold">{event.name}</h3>
                  <p className="text-sm text-gray-600">{event.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDetail;