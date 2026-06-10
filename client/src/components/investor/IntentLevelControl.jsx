import React, { useState } from "react";
import { Eye, Sparkles, Ban } from "lucide-react";
import {
  INTENT_BADGE_CLASS,
  INTENT_LEVELS,
  investorIntentService,
} from "../../services/investorIntentService";

const INTENT_ICONS = {
  WATCHING: Eye,
  INTERESTED: Sparkles,
  PASSED: Ban,
};

export const IntentBadge = ({ level }) => {
  if (!level) return null;
  const meta = INTENT_LEVELS.find((item) => item.value === level);
  const Icon = INTENT_ICONS[level];
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${INTENT_BADGE_CLASS[level] || ""}`}
      title={meta?.description}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {meta?.label || level}
    </span>
  );
};

const IntentLevelControl = ({
  connectionId,
  startupProfileId,
  value,
  onChange,
  compact = false,
  preConnection = false,
}) => {
  const [saving, setSaving] = useState(false);

  const handleChange = async (e) => {
    const next = e.target.value || null;
    setSaving(true);
    let result;
    if (connectionId) {
      result = await investorIntentService.setIntent(connectionId, next);
    } else if (startupProfileId) {
      if (next === "PASSED") {
        result = await investorIntentService.passStartup(startupProfileId);
        if (result.success) {
          onChange?.("PASSED");
        }
        setSaving(false);
        return;
      }
      result = await investorIntentService.setProfileIntent(startupProfileId, next);
    } else {
      setSaving(false);
      return;
    }
    setSaving(false);
    if (result.success) {
      onChange?.(result.data?.intent_level ?? next);
    }
  };

  const intentOptions = preConnection
    ? INTENT_LEVELS.filter((item) => item.value !== "PASSED")
    : INTENT_LEVELS;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <IntentBadge level={value} />
        <select
          value={value || ""}
          onChange={handleChange}
          disabled={saving}
          className="text-[10px] rounded-md border border-line bg-surface px-1.5 py-0.5 text-content-secondary"
          aria-label="Set intent level"
        >
          <option value="">Set intent…</option>
          {intentOptions.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <label className="text-[10px] font-semibold text-content-muted uppercase tracking-widest">
        Private intent
      </label>
      <select
        value={value || ""}
        onChange={handleChange}
        disabled={saving}
        className="w-full text-sm rounded-lg border border-line bg-surface px-3 py-2 text-content"
      >
        <option value="">No intent set</option>
        {intentOptions.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label} — {item.description}
          </option>
        ))}
      </select>
      {value && <IntentBadge level={value} />}
    </div>
  );
};

export default IntentLevelControl;
