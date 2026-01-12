import React from 'react';

const Button = ({
  children,
  type = 'button',
  variant = 'gradient-border', // Options: 'gradient-border', 'white-border'
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  onClick,
  ...props
}) => {
  // Base classes
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';
  
  // Size classes - keep original border-radius
  const sizeClasses = {
    xs: 'px-3 py-1.5 text-xs h-8 rounded-lg',
    sm: 'px-4 py-2 text-sm h-10 rounded-lg',
    md: 'px-5 py-2.5 text-base h-12 rounded-lg',
    lg: 'px-6 py-3 text-lg h-14 rounded-lg',
    xl: 'px-8 py-4 text-xl h-16 rounded-lg',
  };
  
  // Variant-specific base
  let variantBase = '';
  let variantContent = children;
  
  if (variant === 'gradient-border') {
    // GLOW BORDER style (for Login button)
    variantBase = 'relative bg-transparent text-white overflow-hidden group';
    variantContent = (
      <>
        {/* Glow effect layer */}
        <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-[2px] group-hover:blur-[3px] transition-all rounded-lg"></span>
        
        {/* Gradient border with glow */}
        <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-100 group-hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 rounded-lg"></span>
        
        {/* Inner background */}
        <span className="absolute inset-[2px] bg-gray-900 transition-colors group-hover:bg-gray-800 rounded-lg"></span>
        
        {/* Text content */}
        <span className="relative z-10">{children}</span>
      </>
    );
  } else if (variant === 'white-border') {
    // SIMPLE WHITE BORDER style 
    variantBase = 'relative bg-transparent text-white overflow-hidden group';
    variantContent = (
      <>
        {/* White border */}
        <span className="absolute inset-0 border border-white/40 rounded-lg group-hover:border-white/60 transition-colors"></span>
        
        {/* Inner background */}
        <span className="absolute inset-[1px]  rounded-[calc(0.5rem-1px)] transition-colors group-hover:bg-gray-800"></span>
        
        {/* Text content */}
        <span className="relative z-10">{children}</span>
      </>
    );
  } else if (variant === 'solid-gradient') {
    // Solid gradient (optional)
    variantBase = 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white hover:opacity-90 shadow-lg shadow-blue-500/30 transition-all duration-300';
  }
  
  const fullWidthClass = fullWidth ? 'w-full' : '';
  const combinedClasses = `${baseClasses} ${variantBase} ${sizeClasses[size]} ${fullWidthClass} ${className}`;
  
  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center relative z-10">
          <svg 
            className="animate-spin h-4 w-4 mr-2" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            ></circle>
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading...</span>
        </div>
      ) : (
        variantContent
      )}
    </button>
  );
};

export default Button;