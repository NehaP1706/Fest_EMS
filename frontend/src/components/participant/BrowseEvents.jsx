import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiSearch, FiFilter, FiCalendar, FiMapPin, FiTrendingUp } from 'react-icons/fi';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const queryParams = new URLSearchParams(window.location.search);

  const [filters, setFilters] = useState({
    eventType: '',
    eligibility: '',
    dateFrom: '',
    dateTo: '',
    followedOnly: queryParams.get('followedOnly') === 'true',
  });

  useEffect(() => {
    const followed = queryParams.get('followedOnly') === 'true';
    if (followed && !filters.followedOnly) {
      setFilters(prev => ({ ...prev, followedOnly: true }));
    }
    fetchEvents();
    fetchTrending();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        ...filters,
      };
      const response = await eventAPI.getAll(params);
      setEvents(response.data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrending = async () => {
    try {
      const response = await eventAPI.getTrending();
      setTrending(response.data.events || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents();
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
          <h1 className="text-3xl font-bold text-gray-900">Browse Events</h1>
          <p className="text-gray-600 mt-2">
            Discover and register for exciting events
          </p>
        </div>

        {/* Trending Events */}
        {trending.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-4">
              <FiTrendingUp className="text-primary-600 mr-2" size={24} />
              <h2 className="text-xl font-semibold text-gray-900">Trending Events</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {trending.slice(0, 3).map((event) => (
                <Link
                  key={event._id}
                  to={`/events/${event._id}`}
                  className="card hover:shadow-lg transition-shadow bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="bg-primary-600 text-white text-xs px-3 py-1 rounded-full">
                      Trending
                    </span>
                    <span className="text-xs text-gray-600">{event.viewCount} views</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{event.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {event.organizer?.name}
                  </p>
                  <div className="flex items-center mt-3 text-xs text-gray-600">
                    <FiCalendar className="mr-1" />
                    {formatDate(event.eventStartDate)}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="card mb-6">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events..."
                  className="input pl-10"
                />
              </div>
              <button type="submit" className="btn-primary">
                Search
              </button>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.eventType}
                onChange={(e) => setFilters({ ...filters, eventType: e.target.value })}
                className="input"
              >
                <option value="">All Types</option>
                <option value="normal">Normal Event</option>
                <option value="merchandise">Merchandise</option>
              </select>

              <select
                value={filters.eligibility}
                onChange={(e) => setFilters({ ...filters, eligibility: e.target.value })}
                className="input"
              >
                <option value="">All Eligibility</option>
                <option value="iiit-only">IIIT Only</option>
                <option value="non-iiit-only">Non-IIIT Only</option>
                <option value="all">Everyone</option>
              </select>

              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                className="input"
                placeholder="From Date"
              />

              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                className="input"
                placeholder="To Date"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="followedOnly"
                checked={filters.followedOnly}
                onChange={(e) => setFilters({ ...filters, followedOnly: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="followedOnly" className="text-sm text-gray-700">
                Show only events from followed clubs
              </label>
            </div>
          </form>
        </div>

        {/* Events List */}
        {loading ? (
          <Loader />
        ) : events.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">No events found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Link
                key={event._id}
                to={`/events/${event._id}`}
                className="card hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className={`text-xs px-3 py-1 rounded-full ${
                    event.eventType === 'merchandise'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}>
                    {event.eventType}
                  </span>
                  {event.registrationFee > 0 && (
                    <span className="text-sm font-semibold text-primary-600">
                      ₹{event.registrationFee}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {event.name}
                </h3>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                  {event.description}
                </p>

                <div className="text-sm text-gray-600 space-y-1">
                  <div className="flex items-center">
                    <FiMapPin className="mr-2 flex-shrink-0" size={16} />
                    <span>{event.organizer?.name}</span>
                  </div>
                  <div className="flex items-center">
                    <FiCalendar className="mr-2 flex-shrink-0" size={16} />
                    <span>{formatDate(event.eventStartDate)}</span>
                  </div>
                </div>

                {event.registrationLimit && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Spots filled</span>
                      <span>
                        {event.currentRegistrations}/{event.registrationLimit}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-primary-600 h-2 rounded-full"
                        style={{
                          width: `${Math.min(
                            (event.currentRegistrations / event.registrationLimit) * 100,
                            100
                          )}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}

                <button className="w-full mt-4 btn-primary text-sm">
                  View Details
                </button>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseEvents;