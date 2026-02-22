import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Fuse from 'fuse.js';
import { eventAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiSearch, FiCalendar, FiMapPin, FiTrendingUp, FiStar, FiX } from 'react-icons/fi';

// Fuse.js config — searches across the most useful fields with weighted importance
const FUSE_OPTIONS = {
  includeScore: true,
  threshold: 0.35,          // 0 = exact, 1 = match anything; 0.35 is a good balanced default
  minMatchCharLength: 2,
  ignoreLocation: true,     // don't penalise matches far from start of string
  keys: [
    { name: 'name',                  weight: 0.5  },
    { name: 'description',           weight: 0.25 },
    { name: 'tags',                  weight: 0.15 },
    { name: 'organizer.name',        weight: 0.1  },
  ],
};

const BrowseEvents = () => {
  const [allEvents, setAllEvents] = useState([]);   // full list from server (personalized order)
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

  // ── Fetch from server (filters only — no search param, Fuse handles that) ──
  const fetchEvents = useCallback(async (currentFilters) => {
    try {
      setLoading(true);
      const params = {};
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined && value !== false) {
          params[key] = value;
        }
      });

      const response = await eventAPI.getAll(params);
      const fetched = response.data.events || [];
      setAllEvents(fetched);
      setIsPersonalized(fetched.some(e => e.relevanceScore > 0));
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

  useEffect(() => {
    fetchEvents(filters);
    fetchTrending();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fuse instance — rebuilt only when allEvents changes ──────────────────
  const fuse = useMemo(() => new Fuse(allEvents, FUSE_OPTIONS), [allEvents]);

  // ── Filtered + searched events (pure derived state, no extra fetches) ────
  const displayedEvents = useMemo(() => {
    if (!searchTerm.trim()) return allEvents;
    return fuse.search(searchTerm.trim()).map(r => r.item);
  }, [searchTerm, fuse, allEvents]);

  const handleFilterChange = (key, value) => {
    const updated = { ...filters, [key]: value };
    setFilters(updated);
    fetchEvents(updated);   // re-fetch from server with new filters
  };

  const clearFilters = () => {
    const cleared = { eventType: '', eligibility: '', dateFrom: '', dateTo: '', followedOnly: false };
    setFilters(cleared);
    setSearchTerm('');
    fetchEvents(cleared);
  };

  const hasActiveFilters = searchTerm || filters.eventType || filters.eligibility ||
    filters.dateFrom || filters.dateTo || filters.followedOnly;

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

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

        {/* Trending */}
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
                    <span className="bg-primary-600 text-white text-xs px-3 py-1 rounded-full">Trending</span>
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

        {/* Search + Filters */}
        <div className="card mb-6">
          <div className="space-y-4">
            {/* Search — instant, no submit needed */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search events, clubs, tags…"
                  className="input pl-10"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <FiX size={14} />
                  </button>
                )}
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <FiX size={14} /> Clear all
                </button>
              )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <select value={filters.eventType} onChange={(e) => handleFilterChange('eventType', e.target.value)} className="input">
                <option value="">All Types</option>
                <option value="normal">Normal Event</option>
                <option value="merchandise">Merchandise</option>
              </select>
              <select value={filters.eligibility} onChange={(e) => handleFilterChange('eligibility', e.target.value)} className="input">
                <option value="">All Eligibility</option>
                <option value="iiit-only">IIIT Only</option>
                <option value="non-iiit-only">Non-IIIT Only</option>
                <option value="all">Everyone</option>
              </select>
              <input type="date" value={filters.dateFrom} onChange={(e) => handleFilterChange('dateFrom', e.target.value)} className="input" />
              <input type="date" value={filters.dateTo}   onChange={(e) => handleFilterChange('dateTo', e.target.value)}   className="input" />
            </div>

            <label className="flex items-center cursor-pointer w-fit">
              <input
                type="checkbox"
                id="followedOnly"
                checked={filters.followedOnly}
                onChange={(e) => handleFilterChange('followedOnly', e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">Show only events from followed clubs</span>
            </label>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <Loader />
        ) : displayedEvents.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-600">
              {searchTerm ? `No events matched "${searchTerm}"` : 'No events found'}
            </p>
            {hasActiveFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-primary-600 hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {displayedEvents.length} event{displayedEvents.length !== 1 ? 's' : ''}
              {searchTerm ? ` matching "${searchTerm}"` : ''}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedEvents.map((event) => (
                <Link
                  key={event._id}
                  to={`/events/${event._id}`}
                  className="card hover:shadow-lg transition-shadow relative"
                >
                  {event.relevanceScore > 0 && isPersonalized && !hasActiveFilters && (
                    <div className="absolute top-3 right-3 flex items-center gap-1 text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                      <FiStar size={10} /> For you
                    </div>
                  )}

                  <div className="flex items-start justify-between mb-3">
                    <div className="flex gap-2 flex-wrap">
                      <span className={`text-xs px-3 py-1 rounded-full ${
                        event.eventType === 'merchandise' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {event.eventType === 'merchandise' ? 'Merchandise' : 'Normal Event'}
                      </span>
                      {event.eligibility === 'iiit-only' && (
                        <span className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium">IIIT Only</span>
                      )}
                    </div>
                    {event.registrationFee > 0 && (
                      <span className="text-sm font-semibold text-primary-600 ml-2 flex-shrink-0">
                        ₹{event.registrationFee}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2 pr-14">{event.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{event.description}</p>

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
                          style={{ width: `${Math.min((event.currentRegistrations / event.registrationLimit) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <button className="w-full mt-4 btn-primary text-sm">View Details</button>
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