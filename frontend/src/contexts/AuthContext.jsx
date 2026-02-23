import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);
  
  const isRefreshing = useRef(false);

  useEffect(() => {
    checkAuth();
    
    const interval = setInterval(() => {
      validateSession();
    }, 5 * 60 * 1000); 

    const handleFocus = () => {
      validateSession();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const validateSession = async () => {
    const token = localStorage.getItem('token');
    if (!token || isRefreshing.current) return;

    try {
      await authAPI.getMe();
      setSessionExpired(false);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('Session expired, logging out...');
        setSessionExpired(true);
        logout();
      }
    }
  };

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedRole = localStorage.getItem('role');

    if (token) {
      try {
        isRefreshing.current = true;
        
        if (storedUser && storedRole) {
          try {
            const parsedUser = JSON.parse(storedUser);
            setUser(parsedUser);
            setRole(storedRole);
          } catch (e) {
            console.error('Error parsing stored user:', e);
          }
        }

        const response = await authAPI.getMe();
        const userData = response.data.user || response.data.organizer;
        const userRole = response.data.role;
        
        setUser(userData);
        setRole(userRole);
        
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('role', userRole);
        
        setSessionExpired(false);
      } catch (error) {
        console.error('Auth check failed:', error);
        
        if (error.response?.status === 401) {
          logout();
        }
      } finally {
        isRefreshing.current = false;
      }
    } else {
      logout();
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials);
      const { token, user: userData, role: userRole } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);
      localStorage.setItem('loginTime', Date.now().toString());
      
      setUser(userData);
      setRole(userRole);
      setSessionExpired(false);
      
      return userRole;
    } catch (error) {
      throw error;
    }
  };

  const register = async (data) => {
    try {
      const response = await authAPI.register(data);
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', 'participant');
      localStorage.setItem('loginTime', Date.now().toString());
      
      setUser(userData);
      setRole('participant');
      setSessionExpired(false);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    localStorage.removeItem('loginTime');
    
    setUser(null);
    setRole(null);
    setSessionExpired(false);
  };

  const value = {
    user,
    role,
    loading,
    sessionExpired,
    login,
    register,
    logout,
    checkAuth,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};