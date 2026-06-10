import React from "react";
import { Activity, BarChart3, Clock, MessageCircle } from "lucide-react";

const fmtDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const CredibilitySignals = ({ signals, userType = "startup" }) => {
  if (!signals) return null;

  const items = [
    signals.profile_completion_percentage != null && {
      icon: BarChart3,
      label: "Profile completeness",
      value: `${signals.profile_completion_percentage}%`,
    },
    userType === "startup" &&
      signals.milestone_updates_per_month != null && {
        icon: Activity,
        label: "Milestone updates",
        value: `${signals.milestone_updates_per_month}/month (90d)`,
      },
    signals.response_rate_label && {
      icon: MessageCircle,
      label: "Response rate (48h)",
      value: signals.response_rate_label,
      sub:
        signals.response_rate_percentage != null
          ? `${signals.response_rate_percentage}% of requests`
          : null,
    },
    {
      icon: Clock,
      label: "Last profile update",
      value: fmtDate(signals.last_profile_update_at),
    },
    {
      icon: Clock,
      label: "Last activity",
      value: fmtDate(signals.last_activity_at),
    },
  ].filter(Boolean);

  if (!items.length) return null;

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs text-content-muted uppercase tracking-wide mb-3">
        Credibility signals
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-line bg-surface-alt px-3 py-2.5 flex items-start gap-2"
          >
            <item.icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-[11px] text-content-muted">{item.label}</p>
              <p className="text-sm font-semibold text-content">{item.value}</p>
              {item.sub && (
                <p className="text-[10px] text-content-muted mt-0.5">{item.sub}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CredibilitySignals;
