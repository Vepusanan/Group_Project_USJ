/**
 * API endpoints constants
 * 
 * 
 */
export const API_ENDPOINTS = {
  AUTH: {
    
    REGISTER: '/auth/register',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    LOGIN: '/auth/login',
    TOKEN: '/auth/token',
    PROTECTED_TEST: '/auth/protected-test',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    LOGOUT: '/auth/logout',
    LOGOUT_ALL: '/auth/logout-all',
    SESSIONS: '/auth/sessions',
  },
  
  // ❌ NOT Dev4 RESPONSIBILITY 
  STARTUPS: '/startups',
  INVESTORS: '/investors',
  CONNECTIONS: '/connections',
  PROFILE: '/profile',
};

/**
 * User types constants
 */
export const USER_TYPES = {
  STARTUP: 'startup',
  INVESTOR: 'investor',
};

/**
 * Regular expression patterns for validation
 */
export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
};

/**
 * Application constants
 */
export const APP_CONSTANTS = {
  APP_NAME: 'StartHub Capital',
  APP_VERSION: '1.0.0',
  TOKEN_KEY: 'accessToken',
  USER_KEY: 'user',
  DEBOUNCE_DELAY: 500,
  MIN_PASSWORD_LENGTH: 8,
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
};

/**
 * Status constants
 */
export const STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
};

/**
 * Connection status constants
 */
export const CONNECTION_STATUS = {
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  DECLINED: 'declined',
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  EMAIL_EXISTS: 'Email already exists. Please use a different email.',
  WEAK_PASSWORD: 'Password must be at least 8 characters long.',
  INVALID_EMAIL: 'Please enter a valid email address.',
  REQUIRED_FIELD: 'This field is required.',
  PASSWORD_MISMATCH: 'Passwords do not match.',
  TOKEN_EXPIRED: 'Session expired. Please log in again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
};