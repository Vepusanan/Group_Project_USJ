import React from 'react';

const Checkbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
  error,
  ...props
}) => {
  const baseClasses = 'flex items-start cursor-pointer';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  const combinedClasses = `${baseClasses} ${disabledClasses} ${className}`;

  return (
    <div className={combinedClasses}>
      <div className="flex items-start pt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="w-5 h-5 rounded border-2 border-gray-600 bg-white/5 text-purple-600 focus:ring-purple-500 focus:ring-offset-0 cursor-pointer accent-purple-600"
          aria-label={label}
          {...props}
        />
      </div>
      {label && (
        <label className="ml-3 text-sm text-gray-300 cursor-pointer select-none">
          {label}
        </label>
      )}
      {error && <p className="mt-1 text-sm text-red-500 w-full">{error}</p>}
    </div>
  );
};

export default Checkbox;