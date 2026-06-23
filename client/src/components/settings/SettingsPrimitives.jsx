import React from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { APP_CONSTANTS } from "../../utils/constants";

export const inputCls =
  "w-full rounded-lg bg-surface-alt border border-line px-3 py-2 text-content placeholder:text-content-muted text-sm";
export const selectCls =
  "w-full rounded-lg bg-surface-alt border border-line px-3 py-2 text-sm text-content";

export const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-line">
    <div>
      <p className="text-sm text-content-secondary">{label}</p>
      {description && (
        <p className="text-xs text-content-muted mt-0.5">{description}</p>
      )}
    </div>
    <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-line rounded-full peer peer-checked:bg-primary peer-focus:ring-2 peer-focus:ring-primary-light/40 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-surface after:transition-all peer-checked:after:translate-x-4" />
    </label>
  </div>
);

export const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-content-secondary mb-1">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-error mt-1">{error}</p>}
  </div>
);

export const PasswordStrength = ({ password }) => {
  const minLen = APP_CONSTANTS.MIN_PASSWORD_LENGTH;
  const checks = [
    { label: `At least ${minLen} characters`, ok: password.length >= minLen },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
    {
      label: "Special character",
      ok: /[^A-Za-z0-9]/.test(password),
    },
  ];

  if (!password) return null;

  const passed = checks.filter((check) => check.ok).length;
  const barColor =
    passed <= 1
      ? "bg-error"
      : passed <= 2
        ? "bg-warning"
        : passed <= 3
          ? "bg-warning"
          : "bg-primary";

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            className={`h-1 flex-1 rounded-full transition-colors ${
              index < passed ? barColor : "bg-surface-alt"
            }`}
          />
        ))}
      </div>
      <ul className="space-y-0.5">
        {checks.map(({ label, ok }) => (
          <li
            key={label}
            className={`flex items-center gap-1.5 text-xs ${
              ok ? "text-primary" : "text-content-muted"
            }`}
          >
            <span>{ok ? "✓" : "○"}</span>
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
};

export const Feedback = ({ feedback }) => {
  if (!feedback) return null;
  const ok = feedback.type === "success";
  return (
    <div
      className={`mb-4 rounded-lg border px-4 py-3 flex items-start gap-2 text-sm ${
        ok
          ? "border-success/40 bg-success/10 text-success"
          : "border-error/40 bg-error/10 text-error"
      }`}
    >
      {ok ? (
        <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
      ) : (
        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
      )}
      <span>{feedback.message}</span>
    </div>
  );
};

export const SectionHeader = ({ title, description }) => (
  <div className="mb-5">
    <h2 className="text-xl font-semibold text-content">{title}</h2>
    {description && (
      <p className="text-sm text-content-muted mt-0.5">{description}</p>
    )}
  </div>
);
