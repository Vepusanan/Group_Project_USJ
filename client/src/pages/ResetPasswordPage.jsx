import React from 'react';
import { Link } from 'react-router-dom';
import ResetPasswordForm from '../components/auth/ResetPasswordForm';


const ResetPasswordPage = () => {
  return (
    <div className="w-full max-w-md mx-auto">
      
      
      <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-8 md:p-10 border border-gray-700/50 shadow-2xl mt-20">
        <h1 className="text-3xl font-bold text-white text-center mb-3">
          Change Your Password
        </h1>

        <p className="text-gray-400 text-center mb-8 text-sm">
          Enter a new password below to change your password.
        </p>

        <ResetPasswordForm />
      </div>
    </div>
  );
};

export default ResetPasswordPage;