import { format, parseISO, isAfter, isBefore, differenceInDays } from 'date-fns';

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @param {string} formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns {string} Formatted date string
 */
export const formatDate = (date, formatStr = 'MMM dd, yyyy') => {
  if (!date) return '';
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
};

/**
 * Format date and time for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date and time string
 */
export const formatDateTime = (date) => {
  return formatDate(date, 'MMM dd, yyyy hh:mm a');
};

/**
 * Check if date is in the past
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the past
 */
export const isPastDate = (date) => {
  if (!date) return false;
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isBefore(dateObj, new Date());
  } catch (error) {
    return false;
  }
};

/**
 * Check if date is in the future
 * @param {string|Date} date - Date to check
 * @returns {boolean} True if date is in the future
 */
export const isFutureDate = (date) => {
  if (!date) return false;
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return isAfter(dateObj, new Date());
  } catch (error) {
    return false;
  }
};

/**
 * Get days until date
 * @param {string|Date} date - Target date
 * @returns {number} Days until date (negative if past)
 */
export const getDaysUntil = (date) => {
  if (!date) return 0;
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return differenceInDays(dateObj, new Date());
  } catch (error) {
    return 0;
  }
};

/**
 * Format currency (INR)
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (amount) => {
  if (amount === 0) return 'Free';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Truncate text with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from name
 * @param {string} firstName - First name
 * @param {string} lastName - Last name
 * @returns {string} Initials
 */
export const getInitials = (firstName, lastName) => {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
};

/**
 * Get status badge color classes
 * @param {string} status - Status value
 * @returns {string} Tailwind CSS classes
 */
export const getStatusColor = (status) => {
  const colors = {
    draft: 'bg-gray-100 text-gray-800',
    published: 'bg-green-100 text-green-800',
    ongoing: 'bg-blue-100 text-blue-800',
    completed: 'bg-purple-100 text-purple-800',
    closed: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    rejected: 'bg-red-100 text-red-800',
    approved: 'bg-green-100 text-green-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate IIIT email
 * @param {string} email - Email to validate
 * @returns {boolean} True if valid IIIT email
 */
export const isIIITEmail = (email) => {
  const iiitDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
  return iiitDomains.some(domain => email.toLowerCase().endsWith(domain));
};

/**
 * Download file from blob
 * @param {Blob} blob - Blob data
 * @param {string} filename - Filename for download
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Copy text to clipboard
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful
 */
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Failed to copy:', error);
    return false;
  }
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export const debounce = (func, delay = 300) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Handle API errors
 * @param {Error} error - Error object
 * @returns {string} Error message
 */
export const getErrorMessage = (error) => {
  if (error.response) {
    // Server responded with error
    return error.response.data.message || error.response.data.error || 'Something went wrong';
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.';
  } else {
    // Error in request setup
    return error.message || 'An unexpected error occurred';
  }
};

/**
 * Convert file to base64
 * @param {File} file - File to convert
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

/**
 * Format file size
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Generate random color
 * @returns {string} Random hex color
 */
export const getRandomColor = () => {
  const colors = [
    '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1',
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#84CC16',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

/**
 * Scroll to top of page
 */
export const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

/**
 * Check if registration is open
 * @param {string|Date} deadline - Registration deadline
 * @param {string} status - Event status
 * @returns {boolean} True if registration is open
 */
export const isRegistrationOpen = (deadline, status) => {
  return status === 'published' && isFutureDate(deadline);
};

/**
 * Get event type badge
 * @param {string} type - Event type
 * @returns {Object} Badge configuration
 */
export const getEventTypeBadge = (type) => {
  const badges = {
    normal: { label: 'Event', color: 'bg-blue-100 text-blue-800', icon: '🎯' },
    merchandise: { label: 'Merch', color: 'bg-purple-100 text-purple-800', icon: '🛍️' },
  };
  return badges[type] || badges.normal;
};

/**
 * Filter array by search query
 * @param {Array} array - Array to filter
 * @param {string} query - Search query
 * @param {Array} fields - Fields to search in
 * @returns {Array} Filtered array
 */
export const searchFilter = (array, query, fields) => {
  if (!query) return array;
  const lowerQuery = query.toLowerCase();
  return array.filter(item =>
    fields.some(field => {
      const value = field.split('.').reduce((obj, key) => obj?.[key], item);
      return value?.toString().toLowerCase().includes(lowerQuery);
    })
  );
};

/**
 * Group array by key
 * @param {Array} array - Array to group
 * @param {string} key - Key to group by
 * @returns {Object} Grouped object
 */
export const groupBy = (array, key) => {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) {
      result[groupKey] = [];
    }
    result[groupKey].push(item);
    return result;
  }, {});
};

export default {
  formatDate,
  formatDateTime,
  isPastDate,
  isFutureDate,
  getDaysUntil,
  formatCurrency,
  truncateText,
  getInitials,
  getStatusColor,
  isValidEmail,
  isIIITEmail,
  downloadFile,
  copyToClipboard,
  debounce,
  getErrorMessage,
  fileToBase64,
  formatFileSize,
  getRandomColor,
  scrollToTop,
  isRegistrationOpen,
  getEventTypeBadge,
  searchFilter,
  groupBy,
};