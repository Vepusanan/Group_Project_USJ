import { REGEX_PATTERNS, APP_CONSTANTS } from './constants';

/**
 * Validation utilities
 */
export const validation = {
  /**
   * Validate email
   * @param {string} email - Email to validate
   * @returns {Object} Validation result
   */
  email: (email) => {
    if (!email) {
      return { isValid: false, error: 'Email is required' };
    }
    if (!REGEX_PATTERNS.EMAIL.test(email)) {
      return { isValid: false, error: 'Please enter a valid email address' };
    }
    return { isValid: true };
  },

  /**
   * Validate password
   * @param {string} password - Password to validate
   * @returns {Object} Validation result
   */
  password: (password) => {
    if (!password) {
      return { isValid: false, error: 'Password is required' };
    }
    if (password.length < APP_CONSTANTS.MIN_PASSWORD_LENGTH) {
      return { 
        isValid: false, 
        error: `Password must be at least ${APP_CONSTANTS.MIN_PASSWORD_LENGTH} characters long` 
      };
    }
    if (!REGEX_PATTERNS.PASSWORD.test(password)) {
      return { 
        isValid: false, 
        error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' 
      };
    }
    return { isValid: true };
  },

  /**
   * Validate required field
   * @param {any} value - Value to validate
   * @param {string} fieldName - Field name for error message
   * @returns {Object} Validation result
   */
  required: (value, fieldName = 'This field') => {
    if (!value || value.toString().trim() === '') {
      return { isValid: false, error: `${fieldName} is required` };
    }
    return { isValid: true };
  },

  /**
   * Validate phone number
   * @param {string} phone - Phone number to validate
   * @returns {Object} Validation result
   */
  phone: (phone) => {
    if (!phone) {
      return { isValid: false, error: 'Phone number is required' };
    }
    if (!REGEX_PATTERNS.PHONE.test(phone)) {
      return { isValid: false, error: 'Please enter a valid phone number' };
    }
    return { isValid: true };
  },

  /**
   * Validate name
   * @param {string} name - Name to validate
   * @returns {Object} Validation result
   */
  name: (name) => {
    if (!name) {
      return { isValid: false, error: 'Name is required' };
    }
    if (name.length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters long' };
    }
    if (name.length > 50) {
      return { isValid: false, error: 'Name must be less than 50 characters' };
    }
    return { isValid: true };
  },

  /**
   * Validate file
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  file: (file) => {
    if (!file) {
      return { isValid: false, error: 'File is required' };
    }
    if (file.size > APP_CONSTANTS.MAX_FILE_SIZE) {
      return { 
        isValid: false, 
        error: `File size must be less than ${formatFileSize(APP_CONSTANTS.MAX_FILE_SIZE)}` 
      };
    }
    if (!APP_CONSTANTS.SUPPORTED_FILE_TYPES.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'File type not supported' 
      };
    }
    return { isValid: true };
  },
};