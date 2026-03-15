import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem("accessToken");
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const requestUrl = originalRequest?.url || "";
    const isTokenRefreshRequest = requestUrl.includes("/auth/token");

    const redirectToLogin = () => {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    };

    if (error.response?.status === 401 && isTokenRefreshRequest) {
      redirectToLogin();
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem("refreshToken");

      if (refreshToken) {
        try {
          const response = await api.post("/auth/token", { refreshToken });
          const newAccessToken = response.data.accessToken;
          localStorage.setItem("accessToken", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          redirectToLogin();
        }
      } else {
        redirectToLogin();
      }
    }

    if (!error.response) {
      console.error("Network error:", error.message);
    }

    return Promise.reject(error);
  },
);

const authService = {
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        error: response.data.error || "Registration failed",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Registration failed";
      console.error("Registration error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  login: async (email, password, rememberMe = false) => {
    try {
      const response = await api.post("/auth/login", {
        email,
        password,
        rememberMe,
      });

      if (response.data.success) {
        if (response.data.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
        }
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }
        if (response.data.user) {
          localStorage.setItem("userData", JSON.stringify(response.data.user));
        }

        return {
          success: true,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: response.data.error || "Login failed",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Login failed";
      console.error("Login error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  verifyEmail: async (token) => {
    try {
      const response = await api.get(`/auth/verify-email?token=${token}`);

      if (response.status === 200) {
        return {
          success: true,
          message: response.data || "Email verified successfully!",
        };
      }

      return {
        success: false,
        error: "Email verification failed",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to verify email";
      console.error("Verify email error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  resendVerification: async (email) => {
    try {
      const response = await api.post("/auth/resend-verification", { email });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        error: response.data.error || "Failed to resend verification",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to resend verification";
      console.error("Resend verification error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  refreshAccessToken: async (refreshToken) => {
    try {
      const response = await api.post("/auth/token", { refreshToken });

      if (response.data.success) {
        const newAccessToken = response.data.accessToken;
        localStorage.setItem("accessToken", newAccessToken);

        return {
          success: true,
          accessToken: newAccessToken,
        };
      }

      return {
        success: false,
        error: response.data.error || "Failed to refresh token",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to refresh token";
      console.error("Token refresh error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  protectedTest: async () => {
    try {
      const response = await api.get("/auth/protected-test");

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: response.data.error || "Protected test failed",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Protected test failed";
      console.error("Protected test error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        error: response.data.error || "Failed to send reset email",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to send reset email";
      console.error("Forgot password error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
      });

      if (response.data.success) {
        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        error: response.data.error || "Failed to reset password",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to reset password";
      console.error("Reset password error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  logout: async () => {
    const refreshToken = localStorage.getItem("refreshToken");

    try {
      if (refreshToken) {
        await api.post("/auth/logout", { refreshToken });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
    }

    return { success: true };
  },

  logoutAll: async () => {
    try {
      const response = await api.post("/auth/logout-all");

      if (response.data.success) {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("userData");

        return {
          success: true,
          message: response.data.message,
        };
      }

      return {
        success: false,
        error: response.data.error || "Failed to logout all sessions",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to logout all sessions";
      console.error("Logout all error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  getSessions: async () => {
    try {
      const response = await api.get("/auth/sessions");

      if (response.data.success) {
        return {
          success: true,
          sessions: response.data.sessions,
        };
      }

      return {
        success: false,
        error: response.data.error || "Failed to get sessions",
      };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to get sessions";
      console.error("Get sessions error:", errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    }
  },
};

export default authService;
