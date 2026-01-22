import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import Button from '../components/common/Button';

const LoginPage = () => {
  return (
    <div className="w-full max-w-md mx-auto ">
      <div className="bg-white/4 backdrop-blur-lg rounded-2xl p-8 md:p-10 border border-gray-700/50 shadow-2xl mt-10">
        <h1 className="text-3xl font-bold text-white text-center mb-8">
          Sign in
        </h1>

        <LoginForm />

        <div className="text-right pt-2">
          <Link to="/forgot-password" className="text-sm text-gray-400 hover:text-purple-400 transition-colors">
            Forget your password?
          </Link>
        </div>

      
      </div>

      {/* Horizontal line with "New to our community?" centered */}
      <div className="mt-8">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-600"></div>
          </div>
          <div className="relative px-4 bg-black">
            <p className="text-gray-400 text-sm whitespace-nowrap">
              New to our community?
            </p>
          </div>
        </div>
      </div>

      {/* Create an account button */}
      <div className="mt-4 text-center">
        <Link to="/signup">
          <Button 
            variant="white-border" 
            size="lg" 
            fullWidth
          >
            Create an account
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;