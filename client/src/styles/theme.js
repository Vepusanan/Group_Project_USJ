/** Semantic class helpers — StartupConnect design system (UI_inspiration) */

export const navLinkClass = (isActive) =>
  `px-3 py-2 text-label-caps font-label uppercase tracking-wider transition-colors duration-200 ${
    isActive
      ? "text-primary font-bold border-b-2 border-primary pb-1"
      : "text-on-surface-variant font-medium hover:text-primary"
  }`;

export const cardClass =
  "relative bg-surface-container-lowest rounded-card border border-outline-variant/30 shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden";

export const discoveryCardClass =
  "relative w-full min-w-0 box-border bg-surface-container-lowest rounded-[24px] border border-outline-variant/30 p-5 sm:p-6 shadow-premium hover:shadow-premium-hover hover:-translate-y-0.5 transition-all duration-300 overflow-hidden group flex flex-col h-full";

export const pageShellClass = "min-h-screen bg-background text-on-surface";

// Adds top padding so page headers don't sit under the floating nav.
export const pageContainerClass =
  "w-full max-w-container mx-auto px-5 md:px-gutter pt-24 pb-8 md:pt-28 md:pb-10";

// Inner content width for authenticated / app pages (profiles, analytics, settings, etc.).
export const pageContentClass = "w-full max-w-container mx-auto";

// Discovery listing pages share the same app shell width.
export const discoveryPageContainerClass = pageContainerClass;

export const discoveryResultsGridClass = (isListView) =>
  isListView
    ? "grid w-full min-w-0 grid-cols-1 gap-5"
    : "grid w-full min-w-0 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 lg:gap-6";

export const discoveryTagPillClass =
  "inline-flex items-center rounded-pill bg-surface-container px-3 py-1 text-xs font-medium text-on-surface-variant";

export const formatDiscoveryTagLabel = (value) => {
  if (!value) return value;
  return String(value)
    .replace(/_/g, " ")
    .split(/,\s*/)
    .map((part) =>
      part
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    )
    .join(", ");
};

export const pageHeadingClass =
  "font-display text-display-hero-mobile md:text-headline-lg text-on-surface tracking-tight";

export const pageSubheadingClass =
  "text-body-lg text-on-surface-variant leading-relaxed mt-2";

export const pageEyebrowClass =
  "font-label text-label-caps uppercase tracking-widest text-primary mb-2 block";

export const badgeClass =
  "inline-flex items-center gap-1.5 px-3 py-1 rounded-pill bg-primary-fixed text-primary text-label-caps font-label uppercase tracking-wide";

export const tagPillClass =
  "inline-flex items-center px-3 py-1 rounded-pill bg-surface-container text-on-surface-variant text-label-caps font-label uppercase tracking-wide text-[11px]";

export const inputClass =
  "w-full px-4 py-3 bg-surface-container-lowest border border-outline-variant rounded-xl text-body-md text-on-surface placeholder:text-outline focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors";

export const iconButtonClass =
  "w-10 h-10 rounded-full border border-outline-variant bg-surface-container-lowest text-on-surface-variant flex items-center justify-center hover:bg-surface-container hover:text-primary transition-colors shadow-soft";

export const connectButtonClass =
  "rounded-xl bg-primary text-on-primary font-semibold text-button-text hover:bg-primary-dark active:scale-95 transition-all shadow-soft disabled:opacity-40 disabled:cursor-not-allowed";

export const secondaryButtonClass =
  "rounded-xl border border-outline-variant bg-surface-container-lowest text-on-surface font-semibold text-button-text hover:bg-surface-container transition-all active:scale-95";

export const cardHeaderRowClass = "flex items-center gap-3";

export const cardIdentityClass = "card-identity";
export const cardIdentityTitleClass =
  "font-headline text-headline-md text-on-surface leading-none truncate";
export const cardIdentitySubtitleClass =
  "font-label text-label-caps uppercase tracking-wide text-primary leading-none truncate";
export const cardIdentitySubtitleMutedClass =
  "text-body-md text-on-surface-variant leading-snug line-clamp-2";

export const sectionHeaderClass = "section-header";
export const sectionHeaderIconClass =
  "w-4 h-4 text-outline flex-shrink-0";
export const sectionHeaderTitleClass =
  "font-headline text-headline-md text-on-surface leading-none";

export const cardFieldClass = "card-field";
export const cardFieldLabelClass =
  "font-label text-label-caps uppercase tracking-wider text-outline leading-none";
export const cardFieldValueClass =
  "text-sm font-semibold text-primary leading-none truncate";
export const cardFieldValueRowClass = "flex items-center gap-1.5 min-w-0";

export const profileIdentityTitleClass =
  "font-display text-headline-lg text-on-surface leading-none truncate";
export const profileIdentitySubtitleClass =
  "font-label text-label-caps uppercase tracking-wide text-primary leading-none";
export const profileIdentitySubtitleMutedClass =
  "text-body-md text-on-surface-variant leading-snug line-clamp-2";

export const tabNavClass = (isActive) =>
  `font-label text-label-caps uppercase tracking-wider pb-3 transition-colors ${
    isActive
      ? "text-primary font-bold border-b-2 border-primary"
      : "text-on-surface-variant hover:text-primary"
  }`;

export const floatingNavShellClass =
  "fixed top-4 inset-x-0 z-[100] px-5 md:px-gutter";

export const floatingNavPillClass = "floating-nav-pill";

export const floatingNavLinkClass = (isActive) =>
  `font-label text-label-caps uppercase tracking-wider px-3 py-1.5 rounded-full text-[11px] transition-all whitespace-nowrap ${
    isActive
      ? "bg-primary text-on-primary font-bold shadow-soft"
      : "text-primary font-semibold hover:bg-primary-fixed"
  }`;

export const floatingNavIconClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-primary/20 bg-primary-fixed/40 text-primary transition-colors hover:bg-primary-fixed hover:border-primary/30";

export const stickyFilterBarClass =
  "sticky top-20 z-30 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30";
