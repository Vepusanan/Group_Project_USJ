import React from "react";
import { Link } from "react-router-dom";
import RegistrationForm from "../components/auth/RegistrationForm";
import Button from "../components/common/Button";

const RegistrationPage = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      {/* Form Card */}
      <div className="glass-dark rounded-2xl p-6 border border-gray-700/50 shadow-2xl mt-4">
        <h1 className="text-2xl font-bold text-white text-center mb-5">
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
