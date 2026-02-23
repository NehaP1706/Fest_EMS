import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { feedbackAPI, eventAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiStar, FiDownload, FiFilter, FiMessageSquare, FiBarChart2, FiArrowLeft } from 'react-icons/fi';

const FeedbackDashboard = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [feedbacks, setFeedbacks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterRating, setFilterRating] = useState(0);

  useEffect(() => {
    fetchData();
  }, [eventId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [eventRes, feedbackRes] = await Promise.all([
        eventAPI.getById(eventId),
        feedbackAPI.getEventFeedback(eventId),
      ]);
      setEvent(eventRes.data.event);
      setFeedbacks(feedbackRes.data.feedbacks);
      setStats(feedbackRes.data.stats);
    } catch (error) {
      console.error('Error fetching feedback:', error);
      alert('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!feedbacks || feedbacks.length === 0) {
      alert('No feedback to export');
      return;
    }

    const headers = ['Rating', 'Comment', 'Submitted At'];
    const rows = feedbacks.map(f => [
      f.rating,
      `"${(f.comment || '').replace(/"/g, '""')}"`, 
      new Date(f.submittedAt).toLocaleString(),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feedback-${event?.name || 'event'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredFeedbacks = filterRating === 0
    ? feedbacks
    : feedbacks.filter(f => f.rating === filterRating);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Loader />
      </div>
    );
  }

  if (!event || !stats) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <p className="text-gray-600">Feedback data not available</p>
        </div>
      </div>
    );
  }

  const ratingPercentages = {
    5: stats.totalFeedbacks > 0 ? (stats.ratingDistribution[5] / stats.totalFeedbacks * 100) : 0,
    4: stats.totalFeedbacks > 0 ? (stats.ratingDistribution[4] / stats.totalFeedbacks * 100) : 0,
    3: stats.totalFeedbacks > 0 ? (stats.ratingDistribution[3] / stats.totalFeedbacks * 100) : 0,
    2: stats.totalFeedbacks > 0 ? (stats.ratingDistribution[2] / stats.totalFeedbacks * 100) : 0,
    1: stats.totalFeedbacks > 0 ? (stats.ratingDistribution[1] / stats.totalFeedbacks * 100) : 0,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => navigate('/organizer/events')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <FiArrowLeft /> Back to Events
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{event.name}</h1>
              <p className="text-gray-600 mt-1">Event Feedback Dashboard</p>
            </div>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <FiDownload size={16} />
              Export CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FiMessageSquare className="text-blue-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Feedback</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalFeedbacks}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <FiStar className="text-yellow-600 fill-yellow-600" size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.averageRating.toFixed(1)} / 5.0
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <FiBarChart2 className="text-green-600" size={24} />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Rating Distribution</p>
                <div className="flex items-center gap-1">
                  {[5, 4, 3, 2, 1].map(rating => (
                    <div
                      key={rating}
                      className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
                      title={`${rating} stars: ${stats.ratingDistribution[rating]}`}
                    >
                      <div
                        className={`h-full ${
                          rating === 5 ? 'bg-green-500' :
                          rating === 4 ? 'bg-blue-500' :
                          rating === 3 ? 'bg-yellow-500' :
                          rating === 2 ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${ratingPercentages[rating]}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Rating Distribution</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-1 w-24">
                  <span className="text-sm font-medium text-gray-700">{rating}</span>
                  <FiStar size={16} className="text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className={`h-full flex items-center justify-end px-2 text-xs font-medium text-white ${
                      rating === 5 ? 'bg-green-500' :
                      rating === 4 ? 'bg-blue-500' :
                      rating === 3 ? 'bg-yellow-500' :
                      rating === 2 ? 'bg-orange-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${ratingPercentages[rating]}%` }}
                  >
                    {ratingPercentages[rating] > 5 && `${ratingPercentages[rating].toFixed(0)}%`}
                  </div>
                </div>
                <span className="text-sm text-gray-600 w-16 text-right">
                  {stats.ratingDistribution[rating]} {stats.ratingDistribution[rating] === 1 ? 'response' : 'responses'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="card mb-6">
          <div className="flex items-center gap-4">
            <FiFilter className="text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filter by rating:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterRating(0)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filterRating === 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All ({stats.totalFeedbacks})
              </button>
              {[5, 4, 3, 2, 1].map(rating => (
                <button
                  key={rating}
                  onClick={() => setFilterRating(rating)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                    filterRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {rating} <FiStar size={12} className="fill-current" /> ({stats.ratingDistribution[rating]})
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {filteredFeedbacks.length === 0 ? (
            <div className="card text-center py-12">
              <FiMessageSquare className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                {filterRating === 0 ? 'No feedback yet' : `No ${filterRating}-star feedback`}
              </h3>
              <p className="text-gray-600 mt-2">
                {filterRating === 0
                  ? 'Feedback will appear here once participants submit their reviews'
                  : 'Try selecting a different rating filter'}
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-semibold text-gray-900">
                Anonymous Feedback ({filteredFeedbacks.length})
              </h2>
              {filteredFeedbacks.map((feedback, index) => (
                <div key={feedback._id} className="card hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <FiStar
                            key={star}
                            size={18}
                            className={star <= feedback.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {feedback.rating}.0 / 5.0
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(feedback.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                  {feedback.comment && (
                    <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-400">
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                        {feedback.comment}
                      </p>
                    </div>
                  )}
                  {!feedback.comment && (
                    <p className="text-sm text-gray-400 italic">No comment provided</p>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-2 py-1 rounded-full">Anonymous Feedback #{index + 1}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeedbackDashboard;