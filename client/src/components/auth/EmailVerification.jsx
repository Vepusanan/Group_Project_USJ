import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import Button from '../common/Button'; // Add Button import

const EmailVerification = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { verifyEmail, error: authError, clearError } = useAuth();

  const token = searchParams.get('token');
  const email = searchParams.get('email') || 'yourmail@gmail.com';

  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerifyEmail = async () => {
    setIsLoading(true);
    clearError();
    setError('');

    try {
      const result = await verifyEmail(token);
      if (result.success) {
        setIsVerified(true);
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.error || 'Failed to verify email. Please try again.');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className='text-center'>
      {/* Email Verification Image */}
      <div className='mb-6 relative inline-block'>
        <div className='w-48 h-48 rounded-full flex items-center justify-center mx-auto overflow-hidden'>
          <img 
            src="/images/email/emailverification.png" 
            alt="Email Verification" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-white mb-4">
        Verify your email address
      </h1>

      <p className="text-gray-400 mb-8 text-sm leading-relaxed max-w-md mx-auto">
        You've entered <span className="text-blue-400 font-medium">{email}</span> as the email address for your account. 
        Please verify this email address by clicking the button below.
      </p>

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm text-center">{error}</p>
        </div>
      )}

      {authError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm text-center">{authError}</p>
        </div>
      )}

      {isVerified ? (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-green-400 text-sm text-center">
            Email verified successfully! Redirecting to login...
          </p>
        </div>
      ) : (
        //  Verify Button with Glow Border Style
        <div className="w-full max-w-xs mx-auto">
          <Button
            onClick={handleVerifyEmail}
            variant="gradient-border"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
            className="h-12"
          >
            {isLoading ? 'Verifying...' : 'Verify your email'}
          </Button>
        </div>
      )}

    </div>
  );
};

export default EmailVerification;