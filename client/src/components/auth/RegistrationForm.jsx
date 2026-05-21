import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Input from "../common/Input";
import PasswordInput from "../common/PasswordInput";
import Checkbox from "../common/Checkbox";
import Button from "../common/Button";

const RegistrationForm = () => {
  const navigate = useNavigate();
  const { register, error: authError, clearError } = useAuth();

  const [formData, setFormData] = useState({
    userType: "",
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreedToTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.userType) {
      newErrors.userType = "Please select your role";
    }

    if (!formData.fullName) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.length < 2) {
      newErrors.fullName = "Name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else {
      const pw = formData.password;
      const unmet = [];
      if (pw.length < 10) unmet.push("at least 10 characters");
      if (!/[A-Z]/.test(pw)) unmet.push("one uppercase letter");
      if (!/[a-z]/.test(pw)) unmet.push("one lowercase letter");
      if (!/\d/.test(pw)) unmet.push("one number");
      if (!/[^A-Za-z0-9]/.test(pw)) unmet.push("one special character");
      if (unmet.length > 0) {
        newErrors.password = `Password must include: ${unmet.join(" • ")}`;
      }
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!formData.agreedToTerms) {
      newErrors.agreedToTerms = "You must agree to the terms and conditions";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      clearError();

      try {
        const result = await register({
          userType: formData.userType,
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password,
        });

        if (result.success) {
          navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
        } else {
          setErrors({
            general: result.error || "Registration failed. Please try again.",
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
    <form onSubmit={handleSubmit} className="space-y-3">
      {errors.general && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm text-center">{errors.general}</p>
        </div>
      )}

      {authError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm text-center">{authError}</p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          User Type <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.userType}
          onChange={(e) => handleInputChange("userType", e.target.value)}
          className={`w-full px-4 py-2 bg-white/5 border ${errors.userType ? "border-red-500/50" : "border-gray-600"} rounded-lg text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200`}
        >
          <option value="" disabled className="bg-gray-900">
            Select Your Role
          </option>
          <option value="startup" className="bg-gray-900">
            Startup
          </option>
          <option value="investor" className="bg-gray-900">
            Investor
          </option>
        </select>
        {errors.userType && (
          <p className="mt-1 text-sm text-red-500">{errors.userType}</p>
        )}
      </div>

      <Input
        label="Full Name / Company Name"
        type="text"
        value={formData.fullName}
        onChange={(e) => handleInputChange("fullName", e.target.value)}
        error={errors.fullName}
        compact
        required
      />

      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => handleInputChange("email", e.target.value)}
        error={errors.email}
        compact
        required
      />

      <PasswordInput
        label="Password"
        value={formData.password}
        placeholder=""
        onChange={(e) => handleInputChange("password", e.target.value)}
        error={errors.password}
        compact
        required
      />

      <PasswordInput
        label="Confirm Password"
        value={formData.confirmPassword}
        placeholder=""
        onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
        error={errors.confirmPassword}
        compact
        required
      />

      <Checkbox
        label={
          <span className="text-gray-300 text-sm">
            I agree to the{" "}
            <Link to="/terms" className="text-blue-400 hover:text-blue-300">
              Terms and Conditions
            </Link>
          </span>
        }
        checked={formData.agreedToTerms}
        onChange={(checked) => handleInputChange("agreedToTerms", checked)}
        error={errors.agreedToTerms}
      />

      <Button type="submit" fullWidth loading={isLoading} disabled={isLoading}>
        Sign up
      </Button>
    </form>
  );
};

export default RegistrationForm;
