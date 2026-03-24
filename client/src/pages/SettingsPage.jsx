import React, { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { apiService } from "../services/apiService";

const tabs = [
  { key: "privacy", label: "Privacy" },
  { key: "notifications", label: "Notifications" },
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

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState("privacy");
  const [loading, setLoading] = useState(true);
  const [actionKey, setActionKey] = useState("");
  const [tabFeedback, setTabFeedback] = useState({
    privacy: null,
    notifications: null,
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
    currentPassword: "",
    newPassword: "",
    deletePassword: "",
  });

  const setFeedback = (tab, type, message) => {
    setTabFeedback((prev) => ({
      ...prev,
      [tab]: {
        type,
        message,
        at: Date.now(),
      },
    }));
  };

  const clearFeedback = (tab) => {
    setTabFeedback((prev) => ({
      ...prev,
      [tab]: null,
    }));
  };

  const loadSettings = async () => {
    setLoading(true);

    const [privacyRes, notifRes] = await Promise.all([
      apiService.getPrivacySettings(),
      apiService.getNotificationSettings(),
    ]);

    if (!privacyRes.success) {
      setFeedback(
        "privacy",
        "error",
        privacyRes.error || "Failed to load privacy settings",
      );
      setLoading(false);
      return;
    }

    if (!notifRes.success) {
      setFeedback(
        "notifications",
        "error",
        notifRes.error || "Failed to load notification settings",
      );
      setLoading(false);
      return;
    }

    setPrivacy((prev) => ({ ...prev, ...(privacyRes.data?.data || {}) }));
    setNotifications((prev) => ({ ...prev, ...(notifRes.data?.data || {}) }));
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const savePrivacy = async () => {
    setActionKey("privacy.save");
    clearFeedback("privacy");

    const result = await apiService.updatePrivacySettings(privacy);
    setActionKey("");

    if (!result.success) {
      setFeedback(
        "privacy",
        "error",
        result.error || "Failed to save privacy settings",
      );
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
      setFeedback(
        "notifications",
        "error",
        result.error || "Failed to save notification settings",
      );
      return;
    }

    setFeedback("notifications", "success", "Notification settings saved.");
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
      setFeedback(
        "account",
        "error",
        result.error || "Failed to request email change",
      );
      return;
    }

    setFeedback("account", "success", "Email change verification sent.");
    setAccountForm((prev) => ({ ...prev, newEmail: "" }));
  };

  const submitChangePassword = async (event) => {
    event.preventDefault();
    if (!accountForm.currentPassword || !accountForm.newPassword) {
      setFeedback("account", "error", "Current and new password are required");
      return;
    }
    if (accountForm.newPassword.length < 8) {
      setFeedback(
        "account",
        "error",
        "New password must be at least 8 characters long",
      );
      return;
    }
    setActionKey("account.password");
    clearFeedback("account");

    const result = await apiService.changePassword({
      currentPassword: accountForm.currentPassword,
      newPassword: accountForm.newPassword,
    });
    setActionKey("");

    if (!result.success) {
      setFeedback(
        "account",
        "error",
        result.error || "Failed to change password",
      );
      return;
    }

    setFeedback(
      "account",
      "success",
      "Password changed successfully. Please log in again on other devices.",
    );
    setAccountForm((prev) => ({
      ...prev,
      currentPassword: "",
      newPassword: "",
    }));
  };

  const submitDeleteAccount = async (event) => {
    event.preventDefault();
    if (!accountForm.deletePassword) {
      setFeedback(
        "account",
        "error",
        "Password confirmation is required for account deletion",
      );
      return;
    }
    setActionKey("account.delete");
    clearFeedback("account");

    const result = await apiService.deleteAccount(accountForm.deletePassword);
    setActionKey("");

    if (!result.success) {
      setFeedback(
        "account",
        "error",
        result.error || "Failed to delete account",
      );
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
      <div
        className={`mb-4 rounded-lg border px-4 py-3 flex items-start gap-2 ${
          isSuccess
            ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100"
            : "border-rose-500/40 bg-rose-500/10 text-rose-100"
        }`}
      >
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 mt-0.5" />
        ) : (
          <AlertCircle className="w-5 h-5 mt-0.5" />
        )}
        <span>{feedback.message}</span>
      </div>
    );
  };

  const content = useMemo(() => {
    if (activeTab === "privacy") {
      return (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300">Profile visibility</label>
            <select
              value={privacy.profile_visibility}
              onChange={(e) =>
                setPrivacy((prev) => ({
                  ...prev,
                  profile_visibility: e.target.value,
                }))
              }
              className="mt-1 w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
            >
              <option value="public">Public</option>
              <option value="connections_only">Connections only</option>
            </select>
          </div>

          <Toggle
            label="Allow connection requests"
            checked={privacy.connection_request_setting}
            onChange={(v) =>
              setPrivacy((prev) => ({ ...prev, connection_request_setting: v }))
            }
          />
          <Toggle
            label="Show my connections list"
            checked={privacy.show_connections_list}
            onChange={(v) =>
              setPrivacy((prev) => ({ ...prev, show_connections_list: v }))
            }
          />
          <Toggle
            label="Show my activity status"
            checked={privacy.show_activity_status}
            onChange={(v) =>
              setPrivacy((prev) => ({ ...prev, show_activity_status: v }))
            }
          />

          <button
            type="button"
            onClick={savePrivacy}
            disabled={!!actionKey}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {actionKey === "privacy.save" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {actionKey === "privacy.save"
              ? "Saving..."
              : "Save Privacy Settings"}
          </button>
        </div>
      );
    }

    if (activeTab === "notifications") {
      return (
        <div className="space-y-4">
          <Toggle
            label="Email: connection requests"
            checked={notifications.email_connection_requests}
            onChange={(v) =>
              setNotifications((prev) => ({
                ...prev,
                email_connection_requests: v,
              }))
            }
          />
          <Toggle
            label="Email: messages"
            checked={notifications.email_messages}
            onChange={(v) =>
              setNotifications((prev) => ({ ...prev, email_messages: v }))
            }
          />
          <Toggle
            label="Email: profile views"
            checked={notifications.email_profile_views}
            onChange={(v) =>
              setNotifications((prev) => ({ ...prev, email_profile_views: v }))
            }
          />
          <Toggle
            label="Email: weekly digest"
            checked={notifications.email_weekly_digest}
            onChange={(v) =>
              setNotifications((prev) => ({ ...prev, email_weekly_digest: v }))
            }
          />
          <Toggle
            label="In-app: connection requests"
            checked={notifications.inapp_connection_requests}
            onChange={(v) =>
              setNotifications((prev) => ({
                ...prev,
                inapp_connection_requests: v,
              }))
            }
          />
          <Toggle
            label="In-app: messages"
            checked={notifications.inapp_messages}
            onChange={(v) =>
              setNotifications((prev) => ({ ...prev, inapp_messages: v }))
            }
          />
          <Toggle
            label="In-app: profile views"
            checked={notifications.inapp_profile_views}
            onChange={(v) =>
              setNotifications((prev) => ({ ...prev, inapp_profile_views: v }))
            }
          />
          <Toggle
            label="In-app: system updates"
            checked={notifications.inapp_system_updates}
            onChange={(v) =>
              setNotifications((prev) => ({ ...prev, inapp_system_updates: v }))
            }
          />

          <div>
            <label className="text-sm text-gray-300">
              Notification frequency
            </label>
            <select
              value={notifications.notification_frequency}
              onChange={(e) =>
                setNotifications((prev) => ({
                  ...prev,
                  notification_frequency: e.target.value,
                }))
              }
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
            {actionKey === "notifications.save" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            {actionKey === "notifications.save"
              ? "Saving..."
              : "Save Notification Settings"}
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <form
          onSubmit={submitChangeEmail}
          className="space-y-2 rounded-lg border border-white/15 p-4"
        >
          <h3 className="text-white font-medium">Change Email</h3>
          <input
            type="email"
            value={accountForm.newEmail}
            onChange={(e) =>
              setAccountForm((prev) => ({ ...prev, newEmail: e.target.value }))
            }
            placeholder="New email"
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
            required
          />
          <button
            type="submit"
            disabled={!!actionKey}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {actionKey === "account.email" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Request Email Change
          </button>
        </form>

        <form
          onSubmit={submitChangePassword}
          className="space-y-2 rounded-lg border border-white/15 p-4"
        >
          <h3 className="text-white font-medium">Change Password</h3>
          <input
            type="password"
            value={accountForm.currentPassword}
            onChange={(e) =>
              setAccountForm((prev) => ({
                ...prev,
                currentPassword: e.target.value,
              }))
            }
            placeholder="Current password"
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
            required
          />
          <input
            type="password"
            value={accountForm.newPassword}
            onChange={(e) =>
              setAccountForm((prev) => ({
                ...prev,
                newPassword: e.target.value,
              }))
            }
            placeholder="New password"
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
            required
          />
          <button
            type="submit"
            disabled={!!actionKey}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {actionKey === "account.password" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Change Password
          </button>
        </form>

        <form
          onSubmit={submitDeleteAccount}
          className="space-y-2 rounded-lg border border-rose-500/40 bg-rose-500/10 p-4"
        >
          <h3 className="text-rose-200 font-medium">Delete Account</h3>
          <p className="text-sm text-rose-100/80">
            This schedules account deletion with a grace period.
          </p>
          <input
            type="password"
            value={accountForm.deletePassword}
            onChange={(e) =>
              setAccountForm((prev) => ({
                ...prev,
                deletePassword: e.target.value,
              }))
            }
            placeholder="Confirm password"
            className="w-full rounded-lg bg-black/40 border border-rose-300/30 px-3 py-2 text-white"
            required
          />
          <button
            type="submit"
            disabled={!!actionKey}
            className="px-4 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-50 inline-flex items-center gap-2"
          >
            {actionKey === "account.delete" && (
              <Loader2 className="w-4 h-4 animate-spin" />
            )}
            Delete Account
          </button>
        </form>
      </div>
    );
  }, [activeTab, privacy, notifications, accountForm, actionKey]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 text-gray-300">
        Loading settings...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-300 mt-1">
            Manage your privacy, notifications, and account security.
          </p>
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
