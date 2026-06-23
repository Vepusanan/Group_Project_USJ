import React from "react";
import { Link } from "react-router-dom";
import { Loader2, LogOut, Monitor, Smartphone } from "lucide-react";
import {
  Feedback,
  PasswordStrength,
  SectionHeader,
  inputCls,
} from "./SettingsPrimitives";

const fmtSession = (value) =>
  value
    ? new Date(value).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : "Unknown";

const SecuritySettingsTab = ({
  feedback,
  securityForm,
  setSecurityForm,
  busy,
  sessions,
  sessionsLoading,
  onChangePassword,
  onLogoutAll,
  onRevokeSession,
  onDownloadData,
}) => (
  <div className="space-y-5">
    <SectionHeader
      title="Password & Security"
      description="Manage your password, sessions, and account security."
    />
    <Feedback feedback={feedback} />

    <form
      onSubmit={onChangePassword}
      className="rounded-lg border border-line p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
        Change Password
      </h3>
      <input
        className={inputCls}
        type="password"
        value={securityForm.currentPassword}
        onChange={(e) =>
          setSecurityForm((prev) => ({
            ...prev,
            currentPassword: e.target.value,
          }))
        }
        placeholder="Current password"
        required
      />
      <div>
        <input
          className={inputCls}
          type="password"
          value={securityForm.newPassword}
          onChange={(e) =>
            setSecurityForm((prev) => ({
              ...prev,
              newPassword: e.target.value,
            }))
          }
          placeholder="New password"
          required
        />
        <PasswordStrength password={securityForm.newPassword} />
      </div>
      <input
        className={inputCls}
        type="password"
        value={securityForm.confirmPassword}
        onChange={(e) =>
          setSecurityForm((prev) => ({
            ...prev,
            confirmPassword: e.target.value,
          }))
        }
        placeholder="Confirm new password"
        required
      />
      <p className="text-xs text-content-muted">
        All active sessions will be terminated after the password change.
      </p>
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="submit"
          disabled={!!busy}
          className="px-4 py-2 rounded-lg bg-primary text-sm text-content-inverse disabled:opacity-50 inline-flex items-center gap-2"
        >
          {busy === "security.pw" && <Loader2 className="w-4 h-4 animate-spin" />}
          Update Password
        </button>
        <Link to="/forgot-password" className="text-sm text-primary hover:text-primary">
          I forgot my current password →
        </Link>
      </div>
    </form>

    <div className="rounded-lg border border-line p-4 space-y-2">
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
        Email Verification
      </h3>
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-0.5 rounded-full bg-primary-light border border-primary-light text-primary">
          Required
        </span>
        <span className="text-sm text-content-secondary">
          Verified email address on sign-in
        </span>
      </div>
      <p className="text-xs text-content-muted">
        Multi-factor authentication (SMS or authenticator app) is planned for a
        future release.
      </p>
    </div>

    <div className="rounded-lg border border-line p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
          Active Sessions
        </h3>
        <button
          type="button"
          onClick={onLogoutAll}
          disabled={!!busy}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-error/40 text-error hover:bg-error/10 disabled:opacity-50 transition-colors"
        >
          {busy === "security.logoutAll" ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <LogOut className="w-3.5 h-3.5" />
          )}
          Logout from all devices
        </button>
      </div>
      {sessionsLoading ? (
        <div className="flex items-center gap-2 text-content-muted text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading sessions…
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-content-muted">No session data available.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((session, index) => {
            const deviceStr = session.device_info || session.user_agent || "";
            const mobile = /mobile|android|iphone|ipad/i.test(deviceStr);
            const isCurrent = session.is_current ?? index === 0;

            return (
              <li
                key={session.id || index}
                className="flex items-start gap-3 py-2 border-b border-line last:border-0"
              >
                <div className="mt-0.5 text-content-muted flex-shrink-0">
                  {mobile ? (
                    <Smartphone className="w-4 h-4" />
                  ) : (
                    <Monitor className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-content truncate">
                    {deviceStr
                      ? deviceStr.slice(0, 70) + (deviceStr.length > 70 ? "…" : "")
                      : "Unknown device"}
                  </p>
                  <p className="text-xs text-content-muted mt-0.5">
                    Last active: {fmtSession(session.last_used_at || session.created_at)}
                    {session.client_ip ? ` · ${session.client_ip}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary-light text-primary border border-primary-light">
                      Current
                    </span>
                  )}
                  {session.id && !isCurrent && (
                    <button
                      type="button"
                      onClick={() => onRevokeSession(session.id)}
                      disabled={busy === `security.revoke.${session.id}`}
                      className="text-[10px] px-2 py-0.5 rounded border border-line text-content-muted hover:text-red-600 hover:border-red-200 disabled:opacity-50"
                    >
                      {busy === `security.revoke.${session.id}`
                        ? "Revoking…"
                        : "Revoke"}
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>

    <div className="rounded-lg border border-line p-4 space-y-2">
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
        Login History
      </h3>
      <p className="text-xs text-content-muted">
        Recent login activity is shown in your active sessions above. Each entry
        represents a device that authenticated with your account.
      </p>
      <p className="text-xs text-content-muted">
        If you see a session you don&apos;t recognise, log out from all devices
        immediately and change your password.
      </p>
    </div>

    <div className="rounded-lg border border-line p-4 space-y-3">
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
        Data & Privacy
      </h3>
      <p className="text-xs text-content-muted">
        Download a copy of all the data associated with your account.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={onDownloadData}
          disabled={busy === "security.export"}
          className="px-4 py-2 rounded-lg border border-line text-sm text-content-secondary hover:bg-surface-alt transition-colors disabled:opacity-50"
        >
          {busy === "security.export" ? "Preparing export…" : "Download my data"}
        </button>
      </div>
      <div className="flex gap-4 mt-1">
        <Link to="/privacy" className="text-xs text-primary hover:text-primary">
          Privacy policy
        </Link>
        <Link to="/terms" className="text-xs text-primary hover:text-primary">
          Terms of service
        </Link>
      </div>
    </div>
  </div>
);

export default SecuritySettingsTab;
