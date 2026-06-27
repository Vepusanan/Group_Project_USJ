import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  List,
  MapPin,
  Briefcase,
  Target,
  Globe,
  Search,
  ChevronDown,
  ArrowUpDown,
  X,
  DollarSign,
  Users,
} from "lucide-react";
import { useDebounce } from "../hooks/useDebounce";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";
import {
  getProfileRelationship,
  PROFILE_OWNER_TYPES,
} from "../utils/profileRelationship";
import {
  formatCoolingEnd,
  isInConnectionCooling,
} from "../utils/connectionCooling";
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
  tabNavClass,
} from "../styles/theme";
import {
  INVESTOR_INDUSTRY_OPTIONS,
  INVESTOR_STAGE_OPTIONS,
  INVESTOR_TYPE_OPTIONS,
} from "../utils/investorFilterOptions";
import { buildInvestorApiParams } from "../utils/listingFilters";
import {
  buildListingCacheKey,
  fetchListingDeduped,
  invalidateListingNamespace,
  readListingCache,
  writeListingCache,
} from "../hooks/useListingCache";
import VerificationBadge from "../components/common/VerificationBadge";

const defaultFilters = {
  q: "",
  investor_type: "",
  location: "",
  industries: "",
  investment_stage: "",
  investment_min: "",
  investment_max: "",
  connected_only: false,
  sort: "newest",
};

const statusBadgeClass = {
  self: "bg-surface-alt text-content-secondary border-line",
  not_connected: "bg-warning/10 text-warning border-warning/30",
  pending: "bg-warning/20 text-warning border-warning/30",
  accepted: "bg-success/10 text-success border-success/30",
  declined: "bg-error/10 text-error border-error/30",
};

const currencyRange = (min, max) => {
  if (!min && !max) return "Check size not specified";
  const format = (value) => {
    const numeric = Number(value || 0);
    if (!numeric) return "0";
    if (numeric >= 1000000) return `$${(numeric / 1000000).toFixed(1)}M`;
    if (numeric >= 1000) return `$${Math.round(numeric / 1000)}K`;
    return `$${numeric}`;
  };
  return `${format(min)} – ${format(max)}`;
};

const parseList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return [value];
    }
  }
  return [];
};

const truncateDescription = (value, maxLength = 130) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "No investor description provided yet.";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const INVESTOR_AVATAR_GRADIENTS = [
  "from-primary to-primary-dark",
  "from-primary to-primary-dark",
  "from-primary to-primary-dark",
  "from-primary to-primary-dark",
  "from-primary-dark to-primary",
];

const getAvatarGradient = (name = "") => {
  const idx = (name.charCodeAt(0) || 0) % INVESTOR_AVATAR_GRADIENTS.length;
  return INVESTOR_AVATAR_GRADIENTS[idx];
};

const InvestorCard = React.memo(({
  investor,
  onConnect,
  onAccept,
  onDecline,
  isConnecting,
  relationship,
}) => {
  const navigate = useNavigate();
  const connectionStatus = investor.connection_status || "not_connected";
  const inDeclineCooling =
    connectionStatus === "declined" &&
    isInConnectionCooling(investor.connection_declined_at);
  const statusLabel =
    connectionStatus === "accepted"
      ? "Connected"
      : connectionStatus === "pending"
        ? "Pending"
        : connectionStatus === "self"
          ? "You"
          : inDeclineCooling
            ? `Available ${formatCoolingEnd(investor.connection_declined_at) || "later"}`
            : "Connect";
  const description = truncateDescription(
    investor.investment_thesis ||
      investor.what_you_look_for ||
      investor.value_add,
  );
  const canConnect =
    !["self", "pending", "accepted"].includes(connectionStatus) &&
    !inDeclineCooling;
  const industries = parseList(investor.industries_of_interest).slice(0, 3);
  const name = investor.name_or_firm || investor.name || "Unnamed Investor";
  const avatarInitial = name.charAt(0).toUpperCase();
  const avatarGradient = getAvatarGradient(name);
  const physicalLocation = [investor.location_city, investor.location_country]
    .filter(Boolean)
    .join(", ");
  const location =
    physicalLocation ||
    parseList(investor.geographic_preference).slice(0, 2).join(", ");
  const checkSize = currencyRange(
    investor.min_investment_size,
    investor.max_investment_size,
  );
  const profileUrl = `/investors/${investor.investor_profile_id || investor.id}`;

  const STAGE_LABEL = {
    PRE_SEED: "Pre-seed",
    SEED: "Seed",
    SERIES_A: "Series A",
    SERIES_B: "Series B",
    SERIES_C: "Series C",
    SERIES_D_PLUS: "Series D+",
  };
  const stages = parseList(investor.stage_preference)
    .map((s) => STAGE_LABEL[s] || s)
    .slice(0, 3);
  const investorTypeLabel = investor.investor_type
    ? formatDiscoveryTagLabel(String(investor.investor_type))
    : "Investor";
  const yearsExp = investor.years_of_experience;
  const followOn = investor.follow_on_investment;

  const statusDisplayLabel =
    connectionStatus === "accepted"
      ? "Connected"
      : connectionStatus === "pending"
        ? "Pending"
        : connectionStatus === "self"
          ? "You"
          : "Not connected";
  const showConnectionStatus =
    connectionStatus !== "not_connected" || relationship?.showInteractionActions;
  const hasThesis =
    description && description !== "No investor description provided yet.";
  const footerStat =
    checkSize !== "Check size not specified"
      ? { label: "Check size", value: checkSize }
      : null;

  const renderSecondaryActions = () => (
    <div
      className="flex flex-wrap items-center gap-2"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="presentation"
    >
      <Link
        to={profileUrl}
        className="inline-flex items-center px-3 py-1.5 rounded-xl border border-outline-variant/40 bg-surface-container-low text-xs text-on-surface-variant hover:text-primary hover:border-primary/30 transition-colors font-medium"
      >
        View Profile
      </Link>
    </div>
  );

  const renderPrimaryAction = () => {
    if (relationship?.showInteractionActions && relationship.canRespondToConnection) {
      return (
        <div
          className="flex items-center gap-2"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
          role="presentation"
        >
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => onDecline(investor.connection_id)}
            className="px-4 py-2 text-sm rounded-xl border border-error/30 text-error hover:bg-error/10 font-semibold disabled:opacity-40 transition-colors"
          >
            Decline
          </button>
          <button
            type="button"
            disabled={isConnecting}
            onClick={() => onAccept(investor.connection_id)}
            className={`px-5 py-2 text-sm rounded-xl font-semibold text-on-primary bg-primary hover:bg-primary-dark disabled:opacity-40 transition-all group-hover:scale-105 ${connectButtonClass}`}
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
            onConnect(investor.user_id);
          }}
          className={`px-5 py-2 text-sm rounded-xl font-semibold text-on-primary bg-primary hover:bg-primary-dark disabled:opacity-40 transition-all group-hover:scale-105 ${connectButtonClass}`}
        >
          {isConnecting ? "Connecting…" : canConnect ? "Connect" : statusLabel}
        </button>
      );
    }

    return null;
  };

  const primaryAction = renderPrimaryAction();
  const showCardFooter = Boolean(footerStat || primaryAction);

  return (
    <div
      className={`${discoveryCardClass} cursor-pointer`}
      onClick={() => navigate(profileUrl)}
    >
      <div className="mb-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-outline-variant/20 bg-gradient-to-br ${avatarGradient} sm:size-14`}
          >
            {investor.photo_url ? (
              <img
                src={investor.photo_url}
                alt={name}
                className="size-full object-cover"
              />
            ) : (
              <span className="avatar-initial text-lg text-white sm:text-xl">{avatarInitial}</span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="m-0 break-words text-base font-semibold leading-snug text-on-surface sm:text-lg">
              {name}
            </h3>
            <p className="mt-1 text-sm leading-snug text-on-surface-variant">
              {investorTypeLabel}
            </p>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <VerificationBadge tier={investor.verification_tier} />
          {showConnectionStatus && (
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-medium sm:px-3 ${
                statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected
              }`}
            >
              {statusDisplayLabel}
            </span>
          )}
        </div>
      </div>

      {hasThesis && (
        <p className="mb-3 line-clamp-2 text-sm leading-snug text-on-surface-variant/80">
          {description}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {industries.map((ind) => (
          <span
            key={`${investor.investor_profile_id || investor.user_id}-ind-${ind}`}
            className={discoveryTagPillClass}
          >
            {formatDiscoveryTagLabel(ind)}
          </span>
        ))}
        {stages.map((s) => (
          <span
            key={`${investor.investor_profile_id || investor.user_id}-stage-${s}`}
            className={discoveryTagPillClass}
          >
            {s}
          </span>
        ))}
      </div>

      {(location || yearsExp != null || followOn) && (
        <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-on-surface-variant">
          {location && (
            <span className="inline-flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 shrink-0 text-primary" />
              {formatDiscoveryTagLabel(location)}
            </span>
          )}
          {yearsExp != null && yearsExp !== "" && (
            <span className="inline-flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary" />
              {yearsExp} yr{Number(yearsExp) === 1 ? "" : "s"} exp
            </span>
          )}
          {followOn && (
            <span className="inline-flex items-center gap-1.5">
              <Target className="h-3.5 w-3.5 shrink-0 text-primary" />
              Follow-on open
            </span>
          )}
        </div>
      )}

      <div className={showCardFooter ? "mb-4" : "mt-auto"}>{renderSecondaryActions()}</div>

      {showCardFooter && (
        <div
          className={`mt-auto flex flex-wrap items-center gap-3 border-t border-outline-variant/30 pt-4 ${
            footerStat ? "justify-between" : "justify-end"
          }`}
        >
          {footerStat && (
            <div className="min-w-0">
              <span className="text-xs font-medium text-outline">{footerStat.label}</span>
              <span className="mt-0.5 block truncate text-lg font-bold leading-tight text-on-surface">
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

InvestorCard.displayName = "InvestorCard";

const InvestorsPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [connectingUserId, setConnectingUserId] = useState(null);
  const [isListView, setIsListView] = useState(false);

  // Debounce only free-text search fields (not dropdowns or check-size inputs).
  const debouncedQ = useDebounce(filters.q, 350);
  const debouncedLocation = useDebounce(filters.location, 350);
  const apiFilters = useMemo(
    () => ({
      ...filters,
      q: filters.q.trim() === "" ? "" : debouncedQ,
      location: filters.location.trim() === "" ? "" : debouncedLocation,
    }),
    [filters, debouncedQ, debouncedLocation],
  );

  const fetchInvestors = useCallback(async ({ background = false } = {}) => {
    const requestParams = buildInvestorApiParams(apiFilters, { page, limit: 9 });
    const cacheKey = buildListingCacheKey("investors", requestParams);
    const cached = readListingCache(cacheKey);

    if (!background && !cached) {
      setLoading(true);
    }
    setError("");

    const result = await fetchListingDeduped(cacheKey, () =>
      apiService.getInvestors(requestParams),
    );

    if (!result.success) {
      if (!cached) {
        setError(result.error || "Failed to load investors");
        setInvestors([]);
        setTotalCount(0);
      }
      setLoading(false);
      return;
    }

    const payload = result.data || {};
    const nextState = {
      investors: Array.isArray(payload.data) ? payload.data : [],
      totalPages: payload.totalPages || 1,
      totalCount: payload.total ?? 0,
    };
    writeListingCache(cacheKey, nextState);
    setInvestors(nextState.investors);
    setTotalPages(nextState.totalPages);
    setTotalCount(nextState.totalCount);
    setLoading(false);
  }, [apiFilters, page]);

  useEffect(() => {
    const requestParams = buildInvestorApiParams(apiFilters, { page, limit: 9 });
    const cacheKey = buildListingCacheKey("investors", requestParams);
    const cached = readListingCache(cacheKey);

    if (cached) {
      setInvestors(cached.investors);
      setTotalPages(cached.totalPages);
      setTotalCount(cached.totalCount);
      setLoading(false);
    }

    let active = true;
    fetchInvestors({ background: Boolean(cached) }).finally(() => {
      if (!active) return;
    });

    return () => {
      active = false;
    };
  }, [apiFilters, page, fetchInvestors]);

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(defaultFilters);
  };

  const handleConnect = useCallback(async (userId) => {
    if (!userId) return;
    setConnectingUserId(userId);
    const response = await apiService.createConnection(userId);
    setConnectingUserId(null);

    if (!response.success) {
      setError(response.error || "Failed to send connection request");
      return;
    }
    invalidateListingNamespace("investors");
    await fetchInvestors();
  }, [fetchInvestors]);

  const handleAccept = useCallback(async (connectionId) => {
    if (!connectionId) return;
    setConnectingUserId(connectionId);
    const response = await apiService.respondToConnection(
      connectionId,
      "accepted",
    );
    setConnectingUserId(null);
    if (!response.success) {
      setError(response.error || "Failed to accept request");
      return;
    }
    invalidateListingNamespace("investors");
    await fetchInvestors();
  }, [fetchInvestors]);

  const handleDecline = useCallback(async (connectionId) => {
    if (!connectionId) return;
    setConnectingUserId(connectionId);
    const response = await apiService.respondToConnection(
      connectionId,
      "declined",
    );
    setConnectingUserId(null);
    if (!response.success) {
      setError(response.error || "Failed to decline request");
      return;
    }
    invalidateListingNamespace("investors");
    await fetchInvestors();
  }, [fetchInvestors]);

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== "sort" && v !== "" && v !== false,
  );

  return (
    <div className={`${discoveryPageContainerClass} min-h-[calc(100vh-9rem)] flex flex-col overflow-x-hidden`}>
        <div className="flex items-start justify-between gap-4 flex-wrap mb-8">
          <div className="max-w-3xl">
            <span className={pageEyebrowClass}>Investor Discovery</span>
            <h1 className={pageHeadingClass}>
              Discover your next{" "}
              <span className="text-gradient-primary">strategic partner</span>
            </h1>
            <p className={pageSubheadingClass}>
              Find investors who match your startup stage and industry.
            </p>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-outline-variant/40 bg-surface-container p-1">
            <button
              type="button"
              onClick={() => setIsListView(false)}
              className={`p-1.5 rounded-md transition-colors ${!isListView ? "bg-primary-light/30 text-content" : "text-content-muted hover:text-content"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsListView(true)}
              className={`p-1.5 rounded-md transition-colors ${isListView ? "bg-primary-light/30 text-content" : "text-content-muted hover:text-content"}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="mt-6 rounded-xl border border-line bg-surface-alt  p-4 space-y-3">
          {/* Row 1: Search (wide) */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, firm, or keyword"
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              className="w-full h-10 rounded-lg bg-surface-alt border border-line pl-10 pr-3 text-sm text-content placeholder:text-content-muted focus:outline-none focus:border-primary-light/50 transition-colors"
            />
          </div>

          {/* Row 2: Dropdown filters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <select
                value={filters.investor_type}
                onChange={(e) => handleFilterChange("investor_type", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-3 pr-9 text-sm text-content focus:outline-none focus:border-primary-light/50 transition-colors"
              >
                <option value="">All Investor Types</option>
                {INVESTOR_TYPE_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.industries}
                onChange={(e) => handleFilterChange("industries", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-3 pr-9 text-sm text-content focus:outline-none focus:border-primary-light/50 transition-colors"
              >
                <option value="">All Industries</option>
                {INVESTOR_INDUSTRY_OPTIONS.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.investment_stage}
                onChange={(e) => handleFilterChange("investment_stage", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-3 pr-9 text-sm text-content focus:outline-none focus:border-primary-light/50 transition-colors"
              >
                <option value="">All Stages</option>
                {INVESTOR_STAGE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Location / Country"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="w-full h-10 rounded-lg bg-surface-alt border border-line pl-9 pr-3 text-sm text-content placeholder:text-content-muted focus:outline-none focus:border-primary-light/50 transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Check-size range + Sort + Clear (right-aligned) */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 pt-1">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs text-content-muted font-medium whitespace-nowrap">Check size:</span>
                <div className="relative flex-1 max-w-[140px]">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted pointer-events-none" />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="2k"
                    title="Minimum you need — e.g. 2000 or 2k"
                    value={filters.investment_min}
                    onChange={(e) => handleFilterChange("investment_min", e.target.value)}
                    className="w-full h-10 rounded-lg bg-surface-alt border border-line pl-7 pr-2 text-sm text-content placeholder:text-content-muted focus:outline-none focus:border-primary-light/50 transition-colors"
                  />
                </div>
                <span className="text-content-muted text-sm flex-shrink-0">–</span>
                <div className="relative flex-1 max-w-[140px]">
                  <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted pointer-events-none" />
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="1m"
                    title="Maximum you need — e.g. 1000000, 1m, or 1000k"
                    value={filters.investment_max}
                    onChange={(e) => handleFilterChange("investment_max", e.target.value)}
                    className="w-full h-10 rounded-lg bg-surface-alt border border-line pl-7 pr-2 text-sm text-content placeholder:text-content-muted focus:outline-none focus:border-primary-light/50 transition-colors"
                  />
                </div>
              </div>
              <p className="text-[11px] text-content-muted pl-[4.5rem] sm:pl-[5.25rem]">
                Use 2000, 2k, or 1m ($2K = 2k). With min &amp; max set, only investors
                whose check size fits within your range are shown.
              </p>
            </div>

            <div className="flex items-center gap-2 lg:ml-auto">
              {user && (
                <button
                  type="button"
                  onClick={() =>
                    handleFilterChange("connected_only", !filters.connected_only)
                  }
                  aria-pressed={filters.connected_only}
                  className={`flex items-center gap-1.5 h-10 px-3 rounded-lg border text-sm font-medium transition-colors ${
                    filters.connected_only
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line bg-surface-alt text-content-secondary hover:text-content hover:border-line-strong"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Connected only
                </button>
              )}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 h-10 px-3 rounded-lg border border-line bg-surface-alt text-sm text-content-secondary hover:text-content hover:border-line-strong transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-content-muted pointer-events-none" />
                {filters.connected_only ? (
                  <div className="h-10 flex items-center rounded-lg bg-surface-alt border border-line pl-9 pr-9 text-sm text-content-secondary opacity-60 cursor-not-allowed">
                    Recently connected
                  </div>
                ) : (
                  <select
                    value={filters.sort}
                    onChange={(e) => handleFilterChange("sort", e.target.value)}
                    className="h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-9 pr-9 text-sm text-content focus:outline-none focus:border-primary-light/50 transition-colors"
                  >
                    <option value="newest">Newest First</option>
                    <option value="alphabetical">Alphabetical</option>
                    <option value="most_experienced">Most Experienced</option>
                  </select>
                )}
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-error">
            {error}
          </div>
        )}

        {/* Stable meta row (prevents layout shift) */}
        <div className="mt-4">
          {loading ? (
            <div className="h-5 w-40 rounded bg-surface-container-low animate-pulse" />
          ) : (
            <p className="text-sm text-content-secondary">
              {totalCount === 1 ? "1 investor found" : `${totalCount} investors found`}
            </p>
          )}
        </div>

        <div className={`mt-6 ${discoveryResultsGridClass(isListView)}`}>
          {loading
            ? Array.from({ length: isListView ? 6 : 9 }).map((_, idx) => (
                <div
                  // eslint-disable-next-line react/no-array-index-key
                  key={idx}
                  className={`${discoveryCardClass} animate-pulse`}
                >
                  <div className="mb-3 flex items-center gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-surface-container sm:h-14 sm:w-14" />
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="h-5 w-2/3 rounded bg-surface-container" />
                      <div className="h-4 w-full rounded bg-surface-container" />
                    </div>
                    <div className="h-7 w-20 shrink-0 rounded-full bg-surface-container" />
                  </div>
                  <div className="mb-3 h-4 w-full rounded bg-surface-container" />
                  <div className="mb-4 flex gap-2">
                    <div className="h-7 w-16 rounded-full bg-surface-container" />
                    <div className="h-7 w-20 rounded-full bg-surface-container" />
                  </div>
                  <div className="h-8 w-28 rounded-xl bg-surface-container" />
                </div>
              ))
            : investors.map((investor) => {
                const investorKey =
                  investor.investor_profile_id || investor.user_id;
                return (
                <InvestorCard
                  key={investorKey}
                  investor={investor}
                  onConnect={handleConnect}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isConnecting={
                    connectingUserId !== null &&
                    (connectingUserId === investor.user_id ||
                      connectingUserId === investor.connection_id)
                  }
                  relationship={getProfileRelationship({
                    viewerUserId: user?.id,
                    viewerUserType: user?.userType,
                    profileUserId: investor.user_id,
                    profileOwnerType: PROFILE_OWNER_TYPES.INVESTOR,
                    connectionStatus: investor.connection_status,
                    connectionRequesterId: investor.connection_requester_id,
                    connectionDeclinedAt: investor.connection_declined_at,
                  })}
                />
              );
              })}
        </div>

        {!loading && (
          <>
            {!investors.length && (
              <div className="mt-8 text-content-secondary">No investors found.</div>
            )}

            <div className="mt-auto pt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-line text-content-secondary disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-content-secondary">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages || 1, prev + 1))
                }
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-line text-content-secondary disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </>
        )}
    </div>
  );
};

export default InvestorsPage;
