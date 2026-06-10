import React from "react";
import { Loader2 } from "lucide-react";
import {
  Feedback,
  Field,
  SectionHeader,
  Toggle,
  selectCls,
} from "./SettingsPrimitives";

const PrivacySettingsTab = ({
  privacy,
  setPrivacy,
  feedback,
  busy,
  onSave,
}) => (
  <div className="space-y-4">
    <SectionHeader
      title="Privacy Settings"
      description="Control who can see your profile and contact information."
    />
    <Feedback feedback={feedback} />

    <div className="rounded-lg border border-line p-4 space-y-1">
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide mb-3">
        Profile Visibility
      </h3>
      <Field label="Who can view your full profile">
        <select
          className={selectCls}
          value={privacy.profile_visibility}
          onChange={(e) =>
            setPrivacy((prev) => ({
              ...prev,
              profile_visibility: e.target.value,
            }))
          }
        >
          <option value="public">Public — anyone can view</option>
          <option value="connections_only">Connections only</option>
        </select>
      </Field>
      <p className="text-xs text-content-muted mt-1">
        Basic information is always visible in search results.
      </p>
    </div>

    <div className="rounded-lg border border-line p-4">
      <h3 className="text-sm font-semibold text-content-secondary uppercase tracking-wide mb-2">
        Connection Settings
      </h3>
      <Toggle
        label="Allow connection requests"
        description="Allow other users to send you connection requests"
        checked={privacy.connection_request_setting}
        onChange={(value) =>
          setPrivacy((prev) => ({ ...prev, connection_request_setting: value }))
        }
      />
      <Toggle
        label="Show my connections list"
        description="Display your connections list on your profile"
        checked={privacy.show_connections_list}
        onChange={(value) =>
          setPrivacy((prev) => ({ ...prev, show_connections_list: value }))
        }
      />
      <Toggle
        label="Show activity status"
        description="Let others see when you were last active"
        checked={privacy.show_activity_status}
        onChange={(value) =>
          setPrivacy((prev) => ({ ...prev, show_activity_status: value }))
        }
      />
    </div>

    <button
      type="button"
      onClick={onSave}
      disabled={!!busy}
      className="px-5 py-2 rounded-lg bg-primary text-sm text-content-inverse font-medium disabled:opacity-50 inline-flex items-center gap-2"
    >
      {busy === "privacy" && <Loader2 className="w-4 h-4 animate-spin" />}
      {busy === "privacy" ? "Saving…" : "Save Privacy Settings"}
    </button>
  </div>
);

export default PrivacySettingsTab;
