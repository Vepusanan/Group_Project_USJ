import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../common/Input";
import Button from "../common/Button";

const ForgotPasswordForm = () => {
  const { forgotPassword, error: authError, clearError } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    if (!email) {
      setError("Email is required");
      return false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      clearError();
      setSuccess(false);

      try {
        const result = await forgotPassword(email);

        if (result.success) {
          setSuccess(true);
          setError("");
        } else {
          setError(
            result.error || "Failed to send reset link. Please try again.",
          );
        }
      } catch (error) {
        setError("An unexpected error occurred. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-error text-sm text-center">{error}</p>
        </div>
      )}

      {authError && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-error text-sm text-center">{authError}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-primary-light border border-primary-light rounded-lg">
          <p className="text-primary text-sm text-center">
            Watch your email — a password reset link has been sent to your
            inbox.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-content-secondary mb-2">
          Enter email address
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-content-muted">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError("");
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* GLOW BORDER BUTTON WITHOUT EMAIL ICON */}
      <Button
        type="submit"
        variant="gradient-border"
        size="lg"
        fullWidth={true}
        loading={isLoading}
        className="w-full"
      >
        Request reset link
      </Button>
    </form>
  );
};

export default ForgotPasswordForm;
