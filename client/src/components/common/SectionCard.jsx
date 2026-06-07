import React from "react";
import { Lock } from "lucide-react";
import {
  sectionHeaderClass,
  sectionHeaderIconClass,
  sectionHeaderTitleClass,
} from "../../styles/theme";

const ACCENT_BARS = {
  purple: "from-primary to-primary-dark",
  violet: "from-primary to-primary-dark",
  blue: "from-primary to-primary-dark",
  emerald: "from-primary to-primary-dark",
  amber: "from-primary-dark to-primary",
  rose: "from-primary to-primary-dark",
};

export const SectionCard = ({
  title,
  icon: Icon,
  accent = "purple",
  badge,
  children,
}) => {
  const bar = ACCENT_BARS[accent] || ACCENT_BARS.purple;

  return (
    <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-card">
      <div className={`h-0.5 w-full bg-gradient-to-r ${bar}`} />
      <div className="p-4 sm:p-6">
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
    default: "bg-surface-alt border-line text-content-secondary",
    purple: "bg-primary-light/15 border-primary-light/25 text-primary",
    violet: "bg-primary-light border-primary-light text-primary",
    blue: "bg-primary/15 border-primary-light text-primary",
    emerald: "bg-primary-light border-primary-light text-primary",
    amber: "bg-warning/15 border-warning/30 text-warning",
    indigo: "bg-primary-light/15 border-primary-light text-primary",
  }[color] || "bg-surface-alt border-line text-content-secondary";

  const inner = (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border font-medium ${cls}`}
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
  if (!items?.length) return <p className="text-sm text-content-muted">—</p>;
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
  <span className="flex items-center gap-1 text-[10px] text-content-muted border border-line rounded-full px-2 py-0.5 shrink-0">
    <Lock className="w-2.5 h-2.5" /> Private
  </span>
);

export const LockOverlay = ({ message }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <div className="w-12 h-12 rounded-full bg-surface-alt border border-line flex items-center justify-center">
      <Lock className="w-5 h-5 text-content-muted" />
    </div>
    <p className="text-sm text-content-muted">{message}</p>
  </div>
);
