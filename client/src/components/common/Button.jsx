import React from "react";

const VARIANT_MAP = {
  primary: "btn-primary-token",
  secondary: "btn-secondary-token",
  highlight: "btn-highlight-token",
  "gradient-border": "btn-primary-token",
  "white-border": "btn-secondary-token",
  "solid-gradient": "btn-primary-token",
};

const Button = ({
  children,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  className = "",
  onClick,
  ...props
}) => {
  const sizeClasses = {
    xs: "px-3 py-1.5 text-xs h-8 rounded-lg",
    sm: "px-4 py-2 text-sm h-10 rounded-lg",
    md: "px-5 py-2.5 text-button-text h-11 rounded-xl",
    lg: "px-6 py-3 text-base h-12 rounded-xl",
    xl: "px-8 py-4 text-lg h-14 rounded-xl",
  };

  const tokenClass = VARIANT_MAP[variant] || VARIANT_MAP.primary;
  const fullWidthClass = fullWidth ? "w-full" : "";
  const combinedClasses = `${tokenClass} ${sizeClasses[size]} ${fullWidthClass} ${className}`;

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
