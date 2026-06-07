import React from "react";
import { inputClass } from "../../styles/theme";

const Input = ({
  label,
  type = "text",
  placeholder,
  value,
  onChange,
  error,
  disabled = false,
  required = false,
  compact = false,
  className = "",
  icon: Icon,
  ...props
}) => {
  const errorClasses = error
    ? "border-error focus:border-error focus:ring-error/20"
    : "";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed bg-surface-alt" : "";
  const combinedClasses = `${inputClass} ${compact ? "py-2" : ""} ${errorClasses} ${disabledClasses} ${className}`;

  return (
    <div className="w-full">
      {label && (
        <label
          className={`block text-sm font-medium text-content-secondary ${compact ? "mb-1" : "mb-2"}`}
        >
          {label}
          {required && <span className="text-error ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-content-muted">
            <Icon size={20} />
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`${combinedClasses} ${Icon ? "pl-10" : ""}`}
          {...props}
        />
      </div>
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
};

export default Input;
