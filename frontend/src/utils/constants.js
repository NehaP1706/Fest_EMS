// Event Types
export const EVENT_TYPES = {
  NORMAL: 'normal',
  MERCHANDISE: 'merchandise',
};

// Event Status
export const EVENT_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CLOSED: 'closed',
};

// Eligibility Options
export const ELIGIBILITY_OPTIONS = [
  { value: 'all', label: 'All Participants' },
  { value: 'iiit-only', label: 'IIIT Students Only' },
  { value: 'non-iiit-only', label: 'Non-IIIT Only' },
];

// Areas of Interest
export const AREAS_OF_INTEREST = [
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

// Organizer Categories
export const ORGANIZER_CATEGORIES = [
  'Technical Club',
  'Cultural Club',
  'Sports Club',
  'Literary Club',
  'Arts Club',
  'Council',
  'Fest Team',
  'Other',
];

// Form Field Types
export const FORM_FIELD_TYPES = [
  { value: 'text', label: 'Text Input' },
  { value: 'email', label: 'Email' },
  { value: 'number', label: 'Number' },
  { value: 'textarea', label: 'Text Area' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'checkbox', label: 'Checkbox' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'file', label: 'File Upload' },
  { value: 'date', label: 'Date' },
];

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

// Registration Status
export const REGISTRATION_STATUS = {
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

// Participant Types
export const PARTICIPANT_TYPES = {
  IIIT: 'iiit',
  NON_IIIT: 'non-iiit',
};

// Date Format
export const DATE_FORMAT = {
  DISPLAY: 'MMMM DD, YYYY',
  DISPLAY_WITH_TIME: 'MMMM DD, YYYY hh:mm A',
  INPUT: 'YYYY-MM-DD',
  INPUT_WITH_TIME: 'YYYY-MM-DDTHH:mm',
};

// API Response Messages
export const MESSAGES = {
  SUCCESS: {
    REGISTRATION: 'Successfully registered for the event!',
    PROFILE_UPDATE: 'Profile updated successfully!',
    EVENT_CREATED: 'Event created successfully!',
    EVENT_UPDATED: 'Event updated successfully!',
    ORGANIZER_CREATED: 'Organizer created successfully!',
    PASSWORD_CHANGED: 'Password changed successfully!',
  },
  ERROR: {
    GENERIC: 'Something went wrong. Please try again.',
    NETWORK: 'Network error. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    NOT_FOUND: 'Resource not found.',
    VALIDATION: 'Please check your input and try again.',
  },
};

// File Upload Limits
export const FILE_UPLOAD = {
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.pdf'],
};

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  ITEMS_PER_PAGE: [10, 25, 50, 100],
};

// Colors for Status
export const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  ongoing: 'bg-blue-100 text-blue-800',
  completed: 'bg-purple-100 text-purple-800',
  closed: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  rejected: 'bg-red-100 text-red-800',
};

export default {
  EVENT_TYPES,
  EVENT_STATUS,
  ELIGIBILITY_OPTIONS,
  AREAS_OF_INTEREST,
  ORGANIZER_CATEGORIES,
  FORM_FIELD_TYPES,
  PAYMENT_STATUS,
  REGISTRATION_STATUS,
  PARTICIPANT_TYPES,
  DATE_FORMAT,
  MESSAGES,
  FILE_UPLOAD,
  PAGINATION,
  STATUS_COLORS,
};