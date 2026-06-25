import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../common/Input";
import PasswordInput from "../common/PasswordInput";
import Checkbox from "../common/Checkbox";
import Button from "../common/Button";

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    rememberMe: true,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = useCallback(() => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.email, formData.password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      clearError();

      try {
        const result = await login(
          formData.email,
          formData.password,
          formData.rememberMe,
        );

        if (result.success) {
          const destination = result.redirectPath || "/dashboard";
          console.info("[auth] login_redirect", {
            destination,
            userType: result.user?.userType,
          });
          navigate(destination, { replace: true });
        } else {
          setErrors({
            general: result.error || "Login failed. Please try again.",
          });
        }
      } catch (error) {
        setErrors({
          general: "An unexpected error occurred. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {errors.general && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-error text-sm text-center">{errors.general}</p>
        </div>
      )}

      {authError && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-error text-sm text-center">{authError}</p>
        </div>
      )}

      <Input
        label="Email or mobile phone number"
        type="email"
        value={formData.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
        error={errors.email}
        required
      />

      <PasswordInput
        label="Your password"
        value={formData.password}
        placeholder=""
        onChange={(e) => handleInputChange("password", e.target.value)}
        error={errors.password}
        required
      />

      <Checkbox
        label="Remember me"
        checked={formData.rememberMe}
        onChange={(checked) => handleInputChange("rememberMe", checked)}
      />

      <Button
        type="submit"
        variant="primary"
        fullWidth
        loading={isLoading}
        disabled={isLoading}
        className="!py-4"
      >
        Sign In to StartHub
      </Button>
    </form>
  );
};

export default LoginForm;
