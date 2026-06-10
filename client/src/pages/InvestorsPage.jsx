import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  LayoutGrid,
  List,
  MapPin,
  DollarSign,
  Briefcase,
  TrendingUp,
  Target,
  Layers,
  Globe,
  Search,
  ChevronDown,
  ArrowUpDown,
  X,
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
  cardFieldClass,
  cardFieldLabelClass,
  cardFieldValueClass,
  cardHeaderRowClass,
  cardIdentityClass,
  cardIdentityTitleClass,
  cardIdentitySubtitleClass,
} from "../styles/theme";
import {
  INVESTOR_INDUSTRY_OPTIONS,
  INVESTOR_STAGE_OPTIONS,
  INVESTOR_TYPE_OPTIONS,
} from "../utils/investorFilterOptions";
import { buildInvestorApiParams } from "../utils/listingFilters";
import VerificationBadge from "../components/common/VerificationBadge";

const defaultFilters = {
  q: "",
  investor_type: "",
  location: "",
  industries: "",
  investment_stage: "",
  investment_min: "",
  investment_max: "",
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

const InvestorCard = ({
  investor,
  onConnect,
  onAccept,
  onDecline,
  isConnecting,
  isListView,
  relationship,
}) => {
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
  // Prefer the investor's physical location (country/city) — that's what users
  // expect from a "location" field on a card. Fall back to their geographic
  // investment preference if no physical location is set.
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
    ? String(investor.investor_type).replace(/_/g, " ")
    : "Investor";
  const yearsExp = investor.years_of_experience;

  if (isListView) {
    return (
      <div className="group relative rounded-2xl border border-line bg-gradient-to-br from-surface to-surface-alt hover:border-primary-light/30 hover:from-surface-alt hover:to-surface  transition-all duration-300 overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${avatarGradient}`} />

        <div className="p-5 flex flex-col md:flex-row md:items-center gap-5">
          {/* Avatar */}
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden self-start`}>
            {investor.photo_url
              ? <img src={investor.photo_url} alt={name} className="w-full h-full object-cover" />
              : <span className="avatar-initial text-3xl">{avatarInitial}</span>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className={cardIdentityClass}>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cardIdentityTitleClass}>{name}</h3>
                <VerificationBadge tier={investor.verification_tier} />
              </div>
              <p className={cardIdentitySubtitleClass}>{investorTypeLabel}</p>
            </div>

            {/* Check size hero stat + Industries/Stages pills */}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="inline-flex items-center text-xs px-2.5 py-1 rounded-full bg-primary-light border border-primary-light text-primary font-medium">
                {checkSize}
              </span>
              {industries.map((ind) => (
                <span key={ind} className="text-[11px] px-2.5 py-1 rounded-full bg-primary-light/15 border border-primary-light text-primary">
                  {ind}
                </span>
              ))}
              {stages.map((s) => (
                <span key={s} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-primary/15 border border-primary-light text-primary">
                  <Layers className="w-2.5 h-2.5" />{s}
                </span>
              ))}
            </div>

            {/* Meta strip */}
            <div className="mt-2 flex items-center gap-3 flex-wrap text-xs text-content-muted">
              {location && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-primary" />{location}
                </span>
              )}
              {yearsExp != null && yearsExp !== "" && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 text-primary" />{yearsExp} yr{Number(yearsExp) === 1 ? "" : "s"} exp
                </span>
              )}
              {investor.follow_on_investment && (
                <span className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-primary" />Follow-on open
                </span>
              )}
            </div>
          </div>

          {/* Actions column — status on top, buttons grouped below */}
          <div className="flex flex-col items-stretch md:items-end justify-between gap-3 w-full md:shrink-0 md:w-[150px]">
            <span className={`px-2.5 py-1 text-[11px] font-medium border rounded-full whitespace-nowrap ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
              {connectionStatus === "accepted" ? "Connected" : connectionStatus === "pending" ? "Pending" : connectionStatus === "self" ? "You" : "Not connected"}
            </span>
            <div className="flex flex-col items-stretch gap-2 w-full">
              <Link
                to={profileUrl}
                className="text-center px-4 py-2.5 text-sm rounded-xl border border-line text-content-secondary hover:text-content hover:border-line-strong hover:bg-surface-alt transition-all font-medium"
              >
                View Profile
              </Link>
              {relationship?.showInteractionActions && relationship.canRespondToConnection ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={() => onAccept(investor.connection_id)}
                    className="px-2 py-2.5 text-sm rounded-xl bg-primary hover:bg-primary-dark text-content-inverse font-medium disabled:opacity-40 transition-colors"
                  >
                    {isConnecting ? "…" : "Accept"}
                  </button>
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={() => onDecline(investor.connection_id)}
                    className="px-2 py-2.5 text-sm rounded-xl border border-error/30 text-error hover:bg-error/10 font-medium disabled:opacity-40 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              ) : relationship?.showInteractionActions && relationship.canInitiateConnection ? (
                <button
                  type="button"
                  disabled={!canConnect || isConnecting}
                  onClick={() => onConnect(investor.user_id)}
                  className={`px-4 py-2.5 text-sm btn-connect-token ${connectButtonClass} shadow-md`}
                >
                  {isConnecting ? "…" : canConnect ? "Connect" : statusLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }
  const followOn = investor.follow_on_investment;

  return (
    <div className="group relative rounded-2xl border border-line bg-gradient-to-br from-surface to-surface-alt hover:border-primary-light/30 hover:shadow-card hover:shadow-soft/20  transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${avatarGradient}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className={cardHeaderRowClass}>
          <div
            className={`w-14 h-14 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden`}
          >
            {investor.photo_url ? (
              <img
                src={investor.photo_url}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="avatar-initial text-xl">{avatarInitial}</span>
            )}
          </div>
          <div className={`flex-1 min-w-0 ${cardIdentityClass}`}>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className={cardIdentityTitleClass}>{name}</h3>
              <VerificationBadge tier={investor.verification_tier} />
            </div>
            <p className={cardIdentitySubtitleClass}>{investorTypeLabel}</p>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-medium border rounded-full flex-shrink-0 ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}
          >
            {connectionStatus === "accepted"
              ? "Connected"
              : connectionStatus === "pending"
                ? "Pending"
                : connectionStatus === "self"
                  ? "You"
                  : "Not connected"}
          </span>
        </div>

        {/* Check size — hero stat */}
        <div className="mt-2.5 bg-primary-light border border-primary-light rounded-xl px-3 py-2">
          <div className={cardFieldClass}>
            <p className={cardFieldLabelClass}>Check size</p>
            <p className={cardFieldValueClass}>{checkSize}</p>
          </div>
        </div>

        {/* Industry tags */}
        {industries.length > 0 && (
          <div className={`mt-2 ${cardFieldClass}`}>
            <p className={cardFieldLabelClass}>Industries of interest</p>
            <div className="flex flex-wrap gap-1.5">
              {industries.map((ind) => (
                <span
                  key={ind}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-primary-light/15 border border-primary-light text-primary"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stage tags */}
        {stages.length > 0 && (
          <div className={`mt-2 ${cardFieldClass}`}>
            <p className={cardFieldLabelClass}>Investment stages</p>
            <div className="flex flex-wrap gap-1.5">
              {stages.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-primary/15 border border-primary-light text-primary"
                >
                  <Layers className="w-2.5 h-2.5 shrink-0" />{s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats grid — fills card with substantive content */}
        <div className="mt-2 grid grid-cols-2 gap-1.5 text-xs">
          {location && (
            <div className="flex items-center gap-1.5 text-content-secondary bg-surface-alt rounded-lg px-2.5 py-1.5 min-w-0">
              <Globe className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
          {yearsExp != null && yearsExp !== "" && (
            <div className="flex items-center gap-1.5 text-content-secondary bg-surface-alt rounded-lg px-2.5 py-1.5 min-w-0">
              <Briefcase className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">{yearsExp} yr{Number(yearsExp) === 1 ? "" : "s"} exp</span>
            </div>
          )}
          {followOn && (
            <div className="flex items-center gap-1.5 text-content-secondary bg-surface-alt rounded-lg px-2.5 py-1.5 min-w-0 col-span-2">
              <Target className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">Open to follow-on rounds</span>
            </div>
          )}
        </div>


        {/* Divider + Actions */}
        <div className="mt-auto pt-4 flex gap-2">
          <Link
            to={profileUrl}
            className="flex-1 text-center px-3 py-2 text-xs rounded-xl border border-line text-content-secondary hover:text-content hover:border-line-strong hover:bg-surface-alt transition-all font-medium"
          >
            View Profile
          </Link>
          {relationship?.showInteractionActions && relationship.canRespondToConnection ? (
            <>
              <button
                type="button"
                disabled={isConnecting}
                onClick={() => onAccept(investor.connection_id)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-primary hover:bg-primary-dark text-content-inverse font-medium disabled:opacity-40 transition-colors"
              >
                {isConnecting ? "…" : "Accept"}
              </button>
              <button
                type="button"
                disabled={isConnecting}
                onClick={() => onDecline(investor.connection_id)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-error/30 text-error hover:bg-error/10 font-medium disabled:opacity-40 transition-colors"
              >
                Decline
              </button>
            </>
          ) : relationship?.showInteractionActions && relationship.canInitiateConnection ? (
            <button
              type="button"
              disabled={!canConnect || isConnecting}
              onClick={() => onConnect(investor.user_id)}
              className={`flex-1 px-3 py-2 text-xs btn-connect-token ${connectButtonClass} shadow-md`}
            >
              {isConnecting
                ? "Connecting…"
                : canConnect
                  ? "Connect"
                  : statusLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

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

  const fetchInvestors = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await apiService.getInvestors(
      buildInvestorApiParams(apiFilters, { page, limit: 9 }),
    );

    if (!result.success) {
      setError(result.error || "Failed to load investors");
      setInvestors([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const payload = result.data || {};
    setInvestors(Array.isArray(payload.data) ? payload.data : []);
    setTotalPages(payload.totalPages || 1);
    setTotalCount(payload.total ?? 0);
    setLoading(false);
  }, [apiFilters, page]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const result = await apiService.getInvestors(
        buildInvestorApiParams(apiFilters, { page, limit: 9 }),
      );

      if (!active) return;

      if (!result.success) {
        setError(result.error || "Failed to load investors");
        setInvestors([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const payload = result.data || {};
      setInvestors(Array.isArray(payload.data) ? payload.data : []);
      setTotalPages(payload.totalPages || 1);
      setTotalCount(payload.total ?? 0);
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [apiFilters, page]);

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setPage(1);
    setFilters(defaultFilters);
  };

  const handleConnect = async (userId) => {
    if (!userId) return;
    setConnectingUserId(userId);
    const response = await apiService.createConnection(userId);
    setConnectingUserId(null);

    if (!response.success) {
      setError(response.error || "Failed to send connection request");
      return;
    }
    await fetchInvestors();
  };

  const handleAccept = async (connectionId) => {
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
    await fetchInvestors();
  };

  const handleDecline = async (connectionId) => {
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
    await fetchInvestors();
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== "sort" && v !== "",
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl min-h-[calc(100vh-9rem)] flex flex-col">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-content">
              Discover Investors
            </h1>
            <p className="text-content-secondary mt-1">
              Find investors who match your startup stage and industry.
            </p>
          </div>
          {/* Grid / List toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-line bg-surface-alt p-1">
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
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-9 pr-9 text-sm text-content focus:outline-none focus:border-primary-light/50 transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="most_experienced">Most Experienced</option>
                </select>
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

        {!loading && (
          <p className="mt-4 text-sm text-content-secondary">
            {totalCount === 1 ? "1 investor found" : `${totalCount} investors found`}
          </p>
        )}

        {loading ? (
          <div className="mt-8 text-content-secondary">Loading investors...</div>
        ) : (
          <>
            <div
              className={`mt-6 ${isListView ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"}`}
            >
              {investors.map((investor) => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  onConnect={handleConnect}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isConnecting={
                    connectingUserId !== null &&
                    (connectingUserId === investor.user_id ||
                      connectingUserId === investor.connection_id)
                  }
                  isListView={isListView}
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
              ))}
            </div>

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
    </div>
  );
};

export default InvestorsPage;
