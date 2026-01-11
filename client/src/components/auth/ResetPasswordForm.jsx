import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import PasswordInput from '../common/PasswordInput';

const ResetPasswordForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { resetPassword, error: authError, clearError } = useAuth();

  const token = searchParams.get('token');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 10) {
      newErrors.password = 'Password must be at least 10 characters';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setIsLoading(true);
      clearError();

      try {
        const result = await resetPassword(token, formData.password);

        if (result.success) {
          navigate('/login');
        } else {
          setErrors({
            general: result.error || 'Failed to reset password. Please try again.'
          });
        }
      } catch (error) {
        setErrors({
          general: 'An unexpected error occurred. Please try again.'
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  if (!token) {
    return (
      <div className='text-center'>
        <div className='text-red-400 mb-4'>
          <svg className='w-16 h-16 mx-auto' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
            <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' />
          </svg>
        </div>
        <h2 className='text-2xl font-bold text-white mb-3'>Invalid Reset Link</h2>
        <p className='text-gray-400 mb-6'>
          The password reset link is invalid or has expired. Please request a new one.
        </p>
        <Link to='/forgot-password'>
          <div className="relative w-full h-12 group">
            <div className="absolute inset-0 rounded-lg bg-black/50 backdrop-blur-[20px] border border-gray-600/50 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.1),0px_4px_4px_0px_rgba(0,0,0,0.05),0px_1px_0px_0px_rgba(0,0,0,0.05)]"></div>
            <button className="relative w-full h-full px-6 py-3 text-white text-base font-medium rounded-lg flex items-center justify-center hover:text-gray-200 transition-colors">
              Request New Reset Link
            </button>
          </div>
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-5'>
      {errors.general && (
        <div className='mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg'>
          <p className='text-red-400 text-sm text-center'>{errors.general}</p>
        </div>
      )}

      {authError && (
        <div className='mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg'>
          <p className='text-red-400 text-sm text-center'>{authError}</p>
        </div>
      )}

      <PasswordInput
        label='New password'
        placeholder='Enter new password'
        value={formData.password}
        onChange={(e) => handleInputChange('password', e.target.value)}
        error={errors.password}
      />

      <PasswordInput
        label='Re-enter new password'
        placeholder='Confirm new password'
        value={formData.confirmPassword}
        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
        error={errors.confirmPassword}
      />

      <div className='bg-white/5 rounded-lg p-4'>
        <p className='text-sm text-gray-400 mb-2'>Your password must contain:</p>
        <div className='flex items-center text-sm'>
          <svg className='w-4 h-4 text-green-500 mr-2' fill='currentColor' viewBox='0 0 20 20'>
            <path fillRule='evenodd' d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z' clipRule='evenodd' />
          </svg>
          <span className='text-green-500'>At least 10 characters in length</span>
        </div>
      </div>

      {/* Updated Reset Password Button */}
      <div className="relative w-full h-12 group">
        <div className="absolute inset-0 rounded-lg bg-black/50 backdrop-blur-[20px] border border-gray-600/50 shadow-[0px_10px_10px_0px_rgba(0,0,0,0.1),0px_4px_4px_0px_rgba(0,0,0,0.05),0px_1px_0px_0px_rgba(0,0,0,0.05)]"></div>
        <button
          type='submit'
          disabled={isLoading}
          className="relative w-full h-full px-6 py-3 text-white text-base font-medium rounded-lg flex items-center justify-center gap-2 hover:text-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Resetting...</span>
            </>
          ) : (
            'Reset password'
          )}
        </button>
      </div>
    </form>
  );
};

export default ResetPasswordForm;