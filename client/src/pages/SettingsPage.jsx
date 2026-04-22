import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Monitor, Smartphone, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const tabs = [
  { key: "privacy", label: "Privacy" },
  { key: "notifications", label: "Notifications" },
  { key: "security", label: "Password & Security" },
  { key: "account", label: "Account" },
];

const Toggle = ({ label, checked, onChange }) => (
  <label className="flex items-center justify-between py-2 border-b border-white/10">
    <span className="text-sm text-gray-200">{label}</span>
    <input
      type="checkbox"
      checked={!!checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4"
    />
  </label>
);

const PasswordStrengthChecker = ({ password }) => {
  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter", ok: /[a-z]/.test(password) },
    { label: "Number", ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <ul className="mt-1 space-y-1">
      {checks.map(({ label, ok }) => (
        <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-400" : "text-gray-500"}`}>
          <span>{ok ? "✓" : "○"}</span>
          {label}
        </li>
      ))}
    </ul>
  );
};

const SettingsPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState("privacy");
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const [tabFeedback, setTabFeedback] = useState({
    privacy: null,
    notifications: null,
    security: null,
    account: null,
  });

  const [privacy, setPrivacy] = useState({
    profile_visibility: "public",
    connection_request_setting: true,
    show_connections_list: true,
    show_activity_status: true,
  });

  const [notifications, setNotifications] = useState({
    email_connection_requests: true,
    email_messages: true,
    email_profile_views: false,
    email_weekly_digest: true,
    notification_frequency: "instant",
    inapp_connection_requests: true,
    inapp_messages: true,
    inapp_profile_views: true,
    inapp_system_updates: true,
  });

  const [accountForm, setAccountForm] = useState({
    newEmail: "",
    deletePassword: "",
  });

  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  const setFeedback = (tab, type, message) => {
    setTabFeedback((prev) => ({
      ...prev,
      [tab]: { type, message, at: Date.now() },
    }));
  };

  const clearFeedback = (tab) => {
    setTabFeedback((prev) => ({ ...prev, [tab]: null }));
  };

  const loadSettings = async () => {
    setLoading(true);

    const [privacyRes, notifRes] = await Promise.all([
      apiService.getPrivacySettings(),
      apiService.getNotificationSettings(),
    ]);

    if (!privacyRes.success) {
      setFeedback("privacy", "error", privacyRes.error || "Failed to load privacy settings");
      setLoading(false);
      return;
    }

    if (!notifRes.success) {
      setFeedback("notifications", "error", notifRes.error || "Failed to load notification settings");
      setLoading(false);
      return;
    }

    setPrivacy((prev) => ({ ...prev, ...(privacyRes.data?.data || {}) }));
    setNotifications((prev) => ({ ...prev, ...(notifRes.data?.data || {}) }));
    setLoading(false);
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    const result = await apiService.getSessions();
    setSessionsLoading(false);
    if (result.success) {
      setSessions(result.data?.sessions || result.data || []);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === "security") {
      loadSessions();
    }
  }, [activeTab]);

  const savePrivacy = async () => {
    setActionKey("privacy.save");
    clearFeedback("privacy");
    const result = await apiService.updatePrivacySettings(privacy);
    setActionKey("");
    if (!result.success) {
      setFeedback("privacy", "error", result.error || "Failed to save privacy settings");
      return;
    }
    setFeedback("privacy", "success", "Privacy settings saved.");
  };

  const saveNotifications = async () => {
    setActionKey("notifications.save");
    clearFeedback("notifications");
    const result = await apiService.updateNotificationSettings(notifications);
    setActionKey("");
    if (!result.success) {
      setFeedback("notifications", "error", result.error || "Failed to save notification settings");
      return;
    }
    setFeedback("notifications", "success", "Notification settings saved.");
  };

  const submitChangePassword = async (event) => {
    event.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = securityForm;
    if (!currentPassword || !newPassword) {
      setFeedback("security", "error", "Current and new password are required");
      return;
    }
    if (newPassword.length < 8) {
      setFeedback("security", "error", "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setFeedback("security", "error", "Passwords do not match");
      return;
    }
    setActionKey("security.password");
    clearFeedback("security");
    const result = await apiService.changePassword({ currentPassword, newPassword });
    setActionKey("");
    if (!result.success) {
      setFeedback("security", "error", result.error || "Failed to change password");
      return;
    }
    setFeedback("security", "success", "Password changed. Other sessions will be signed out.");
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const handleLogoutAllDevices = async () => {
    setActionKey("security.logoutAll");
    clearFeedback("security");
    const result = await apiService.logoutAllDevices();
    setActionKey("");
    if (!result.success) {
      setFeedback("security", "error", result.error || "Failed to logout all devices");
      return;
    }
    logout();
    navigate("/login");
  };

  const submitChangeEmail = async (event) => {
    event.preventDefault();
    if (!accountForm.newEmail.trim()) {
      setFeedback("account", "error", "New email is required");
      return;
    }
    setActionKey("account.email");
    clearFeedback("account");
    const result = await apiService.changeEmail(accountForm.newEmail);
    setActionKey("");
    if (!result.success) {
      setFeedback("account", "error", result.error || "Failed to request email change");
      return;
    }
    setFeedback("account", "success", "Email change verification sent.");
    setAccountForm((prev) => ({ ...prev, newEmail: "" }));
  };

  const submitDeleteAccount = async (event) => {
    event.preventDefault();
    if (!accountForm.deletePassword) {
      setFeedback("account", "error", "Password confirmation is required for account deletion");
      return;
    }
    setActionKey("account.delete");
    clearFeedback("account");
    const result = await apiService.deleteAccount(accountForm.deletePassword);
    setActionKey("");
    if (!result.success) {
      setFeedback("account", "error", result.error || "Failed to delete account");
      return;
    }
    setFeedback("account", "success", "Account deletion has been scheduled.");
    setAccountForm((prev) => ({ ...prev, deletePassword: "" }));
  };

  const renderFeedback = (tab) => {
    const feedback = tabFeedback[tab];
    if (!feedback) return null;
    const isSuccess = feedback.type === "success";
    return (
      <div className={`mb-4 rounded-lg border px-4 py-3 flex items-start gap-2 ${isSuccess ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : "border-rose-500/40 bg-rose-500/10 text-rose-100"}`}>
        {isSuccess ? <CheckCircle2 className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
        <span>{feedback.message}</span>
      </div>
    );
  };

  const formatSessionDate = (dateStr) => {
    if (!dateStr) return "Unknown";
    return new Date(dateStr).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
  };

  const content = useMemo(() => {
    if (activeTab === "privacy") {
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Profile visibility</label>
            <select
              value={privacy.profile_visibility}
              onChange={(e) => setPrivacy((prev) => ({ ...prev, profile_visibility: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
            >
              <option value="public">Public</option>
              <option value="connections_only">Connections only</option>
            </select>
          </div>
          <Toggle label="Allow connection requests" checked={privacy.connection_request_setting} onChange={(v) => setPrivacy((prev) => ({ ...prev, connection_request_setting: v }))} />
          <Toggle label="Show my connections list" checked={privacy.show_connections_list} onChange={(v) => setPrivacy((prev) => ({ ...prev, show_connections_list: v }))} />
          <Toggle label="Show my activity status" checked={privacy.show_activity_status} onChange={(v) => setPrivacy((prev) => ({ ...prev, show_activity_status: v }))} />
          <button
            type="button"
            onClick={savePrivacy}
            disabled={!!actionKey}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {actionKey === "privacy.save" && <Loader2 className="w-4 h-4 animate-spin" />}
            {actionKey === "privacy.save" ? "Saving..." : "Save Privacy Settings"}
          </button>
        </div>
      );
    }

    if (activeTab === "notifications") {
      return (
        <div className="space-y-4">
          <Toggle label="Email: connection requests" checked={notifications.email_connection_requests} onChange={(v) => setNotifications((prev) => ({ ...prev, email_connection_requests: v }))} />
          <Toggle label="Email: messages" checked={notifications.email_messages} onChange={(v) => setNotifications((prev) => ({ ...prev, email_messages: v }))} />
          <Toggle label="Email: profile views" checked={notifications.email_profile_views} onChange={(v) => setNotifications((prev) => ({ ...prev, email_profile_views: v }))} />
          <Toggle label="Email: weekly digest" checked={notifications.email_weekly_digest} onChange={(v) => setNotifications((prev) => ({ ...prev, email_weekly_digest: v }))} />
          <Toggle label="In-app: connection requests" checked={notifications.inapp_connection_requests} onChange={(v) => setNotifications((prev) => ({ ...prev, inapp_connection_requests: v }))} />
          <Toggle label="In-app: messages" checked={notifications.inapp_messages} onChange={(v) => setNotifications((prev) => ({ ...prev, inapp_messages: v }))} />
          <Toggle label="In-app: profile views" checked={notifications.inapp_profile_views} onChange={(v) => setNotifications((prev) => ({ ...prev, inapp_profile_views: v }))} />
          <Toggle label="In-app: system updates" checked={notifications.inapp_system_updates} onChange={(v) => setNotifications((prev) => ({ ...prev, inapp_system_updates: v }))} />
          <div>
            <label className="text-sm text-gray-300">Notification frequency</label>
            <select
              value={notifications.notification_frequency}
              onChange={(e) => setNotifications((prev) => ({ ...prev, notification_frequency: e.target.value }))}
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
            >
              <option value="instant">Instant</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
          </div>
          <button
            type="button"
            onClick={saveNotifications}
            disabled={!!actionKey}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {actionKey === "notifications.save" && <Loader2 className="w-4 h-4 animate-spin" />}
            {actionKey === "notifications.save" ? "Saving..." : "Save Notification Settings"}
          </button>
        </div>
      );
    }

    if (activeTab === "security") {
      return (
        <div className="space-y-6">
          {/* Change password */}
          <form onSubmit={submitChangePassword} className="space-y-3 rounded-lg border border-white/15 p-4">
            <h3 className="text-white font-medium">Change Password</h3>
            <input
              type="password"
              value={securityForm.currentPassword}
              onChange={(e) => setSecurityForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
              placeholder="Current password"
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              required
            />
            <div>
              <input
                type="password"
                value={securityForm.newPassword}
                onChange={(e) => setSecurityForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                placeholder="New password"
                className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
                required
              />
              <PasswordStrengthChecker password={securityForm.newPassword} />
            </div>
            <input
              type="password"
              value={securityForm.confirmPassword}
              onChange={(e) => setSecurityForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
              placeholder="Confirm new password"
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              required
            />
            <button
              type="submit"
              disabled={!!actionKey}
              className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
            >
              {actionKey === "security.password" && <Loader2 className="w-4 h-4 animate-spin" />}
              {actionKey === "security.password" ? "Saving..." : "Update Password"}
            </button>
          </form>

          {/* Active sessions */}
          <div className="rounded-lg border border-white/15 p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-white font-medium">Active Sessions</h3>
              <button
                type="button"
                onClick={handleLogoutAllDevices}
                disabled={!!actionKey}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
              >
                {actionKey === "security.logoutAll" ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogOut className="w-3.5 h-3.5" />
                )}
                Logout from all devices
              </button>
            </div>

            {sessionsLoading ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <p className="text-gray-400 text-sm">No active sessions found.</p>
            ) : (
              <ul className="space-y-2">
                {sessions.map((session, idx) => {
                  const isMobile = /mobile|android|iphone|ipad/i.test(session.user_agent || "");
                  return (
                    <li
                      key={session.id || idx}
                      className="flex items-start gap-3 py-2 border-b border-white/10 last:border-0"
                    >
                      <div className="mt-0.5 text-gray-400">
                        {isMobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white truncate">
                          {session.user_agent
                            ? session.user_agent.slice(0, 60) + (session.user_agent.length > 60 ? "…" : "")
                            : "Unknown device"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Last active: {formatSessionDate(session.last_used_at || session.created_at)}
                          {session.ip_address ? ` · ${session.ip_address}` : ""}
                        </p>
                      </div>
                      {idx === 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex-shrink-0">
                          Current
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <form onSubmit={submitChangeEmail} className="space-y-2 rounded-lg border border-white/15 p-4">
          <h3 className="text-white font-medium">Change Email</h3>
          <input
            type="email"
            value={accountForm.newEmail}
            onChange={(e) => setAccountForm((prev) => ({ ...prev, newEmail: e.target.value }))}
            placeholder="New email"
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
            required
          />
          <button
            type="submit"
            disabled={!!actionKey}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {actionKey === "account.email" && <Loader2 className="w-4 h-4 animate-spin" />}
            Request Email Change
          </button>
        </form>

        <form onSubmit={submitDeleteAccount} className="space-y-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4">
          <h3 className="text-rose-200 font-medium">Delete Account</h3>
          <p className="text-sm text-rose-100/80">This schedules account deletion with a grace period.</p>
          <input
            type="password"
            value={accountForm.deletePassword}
            onChange={(e) => setAccountForm((prev) => ({ ...prev, deletePassword: e.target.value }))}
            placeholder="Confirm password"
            className="w-full rounded-lg bg-black/40 border border-rose-300/30 px-3 py-2 text-white"
            required
          />
          <button
            type="submit"
            disabled={!!actionKey}
            className="px-4 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {actionKey === "account.delete" && <Loader2 className="w-4 h-4 animate-spin" />}
            Delete Account
          </button>
        </form>
      </div>
    );
  }, [activeTab, privacy, notifications, accountForm, securityForm, sessions, sessionsLoading, actionKey]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 text-gray-300">Loading settings...</div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-300 mt-1">Manage your privacy, notifications, and account security.</p>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex gap-2 mb-5 flex-wrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  clearFeedback(tab.key);
                }}
                className={`px-3 py-1.5 rounded-full text-sm border ${activeTab === tab.key ? "bg-purple-500/30 border-purple-400/60 text-white" : "bg-white/5 border-white/15 text-gray-200"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {renderFeedback(activeTab)}
          {content}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
