import React from "react";

const Checkbox = ({
  label,
  checked,
  onChange,
  disabled = false,
  className = "",
  error,
  ...props
}) => {
  const combinedClasses = `flex items-start gap-3 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`;

  return (
    <div className={combinedClasses}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="w-5 h-5 rounded border-2 border-line bg-surface text-primary focus:ring-primary focus:ring-offset-0 cursor-pointer accent-primary mt-0.5"
        aria-label={label}
        {...props}
      />
      {label && (
        <label className="text-sm text-content-secondary cursor-pointer select-none">
          {label}
        </label>
      )}
      {error && <p className="text-sm text-error w-full">{error}</p>}
    </div>
  );
};

export default Checkbox;
