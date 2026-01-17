import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import authService from '../services/authService';
import { apiService } from '../services/apiService';

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
  accessToken: null,
  refreshToken: null,
};

const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  REGISTER_START: 'REGISTER_START',
  REGISTER_SUCCESS: 'REGISTER_SUCCESS',
  REGISTER_FAILURE: 'REGISTER_FAILURE',
  FORGOT_PASSWORD_START: 'FORGOT_PASSWORD_START',
  FORGOT_PASSWORD_SUCCESS: 'FORGOT_PASSWORD_SUCCESS',
  FORGOT_PASSWORD_FAILURE: 'FORGOT_PASSWORD_FAILURE',
  RESET_PASSWORD_START: 'RESET_PASSWORD_START',
  RESET_PASSWORD_SUCCESS: 'RESET_PASSWORD_SUCCESS',
  RESET_PASSWORD_FAILURE: 'RESET_PASSWORD_FAILURE',
  VERIFY_EMAIL_START: 'VERIFY_EMAIL_START',
  VERIFY_EMAIL_SUCCESS: 'VERIFY_EMAIL_SUCCESS',
  VERIFY_EMAIL_FAILURE: 'VERIFY_EMAIL_FAILURE',
  CLEAR_ERROR: 'CLEAR_ERROR',
  SET_LOADING: 'SET_LOADING',
  SET_USER: 'SET_USER',
  REFRESH_TOKEN_SUCCESS: 'REFRESH_TOKEN_SUCCESS',
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
    case AUTH_ACTIONS.FORGOT_PASSWORD_START:
    case AUTH_ACTIONS.RESET_PASSWORD_START:
    case AUTH_ACTIONS.VERIFY_EMAIL_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return {
        ...state,
        user: action.payload?.user || null,
        accessToken: action.payload?.accessToken || null,
        refreshToken: action.payload?.refreshToken || null,
        isAuthenticated: !!action.payload?.accessToken && !!action.payload?.user,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.FORGOT_PASSWORD_FAILURE:
    case AUTH_ACTIONS.RESET_PASSWORD_FAILURE:
    case AUTH_ACTIONS.VERIFY_EMAIL_FAILURE:
      return {
        ...state,
        isLoading: false,
        error: action.payload || 'An error occurred',
      };
    
    case AUTH_ACTIONS.FORGOT_PASSWORD_SUCCESS:
    case AUTH_ACTIONS.RESET_PASSWORD_SUCCESS:
    case AUTH_ACTIONS.VERIFY_EMAIL_SUCCESS:
      return {
        ...state,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };
    
    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null,
      };
    
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload ?? true,
      };
    
    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
      };
    
    case AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS:
      return {
        ...state,
        accessToken: action.payload?.accessToken || null,
      };
    
    default:
      return state;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');
        const userDataStr = localStorage.getItem('userData');
        
        if (accessToken && refreshToken && userDataStr) {
          try {
            // Parse stored user data
            const userData = JSON.parse(userDataStr);
            dispatch({ 
              type: AUTH_ACTIONS.SET_USER, 
              payload: userData 
            });
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          } catch (error) {
            console.error('Failed to parse user data:', error);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('userData');
            dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          }
        } else {
          // Clear all auth data if any piece is missing
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        }
      } catch (error) {
        console.error('Auth status check failed:', error);
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userData');
      }
    };

    checkAuthStatus();
  }, []);

  const login = useCallback(async (email, password, rememberMe = false) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });
    try {
      const response = await authService.login(email, password, rememberMe);
      
      if (response.success === false) {
        dispatch({
          type: AUTH_ACTIONS.LOGIN_FAILURE,
          payload: response.error || 'Login failed',
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });
      return { success: true, user: response.user };
    } catch (error) {
      const errorMsg = error?.message || 'Login failed';
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  const register = useCallback(async (userData) => {
    dispatch({ type: AUTH_ACTIONS.REGISTER_START });
    try {
      const response = await authService.register(userData);
      
      if (response.success === false) {
        dispatch({
          type: AUTH_ACTIONS.REGISTER_FAILURE,
          payload: response.error || 'Registration failed',
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: {
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
        },
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || 'Registration failed';
      dispatch({
        type: AUTH_ACTIONS.REGISTER_FAILURE,
        payload: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    dispatch({ type: AUTH_ACTIONS.FORGOT_PASSWORD_START });
    try {
      const response = await authService.forgotPassword(email);
      
      if (response.success === false) {
        dispatch({
          type: AUTH_ACTIONS.FORGOT_PASSWORD_FAILURE,
          payload: response.error || 'Failed to send reset link',
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.FORGOT_PASSWORD_SUCCESS,
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || 'Failed to send reset link';
      dispatch({
        type: AUTH_ACTIONS.FORGOT_PASSWORD_FAILURE,
        payload: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  const resetPassword = useCallback(async (token, password) => {
    dispatch({ type: AUTH_ACTIONS.RESET_PASSWORD_START });
    try {
      const response = await authService.resetPassword(token, password);
      
      if (response.success === false) {
        dispatch({
          type: AUTH_ACTIONS.RESET_PASSWORD_FAILURE,
          payload: response.error || 'Failed to reset password',
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.RESET_PASSWORD_SUCCESS,
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || 'Failed to reset password';
      dispatch({
        type: AUTH_ACTIONS.RESET_PASSWORD_FAILURE,
        payload: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  const verifyEmail = useCallback(async (token) => {
    dispatch({ type: AUTH_ACTIONS.VERIFY_EMAIL_START });
    try {
      const response = await authService.verifyEmail(token);
      
      if (response.success === false) {
        dispatch({
          type: AUTH_ACTIONS.VERIFY_EMAIL_FAILURE,
          payload: response.error || 'Failed to verify email',
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.VERIFY_EMAIL_SUCCESS,
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || 'Failed to verify email';
      dispatch({
        type: AUTH_ACTIONS.VERIFY_EMAIL_FAILURE,
        payload: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  const resendVerification = useCallback(async (email) => {
    dispatch({ type: AUTH_ACTIONS.VERIFY_EMAIL_START });
    try {
      const response = await authService.resendVerification(email);
      
      if (response.success === false) {
        dispatch({
          type: AUTH_ACTIONS.VERIFY_EMAIL_FAILURE,
          payload: response.error || 'Failed to resend verification',
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.VERIFY_EMAIL_SUCCESS,
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || 'Failed to resend verification';
      dispatch({
        type: AUTH_ACTIONS.VERIFY_EMAIL_FAILURE,
        payload: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return { success: false };

    try {
      const response = await authService.refreshAccessToken(refreshToken);
      if (response.success) {
        dispatch({
          type: AUTH_ACTIONS.REFRESH_TOKEN_SUCCESS,
          payload: { accessToken: response.accessToken }
        });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: false };
    }
  }, []);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const value = {
    ...state,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    refreshAccessToken,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export { AuthContext, AUTH_ACTIONS };