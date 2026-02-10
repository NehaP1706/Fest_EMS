import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
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

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
  followOrganizer: (organizerId) => api.post(`/users/follow/${organizerId}`),
  changePassword: (data) => api.put('/users/change-password', data),
  requestPasswordResetOTP: () => api.post('/users/request-password-reset-otp'),
  resetPasswordWithOTP: (data) => api.post('/users/reset-password-otp', data),
};

// Event APIs
export const eventAPI = {
  getAll: (params) => api.get('/events', { params }),
  getTrending: () => api.get('/events/trending'),
  getById: (id) => api.get(`/events/${id}`),
  create: (data) => api.post('/events', data),
  update: (id, data) => api.put(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
  getMyEvents: () => api.get('/events/organizer/my-events'),
};

// Registration APIs
export const registrationAPI = {
  register: (eventId, data) => api.post(`/registrations/${eventId}`, data),
  getMyRegistrations: () => api.get('/registrations/my-registrations'),
  cancel: (registrationId) => api.delete(`/registrations/${registrationId}`),
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
  getAllOrganizers: (params) => api.get('/admin/organizers', { params }),
  enableOrganizer: (id) => api.patch(`/admin/organizers/${id}/enable`),
  disableOrganizer: (id) => api.patch(`/admin/organizers/${id}/disable`),
  archiveOrganizer: (id, data) => api.patch(`/admin/organizers/${id}/archive`, data),
  unarchiveOrganizer: (id) => api.patch(`/admin/organizers/${id}/unarchive`),
  deleteOrganizer: (id, data) => api.delete(`/admin/organizers/${id}`, { data }),
  getPasswordResets: () => api.get('/admin/password-resets'),
  approveReset: (id) => api.post(`/admin/password-resets/${id}/approve`),
  rejectReset: (id, data) => api.post(`/admin/password-resets/${id}/reject`, data),
};

// Merchandise APIs
export const merchandiseAPI = {
  purchase: (eventId, formData) => api.post(`/merchandise/${eventId}/purchase`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getMyPurchases: () => api.get('/merchandise/my-purchases'),
  getPendingApprovals: () => api.get('/merchandise/pending-approvals'),
  approve: (purchaseId) => api.post(`/merchandise/${purchaseId}/approve`),
  reject: (purchaseId, data) => api.post(`/merchandise/${purchaseId}/reject`, data),
};

// Discussion APIs
export const discussionAPI = {
  getMessages: (eventId) => api.get(`/discussions/${eventId}`),
  postMessage: (eventId, data) => api.post(`/discussions/${eventId}`, data),
  deleteMessage: (messageId) => api.delete(`/discussions/${messageId}`),
  pinMessage: (messageId) => api.post(`/discussions/${messageId}/pin`),
};

// Feedback APIs
export const feedbackAPI = {
  submit: (eventId, data) => api.post(`/feedback/${eventId}`, data),
  getEventFeedback: (eventId) => api.get(`/feedback/${eventId}`),
};

// Attendance APIs
export const attendanceAPI = {
  scanQR: (data) => api.post('/attendance/scan', data),
  getEventAttendance: (eventId) => api.get(`/attendance/${eventId}`),
  exportAttendance: (eventId) => api.get(`/attendance/${eventId}/export`),
};

export default api;