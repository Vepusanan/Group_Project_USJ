import React from 'react';
import { Link } from 'react-router-dom';
import LoginForm from '../components/auth/LoginForm';
import Button from '../components/common/Button';

const LoginPage = () => {
  return (
    <div className="w-full max-w-md mx-auto self-start mt-4 md:mt-8">
      <div className="bg-surface  rounded-2xl p-8 md:p-10 border border-line shadow-card">
        <h1 className="text-3xl font-bold text-content text-center mb-8">
          Sign in
        </h1>

        <LoginForm />

        <div className="text-right pt-2">
          <Link to="/forgot-password" className="text-sm text-content-muted hover:text-primary transition-colors">
            Forget your password?
          </Link>
        </div>

      
      </div>

      {/* Horizontal line with "New to our community?" centered */}
      <div className="mt-8 flex items-center gap-4">
        <div className="flex-1 border-t border-line"></div>
        <p className="text-content-muted text-sm text-center">
          New to our community?
        </p>
        <div className="flex-1 border-t border-line"></div>
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