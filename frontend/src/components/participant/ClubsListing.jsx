import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { organizerAPI, userAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiHeart, FiUsers, FiMail, FiPhone } from 'react-icons/fi';

const ClubsListing = () => {
  const { user, checkAuth } = useAuth();
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followedIds, setFollowedIds] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = [
    'All',
    'Technical',
    'Cultural',
    'Sports',
    'Literary',
    'Arts',
    'Council',
    'Fest Team',
    'Other',
  ];

  useEffect(() => {
    fetchOrganizers();
    if (user?.followedOrganizers) {
      setFollowedIds(user.followedOrganizers.map(id => id.toString()));
    }
  }, [user]);

  const fetchOrganizers = async () => {
    try {
      const response = await organizerAPI.getAll();
      setOrganizers(response.data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (organizerId) => {
    try {
      await userAPI.followOrganizer(organizerId);
      
      if (followedIds.includes(organizerId)) {
        setFollowedIds(followedIds.filter(id => id !== organizerId));
      } else {
        setFollowedIds([...followedIds, organizerId]);
      }

      await checkAuth();
      
    } catch (error) {
      alert('Failed to update follow status');
    }
  };

  const filteredOrganizers = organizers.filter(org => {
    if (filterCategory === 'all') return true;
    return org.category.toLowerCase() === filterCategory.toLowerCase();
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Clubs & Organizers</h1>
          <p className="text-gray-600 mt-2">
            Discover and follow clubs to stay updated with their events
          </p>
        </div>

        
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setFilterCategory(category.toLowerCase())}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterCategory === category.toLowerCase()
                    ? 'bg-primary-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

       
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-primary-500 to-purple-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-sm font-medium">Total Clubs</p>
                <p className="text-4xl font-bold mt-2">{organizers.length}</p>
              </div>
              <FiUsers className="text-5xl text-primary-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Following</p>
                <p className="text-4xl font-bold mt-2">{followedIds.length}</p>
              </div>
              <FiHeart className="text-5xl text-green-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-700 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Filtered Results</p>
                <p className="text-4xl font-bold mt-2">{filteredOrganizers.length}</p>
              </div>
              <FiUsers className="text-5xl text-orange-200" />
            </div>
          </div>
        </div>

        
        {loading ? (
          <Loader />
        ) : filteredOrganizers.length === 0 ? (
          <div className="card text-center py-12">
            <FiUsers className="mx-auto text-6xl text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No clubs found</h3>
            <p className="text-gray-600 mt-2">
              {filterCategory === 'all'
                ? 'No clubs available at the moment'
                : `No clubs in the ${filterCategory} category`}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizers.map((org) => {
              const isFollowing = followedIds.includes(org._id.toString());
              
              return (
                <div
                  key={org._id}
                  className={`card hover:shadow-lg transition-all ${
                    isFollowing ? 'border-2 border-primary-300 bg-primary-50' : ''
                  }`}
                >
                  
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
                      <span className="inline-block mt-2 bg-primary-100 text-primary-800 text-xs px-3 py-1 rounded-full">
                        {org.category}
                      </span>
                    </div>
                    {isFollowing && (
                      <div className="ml-2">
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full flex items-center">
                          <FiHeart className="mr-1" size={12} fill="currentColor" />
                          Following
                        </span>
                      </div>
                    )}
                  </div>

                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3 min-h-[60px]">
                    {org.description || 'No description available'}
                  </p>

                  
                  <div className="space-y-2 mb-4 pb-4 border-b">
                    {org.contactEmail && (
                      <div className="flex items-center text-xs text-gray-600">
                        <FiMail className="mr-2 flex-shrink-0" size={14} />
                        <span className="truncate">{org.contactEmail}</span>
                      </div>
                    )}
                    {org.contactNumber && (
                      <div className="flex items-center text-xs text-gray-600">
                        <FiPhone className="mr-2 flex-shrink-0" size={14} />
                        <span>{org.contactNumber}</span>
                      </div>
                    )}
                    {org.followers && org.followers.length > 0 && (
                      <div className="flex items-center text-xs text-gray-600">
                        <FiUsers className="mr-2 flex-shrink-0" size={14} />
                        <span>{org.followers.length} followers</span>
                      </div>
                    )}
                  </div>

                  
                  <div className="flex gap-2">
                    <Link
                      to={`/organizer/${org._id}`}
                      className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors text-center font-medium text-sm"
                    >
                      View Details
                    </Link>
                    <button
                      onClick={() => handleFollow(org._id)}
                      className={`flex-1 px-4 py-2 rounded-lg transition-colors flex items-center justify-center font-medium text-sm ${
                        isFollowing
                          ? 'bg-red-50 text-red-700 hover:bg-red-100'
                          : 'bg-primary-50 text-primary-700 hover:bg-primary-100'
                      }`}
                    >
                      <FiHeart
                        className="mr-2"
                        size={16}
                        fill={isFollowing ? 'currentColor' : 'none'}
                      />
                      {isFollowing ? 'Unfollow' : 'Follow'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        
        {followedIds.length > 0 && filterCategory === 'all' && (
          <div className="mt-12">
            <div className="card bg-gradient-to-br from-primary-50 to-purple-50 border-2 border-primary-200">
              <div className="flex items-center mb-4">
                <FiHeart className="text-primary-600 mr-2" size={24} fill="currentColor" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Followed Clubs ({followedIds.length})
                </h2>
              </div>
              <p className="text-gray-700 mb-4">
                You're following {followedIds.length} club{followedIds.length !== 1 ? 's' : ''}. 
                You'll receive updates about their events on your dashboard.
              </p>
              <Link
                to="/browse-events?followedOnly=true"
                className="btn-primary inline-block"
              >
                View Events from Followed Clubs
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsListing;