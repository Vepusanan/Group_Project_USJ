import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useLocation } from "react-router-dom";
import authService from "../services/authService";
import { apiService } from "../services/apiService";
import { clearProfileCaches } from "../hooks/useProfileCache";
import { clearListingCaches } from "../hooks/useListingCache";
import { notifyAuthChanged, subscribeAuthSync } from "../utils/authSync";
import { getAuthState, AUTH_STATUS } from "@shared/authStateMachine.mjs";

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  isRevalidating: false,
  authState: null,
  redirectPath: null,
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
  SET_REVALIDATING: "SET_REVALIDATING",
  SET_SESSION: "SET_SESSION",
};

const applySession = (session) => ({
  user: session?.user ?? null,
  isAuthenticated: Boolean(session?.user),
  authState: session?.authState ?? null,
  redirectPath: session?.redirectPath ?? null,
  isLoading: false,
  isRevalidating: false,
  error: null,
});

const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
    case AUTH_ACTIONS.REGISTER_START:
      return { ...state, isLoading: true, error: null };

    case AUTH_ACTIONS.FORGOT_PASSWORD_START:
    case AUTH_ACTIONS.RESET_PASSWORD_START:
    case AUTH_ACTIONS.VERIFY_EMAIL_START:
      return { ...state, error: null };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return { ...state, ...applySession(action.payload) };

    case AUTH_ACTIONS.LOGIN_FAILURE:
    case AUTH_ACTIONS.REGISTER_FAILURE:
    case AUTH_ACTIONS.FORGOT_PASSWORD_FAILURE:
    case AUTH_ACTIONS.RESET_PASSWORD_FAILURE:
    case AUTH_ACTIONS.VERIFY_EMAIL_FAILURE:
      return {
        ...state,
        isLoading: false,
        isRevalidating: false,
        error: action.payload || "An error occurred",
      };

    case AUTH_ACTIONS.FORGOT_PASSWORD_SUCCESS:
    case AUTH_ACTIONS.RESET_PASSWORD_SUCCESS:
    case AUTH_ACTIONS.VERIFY_EMAIL_SUCCESS:
      return { ...state, isLoading: false, isRevalidating: false, error: null };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...initialState,
        isLoading: false,
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };

    case AUTH_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload ?? true };

    case AUTH_ACTIONS.SET_REVALIDATING:
      return { ...state, isRevalidating: action.payload ?? true };

    case AUTH_ACTIONS.SET_SESSION:
      return { ...state, ...applySession(action.payload) };

    case AUTH_ACTIONS.REGISTER_SUCCESS:
      return { ...state, isLoading: false, error: null };

    default:
      return state;
  }
};

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const revalidateInFlight = useRef(null);

  const applyAuthSession = useCallback((session) => {
    if (session?.user) {
      localStorage.setItem("userData", JSON.stringify(session.user));
    } else {
      localStorage.removeItem("userData");
    }
    dispatch({ type: AUTH_ACTIONS.SET_SESSION, payload: session });
  }, []);

  const revalidateAuth = useCallback(
    async ({ silent = false } = {}) => {
      if (revalidateInFlight.current) return revalidateInFlight.current;

      if (!silent) {
        dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });
      } else {
        dispatch({ type: AUTH_ACTIONS.SET_REVALIDATING, payload: true });
      }

      const promise = (async () => {
        try {
          const result = await apiService.getAuthSession();
          if (result.success && result.data?.user) {
            applyAuthSession(result.data);
            return { success: true, ...result.data };
          }
          localStorage.removeItem("userData");
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          return { success: false };
        } catch (error) {
          console.error("Auth revalidation failed:", error);
          localStorage.removeItem("userData");
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          return { success: false };
        } finally {
          dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
          dispatch({ type: AUTH_ACTIONS.SET_REVALIDATING, payload: false });
          revalidateInFlight.current = null;
        }
      })();

      revalidateInFlight.current = promise;
      return promise;
    },
    [applyAuthSession],
  );

  useEffect(() => {
    const onForceLogout = () => {
      clearProfileCaches();
      clearListingCaches();
      localStorage.removeItem("userData");
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
    };
    window.addEventListener("auth:force-logout", onForceLogout);
    return () => window.removeEventListener("auth:force-logout", onForceLogout);
  }, []);

  useEffect(() => {
    revalidateAuth();
  }, [revalidateAuth]);

  useEffect(() => {
    return subscribeAuthSync(() => {
      revalidateAuth({ silent: true });
    });
  }, [revalidateAuth]);

  const login = useCallback(
    async (email, password, rememberMe = false) => {
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

        const session = {
          user: response.user,
          redirectPath: response.redirectPath,
          authState: response.authState,
        };
        applyAuthSession(session);
        notifyAuthChanged();
        return {
          success: true,
          user: response.user,
          redirectPath: response.redirectPath,
          authState: response.authState,
        };
      } catch (error) {
        const errorMsg = error?.message || "Login failed";
        dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: errorMsg });
        return { success: false, error: errorMsg };
      }
    },
    [applyAuthSession],
  );

  const register = useCallback(
    async (userData) => {
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

        if (response.user) {
          const session = {
            user: response.user,
            redirectPath: response.redirectPath,
            authState: response.authState,
          };
          applyAuthSession(session);
          notifyAuthChanged();
        } else {
          dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS });
        }

        return {
          success: true,
          redirectPath: response.redirectPath,
          authState: response.authState,
          user: response.user,
        };
      } catch (error) {
        const errorMsg = error?.message || "Registration failed";
        dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: errorMsg });
        return { success: false, error: errorMsg };
      }
    },
    [applyAuthSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    }

    clearProfileCaches();
    clearListingCaches();
    localStorage.removeItem("userData");
    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    notifyAuthChanged();
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
      dispatch({ type: AUTH_ACTIONS.FORGOT_PASSWORD_SUCCESS });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || "Failed to send reset link";
      dispatch({ type: AUTH_ACTIONS.FORGOT_PASSWORD_FAILURE, payload: errorMsg });
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
      dispatch({ type: AUTH_ACTIONS.RESET_PASSWORD_SUCCESS });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || "Failed to reset password";
      dispatch({ type: AUTH_ACTIONS.RESET_PASSWORD_FAILURE, payload: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  const verifyEmail = useCallback(
    async (token) => {
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

        if (response.user) {
          clearProfileCaches();
          const session = {
            user: response.user,
            redirectPath: response.redirectPath,
            authState: response.authState,
          };
          applyAuthSession(session);
          notifyAuthChanged();
        } else {
          dispatch({ type: AUTH_ACTIONS.VERIFY_EMAIL_SUCCESS });
        }

        return {
          success: true,
          redirectPath: response.redirectPath,
          authState: response.authState,
          user: response.user,
        };
      } catch (error) {
        const errorMsg = error?.message || "Failed to verify email";
        dispatch({ type: AUTH_ACTIONS.VERIFY_EMAIL_FAILURE, payload: errorMsg });
        return { success: false, error: errorMsg };
      }
    },
    [applyAuthSession],
  );

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
      dispatch({ type: AUTH_ACTIONS.VERIFY_EMAIL_SUCCESS });
      return { success: true };
    } catch (error) {
      const errorMsg = error?.message || "Failed to resend verification";
      dispatch({ type: AUTH_ACTIONS.VERIFY_EMAIL_FAILURE, payload: errorMsg });
      return { success: false, error: errorMsg };
    }
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const response = await authService.refreshAccessToken();
      if (response.success) {
        await revalidateAuth({ silent: true });
        return { success: true };
      }
      return { success: false };
    } catch {
      localStorage.removeItem("userData");
      dispatch({ type: AUTH_ACTIONS.LOGOUT });
      return { success: false };
    }
  }, [revalidateAuth]);

  const clearError = useCallback(() => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  }, []);

  const sessionMachine = useMemo(
    () =>
      getAuthState({
        user: state.user,
        authState: state.authState,
        redirectPath: state.redirectPath,
      }),
    [state.user, state.authState, state.redirectPath],
  );

  const value = useMemo(
    () => ({
      ...state,
      authStatus: sessionMachine.status,
      authMachine: sessionMachine,
      isAuthenticated:
        sessionMachine.status !== AUTH_STATUS.UNAUTHENTICATED,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      verifyEmail,
      resendVerification,
      refreshAccessToken,
      revalidateAuth,
      clearError,
    }),
    [
      state,
      sessionMachine,
      login,
      register,
      logout,
      forgotPassword,
      resetPassword,
      verifyEmail,
      resendVerification,
      refreshAccessToken,
      revalidateAuth,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/** Revalidates /auth/me on every client-side route change. */
export const RouteChangeAuthSync = () => {
  const location = useLocation();
  const { revalidateAuth, isLoading } = useAuthContext();
  const isFirstRoute = useRef(true);

  useEffect(() => {
    if (isFirstRoute.current) {
      isFirstRoute.current = false;
      return;
    }
    if (isLoading) return;
    revalidateAuth({ silent: true });
  }, [location.pathname, revalidateAuth, isLoading]);

  return null;
};

export { AuthContext, AUTH_ACTIONS };

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};
