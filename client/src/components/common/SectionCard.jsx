import React from "react";
import { Lock } from "lucide-react";
import {
  sectionHeaderClass,
  sectionHeaderIconClass,
  sectionHeaderTitleClass,
} from "../../styles/theme";

const ACCENT_BARS = {
  purple: "bg-primary",
  violet: "bg-primary",
  blue: "bg-primary",
  emerald: "bg-success",
  amber: "bg-warning",
  rose: "bg-primary",
};

export const SectionCard = ({
  title,
  icon: Icon,
  accent = "purple",
  badge,
  children,
  className = "",
}) => {
  const bar = ACCENT_BARS[accent] || ACCENT_BARS.purple;

  return (
    <div
      className={`relative rounded-card border border-outline-variant/30 bg-surface-container-lowest overflow-hidden shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300 ${className}`}
    >
      <div className={`h-1 w-full ${bar}`} />
      <div className="p-5 sm:p-6 md:p-8">
        <div className="flex items-center justify-between gap-3 mb-4 sm:mb-5">
          <div className={sectionHeaderClass}>
            {Icon && <Icon className={sectionHeaderIconClass} />}
            <h2 className={sectionHeaderTitleClass}>{title}</h2>
          </div>
          {badge}
        </div>
        {children}
      </div>
    </div>
  );
};

export const Pill = ({ children, color = "default", href }) => {
  const cls = {
    default: "bg-surface-container text-on-surface-variant border-outline-variant/30",
    purple: "bg-primary-fixed/15 border-primary/20 text-primary",
    violet: "bg-primary-fixed border-primary/20 text-primary",
    blue: "bg-primary/10 border-primary/20 text-primary",
    emerald: "bg-success/10 border-success/30 text-success",
    amber: "bg-warning/10 border-warning/30 text-warning",
    indigo: "bg-primary-fixed/15 border-primary/20 text-primary",
  }[color] || "bg-surface-container text-on-surface-variant border-outline-variant/30";

  const inner = (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-pill text-[11px] border font-semibold font-label uppercase tracking-wide ${cls}`}
    >
      {children}
    </span>
  );

  return href ? (
    <a href={href} target="_blank" rel="noreferrer">
      {inner}
    </a>
  ) : (
    inner
  );
};

export const TagGrid = ({ items, color = "default" }) => {
  if (!items?.length) return <p className="text-sm text-outline">—</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <Pill key={i} color={color}>
          {item}
        </Pill>
      ))}
    </div>
  );
};

export const PrivateBadge = () => (
  <span className="flex items-center gap-1 text-[10px] text-outline border border-outline-variant rounded-full px-2 py-0.5 shrink-0 font-label uppercase tracking-wide">
    <Lock className="w-2.5 h-2.5" /> Private
  </span>
);

export const LockOverlay = ({ message }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <div className="w-12 h-12 rounded-full bg-surface-container border border-outline-variant flex items-center justify-center">
      <Lock className="w-5 h-5 text-outline" />
    </div>
    <p className="text-sm text-on-surface-variant">{message}</p>
  </div>
);
