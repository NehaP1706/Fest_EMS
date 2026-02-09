import { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import Navbar from '../common/Navbar';
import Loader from '../common/Loader';
import { FiUsers, FiCalendar, FiAlertCircle } from 'react-icons/fi';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalOrganizers: 0,
    activeOrganizers: 0,
    pendingResets: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [organizersRes, resetsRes] = await Promise.all([
        adminAPI.getAllOrganizers(),
        adminAPI.getPasswordResets(),
      ]);

      const organizers = organizersRes.data.organizers || [];
      const resets = resetsRes.data.requests || [];

      setStats({
        totalOrganizers: organizers.length,
        activeOrganizers: organizers.filter((o) => o.isActive).length,
        pendingResets: resets.filter((r) => r.status === 'pending').length,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

        {loading ? (
          <Loader />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Organizers</p>
                  <p className="text-4xl font-bold mt-2">{stats.totalOrganizers}</p>
                </div>
                <FiUsers className="text-5xl text-blue-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Organizers</p>
                  <p className="text-4xl font-bold mt-2">{stats.activeOrganizers}</p>
                </div>
                <FiCalendar className="text-5xl text-green-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-orange-500 to-orange-700 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">Pending Password Resets</p>
                  <p className="text-4xl font-bold mt-2">{stats.pendingResets}</p>
                </div>
                <FiAlertCircle className="text-5xl text-orange-200" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <a href="/admin/clubs" className="block p-4 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors">
                <h3 className="font-medium text-primary-900">Manage Clubs</h3>
                <p className="text-sm text-primary-700">Add, edit, or remove club accounts</p>
              </a>
              <a href="/admin/password-resets" className="block p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
                <h3 className="font-medium text-purple-900">Password Resets</h3>
                <p className="text-sm text-purple-700">Review and approve password reset requests</p>
              </a>
            </div>
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Info</h2>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>System Status:</span>
                <span className="text-green-600 font-medium">● Online</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span className="font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;