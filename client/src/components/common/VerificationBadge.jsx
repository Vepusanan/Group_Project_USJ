import React from "react";
import { BadgeCheck, Shield, ShieldAlert } from "lucide-react";

const TIER_CONFIG = {
  UNVERIFIED: {
    label: "Unverified",
    icon: ShieldAlert,
    className: "bg-surface-alt text-content-muted border-line",
  },
  IDENTITY_VERIFIED: {
    label: "Identity Verified",
    icon: BadgeCheck,
    className: "bg-primary/10 text-primary border-primary/30",
  },
  BUSINESS_VERIFIED: {
    label: "Business Verified",
    icon: Shield,
    className: "bg-success/10 text-success border-success/30",
  },
};

const VerificationBadge = ({ tier = "UNVERIFIED", size = "sm" }) => {
  const config = TIER_CONFIG[tier] || TIER_CONFIG.UNVERIFIED;
  const Icon = config.icon;
  const sizeCls =
    size === "lg"
      ? "text-sm px-3 py-1.5 gap-1.5"
      : "text-[11px] px-2 py-0.5 gap-1";

  return (
    <span
      className={`inline-flex items-center font-semibold border rounded-full ${config.className} ${sizeCls}`}
      title={`Verification: ${config.label}`}
    >
      <Icon className={size === "lg" ? "w-4 h-4" : "w-3 h-3"} />
      {config.label}
    </span>
  );
};

export default VerificationBadge;
