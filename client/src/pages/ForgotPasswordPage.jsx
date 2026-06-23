import React from "react";
import ForgotPasswordForm from "../components/auth/ForgotPasswordForm";

const ForgotPasswordPage = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface  rounded-2xl p-8 md:p-10 border border-line shadow-card mt-10">
        <h1 className="text-3xl font-bold text-content text-center mb-3">
          Forgot your password
        </h1>

        <p className="text-content-muted text-center mb-8 text-sm">
          Please enter the email address you'd like your password reset
          information sent to
        </p>

        <ForgotPasswordForm />
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
