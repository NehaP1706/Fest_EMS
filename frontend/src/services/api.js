import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Request interceptor - Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors and token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized (token expired or invalid)
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      
      // Only redirect to login if not already there
      if (!currentPath.includes('/login') && !currentPath.includes('/register')) {
        console.log('Token expired or invalid, redirecting to login...');
        
        // Clear auth data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        localStorage.removeItem('loginTime');
        
        // Show session expired message
        const sessionExpired = error.response?.data?.code === 'TOKEN_EXPIRED';
        if (sessionExpired) {
          // Store a flag to show session expired message
          sessionStorage.setItem('sessionExpired', 'true');
        }
        
        // Redirect to login
        window.location.href = '/login';
      }
    }
    
    // Handle 403 Forbidden (account disabled)
    if (error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('loginTime');
      
      // Store reason for logout
      sessionStorage.setItem('logoutReason', error.response?.data?.message || 'Access forbidden');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// User APIs
export const userAPI = {
  setPreferences: (data) => api.put('/users/preferences', data),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  requestPasswordResetOTP: () => api.post('/users/request-password-reset-otp'),
  resetPasswordWithOTP: (data) => api.post('/users/reset-password-otp', data),
  followOrganizer: (organizerId) => api.post(`/users/follow/${organizerId}`),
};

// Event APIs
export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getTrending: () => api.get('/events/trending'),
  getRecommended: () => api.get('/events/recommended'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getMyEvents: () => api.get('/events/organizer/my-events'),
  toggleRegistrations: (eventId) => api.patch(`/events/${eventId}/toggle-registrations`),
};

// Registration APIs
export const registrationAPI = {
  register: (eventId, data) => api.post(`/registrations/${eventId}`, data),
  getMyRegistrations: () => api.get('/registrations/my-registrations'),
  cancel: (registrationId) => api.delete(`/registrations/${registrationId}`),
  getEventRegistrations: (eventId) => api.get(`/registrations/event/${eventId}`),
};

// Organizer APIs
export const organizerAPI = {
  getAll: () => api.get('/organizers'),
  getById: (id) => api.get(`/organizers/${id}`),
  updateProfile: (data) => api.put('/organizers/profile', data),
  changePassword: (data) => api.put('/organizers/change-password', data),
  requestPasswordReset: (data) => api.post('/organizers/request-password-reset', data),
  getMyResetRequests: () => api.get('/organizers/my-reset-requests'),
};

// Admin APIs
export const adminAPI = {
  createOrganizer: (data) => api.post('/admin/organizers', data),
  getAllOrganizers: () => api.get('/admin/organizers'),
  deleteOrganizer: (id, body) => api.delete(`/admin/organizers/${id}`, { data: body }),
  getPasswordResets: () => api.get('/admin/password-resets'),
  approveReset: (id) => api.post(`/admin/password-resets/${id}/approve`),
  rejectReset: (id, data) => api.post(`/admin/password-resets/${id}/reject`, data),
};

export const merchandiseAPI = {
  purchase: (eventId, formData) =>
    api.post(`/merchandise/${eventId}/purchase`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  getMyPurchases: () => api.get('/merchandise/my-purchases'),
  getPendingApprovals: () => api.get('/merchandise/pending-approvals'),
  approve: (purchaseId) => api.post(`/merchandise/${purchaseId}/approve`),
  reject: (purchaseId, data) => api.post(`/merchandise/${purchaseId}/reject`, data),
  getEventPurchases: (eventId) => api.get(`/merchandise/event/${eventId}`),
  claimMerchandise: (registrationId, data) => api.post(`/merchandise/claim/${registrationId}`, data),
};

// Discussion APIs
export const discussionAPI = {
  getMessages: (eventId) => api.get(`/discussions/${eventId}`),
  postMessage: (eventId, data) => api.post(`/discussions/${eventId}`, data),
  postReply: (messageId, data) => api.post(`/discussions/${messageId}/reply`, data),
  deleteMessage: (messageId) => api.delete(`/discussions/${messageId}`),
  pinMessage: (messageId) => api.post(`/discussions/${messageId}/pin`),
  reactToMessage: (messageId, data) => api.post(`/discussions/${messageId}/react`, data),
  markRead: (eventId) => api.post(`/discussions/${eventId}/mark-read`),
  getUnreadCount: (eventId) => api.get(`/discussions/${eventId}/unread-count`),
};

export const feedbackAPI = {
  submit: (eventId, data) => api.post(`/feedback/${eventId}`, data),
  getEventFeedback: (eventId) => api.get(`/feedback/${eventId}`),
  getMyFeedback: (eventId) => api.get(`/feedback/${eventId}/my-feedback`), 
};

// Attendance APIs
export const attendanceAPI = {
  scanQR: (data) => api.post('/attendance/scan', data),
  getEventAttendance: (eventId) => api.get(`/attendance/${eventId}`),
  exportAttendance: (eventId) => api.get(`/attendance/${eventId}/export`),
  manualAttendance: (data) => api.post('/attendance/manual', data),
  removeAttendance: (eventId, participantId) => api.delete(`/attendance/${eventId}/participant/${participantId}`),
};

export default api;