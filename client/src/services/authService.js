import api from "./apiClient";

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
      const errorMessage = !error.response
        ? "Unable to reach the server. Check your internet connection."
        : error.response.data?.message ||
          error.response.data?.error ||
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
        // Tokens now live in HttpOnly cookies set by the backend.
        // userData is cached so AuthContext can render an authenticated
        // skeleton immediately on next page load while /auth/me confirms.
        if (response.data.user) {
          localStorage.setItem("userData", JSON.stringify(response.data.user));
        }

        return {
          success: true,
          user: response.data.user,
        };
      }

      return {
        success: false,
        error: response.data.error || "Login failed",
      };
    } catch (error) {
      const errorMessage = !error.response
        ? "Unable to reach the server. Check your internet connection."
        : error.response.data?.message ||
          error.response.data?.error ||
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
      const response = await api.get(
        `/auth/verify-email?token=${encodeURIComponent(token)}&format=json`,
      );

      if (response.data?.success) {
        if (response.data.user) {
          localStorage.setItem("userData", JSON.stringify(response.data.user));
        }
        return {
          success: true,
          message: response.data.message || "Email verified successfully!",
          user: response.data.user,
          redirectPath: response.data.redirectPath,
        };
      }

      return {
        success: false,
        error: response.data?.error || "Email verification failed",
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

  refreshAccessToken: async () => {
    // The refresh_token cookie is sent automatically; the backend sets a
    // new access_token cookie on success. Nothing for us to read or store.
    try {
      const response = await api.post("/auth/token");
      return { success: !!response.data?.success };
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to refresh token";
      console.error("Token refresh error:", errorMessage);
      return { success: false, error: errorMessage };
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
    // Backend reads the refresh cookie and clears both cookies; we just
    // drop the local userData cache.
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      localStorage.removeItem("userData");
    }
    return { success: true };
  },

  logoutAll: async () => {
    try {
      const response = await api.post("/auth/logout-all");

      if (response.data.success) {
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
