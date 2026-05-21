import React from "react";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

const ForgotPasswordPage = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white/4 backdrop-blur-lg rounded-2xl p-8 md:p-10 border border-gray-700/50 shadow-2xl mt-10">
        <h1 className="text-3xl font-bold text-white text-center mb-3">
          Forgot your password
        </h1>

        <p className="text-gray-400 text-center mb-8 text-sm">
          Please enter the email address you'd like your password reset
          information sent to
        </p>

        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
