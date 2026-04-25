import React, { useState, useEffect, useRef } from 'react';

const PasswordInput = ({
  label,
  placeholder = 'Your password',
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  compact = false,
  className = '',
  autoHideDelay = 3000,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const timeoutRef = useRef(null);

  const togglePassword = () => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    // Show password
    const newShowState = !showPassword;
    setShowPassword(newShowState);
    
    // If showing, set timeout to hide
    if (newShowState) {
      timeoutRef.current = setTimeout(() => {
        setShowPassword(false);
        timeoutRef.current = null;
      }, autoHideDelay);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const baseClasses = `w-full px-4 ${compact ? 'py-2' : 'py-3'} bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all duration-200`;
  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : '';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const combinedClasses = `${baseClasses} ${errorClasses} ${disabledClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label className={`block text-sm font-medium text-gray-300 ${compact ? 'mb-1' : 'mb-2'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={combinedClasses}
          {...props}
        />
        <button
          type="button"
          onClick={togglePassword}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${showPassword ? 'text-purple-400' : 'text-gray-400'} hover:text-gray-300 focus:outline-none transition-colors duration-200`}
          tabIndex={-1}
          aria-label={showPassword ? `Hide password (auto-hides in ${autoHideDelay/1000}s)` : 'Show password'}
        >
          {showPassword ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
      {showPassword && (
        <p className="mt-1 text-xs text-purple-400 animate-pulse">
          Password will hide automatically in {autoHideDelay/1000} seconds
        </p>
      )}
    </div>
  );
};

export default PasswordInput;