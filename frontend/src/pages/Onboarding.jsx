import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { userAPI, organizerAPI } from '../services/api';

const INTEREST_OPTIONS = [
  'Technical',
  'Cultural',
  'Sports',
  'Literary',
  'Arts',
  'Gaming',
  'Music',
  'Dance',
  'Drama',
  'Photography',
  'Other',
];

const Onboarding = () => {
  const [step, setStep] = useState(1);
  const [selectedInterests, setSelectedInterests] = useState([]);
  const [followedOrganizers, setFollowedOrganizers] = useState([]);
  const [availableOrganizers, setAvailableOrganizers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOrganizers, setLoadingOrganizers] = useState(true);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const response = await organizerAPI.getAll();
      setAvailableOrganizers(response.data.organizers || []);
    } catch (error) {
      console.error('Error fetching organizers:', error);
    } finally {
      setLoadingOrganizers(false);
    }
  };

  const toggleInterest = (interest) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleOrganizer = (organizerId) => {
    setFollowedOrganizers(prev => 
      prev.includes(organizerId)
        ? prev.filter(id => id !== organizerId)
        : [...prev, organizerId]
    );
  };

  const handleSkip = async () => {
    try {
      await userAPI.setPreferences({
        areasOfInterest: [],
        followedOrganizers: [],
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error skipping onboarding:', error);
      navigate('/dashboard'); 
    }
  };

  const handleNext = () => {
    if (step === 1) {
      setStep(2);
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      await userAPI.setPreferences({
        areasOfInterest: selectedInterests,
        followedOrganizers,
      });
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-600 to-purple-700 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome, {user?.firstName}! 
          </h1>
          <p className="text-gray-600 mt-2">
            Let's personalize your experience
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 1 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                1
              </div>
              <div className={`w-24 h-1 mx-2 ${step >= 2 ? 'bg-primary-600' : 'bg-gray-300'}`}></div>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= 2 ? 'bg-primary-600 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                2
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-2 px-20">
            <span className="text-sm text-gray-600">Interests</span>
            <span className="text-sm text-gray-600">Follow Clubs</span>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Select Your Areas of Interest
              </h2>
              <p className="text-gray-600 mb-6">
                Choose topics you're interested in to get personalized event recommendations
              </p>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {INTEREST_OPTIONS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() => toggleInterest(interest)}
                    className={`p-4 rounded-lg border-2 transition-all font-medium ${
                      selectedInterests.includes(interest)
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>

              {selectedInterests.length > 0 && (
                <p className="text-sm text-gray-600 mt-4">
                  {selectedInterests.length} interest{selectedInterests.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

            <div className="flex justify-between pt-6 border-t">
              <button
                onClick={handleSkip}
                className="btn-secondary"
              >
                Skip for Now
              </button>
              <button
                onClick={handleNext}
                className="btn-primary"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                Follow Clubs & Organizers
              </h2>
              <p className="text-gray-600 mb-6">
                Stay updated with events from your favorite clubs
              </p>

              {loadingOrganizers ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
                </div>
              ) : availableOrganizers.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  No clubs available at the moment
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableOrganizers.map((organizer) => (
                    <div
                      key={organizer._id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        followedOrganizers.includes(organizer._id)
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 bg-white hover:border-primary-300'
                      }`}
                      onClick={() => toggleOrganizer(organizer._id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">
                            {organizer.name}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            {organizer.category}
                          </p>
                          {organizer.description && (
                            <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                              {organizer.description}
                            </p>
                          )}
                        </div>
                        <div className="ml-4">
                          {followedOrganizers.includes(organizer._id) ? (
                            <div className="w-6 h-6 bg-primary-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {followedOrganizers.length > 0 && (
                <p className="text-sm text-gray-600 mt-4">
                  Following {followedOrganizers.length} club{followedOrganizers.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="flex justify-between pt-6 border-t">
              <button
                onClick={handleBack}
                className="btn-secondary"
              >
                Back
              </button>
              <div className="flex gap-3">
                <button
                  onClick={handleSkip}
                  className="btn-secondary"
                >
                  Skip
                </button>
                <button
                  onClick={handleComplete}
                  disabled={loading}
                  className="btn-primary disabled:opacity-50"
                >
                  {loading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    'Complete Setup'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-sm text-gray-500 hover:text-gray-700 underline"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;