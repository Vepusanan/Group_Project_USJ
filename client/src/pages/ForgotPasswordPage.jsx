import React from 'react';
import ForgotPasswordForm from '../components/auth/ForgotPasswordForm';


const ForgotPasswordPage = () => {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900/20 via-black to-black"></div>
        <div className="absolute top-20 left-10 w-[400px] h-[400px] bg-gradient-to-br from-purple-900/10 to-blue-900/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-[500px] h-[500px] bg-gradient-to-tr from-violet-900/10 to-pink-900/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
       
        
        <main className="flex-grow flex items-center justify-center px-4 md:px-6 lg:px-8 py-8">
          <div className="w-full max-w-md">
            <div className="bg-white/1 backdrop-blur-lg rounded-2xl p-8 md:p-10 border border-gray-700/50 shadow-2xl">
              <h1 className="text-3xl font-bold text-white text-center mb-3">
                Forgot your password
              </h1>

              <p className="text-gray-400 text-center mb-8 text-sm">
                Please enter the email address you'd like your password reset information sent to
              </p>

              <ForgotPasswordForm />
            </div>
          </div>
        </main>
        
        
      </div>
    </div>
  );
};

export default ForgotPasswordPage;