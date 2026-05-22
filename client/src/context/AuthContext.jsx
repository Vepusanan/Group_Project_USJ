import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
} from "react";
import authService from "../services/authService";
import { apiService } from "../services/apiService";
import { clearProfileCaches } from "../hooks/useProfileCache";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

const AUTH_ACTIONS = {
  LOGIN_START: "LOGIN_START",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILURE: "LOGIN_FAILURE",
  LOGOUT: "LOGOUT",
  REGISTER_START: "REGISTER_START",
  REGISTER_SUCCESS: "REGISTER_SUCCESS",
  REGISTER_FAILURE: "REGISTER_FAILURE",
  FORGOT_PASSWORD_START: "FORGOT_PASSWORD_START",
  FORGOT_PASSWORD_SUCCESS: "FORGOT_PASSWORD_SUCCESS",
  FORGOT_PASSWORD_FAILURE: "FORGOT_PASSWORD_FAILURE",
  RESET_PASSWORD_START: "RESET_PASSWORD_START",
  RESET_PASSWORD_SUCCESS: "RESET_PASSWORD_SUCCESS",
  RESET_PASSWORD_FAILURE: "RESET_PASSWORD_FAILURE",
  VERIFY_EMAIL_START: "VERIFY_EMAIL_START",
  VERIFY_EMAIL_SUCCESS: "VERIFY_EMAIL_SUCCESS",
  VERIFY_EMAIL_FAILURE: "VERIFY_EMAIL_FAILURE",
  CLEAR_ERROR: "CLEAR_ERROR",
  SET_LOADING: "SET_LOADING",
  SET_USER: "SET_USER",
};

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case AUTH_ACTIONS.FORGOT_PASSWORD_START:
    case AUTH_ACTIONS.RESET_PASSWORD_START:
    case AUTH_ACTIONS.VERIFY_EMAIL_START:
      return {
        ...state,
        error: null,
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
    case AUTH_ACTIONS.REGISTER_SUCCESS:
      // Tokens are in HttpOnly cookies, not state. Auth status is derived
      // from whether we successfully got a user back.
      return {
        ...state,
        user: action.payload?.user || null,
        isAuthenticated: !!action.payload?.user,
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
        error: action.payload || "An error occurred",
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

    default:
      return state;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  useEffect(() => {
    const onForceLogout = () => {
      clearProfileCaches();
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };
    window.addEventListener("auth:force-logout", onForceLogout);
    return () => window.removeEventListener("auth:force-logout", onForceLogout);
  }, []);

  useEffect(() => {
    // Cookie-based auth: we can't read the access_token from JS, so the
    // only signal that the user is logged in is whether `/auth/me`
    // succeeds. userData is cached so the UI can render an optimistic
    // logged-in skeleton while the network call resolves; on 401 we
    // clear it and stay logged out.
    const checkAuthStatus = async () => {
      const userDataStr = localStorage.getItem("userData");
      let optimisticallyHydrated = false;

      if (userDataStr) {
        try {
          const cachedUser = JSON.parse(userDataStr);
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: cachedUser });
          optimisticallyHydrated = true;
        } catch (parseError) {
          console.error("Failed to parse user data:", parseError);
          localStorage.removeItem("userData");
        }
      }

      // Only call /auth/me when we have a cached user to confirm. Anonymous
      // visitors should not trigger a 401 cascade (the apiClient interceptor
      // would otherwise treat the bootstrap 401 as a session expiry and
      // redirect them away from public pages like the home screen).
      if (!optimisticallyHydrated) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
        return;
      }

      try {
        const userData = await apiService.getCurrentUser();
        if (userData.success && userData.data) {
          localStorage.setItem("userData", JSON.stringify(userData.data));
          dispatch({ type: AUTH_ACTIONS.SET_USER, payload: userData.data });
        } else {
          // /auth/me failed but we'd already rendered the user — roll back.
          localStorage.removeItem("userData");
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
      } catch (error) {
        // Either the network call failed or the cookie has expired and
        // even the refresh-retry could not save it. Treat as logged out.
        console.error("Failed to fetch user data:", error);
        localStorage.removeItem("userData");
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      } finally {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
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
          payload: response.error || "Login failed",
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user: response.user },
      });
      return { success: true, user: response.user };
    } catch (error) {
      const errorMsg = error?.message || "Login failed";
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
          payload: response.error || "Registration failed",
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.REGISTER_SUCCESS,
        payload: { user: response.user },
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || "Registration failed";
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
      console.error("Logout error:", error);
    }

    clearProfileCaches();
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
  }, []);

  const forgotPassword = useCallback(async (email) => {
    dispatch({ type: AUTH_ACTIONS.FORGOT_PASSWORD_START });
    try {
      const response = await authService.forgotPassword(email);

      if (response.success === false) {
        dispatch({
          type: AUTH_ACTIONS.FORGOT_PASSWORD_FAILURE,
          payload: response.error || "Failed to send reset link",
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.FORGOT_PASSWORD_SUCCESS,
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || "Failed to send reset link";
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
          payload: response.error || "Failed to reset password",
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.RESET_PASSWORD_SUCCESS,
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || "Failed to reset password";
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
          payload: response.error || "Failed to verify email",
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.VERIFY_EMAIL_SUCCESS,
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || "Failed to verify email";
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
          payload: response.error || "Failed to resend verification",
        });
        return { success: false, error: response.error };
      }

      dispatch({
        type: AUTH_ACTIONS.VERIFY_EMAIL_SUCCESS,
      });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || "Failed to resend verification";
      dispatch({
        type: AUTH_ACTIONS.VERIFY_EMAIL_FAILURE,
        payload: errorMsg,
      });
      return { success: false, error: errorMsg };
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    // Refresh cookie is sent automatically; nothing to read from JS.
    try {
      const response = await authService.refreshAccessToken();
      if (response.success) return { success: true };
      return { success: false };
    } catch (error) {
      localStorage.removeItem("userData");
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

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
