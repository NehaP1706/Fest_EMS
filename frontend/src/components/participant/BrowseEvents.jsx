import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { eventAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiSearch, FiCalendar, FiMapPin, FiTrendingUp, FiStar, FiX } from 'react-icons/fi';

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPersonalized, setIsPersonalized] = useState(false);

  const queryParams = new URLSearchParams(window.location.search);

  const [filters, setFilters] = useState({
    eventType: '',
    eligibility: '',
    dateFrom: '',
    dateTo: '',
    followedOnly: queryParams.get('followedOnly') === 'true',
  });

  // Build params and fetch — always includes current search + filters
  const fetchEvents = useCallback(async (currentSearch, currentFilters) => {
    try {
      setLoading(true);
      const params = {};

      if (currentSearch?.trim()) params.search = currentSearch.trim();

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined && value !== false) {
          params[key] = value;
        }
      });

      const response = await eventAPI.getAll(params);
      const fetchedEvents = response.data.events || [];
      setEvents(fetchedEvents);

      // If events have relevanceScore > 0, the backend personalized the results
      const hasPersonalization = fetchedEvents.some(e => e.relevanceScore > 0);
      setIsPersonalized(hasPersonalization);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrending = useCallback(async () => {
    try {
      const response = await eventAPI.getTrending();
      setTrending(response.data.events || []);
    } catch (error) {
      console.error('Error fetching trending:', error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchEvents(searchTerm, filters);
    fetchTrending();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (e) => {
    e.preventDefault();
    fetchEvents(searchTerm, filters);
  };

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    fetchEvents(searchTerm, updated);
  };

  const clearFilters = () => {
    const cleared = { eventType: '', eligibility: '', dateFrom: '', dateTo: '', followedOnly: false };
    setFilters(cleared);
    setSearchTerm('');
    fetchEvents('', cleared);
  };

  const hasActiveFilters = searchTerm || filters.eventType || filters.eligibility ||
    filters.dateFrom || filters.dateTo || filters.followedOnly;

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
        <div className="mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Browse Events</h1>
            <p className="text-gray-600 mt-2">Discover and register for exciting events</p>
          </div>
          {isPersonalized && !hasActiveFilters && (
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700 font-medium mt-1">
              <FiStar size={14} className="text-purple-500" />
              Sorted by your interests
            </div>
          )}
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
                  <p className="text-sm text-gray-600 mt-1">{event.organizer?.name}</p>
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
              <button type="submit" className="btn-primary">Search</button>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FiX size={14} /> Clear
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select
                value={filters.eventType}
                onChange={(e) => handleFilterChange('eventType', e.target.value)}
                className="input"
              >
                <option value="">All Types</option>
                <option value="normal">Normal Event</option>
                <option value="merchandise">Merchandise</option>
              </select>

              <select
                value={filters.eligibility}
                onChange={(e) => handleFilterChange('eligibility', e.target.value)}
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
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="input"
              />

              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="input"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="followedOnly"
                checked={filters.followedOnly}
                onChange={(e) => handleFilterChange('followedOnly', e.target.checked)}
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
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-primary-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">{events.length} event{events.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <Link
                  key={event._id}
                  to={`/events/${event._id}`}
                  className="card hover:shadow-lg transition-shadow relative"
                >
                  {/* Relevance badge for personalized results */}
                  {event.relevanceScore > 0 && isPersonalized && !hasActiveFilters && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                      <FiStar size={10} /> For you
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        event.eventType === 'merchandise'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.eventType === 'merchandise' ? 'Merchandise' : 'Normal Event'}
                      </span>
                      {event.eligibility === 'iiit-only' && (
                        <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium">
                          IIIT Only
                        </span>
                      )}
                    </div>
                    {event.registrationFee > 0 && (
                      <span className="text-sm font-semibold text-primary-600 ml-2 flex-shrink-0">
                        ₹{event.registrationFee}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-12">
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
                        <span>{event.currentRegistrations}/{event.registrationLimit}</span>
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
                        />
                      </div>
                    </div>
                  )}

                  <button className="w-full mt-4 btn-primary text-sm">
                    View Details
                  </button>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BrowseEvents;