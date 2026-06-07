import React from "react";
import { Link } from "react-router-dom";
import RegistrationForm from "../components/auth/RegistrationForm";
import Button from "../components/common/Button";

const RegistrationPage = () => {
  return (
    <div className="w-full max-w-md mx-auto self-start mt-4 md:mt-8">
      {/* Form Card */}
      <div className="surface-card p-6 border border-line shadow-card">
        <h1 className="text-2xl font-bold text-content text-center mb-5">
          Sign up
        </h1>

        <RegistrationForm />
      </div>

      {/* Button with text - OUTSIDE the card */}
      <div className="mt-4 mb-6 text-center">
        <Link to="/login">
          <Button
            variant="white-border"
            size="lg"
            fullWidth
            className="max-w-md mx-auto"
          >
            Already have an account?
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RegistrationPage;
