import React from 'react';
import { Link } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';


const ResetPasswordPage = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      
      
      <div className="bg-surface-alt rounded-2xl p-8 md:p-10 border border-line shadow-card mt-8 md:mt-20">
        <h1 className="text-3xl font-bold text-content text-center mb-3">
          Change Your Password
        </h1>

        <p className="text-content-muted text-center mb-8 text-sm">
          Enter a new password below to change your password.
        </p>

        <ResetPasswordForm />
      </div>
    </div>
  );
};

export default ResetPasswordPage;