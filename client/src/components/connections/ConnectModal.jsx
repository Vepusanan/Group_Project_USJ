import React from "react";

const ConnectModal = ({
  open,
  companyName,
  initial,
  gradientFrom,
  gradientTo,
  message,
  onMessageChange,
  onCancel,
  onSubmit,
  loading,
  maxLength = 300,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradientFrom} ${gradientTo} flex items-center justify-center flex-shrink-0`}
          >
            <span className="avatar-initial text-lg">{initial}</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-content">
              Connect with {companyName}
            </h3>
            <p className="text-xs text-content-muted">Add an optional intro message</p>
          </div>
        </div>
        <textarea
          value={message}
          onChange={(e) => onMessageChange(e.target.value.slice(0, maxLength))}
          rows={4}
          className="w-full rounded-xl bg-surface-alt border border-line px-4 py-3 text-sm text-content placeholder:text-content-muted resize-none focus:outline-none focus:border-primary-light/50 focus:bg-surface-alt transition-all"
          placeholder="Hi! I'd love to learn more about your startup and explore how we might work together."
        />
        <div className="text-xs text-content-secondary text-right mt-1 mb-4">
          {message.length}/{maxLength}
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-line text-content-secondary text-sm hover:bg-surface-alt hover:text-content transition-all"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={loading}
            className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-sm !text-content-inverse font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {loading ? "Sending…" : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConnectModal;
