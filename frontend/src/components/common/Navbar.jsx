import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { FiLogOut, FiUser, FiMenu, FiX } from 'react-icons/fi';
import { useState } from 'react';

const Navbar = () => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Navigation items based on role
  const getNavItems = () => {
    switch (role) {
      case 'participant':
        return [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Browse Events', path: '/browse-events' },
          { label: 'Clubs', path: '/clubs' },
          { label: 'Profile', path: '/profile' },
        ];
      case 'organizer':
        return [
          { label: 'Dashboard', path: '/organizer/dashboard' },
          { label: 'Create Event', path: '/organizer/create-event' },
          { label: 'QR Scanner', path: '/organizer/scanner' },
          { label: 'Merchandise Approvals', path: '/organizer/merchandise-approval' },
          { label: 'Profile', path: '/organizer/profile' },
        ];
      case 'admin':
        return [
          { label: 'Dashboard', path: '/admin/dashboard' },
          { label: 'Manage Clubs', path: '/admin/clubs' },
          { label: 'Password Resets', path: '/admin/password-resets' },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to={role === 'organizer' ? '/organizer/dashboard' : role === 'admin' ? '/admin/dashboard' : '/dashboard'} className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">F</span>
              </div>
              <span className="ml-3 text-xl font-bold text-gray-800">
                Felicity EMS
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="px-4 py-2 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}

            {/* User Menu */}
            <div className="ml-4 flex items-center space-x-4 border-l pl-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-primary-700" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName || user?.name || 'User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <FiLogOut />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-700 hover:bg-gray-100"
            >
              {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors font-medium"
              >
                {item.label}
              </Link>
            ))}
            <div className="border-t pt-2 mt-2">
              <div className="px-3 py-2 flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <FiUser className="text-primary-700" />
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {user?.firstName || user?.name || 'User'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="w-full mt-2 flex items-center justify-center space-x-2 px-3 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
              >
                <FiLogOut />
                <span className="font-medium">Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;