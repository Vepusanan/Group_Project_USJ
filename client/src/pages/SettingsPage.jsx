import React, { useEffect, useState, useCallback } from "react";
import {
  AlertCircle, CheckCircle2, Loader2, Monitor, Smartphone,
  LogOut, Shield, Bell, Eye, Settings2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const NAV_ITEMS = [
  { key: "account",       label: "Account Settings",    icon: Settings2 },
  { key: "privacy",       label: "Privacy Settings",    icon: Eye },
  { key: "notifications", label: "Notification Settings", icon: Bell },
  { key: "security",      label: "Password & Security", icon: Shield },
];

// ─── small helpers ────────────────────────────────────────────────────────────

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/10">
    <div>
      <p className="text-sm text-gray-200">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-500/40 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
    </label>
  </div>
);

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

const inputCls = "w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500 text-sm";
const selectCls = "w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white text-sm";

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Uppercase letter",       ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter",       ok: /[a-z]/.test(password) },
    { label: "Number",                 ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  const passed = checks.filter((c) => c.ok).length;
  const barColor = passed <= 1 ? "bg-red-500" : passed <= 2 ? "bg-amber-500" : passed <= 3 ? "bg-yellow-400" : "bg-emerald-500";
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < passed ? barColor : "bg-white/10"}`} />
        ))}
      </div>
      <ul className="space-y-0.5">
        {checks.map(({ label, ok }) => (
          <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-400" : "text-gray-500"}`}>
            <span>{ok ? "✓" : "○"}</span>{label}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Feedback = ({ feedback }) => {
  if (!feedback) return null;
  const ok = feedback.type === "success";
  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 flex items-start gap-2 text-sm ${ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : "border-rose-500/40 bg-rose-500/10 text-rose-100"}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
      <span>{feedback.message}</span>
    </div>
  );
};

const SectionHeader = ({ title, description }) => (
  <div className="mb-5">
    <h2 className="text-xl font-semibold text-white">{title}</h2>
    {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
  </div>
);

// ─── main page ───────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || user?.user_type || "startup";

  const [activeTab, setActiveTab] = useState("account");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState({});

  // ── privacy / notifications state ──────────────────────────────────────────
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

  // ── account form state ─────────────────────────────────────────────────────
  const [accountForm, setAccountForm] = useState({ newEmail: "", deletePassword: "" });

  // ── security form state ────────────────────────────────────────────────────
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // ── helpers ────────────────────────────────────────────────────────────────
  const setFb = (tab, type, message) => setFeedback((p) => ({ ...p, [tab]: { type, message } }));
  const clearFb = (tab) => setFeedback((p) => ({ ...p, [tab]: null }));

  // ── initial data load ──────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const [privRes, notifRes] = await Promise.all([
        apiService.getPrivacySettings(),
        apiService.getNotificationSettings(),
      ]);
      if (privRes.success) setPrivacy((p) => ({ ...p, ...(privRes.data?.data || {}) }));
      else setFb("privacy", "error", privRes.error || "Failed to load privacy settings");
      if (notifRes.success) setNotifications((p) => ({ ...p, ...(notifRes.data?.data || {}) }));
      else setFb("notifications", "error", notifRes.error || "Failed to load notification settings");
    } catch {
      setFb("account", "error", "Network error — settings could not be loaded. Please refresh.");
    }
    setSettingsLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (activeTab === "security") loadSessions();
  }, [activeTab]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await apiService.getSessions();
      if (res.success) setSessions(res.data?.sessions || res.data || []);
      else setFb("security", "error", res.error || "Failed to load sessions");
    } catch {
      setFb("security", "error", "Network error — sessions could not be loaded.");
    }
    setSessionsLoading(false);
  };

  // ── save handlers ──────────────────────────────────────────────────────────

  const savePrivacy = async () => {
    clearFb("privacy");
    setBusy("privacy");
    const r = await apiService.updatePrivacySettings(privacy);
    setBusy("");
    if (!r.success) { setFb("privacy", "error", r.error || "Failed to save"); return; }
    setFb("privacy", "success", "Privacy settings saved.");
  };

  const saveNotifications = async () => {
    clearFb("notifications");
    setBusy("notifications");
    const r = await apiService.updateNotificationSettings(notifications);
    setBusy("");
    if (!r.success) { setFb("notifications", "error", r.error || "Failed to save"); return; }
    setFb("notifications", "success", "Notification settings saved.");
  };

  const changeEmail = async (e) => {
    e.preventDefault();
    if (!accountForm.newEmail.trim()) { setFb("account", "error", "New email is required"); return; }
    clearFb("account");
    setBusy("account.email");
    const r = await apiService.changeEmail(accountForm.newEmail);
    setBusy("");
    if (!r.success) { setFb("account", "error", r.error || "Failed to change email"); return; }
    setFb("account", "success", "Verification email sent to your new address.");
    setAccountForm((p) => ({ ...p, newEmail: "" }));
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.deletePassword) { setFb("account", "error", "Password is required"); return; }
    clearFb("account");
    setBusy("account.delete");
    const r = await apiService.deleteAccount(accountForm.deletePassword);
    setBusy("");
    if (!r.success) { setFb("account", "error", r.error || "Failed to delete account"); return; }
    setFb("account", "success", "Account deletion scheduled. You have 30 days to cancel.");
    setAccountForm((p) => ({ ...p, deletePassword: "" }));
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = securityForm;
    if (!currentPassword || !newPassword) { setFb("security", "error", "All fields are required"); return; }
    if (newPassword.length < 10) { setFb("security", "error", "Password must be at least 10 characters"); return; }
    if (newPassword !== confirmPassword) { setFb("security", "error", "Passwords do not match"); return; }
    clearFb("security");
    setBusy("security.pw");
    const r = await apiService.changePassword({ currentPassword, newPassword });
    setBusy("");
    if (!r.success) { setFb("security", "error", r.error || "Failed to change password"); return; }
    setFb("security", "success", "Password changed. All other sessions will be signed out.");
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const logoutAll = async () => {
    clearFb("security");
    setBusy("security.logoutAll");
    const r = await apiService.logoutAllDevices();
    setBusy("");
    if (!r.success) { setFb("security", "error", r.error || "Failed"); return; }
    await logout();
    navigate("/login");
  };

  const downloadData = () => {
    const blob = new Blob([JSON.stringify({ user }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── format helpers ─────────────────────────────────────────────────────────
  const fmtDate = (ds) => ds ? new Date(ds).toLocaleDateString([], { dateStyle: "medium" }) : "—";
  const fmtSession = (ds) => ds ? new Date(ds).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Unknown";

  // ─────────────────────────────────────────────────────────────────────────
  // Tab content renderers
  // ─────────────────────────────────────────────────────────────────────────

  const renderAccount = () => (
    <div className="space-y-5">
      <SectionHeader title="Account Settings" />
      <Feedback feedback={feedback.account} />

      {/* Account status info */}
      <div className="rounded-lg border border-white/10 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Account Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm text-white mt-0.5">{user?.email || "—"}</p>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-xs text-gray-500">User Type</p>
            <p className="text-sm text-white mt-0.5 capitalize">{role}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">To change type, create a new account</p>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-xs text-gray-500">Member Since</p>
            <p className="text-sm text-white mt-0.5">{fmtDate(user?.createdAt)}</p>
          </div>
        </div>
      </div>

      {/* Change email */}
      <form onSubmit={changeEmail} className="rounded-lg border border-white/10 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Change Email</h3>
        <p className="text-xs text-gray-500">A verification email will be sent to the new address. Your old email will be notified.</p>
        <input
          className={inputCls}
          type="email"
          value={accountForm.newEmail}
          onChange={(e) => setAccountForm((p) => ({ ...p, newEmail: e.target.value }))}
          placeholder="New email address"
          required
        />
        <button type="submit" disabled={!!busy} className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2">
          {busy === "account.email" && <Loader2 className="w-4 h-4 animate-spin" />}
          Request Email Change
        </button>
      </form>

      {/* Delete */}
      <form onSubmit={deleteAccount} className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-rose-300 uppercase tracking-wide">Delete Account</h3>
        <p className="text-xs text-rose-200/70">Your account will be deactivated immediately. After 30 days all data is permanently deleted.</p>
        <input
          className={`${inputCls} border-rose-400/30`}
          type="password"
          value={accountForm.deletePassword}
          onChange={(e) => setAccountForm((p) => ({ ...p, deletePassword: e.target.value }))}
          placeholder="Confirm your password"
          required
        />
        <button type="submit" disabled={!!busy} className="px-4 py-2 rounded-lg bg-rose-600 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2">
          {busy === "account.delete" && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete My Account
        </button>
      </form>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-4">
      <SectionHeader title="Privacy Settings" description="Control who can see your profile and contact information." />
      <Feedback feedback={feedback.privacy} />

      <div className="rounded-lg border border-white/10 p-4 space-y-1">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Profile Visibility</h3>
        <Field label="Who can view your full profile">
          <select className={selectCls} value={privacy.profile_visibility} onChange={(e) => setPrivacy((p) => ({ ...p, profile_visibility: e.target.value }))}>
            <option value="public">Public — anyone can view</option>
            <option value="connections_only">Connections only</option>
          </select>
        </Field>
        <p className="text-xs text-gray-500 mt-1">Basic information is always visible in search results.</p>
      </div>

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">Connection Settings</h3>
        <Toggle label="Allow connection requests" description="Allow other users to send you connection requests" checked={privacy.connection_request_setting} onChange={(v) => setPrivacy((p) => ({ ...p, connection_request_setting: v }))} />
        <Toggle label="Show my connections list" description="Display your connections list on your profile" checked={privacy.show_connections_list} onChange={(v) => setPrivacy((p) => ({ ...p, show_connections_list: v }))} />
        <Toggle label="Show activity status" description="Let others see when you were last active" checked={privacy.show_activity_status} onChange={(v) => setPrivacy((p) => ({ ...p, show_activity_status: v }))} />
      </div>

      <button type="button" onClick={savePrivacy} disabled={!!busy} className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
        {busy === "privacy" && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy === "privacy" ? "Saving…" : "Save Privacy Settings"}
      </button>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <SectionHeader title="Notification Settings" description="Choose how and when you receive notifications." />
      <Feedback feedback={feedback.notifications} />

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">Email Notifications</h3>
        <Toggle label="New connection requests" checked={notifications.email_connection_requests} onChange={(v) => setNotifications((p) => ({ ...p, email_connection_requests: v }))} />
        <Toggle label="New messages" checked={notifications.email_messages} onChange={(v) => setNotifications((p) => ({ ...p, email_messages: v }))} />
        <Toggle label="Profile views" checked={notifications.email_profile_views} onChange={(v) => setNotifications((p) => ({ ...p, email_profile_views: v }))} />
        <Toggle label="Weekly activity summary" checked={notifications.email_weekly_digest} onChange={(v) => setNotifications((p) => ({ ...p, email_weekly_digest: v }))} />
        <div className="pt-3">
          <Field label="Email frequency">
            <select className={selectCls} value={notifications.notification_frequency} onChange={(e) => setNotifications((p) => ({ ...p, notification_frequency: e.target.value }))}>
              <option value="instant">Instant (as they happen)</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">In-App Notifications</h3>
        <Toggle label="Connection requests" checked={notifications.inapp_connection_requests} onChange={(v) => setNotifications((p) => ({ ...p, inapp_connection_requests: v }))} />
        <Toggle label="Messages" checked={notifications.inapp_messages} onChange={(v) => setNotifications((p) => ({ ...p, inapp_messages: v }))} />
        <Toggle label="Profile views" checked={notifications.inapp_profile_views} onChange={(v) => setNotifications((p) => ({ ...p, inapp_profile_views: v }))} />
        <Toggle label="System announcements" checked={notifications.inapp_system_updates} onChange={(v) => setNotifications((p) => ({ ...p, inapp_system_updates: v }))} />
      </div>

      <button type="button" onClick={saveNotifications} disabled={!!busy} className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
        {busy === "notifications" && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy === "notifications" ? "Saving…" : "Save Notification Settings"}
      </button>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-5">
      <SectionHeader title="Password & Security" description="Manage your password, sessions, and account security." />
      <Feedback feedback={feedback.security} />

      {/* Change password */}
      <form onSubmit={changePassword} className="rounded-lg border border-white/10 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Change Password</h3>
        <input
          className={inputCls}
          type="password"
          value={securityForm.currentPassword}
          onChange={(e) => setSecurityForm((p) => ({ ...p, currentPassword: e.target.value }))}
          placeholder="Current password"
          required
        />
        <div>
          <input
            className={inputCls}
            type="password"
            value={securityForm.newPassword}
            onChange={(e) => setSecurityForm((p) => ({ ...p, newPassword: e.target.value }))}
            placeholder="New password"
            required
          />
          <PasswordStrength password={securityForm.newPassword} />
        </div>
        <input
          className={inputCls}
          type="password"
          value={securityForm.confirmPassword}
          onChange={(e) => setSecurityForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          placeholder="Confirm new password"
          required
        />
        <p className="text-xs text-gray-500">All active sessions will be terminated after the password change.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <button type="submit" disabled={!!busy} className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2">
            {busy === "security.pw" && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
          <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
            I forgot my current password →
          </Link>
        </div>
      </form>

      {/* 2FA info */}
      <div className="rounded-lg border border-white/10 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Two-Factor Authentication</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">Active</span>
          <span className="text-sm text-gray-300">Email-based verification</span>
        </div>
        <p className="text-xs text-gray-500">SMS and authenticator app options coming in a future release.</p>
      </div>

      {/* Active sessions */}
      <div className="rounded-lg border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Active Sessions</h3>
          <button
            type="button"
            onClick={logoutAll}
            disabled={!!busy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
          >
            {busy === "security.logoutAll" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            Logout from all devices
          </button>
        </div>
        {sessionsLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500">No session data available.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s, idx) => {
              const deviceStr = s.device_info || s.user_agent || "";
              const mobile = /mobile|android|iphone|ipad/i.test(deviceStr);
              return (
                <li key={s.id || idx} className="flex items-start gap-3 py-2 border-b border-white/10 last:border-0">
                  <div className="mt-0.5 text-gray-400 flex-shrink-0">
                    {mobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{deviceStr ? deviceStr.slice(0, 70) + (deviceStr.length > 70 ? "…" : "") : "Unknown device"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last active: {fmtSession(s.last_used_at || s.created_at)}
                      {s.client_ip ? ` · ${s.client_ip}` : ""}
                    </p>
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex-shrink-0">Current</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Login history placeholder */}
      <div className="rounded-lg border border-white/10 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Login History</h3>
        <p className="text-xs text-gray-500">Recent login activity is shown in your active sessions above. Each entry represents a device that authenticated with your account.</p>
        <p className="text-xs text-gray-500">If you see a session you don't recognise, log out from all devices immediately and change your password.</p>
      </div>

      {/* Data & Privacy */}
      <div className="rounded-lg border border-white/10 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Data & Privacy</h3>
        <p className="text-xs text-gray-500">Download a copy of all the data associated with your account.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadData}
            className="px-4 py-2 rounded-lg border border-white/20 text-sm text-white hover:bg-white/5 transition-colors"
          >
            Download my data
          </button>
        </div>
        <div className="flex gap-4 mt-1">
          <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Data usage policy</a>
          <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Privacy policy</a>
        </div>
      </div>
    </div>
  );

  const tabContent = {
    account: renderAccount,
    privacy: renderPrivacy,
    notifications: renderNotifications,
    security: renderSecurity,
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center text-gray-300">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your account, privacy, and security.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left sidebar nav ── */}
          <nav className="lg:w-56 flex-shrink-0">
            <ul className="space-y-1">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => { setActiveTab(key); clearFb(key); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      activeTab === key
                        ? "bg-purple-500/20 border border-purple-400/30 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 rounded-xl border border-white/15 bg-black/45 p-6">
            {tabContent[activeTab]?.()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
