import React from "react";
import { Loader2 } from "lucide-react";
import {
  Feedback,
  Field,
  SectionHeader,
  Toggle,
  selectCls,
} from "./SettingsPrimitives";

const NotificationSettingsTab = ({
  notifications,
  setNotifications,
  feedback,
  busy,
  onSave,
}) => (
  <div className="space-y-4">
    <SectionHeader
      title="Notification Settings"
      description="Choose how and when you receive notifications."
    />
    <Feedback feedback={feedback} />

    <div className="rounded-lg border border-line p-4">
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide mb-2">
        Email Notifications
      </h3>
      <Toggle
        label="New connection requests"
        checked={notifications.email_connection_requests}
        onChange={(value) =>
          setNotifications((prev) => ({
            ...prev,
            email_connection_requests: value,
          }))
        }
      />
      <Toggle
        label="New messages"
        checked={notifications.email_messages}
        onChange={(value) =>
          setNotifications((prev) => ({ ...prev, email_messages: value }))
        }
      />
      <Toggle
        label="Profile views"
        checked={notifications.email_profile_views}
        onChange={(value) =>
          setNotifications((prev) => ({ ...prev, email_profile_views: value }))
        }
      />
      <Toggle
        label="Weekly activity summary"
        checked={notifications.email_weekly_digest}
        onChange={(value) =>
          setNotifications((prev) => ({ ...prev, email_weekly_digest: value }))
        }
      />
      <div className="pt-3">
        <Field label="Email frequency">
          <select
            className={selectCls}
            value={notifications.notification_frequency}
            onChange={(e) =>
              setNotifications((prev) => ({
                ...prev,
                notification_frequency: e.target.value,
              }))
            }
          >
            <option value="instant">Instant (as they happen)</option>
            <option value="daily">Daily digest</option>
            <option value="weekly">Weekly digest</option>
          </select>
        </Field>
      </div>
    </div>

    <div className="rounded-lg border border-line p-4">
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide mb-2">
        In-App Notifications
      </h3>
      <Toggle
        label="Connection requests"
        checked={notifications.inapp_connection_requests}
        onChange={(value) =>
          setNotifications((prev) => ({
            ...prev,
            inapp_connection_requests: value,
          }))
        }
      />
      <Toggle
        label="Messages"
        checked={notifications.inapp_messages}
        onChange={(value) =>
          setNotifications((prev) => ({ ...prev, inapp_messages: value }))
        }
      />
      <Toggle
        label="Profile views"
        checked={notifications.inapp_profile_views}
        onChange={(value) =>
          setNotifications((prev) => ({ ...prev, inapp_profile_views: value }))
        }
      />
      <Toggle
        label="System announcements"
        checked={notifications.inapp_system_updates}
        onChange={(value) =>
          setNotifications((prev) => ({
            ...prev,
            inapp_system_updates: value,
          }))
        }
      />
    </div>

    <button
      type="button"
      onClick={onSave}
      disabled={!!busy}
      className="px-5 py-2 rounded-lg bg-primary text-sm text-content-inverse font-medium disabled:opacity-50 inline-flex items-center gap-2"
    >
      {busy === "notifications" && <Loader2 className="w-4 h-4 animate-spin" />}
      {busy === "notifications" ? "Saving…" : "Save Notification Settings"}
    </button>
  </div>
);

export default NotificationSettingsTab;
