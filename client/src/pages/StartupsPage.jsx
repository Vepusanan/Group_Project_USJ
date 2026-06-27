import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid, List, MapPin, Search, ChevronDown, ArrowUpDown, X, Sparkles, Bookmark, Columns3, Play, Ban, Calendar, Users, Globe } from "lucide-react";
import ConnectModal from "../components/connections/ConnectModal";
import MatchExplanationBlock from "../components/investor/MatchExplanationBlock";
import investorIntentService from "../services/investorIntentService";
import VerificationBadge from "../components/common/VerificationBadge";
import engagementService from "../services/engagementService";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";
import {
  getProfileRelationship,
  PROFILE_OWNER_TYPES,
} from "../utils/profileRelationship";
import {
  connectButtonClass,
  discoveryCardClass,
  discoveryPageContainerClass,
  discoveryResultsGridClass,
  discoveryTagPillClass,
  formatDiscoveryTagLabel,
  pageEyebrowClass,
  pageHeadingClass,
  pageSubheadingClass,
} from "../styles/theme";
import { useDebounce } from "../hooks/useDebounce";
import { INVESTOR_INDUSTRY_OPTIONS } from "../utils/investorFilterOptions";
import { buildStartupApiParams } from "../utils/listingFilters";
import {
  formatCoolingEnd,
  isInConnectionCooling,
} from "../utils/connectionCooling";
import {
  buildListingCacheKey,
  fetchListingDeduped,
  invalidateListingNamespace,
  readListingCache,
  writeListingCache,
} from "../hooks/useListingCache";

const defaultFilters = {
  q: "",
  industry: "",
  location_country: "",
  funding_stage: "",
  revenue_status: "",
  min_verification: "",
  connected_only: false,
  sort: "newest",
};

const VERIFICATION_FILTERS = [
  { value: "", label: "All verification levels" },
  { value: "IDENTITY_VERIFIED", label: "Identity Verified+" },
  { value: "BUSINESS_VERIFIED", label: "Business Verified only" },
];

const FUNDING_STAGES = [
  { value: "PRE_SEED", label: "Pre-seed" },
  { value: "SEED", label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "SERIES_D_PLUS", label: "Series D+" },
];

const REVENUE_STATUSES = [
  { value: "PRE_REVENUE", label: "Pre-revenue" },
  { value: "REVENUE_GENERATING", label: "Revenue-generating" },
  { value: "PROFITABLE", label: "Profitable" },
];

const statusBadgeClass = {
  self: "bg-surface-alt text-content-secondary border-line",
  not_connected: "bg-warning/10 text-warning border-warning/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  accepted: "bg-success/10 text-success border-success/30",
  declined: "bg-error/10 text-error border-error/30",
};

const truncateDescription = (value, maxLength = 130) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "No startup description provided yet.";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const STARTUP_AVATAR_GRADIENTS = [
  "from-primary to-primary-dark",
  "from-primary to-primary-dark",
  "from-primary-dark to-primary",
  "from-primary-dark to-primary",
  "from-primary to-primary-dark",
];

const getStartupGradient = (name = "") => {
  const idx = (name.charCodeAt(0) || 0) % STARTUP_AVATAR_GRADIENTS.length;
  return STARTUP_AVATAR_GRADIENTS[idx];
};

const STAGE_LABEL = {
  PRE_SEED: "Pre-seed", SEED: "Seed", SERIES_A: "Series A",
  SERIES_B: "Series B", SERIES_C: "Series C", SERIES_D_PLUS: "Series D+",
};

const getMatchScoreBadgeClass = (score) => {
  if (score >= 80) return "bg-green-100 text-green-700";
  if (score >= 60) return "bg-blue-100 text-blue-700";
  return "bg-orange-100 text-orange-700";
};

const filterFieldClass =
  "w-full h-11 appearance-none rounded-xl bg-surface-container-low border border-outline-variant/40 pl-3 pr-9 text-sm text-on-surface transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

const filterInputClass =
  "w-full h-11 rounded-xl bg-surface-container-low border border-outline-variant/40 pl-10 pr-3 text-sm text-on-surface placeholder:text-outline transition-all duration-200 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

const viewToggleBtnClass = (active) =>
  `p-1.5 rounded-md transition-all duration-200 ${
    active
      ? "bg-white text-primary shadow-sm"
      : "text-on-surface-variant hover:bg-white/60 hover:text-on-surface"
  }`;

const buildPageNumbers = (current, total, maxVisible = 5) => {
  if (total <= 1) return [1];
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  let start = Math.max(1, current - Math.floor(maxVisible / 2));
  let end = start + maxVisible - 1;
  if (end > total) {
    end = total;
    start = Math.max(1, end - maxVisible + 1);
  }
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
};

const fmtMoney = (val) => {
  const amount = Number(val);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
};

const getFooterStat = (startup) => {
  const seeking = fmtMoney(startup.amount_seeking);
  if (seeking) {
    return { label: "Seeking", value: seeking };
  }
  return null;
};

const MatchScoreBadge = ({ score }) => {
  if (score == null || Number.isNaN(Number(score))) return null;

  const normalized = Math.round(Number(score));
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${getMatchScoreBadgeClass(normalized)}`}
      title="Compatibility based on your stated investment preferences"
    >
      <Sparkles className="w-3.5 h-3.5" />
      {normalized}% Match
    </span>
  );
};

const StartupCard = React.memo(({
  startup,
  onConnect,
  onAccept,
  onDecline,
  isConnecting,
  relationship,
  showMatchScore,
  showWatchlist,
  onWatchlistToggle,
  onPass,
  isPassing,
  showCompare,
  isSelectedForCompare,
  onToggleCompare,
}) => {
  const navigate = useNavigate();
  const startupProfileId = startup.startup_profile_id || startup.id;
  const connectionStatus = startup.connection_status || "not_connected";
  const inDeclineCooling =
    connectionStatus === "declined" &&
    isInConnectionCooling(startup.connection_declined_at);
  const canConnect =
    !["self", "pending", "accepted"].includes(connectionStatus) &&
    !inDeclineCooling;
  const description = truncateDescription(startup.detailed_description || startup.description);
  const name = startup.company_name || "Unnamed Startup";
  const avatarInitial = name.charAt(0).toUpperCase();
  const locationParts = [startup.location_city || startup.city, startup.location_country || startup.country].filter(Boolean);
  const stage = STAGE_LABEL[startup.funding_stage] || startup.funding_stage || null;
  const profileUrl = `/startups/${startupProfileId}`;

  const statusDisplayLabel = connectionStatus === "accepted" ? "Connected" : connectionStatus === "pending" ? "Pending" : connectionStatus === "self" ? "You" : "Not connected";
  const connectLabel = isConnecting
    ? "Connecting…"
    : canConnect
      ? "Connect"
      : inDeclineCooling
        ? `Available ${formatCoolingEnd(startup.connection_declined_at) || "later"}`
        : connectionStatus === "accepted"
          ? "Connected"
          : connectionStatus === "pending"
            ? "Pending"
            : "You";

  const teamSize = startup.team_size || startup.team_members_count;
  const foundedYear = startup.founded_date
    ? new Date(startup.founded_date).getFullYear()
    : startup.founded_year;
  const revenueLabel = startup.revenue_status === "PROFITABLE"
    ? "Profitable"
    : startup.revenue_status === "REVENUE_GENERATING"
      ? "Revenue-generating"
      : startup.revenue_status === "PRE_REVENUE"
        ? "Pre-revenue"
        : null;
  const hasWebsite = Boolean(startup.website_url);
  const hasFounderVideo = Boolean(startup.has_founder_video);

  const footerStat = getFooterStat(startup);
  const showConnectionStatus =
    connectionStatus !== "not_connected" || relationship?.showInteractionActions;

  const renderSecondaryActions = () => (
    <div
      className="flex flex-wrap items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      {showCompare && (
        <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface-variant cursor-pointer hover:border-primary/30 transition-colors">
          <input
            type="checkbox"
            checked={isSelectedForCompare}
            onChange={() => onToggleCompare?.(startupProfileId)}
            className="rounded border-outline-variant"
          />
          Compare
        </label>
      )}
      {showWatchlist && (
        <button
          type="button"
          onClick={() => onWatchlistToggle?.(startup)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs transition-all ${
            startup.is_watchlisted
              ? "border-primary bg-primary-fixed text-primary"
              : "border-outline-variant/40 bg-surface-container-low text-on-surface-variant hover:border-primary/30"
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${startup.is_watchlisted ? "fill-current" : ""}`} />
          {startup.is_watchlisted ? "Saved" : "Watchlist"}
        </button>
      )}
      <Link
        to={profileUrl}
        className="inline-flex items-center px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors font-medium"
      >
        View Profile
      </Link>
      {showWatchlist && canConnect && relationship?.canInitiateConnection && (
        <button
          type="button"
          disabled={isPassing}
          onClick={() => onPass?.(startup)}
          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-outline-variant/40 text-xs text-on-surface-variant hover:text-on-surface transition-colors"
          title="Pass — archive from discovery"
        >
          <Ban className="w-3.5 h-3.5" />
          {isPassing ? "…" : "Pass"}
        </button>
      )}
    </div>
  );

  const renderPrimaryAction = () => {
    if (relationship?.showInteractionActions && relationship.canRespondToConnection) {
      return (
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => onDecline(startup.connection_id)}
            className="px-4 py-2 text-sm rounded-xl border border-error/30 text-error hover:bg-error/10 font-semibold disabled:opacity-40 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => onAccept(startup.connection_id)}
            className={`px-5 py-2 text-sm rounded-xl font-semibold text-on-primary bg-primary hover:bg-primary-dark disabled:opacity-40 transition-all ${connectButtonClass}`}
          >
            {isConnecting ? "…" : "Accept"}
          </button>
        </div>
      );
    }

    if (relationship?.showInteractionActions && relationship.canInitiateConnection) {
      return (
        <button
          type="button"
          disabled={!canConnect || isConnecting}
          onClick={(e) => {
            e.stopPropagation();
            onConnect(startup);
          }}
          className={`shrink-0 px-5 py-2 text-sm rounded-xl font-semibold text-on-primary bg-primary hover:bg-primary-dark disabled:opacity-40 transition-all ${connectButtonClass}`}
        >
          {connectLabel}
        </button>
      );
    }

    return null;
  };

  const primaryAction = renderPrimaryAction();
  const showCardFooter = Boolean(footerStat || primaryAction);
  const taglineText = startup.tagline || description;
  const showDescription =
    Boolean(startup.tagline) &&
    description &&
    description !== taglineText &&
    description !== "No startup description provided yet.";

  return (
    <div
      className={`${discoveryCardClass} cursor-pointer`}
      onClick={() => navigate(profileUrl)}
    >
      <div className="mb-2">
        <div className="flex items-start gap-3">
          <div className="mx-auto flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/20 bg-primary/10 sm:size-14">
            {startup.logo_url ? (
              <img src={startup.logo_url} alt={name} className="size-8 object-contain sm:size-9" />
            ) : (
              <span className="avatar-initial text-lg text-primary sm:text-xl">{avatarInitial}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className="m-0 min-w-0 flex-1 break-words text-base font-semibold leading-snug text-on-surface sm:text-lg">
                {name}
              </h3>
              {showMatchScore && (
                <div className="shrink-0">
                  <MatchScoreBadge score={startup.match_score} />
                </div>
              )}
            </div>

            <p className="mt-0.5 line-clamp-2 text-sm leading-snug text-on-surface-variant">
              {taglineText}
            </p>
          </div>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <VerificationBadge tier={startup.verification_tier} />
          {showConnectionStatus && (
            <span
              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium sm:px-3 ${
                statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected
              }`}
            >
              {statusDisplayLabel}
            </span>
          )}
        </div>
      </div>

      {showDescription && (
        <p className="mb-3 line-clamp-2 text-sm leading-snug text-on-surface-variant/80">
          {description}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {stage && <span className={discoveryTagPillClass}>{stage}</span>}
        {startup.industry && (
          <span className={discoveryTagPillClass}>{formatDiscoveryTagLabel(startup.industry)}</span>
        )}
        {locationParts.length > 0 && (
          <span className={discoveryTagPillClass}>
            {formatDiscoveryTagLabel(locationParts.join(", "))}
          </span>
        )}
        {revenueLabel && <span className={discoveryTagPillClass}>{revenueLabel}</span>}
      </div>

      {showMatchScore && (
        <div
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <MatchExplanationBlock
            startupProfileId={startupProfileId}
            matchScore={startup.match_score}
            compact
            className="mb-3"
          />
        </div>
      )}

      {hasFounderVideo && (
        <div className="relative mb-3 h-24 w-full overflow-hidden rounded-xl border border-outline-variant/30">
          {startup.founder_video_thumbnail_url ? (
            <img src={startup.founder_video_thumbnail_url} alt="Founder video" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full bg-surface-container" />
          )}
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-6 w-6 text-white" />
          </div>
          <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] text-white">
            Video pitch available
          </span>
        </div>
      )}

      {(foundedYear || teamSize || hasWebsite) && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
          {foundedYear && (
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
              Est. {foundedYear}
            </span>
          )}
          {teamSize && (
            <span className="inline-flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 shrink-0 text-primary" />
              {teamSize} {Number(teamSize) === 1 ? "person" : "people"}
            </span>
          )}
          {hasWebsite && (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
              Website
            </span>
          )}
        </div>
      )}

      <div className={showCardFooter ? "mb-4" : "mt-auto"}>{renderSecondaryActions()}</div>

      {showCardFooter && (
        <div
          className={`mt-auto flex flex-wrap items-end gap-3 border-t border-outline-variant/30 pt-4 ${
            footerStat ? "justify-between" : "justify-end"
          }`}
        >
          {footerStat && (
            <div className="min-w-0">
              <span className="text-xs font-medium text-outline">{footerStat.label}</span>
              <span className="mt-0.5 block text-lg font-bold leading-tight text-on-surface">
                {footerStat.value}
              </span>
            </div>
          )}
          {primaryAction}
        </div>
      )}
    </div>
  );
});

StartupCard.displayName = "StartupCard";

const StartupsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isInvestorViewer = user?.userType === "investor";
  const [filters, setFilters] = useState(defaultFilters);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [connectingUserId, setConnectingUserId] = useState(null);
  const [passingProfileId, setPassingProfileId] = useState(null);
  const [connectTarget, setConnectTarget] = useState(null);
  const [connectMsg, setConnectMsg] = useState("");
  const [isListView, setIsListView] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [aiSearchLoading, setAiSearchLoading] = useState(false);
  const [aiSearchSummary, setAiSearchSummary] = useState("");

  useEffect(() => {
    if (isInvestorViewer) {
      setFilters((prev) =>
        prev.sort === "newest" ? { ...prev, sort: "match_score" } : prev,
      );
    }
  }, [isInvestorViewer]);

  const toggleCompareSelection = (startupProfileId) => {
    setCompareIds((prev) => {
      const id = String(startupProfileId);
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
  };

  const openComparison = () => {
    if (compareIds.length === 0) return;
    navigate(`/compare?ids=${compareIds.join(",")}`);
  };

  const debouncedQ = useDebounce(filters.q, 350);
  const debouncedLocation = useDebounce(filters.location_country, 350);
  const apiFilters = useMemo(
    () => ({
      ...filters,
      q: filters.q.trim() === "" ? "" : debouncedQ,
      location_country:
        filters.location_country.trim() === "" ? "" : debouncedLocation,
    }),
    [filters, debouncedQ, debouncedLocation],
  );

  const fetchStartups = useCallback(async ({ background = false } = {}) => {
    const requestParams = buildStartupApiParams(apiFilters, { page, limit: 9 });
    const cacheKey = buildListingCacheKey("startups", requestParams);
    const cached = readListingCache(cacheKey);

    if (!background && !cached) {
      setLoading(true);
    }
    setError("");

    const result = await fetchListingDeduped(cacheKey, () =>
      apiService.getStartups(requestParams),
    );

    if (!result.success) {
      if (!cached) {
        setError(result.error || "Failed to load startups");
        setStartups([]);
        setTotalCount(0);
      }
      setLoading(false);
      return;
    }

    const payload = result.data || {};
    const nextState = {
      startups: Array.isArray(payload.data) ? payload.data : [],
      totalPages: payload.totalPages || 1,
      totalCount: payload.total ?? 0,
    };
    writeListingCache(cacheKey, nextState);
    setStartups(nextState.startups);
    setTotalPages(nextState.totalPages);
    setTotalCount(nextState.totalCount);
    setLoading(false);
  }, [apiFilters, page]);

  useEffect(() => {
    const requestParams = buildStartupApiParams(apiFilters, { page, limit: 9 });
    const cacheKey = buildListingCacheKey("startups", requestParams);
    const cached = readListingCache(cacheKey);

    if (cached) {
      setStartups(cached.startups);
      setTotalPages(cached.totalPages);
      setTotalCount(cached.totalCount);
      setLoading(false);
    }

    let active = true;
    fetchStartups({ background: Boolean(cached) }).finally(() => {
      if (!active) return;
    });

    return () => {
      active = false;
    };
  }, [apiFilters, page, fetchStartups]);

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(defaultFilters);
    setAiSearchSummary("");
  };

  const handleAiSearch = async () => {
    const phrase = filters.q.trim();
    if (!phrase) return;

    setAiSearchLoading(true);
    setError("");
    const result = await apiService.parseNaturalLanguageSearch(phrase);
    setAiSearchLoading(false);

    if (!result.success) {
      setError(result.error || "AI search failed");
      return;
    }

    const { filters: parsed, applied_summary: summary } = result.data || {};
    setPage(1);
    setFilters((prev) => ({
      ...prev,
      industry: parsed?.industry || "",
      location_country: parsed?.location_country || "",
      funding_stage: parsed?.funding_stage || "",
      revenue_status: parsed?.revenue_status || "",
      q: parsed?.q || "",
    }));
    setAiSearchSummary(summary || "");
  };

  const handleOpenConnect = useCallback((startup) => {
    if (!startup?.user_id) return;
    const name = startup.company_name || "Startup";
    const gradientParts = getStartupGradient(name).split(" ");
    setConnectTarget({
      userId: startup.user_id,
      companyName: name,
      initial: name.charAt(0).toUpperCase(),
      gradientFrom: gradientParts[0] || "from-primary",
      gradientTo: gradientParts.slice(1).join(" ") || "to-primary-dark",
    });
    setConnectMsg("");
  }, []);

  const handleSubmitConnect = useCallback(async () => {
    if (!connectTarget?.userId) return;
    setConnectingUserId(connectTarget.userId);
    const response = await apiService.createConnection(
      connectTarget.userId,
      connectMsg.trim(),
    );
    setConnectingUserId(null);

    if (!response.success) {
      setError(response.error || "Failed to send connection request");
      return;
    }
    setConnectTarget(null);
    setConnectMsg("");
    invalidateListingNamespace("startups");
    await fetchStartups();
  }, [connectMsg, connectTarget?.userId, fetchStartups]);

  const handlePass = useCallback(async (startup) => {
    const profileId = startup.startup_profile_id || startup.id;
    if (!profileId) return;
    setPassingProfileId(profileId);
    const result = await investorIntentService.passStartup(profileId);
    setPassingProfileId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    invalidateListingNamespace("startups");
    await fetchStartups();
  }, [fetchStartups]);

  const handleAccept = useCallback(async (connectionId) => {
    if (!connectionId) return;
    setConnectingUserId(connectionId);
    const response = await apiService.respondToConnection(connectionId, "accepted");
    setConnectingUserId(null);
    if (!response.success) {
      setError(response.error || "Failed to accept request");
      return;
    }
    invalidateListingNamespace("startups");
    await fetchStartups();
  }, [fetchStartups]);

  const handleWatchlistToggle = useCallback(async (startup) => {
    const profileId = startup.startup_profile_id || startup.id;
    const result = startup.is_watchlisted
      ? await engagementService.removeFromWatchlist(profileId)
      : await engagementService.addToWatchlist(profileId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setStartups((prev) =>
      prev.map((s) =>
        (s.startup_profile_id || s.id) === profileId
          ? { ...s, is_watchlisted: !startup.is_watchlisted }
          : s,
      ),
    );
  }, []);

  const handleDecline = useCallback(async (connectionId) => {
    if (!connectionId) return;
    setConnectingUserId(connectionId);
    const response = await apiService.respondToConnection(connectionId, "declined");
    setConnectingUserId(null);
    if (!response.success) {
      setError(response.error || "Failed to decline request");
      return;
    }
    invalidateListingNamespace("startups");
    await fetchStartups();
  }, [fetchStartups]);

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== "sort" && v !== "" && v !== false,
  );

  return (
    <div className={`${discoveryPageContainerClass} min-h-[calc(100vh-9rem)] flex flex-col overflow-x-hidden`}>
      <div className="flex min-w-0 flex-col gap-6 md:gap-8">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 md:gap-6">
          <div className="min-w-0 max-w-3xl">
            <span className={pageEyebrowClass}>Startup Discovery</span>
            <h1 className={pageHeadingClass}>
              Discover the next{" "}
              <span className="text-gradient-primary">high-velocity</span> unicorns
            </h1>
            <p className={pageSubheadingClass}>
              Browse and search startups seeking funding.
            </p>
            {isInvestorViewer && (
              <p className="mt-3 text-xs text-outline max-w-2xl leading-relaxed">
                Match scores reflect alignment with your stated preferences (industry, stage, geography, check size, and revenue status). They are a guide only and may not capture every relevant factor.
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-lg border border-outline-variant/40 bg-surface-container p-1">
            <button
              type="button"
              onClick={() => setIsListView(false)}
              className={viewToggleBtnClass(!isListView)}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsListView(true)}
              className={viewToggleBtnClass(isListView)}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters panel */}
        <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-soft p-5 md:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
              <input
                type="text"
                placeholder={
                  isInvestorViewer
                    ? "Search or describe what you're looking for…"
                    : "Search by name, tagline, or description"
                }
                value={filters.q}
                onChange={(e) => {
                  handleFilterChange("q", e.target.value);
                  if (aiSearchSummary) setAiSearchSummary("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isInvestorViewer && filters.q.trim()) {
                    e.preventDefault();
                    handleAiSearch();
                  }
                }}
                className={filterInputClass}
              />
            </div>
            {isInvestorViewer && (
              <button
                type="button"
                onClick={handleAiSearch}
                disabled={aiSearchLoading || !filters.q.trim()}
                className="inline-flex items-center justify-center gap-1.5 h-11 px-4 rounded-xl border border-primary/30 bg-primary-fixed text-sm font-semibold text-primary hover:bg-primary/10 disabled:opacity-50 shrink-0 transition-colors"
                title="Parse natural language into filters"
              >
                <Sparkles className="w-4 h-4" />
                {aiSearchLoading ? "Parsing…" : "AI filters"}
              </button>
            )}
          </div>

          {aiSearchSummary && (
            <p className="text-xs text-on-surface-variant bg-primary-fixed/50 border border-primary/15 rounded-xl px-3 py-2.5 leading-relaxed">
              <span className="font-semibold text-primary">Applied filters:</span> {aiSearchSummary}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <div className="relative">
              <select
                value={filters.industry}
                onChange={(e) => handleFilterChange("industry", e.target.value)}
                className={filterFieldClass}
              >
                <option value="">All Industries</option>
                {INVESTOR_INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.funding_stage}
                onChange={(e) => handleFilterChange("funding_stage", e.target.value)}
                className={filterFieldClass}
              >
                <option value="">All Stages</option>
                {FUNDING_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.revenue_status}
                onChange={(e) => handleFilterChange("revenue_status", e.target.value)}
                className={filterFieldClass}
              >
                <option value="">All Revenue Status</option>
                {REVENUE_STATUSES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
              <input
                type="text"
                placeholder="Country"
                value={filters.location_country}
                onChange={(e) => handleFilterChange("location_country", e.target.value)}
                className={`${filterInputClass} pl-9`}
              />
            </div>

            {isInvestorViewer && (
              <div className="relative sm:col-span-2 lg:col-span-4 lg:max-w-xs">
                <select
                  value={filters.min_verification}
                  onChange={(e) => handleFilterChange("min_verification", e.target.value)}
                  className={filterFieldClass}
                >
                  {VERIFICATION_FILTERS.map((v) => (
                    <option key={v.value || "all"} value={v.value}>{v.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-outline-variant/20">
            {user ? (
              <button
                type="button"
                onClick={() =>
                  handleFilterChange("connected_only", !filters.connected_only)
                }
                aria-pressed={filters.connected_only}
                className={`inline-flex items-center gap-2 h-11 px-4 rounded-xl border text-sm font-medium transition-colors ${
                  filters.connected_only
                    ? "border-primary bg-primary-fixed text-primary"
                    : "border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container"
                }`}
              >
                <Users className="w-4 h-4" />
                Connected only
              </button>
            ) : (
              <span />
            )}
            <div className="flex flex-wrap items-center gap-3">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 h-11 px-4 rounded-xl border border-outline-variant/40 text-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-outline pointer-events-none" />
                {filters.connected_only ? (
                  <div
                    className={`${filterFieldClass} w-auto min-w-[11rem] pl-9 flex items-center text-on-surface-variant opacity-60 cursor-not-allowed`}
                  >
                    Recently connected
                  </div>
                ) : (
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className={`${filterFieldClass} w-auto min-w-[11rem] pl-9`}
                  >
                    {isInvestorViewer && <option value="match_score">Best Match</option>}
                    <option value="newest">Newest First</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="recently_updated">Recently Updated</option>
                  </select>
                )}
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-outline pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-error text-sm">
            {error}
          </div>
        )}

        {/* Results meta */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {loading ? (
            <div className="h-5 w-40 rounded bg-surface-container-low animate-pulse" />
          ) : (
            <p className="text-sm text-on-surface-variant">
              {totalCount === 1 ? "1 startup found" : `${totalCount} startups found`}
            </p>
          )}
          {!loading && isInvestorViewer && compareIds.length > 0 && (
            <button
              type="button"
              onClick={openComparison}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-content-inverse text-sm"
            >
              <Columns3 className="w-4 h-4" />
              Compare {compareIds.length} startup{compareIds.length > 1 ? "s" : ""}
            </button>
          )}
        </div>

        <div className={discoveryResultsGridClass(isListView)}>
          {loading
            ? Array.from({ length: isListView ? 6 : 9 }).map((_, idx) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={idx}
                  className={`${discoveryCardClass} animate-pulse`}
                >
                  <div className="mb-3">
                    <div className="flex items-start gap-3">
                      <div className="size-12 shrink-0 rounded-2xl bg-surface-container sm:size-14" />
                      <div className="min-w-0 flex-1 space-y-2">
                        <div className="h-5 w-full rounded bg-surface-container" />
                        <div className="h-4 w-full rounded bg-surface-container" />
                        <div className="h-4 w-4/5 rounded bg-surface-container" />
                      </div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      <div className="h-5 w-20 rounded-full bg-surface-container" />
                      <div className="h-5 w-24 rounded-full bg-surface-container" />
                    </div>
                  </div>
                  <div className="mb-3 h-4 w-full rounded bg-surface-container" />
                  <div className="mb-4 flex gap-2">
                    <div className="h-7 w-16 rounded-full bg-surface-container" />
                    <div className="h-7 w-20 rounded-full bg-surface-container" />
                  </div>
                  <div className="h-8 w-28 rounded-xl bg-surface-container" />
                </div>
              ))
            : startups.map((startup) => (
                <StartupCard
                  key={startup.startup_profile_id || startup.id || startup.user_id}
                  startup={startup}
                  onConnect={handleOpenConnect}
                  onPass={handlePass}
                  isPassing={passingProfileId === (startup.startup_profile_id || startup.id)}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isConnecting={
                    connectingUserId !== null &&
                    (connectingUserId === startup.user_id ||
                      connectingUserId === startup.connection_id)
                  }
                  relationship={getProfileRelationship({
                    viewerUserId: user?.id,
                    viewerUserType: user?.userType,
                    profileUserId: startup.user_id,
                    profileOwnerType: PROFILE_OWNER_TYPES.STARTUP,
                    connectionStatus: startup.connection_status,
                    connectionRequesterId: startup.connection_requester_id,
                    connectionDeclinedAt: startup.connection_declined_at,
                  })}
                  showMatchScore={isInvestorViewer}
                  showWatchlist={isInvestorViewer}
                  showCompare={isInvestorViewer}
                  isSelectedForCompare={compareIds.includes(
                    String(startup.startup_profile_id || startup.id),
                  )}
                  onToggleCompare={toggleCompareSelection}
                  onWatchlistToggle={handleWatchlistToggle}
                />
              ))}
        </div>

        {!loading && (
          <>
            {!startups.length && (
              <div className="mt-8 text-center text-on-surface-variant">No startups found.</div>
            )}

            {totalPages > 1 && (
              <nav
                className="flex flex-wrap items-center justify-center gap-2 pt-6 pb-2"
                aria-label="Pagination"
              >
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page <= 1}
                  className="inline-flex h-10 items-center rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                {buildPageNumbers(page, totalPages, 5).map((pageNum) => (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setPage(pageNum)}
                    className={`flex h-10 min-w-10 px-3 items-center justify-center rounded-xl text-sm font-semibold transition-all duration-200 ${
                      page === pageNum
                        ? "bg-primary text-on-primary shadow-soft"
                        : "border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container hover:border-primary/20"
                    }`}
                    aria-current={page === pageNum ? "page" : undefined}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage((prev) => Math.min(totalPages || 1, prev + 1))}
                  disabled={page >= totalPages}
                  className="inline-flex h-10 items-center rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold text-on-surface-variant hover:bg-surface-container disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </nav>
            )}
          </>
        )}

      </div>

      <ConnectModal
        open={Boolean(connectTarget)}
        companyName={connectTarget?.companyName}
        initial={connectTarget?.initial}
        gradientFrom={connectTarget?.gradientFrom}
        gradientTo={connectTarget?.gradientTo}
        message={connectMsg}
        onMessageChange={setConnectMsg}
        onCancel={() => {
          setConnectTarget(null);
          setConnectMsg("");
        }}
        onSubmit={handleSubmitConnect}
        loading={connectingUserId !== null}
      />
    </div>
  );
};

export default StartupsPage;
