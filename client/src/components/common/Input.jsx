import React from 'react';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  compact = false,
  className = '',
  icon: Icon,
  ...props
}) => {
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
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon size={20} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${combinedClasses} ${Icon ? 'pl-10' : ''}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};

export default Input;