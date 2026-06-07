/** Semantic class helpers — use design tokens only (see tailwind.config.js + index.css) */

export const navLinkClass = (isActive) =>
  `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? "text-primary bg-primary-light"
      : "text-content-secondary hover:text-content hover:bg-surface-alt"
  }`;

export const cardClass = "surface-card";

export const pageHeadingClass =
  "text-3xl md:text-4xl font-bold text-content tracking-tight";

export const pageSubheadingClass =
  "text-content-secondary text-base leading-relaxed";

export const badgeClass =
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-primary-light text-primary text-xs font-semibold";

export const inputClass =
  "w-full px-4 py-3 bg-surface border border-line rounded-xl text-content placeholder:text-content-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary-light transition-colors";

export const iconButtonClass =
  "w-10 h-10 rounded-full border border-line bg-surface text-content-secondary flex items-center justify-center hover:bg-surface-alt hover:text-content transition-colors shadow-soft";

/** Primary connect / CTA on blue backgrounds — white label text */
export const connectButtonClass =
  "rounded-xl bg-gradient-to-r from-primary to-primary-dark !text-content-inverse font-medium hover:opacity-90 transition-opacity shadow-soft disabled:opacity-40 disabled:cursor-not-allowed";

/** Avatar + name/role row on listing cards */
export const cardHeaderRowClass = "flex items-center gap-3";

/** Name + role/tagline block on listing cards */
export const cardIdentityClass = "card-identity";
export const cardIdentityTitleClass =
  "text-base font-semibold text-content leading-none truncate";
export const cardIdentitySubtitleClass =
  "text-xs text-primary font-medium leading-none uppercase tracking-wide truncate";
export const cardIdentitySubtitleMutedClass =
  "text-xs text-content-secondary font-medium leading-none line-clamp-2";

/** Profile section card title row (icon + heading) */
export const sectionHeaderClass = "section-header";
export const sectionHeaderIconClass =
  "w-4 h-4 text-content-muted flex-shrink-0";
export const sectionHeaderTitleClass =
  "text-base font-semibold text-content leading-none";

/** Label + value / tags block on listing cards */
export const cardFieldClass = "card-field";
export const cardFieldLabelClass =
  "text-[10px] text-content-muted uppercase tracking-wide font-medium leading-none";
export const cardFieldValueClass =
  "text-sm font-semibold text-primary leading-none truncate";
export const cardFieldValueRowClass = "flex items-center gap-1.5 min-w-0";

/** Name + role on profile header cards */
export const profileIdentityTitleClass =
  "text-2xl font-bold text-content leading-none truncate";
export const profileIdentitySubtitleClass =
  "text-sm text-primary font-medium leading-none uppercase tracking-wide";
export const profileIdentitySubtitleMutedClass =
  "text-sm text-content-secondary font-medium leading-none line-clamp-2";
