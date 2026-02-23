const isIIITEmail = (email) => {
  const iiitDomains = ['@iiit.ac.in', '@students.iiit.ac.in', '@research.iiit.ac.in'];
  return iiitDomains.some(domain => email.toLowerCase().endsWith(domain));
};

const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  if (!password || password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters long',
    };
  }
  return {
    isValid: true,
    message: 'Password is valid',
  };
};

const isValidPhone = (phone) => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};


const validateEventDates = (registrationDeadline, eventStartDate, eventEndDate) => {
  const now = new Date();
  const regDeadline = new Date(registrationDeadline);
  const startDate = new Date(eventStartDate);
  const endDate = new Date(eventEndDate);

  if (regDeadline <= now) {
    return {
      isValid: false,
      message: 'Registration deadline must be in the future',
    };
  }

  if (startDate <= regDeadline) {
    return {
      isValid: false,
      message: 'Event start date must be after registration deadline',
    };
  }

  if (endDate < startDate) {
    return {
      isValid: false,
      message: 'Event end date must be after or equal to start date',
    };
  }

  return {
    isValid: true,
    message: 'Event dates are valid',
  };
};

const validateFormField = (field) => {
  const validFieldTypes = ['text', 'email', 'number', 'textarea', 'dropdown', 'checkbox', 'radio', 'file', 'date'];
  
  if (!field.fieldId || !field.fieldType || !field.label) {
    return {
      isValid: false,
      message: 'Field must have fieldId, fieldType, and label',
    };
  }

  if (!validFieldTypes.includes(field.fieldType)) {
    return {
      isValid: false,
      message: `Invalid field type. Must be one of: ${validFieldTypes.join(', ')}`,
    };
  }

  if (['dropdown', 'checkbox', 'radio'].includes(field.fieldType) && (!field.options || field.options.length === 0)) {
    return {
      isValid: false,
      message: `Field type ${field.fieldType} must have options`,
    };
  }

  return {
    isValid: true,
    message: 'Field is valid',
  };
};

const validateFormResponses = (formResponses, formFields) => {
  const errors = [];

  for (const field of formFields) {
    const response = formResponses[field.fieldId];

    if (field.required && (!response || response === '')) {
      errors.push(`${field.label} is required`);
      continue;
    }

    if (!response) continue;

    switch (field.fieldType) {
      case 'email':
        if (!isValidEmail(response)) {
          errors.push(`${field.label} must be a valid email`);
        }
        break;

      case 'number':
        if (isNaN(response)) {
          errors.push(`${field.label} must be a number`);
        }
        break;

      case 'dropdown':
      case 'radio':
        if (!field.options.includes(response)) {
          errors.push(`${field.label} has an invalid option`);
        }
        break;

      case 'checkbox':
        if (!Array.isArray(response)) {
          errors.push(`${field.label} must be an array`);
        } else {
          const invalidOptions = response.filter(r => !field.options.includes(r));
          if (invalidOptions.length > 0) {
            errors.push(`${field.label} has invalid options`);
          }
        }
        break;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    message: errors.length > 0 ? errors.join(', ') : 'Form responses are valid',
  };
};

const validateFileUpload = (file, allowedTypes = [], maxSize = 5 * 1024 * 1024) => {
  if (!file) {
    return {
      isValid: false,
      message: 'No file provided',
    };
  }

  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      message: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }

  if (file.size > maxSize) {
    return {
      isValid: false,
      message: `File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`,
    };
  }

  return {
    isValid: true,
    message: 'File is valid',
  };
};

const checkEligibility = (eventEligibility, participantType) => {
  if (eventEligibility === 'all') return true;
  if (eventEligibility === 'iiit-only') return participantType === 'iiit';
  if (eventEligibility === 'non-iiit-only') return participantType === 'non-iiit';
  return false;
};

const sanitizeString = (str) => {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
};

const isValidObjectId = (id) => {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
};

const validateMerchandiseVariant = (variant, availableVariants) => {
  if (!variant || !variant.variantId) {
    return {
      isValid: false,
      message: 'Variant selection is required',
    };
  }

  const selectedVariant = availableVariants.find(v => v._id.toString() === variant.variantId);

  if (!selectedVariant) {
    return {
      isValid: false,
      message: 'Invalid variant selected',
    };
  }

  if (selectedVariant.stock <= 0) {
    return {
      isValid: false,
      message: 'Selected variant is out of stock',
    };
  }

  if (variant.quantity > selectedVariant.stock) {
    return {
      isValid: false,
      message: `Only ${selectedVariant.stock} items available in stock`,
    };
  }

  return {
    isValid: true,
    variant: selectedVariant,
    message: 'Variant is valid',
  };
};

const validateSearchQuery = (query) => {
  if (!query || query.trim().length === 0) {
    return {
      isValid: false,
      message: 'Search query cannot be empty',
    };
  }

  if (query.length > 100) {
    return {
      isValid: false,
      message: 'Search query is too long',
    };
  }

  return {
    isValid: true,
    sanitized: sanitizeString(query),
    message: 'Search query is valid',
  };
};

module.exports = {
  isIIITEmail,
  isValidEmail,
  validatePassword,
  isValidPhone,
  validateEventDates,
  validateFormField,
  validateFormResponses,
  validateFileUpload,
  checkEligibility,
  sanitizeString,
  isValidObjectId,
  validateMerchandiseVariant,
  validateSearchQuery,
};