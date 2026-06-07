import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, List, MapPin, Tag, Rocket, Calendar, Users, TrendingUp, Globe, Search, ChevronDown, ArrowUpDown, X } from "lucide-react";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";
import {
  getProfileRelationship,
  PROFILE_OWNER_TYPES,
} from "../utils/profileRelationship";
import {
  connectButtonClass,
  cardHeaderRowClass,
  cardIdentityClass,
  cardIdentityTitleClass,
  cardIdentitySubtitleMutedClass,
} from "../styles/theme";
import { useDebounce } from "../hooks/useDebounce";

const defaultFilters = {
  q: "",
  industry: "",
  location_country: "",
  funding_stage: "",
  revenue_status: "",
  sort: "newest",
};

const INDUSTRIES = [
  "FinTech","HealthTech","EdTech","AgriTech","CleanTech","AI/ML","SaaS","E-commerce",
  "Logistics","LegalTech","PropTech","InsurTech","FoodTech","TravelTech","Gaming",
  "Cybersecurity","Blockchain","IoT","BioTech","SpaceTech","Other",
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

const StartupCard = ({
  startup,
  onConnect,
  onAccept,
  onDecline,
  isConnecting,
  isListView,
  relationship,
}) => {
  const startupProfileId = startup.startup_profile_id || startup.id;
  const connectionStatus = startup.connection_status || "not_connected";
  const canConnect = !["self", "pending", "accepted"].includes(connectionStatus);
  const description = truncateDescription(startup.detailed_description || startup.description);
  const name = startup.company_name || "Unnamed Startup";
  const avatarInitial = name.charAt(0).toUpperCase();
  const avatarGradient = getStartupGradient(name);
  const locationParts = [startup.location_city || startup.city, startup.location_country || startup.country].filter(Boolean);
  const stage = STAGE_LABEL[startup.funding_stage] || startup.funding_stage || null;
  const profileUrl = `/startups/${startupProfileId}`;

  const statusDisplayLabel = connectionStatus === "accepted" ? "Connected" : connectionStatus === "pending" ? "Pending" : connectionStatus === "self" ? "You" : "Not connected";
  const connectLabel = isConnecting ? "Connecting…" : canConnect ? "Connect" : connectionStatus === "accepted" ? "Connected" : connectionStatus === "pending" ? "Pending" : "You";

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

  if (isListView) {
    const description = truncateDescription(startup.detailed_description || startup.description, 180);
    return (
      <div className="group relative rounded-2xl border border-line bg-gradient-to-br from-surface to-surface-alt hover:border-primary-light hover:from-surface-alt hover:to-surface  transition-all duration-300 overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${avatarGradient}`} />

        <div className="p-5 flex flex-col md:flex-row md:items-center gap-5">
          {/* Avatar */}
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden self-start`}>
            {startup.logo_url
              ? <img src={startup.logo_url} alt={name} className="w-full h-full object-cover" />
              : <span className="avatar-initial text-3xl">{avatarInitial}</span>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col">
            <div className={cardIdentityClass}>
              <h3 className={cardIdentityTitleClass}>{name}</h3>
              <p className={cardIdentitySubtitleMutedClass}>{startup.tagline || "No tagline provided"}</p>
            </div>

            {/* Meta pills */}
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {startup.industry && (
                <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-primary-light border border-primary-light text-primary">
                  <Tag className="w-2.5 h-2.5" />{startup.industry}
                </span>
              )}
              {stage && (
                <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-primary/15 border border-primary-light text-primary">
                  <Rocket className="w-2.5 h-2.5" />{stage}
                </span>
              )}
              {revenueLabel && (
                <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-warning/15 border border-warning/30 text-warning">
                  <TrendingUp className="w-2.5 h-2.5" />{revenueLabel}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="mt-2.5 text-xs text-content-muted leading-relaxed line-clamp-2">{description}</p>

            {/* Meta strip */}
            <div className="mt-3 flex items-center gap-4 flex-wrap text-xs text-content-muted">
              {locationParts.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-primary" />{locationParts.join(", ")}
                </span>
              )}
              {foundedYear && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3 h-3 text-primary" />Est. {foundedYear}
                </span>
              )}
              {teamSize && (
                <span className="flex items-center gap-1.5">
                  <Users className="w-3 h-3 text-primary" />{teamSize} {Number(teamSize) === 1 ? "person" : "people"}
                </span>
              )}
              {hasWebsite && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-primary" />Website
                </span>
              )}
            </div>
          </div>

          {/* Actions column — status on top, buttons grouped below */}
          <div className="flex flex-col items-stretch md:items-end justify-between gap-3 w-full md:shrink-0 md:w-[150px]">
            <span className={`px-2.5 py-1 text-[11px] font-medium border rounded-full whitespace-nowrap ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
              {statusDisplayLabel}
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
                    onClick={() => onAccept(startup.connection_id)}
                    className="px-2 py-2.5 text-sm rounded-xl bg-primary hover:bg-primary-dark text-content-inverse font-medium disabled:opacity-40 transition-colors"
                  >
                    {isConnecting ? "…" : "Accept"}
                  </button>
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={() => onDecline(startup.connection_id)}
                    className="px-2 py-2.5 text-sm rounded-xl border border-error/30 text-error hover:bg-error/10 font-medium disabled:opacity-40 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              ) : relationship?.showInteractionActions && relationship.canInitiateConnection ? (
                <button
                  type="button"
                  disabled={!canConnect || isConnecting}
                  onClick={() => onConnect(startup.user_id)}
                  className={`px-4 py-2.5 text-sm btn-connect-token ${connectButtonClass} shadow-md`}
                >
                  {connectLabel}
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl border border-line bg-gradient-to-br from-surface to-surface-alt hover:border-primary-light hover:shadow-card hover:shadow-soft  transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${avatarGradient}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className={cardHeaderRowClass}>
          <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden`}>
            {startup.logo_url
              ? <img src={startup.logo_url} alt={name} className="w-full h-full object-cover" />
              : <span className="avatar-initial text-xl">{avatarInitial}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className={cardIdentityClass}>
              <h3 className={cardIdentityTitleClass}>{name}</h3>
              <p className={cardIdentitySubtitleMutedClass}>{startup.tagline || "No tagline provided"}</p>
            </div>
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full flex-shrink-0 ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
            {statusDisplayLabel}
          </span>
        </div>

        {/* Meta pills (industry + stage) */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {startup.industry && (
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-primary-light border border-primary-light text-primary">
              <Tag className="w-2.5 h-2.5" />{startup.industry}
            </span>
          )}
          {stage && (
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-primary/15 border border-primary-light text-primary">
              <Rocket className="w-2.5 h-2.5" />{stage}
            </span>
          )}
          {revenueLabel && (
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-warning/15 border border-warning/30 text-warning">
              <TrendingUp className="w-2.5 h-2.5" />{revenueLabel}
            </span>
          )}
        </div>

        {/* About */}
        <p className="mt-3 text-xs text-content-muted leading-relaxed line-clamp-3">{description}</p>

        {/* Stats grid — fills card with substantive content */}
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          {locationParts.length > 0 && (
            <div className="flex items-center gap-1.5 text-content-secondary bg-surface-alt rounded-lg px-2.5 py-1.5 min-w-0">
              <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">{locationParts.join(", ")}</span>
            </div>
          )}
          {foundedYear && (
            <div className="flex items-center gap-1.5 text-content-secondary bg-surface-alt rounded-lg px-2.5 py-1.5 min-w-0">
              <Calendar className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">Est. {foundedYear}</span>
            </div>
          )}
          {teamSize && (
            <div className="flex items-center gap-1.5 text-content-secondary bg-surface-alt rounded-lg px-2.5 py-1.5 min-w-0">
              <Users className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">{teamSize} {Number(teamSize) === 1 ? "person" : "people"}</span>
            </div>
          )}
          {hasWebsite && (
            <div className="flex items-center gap-1.5 text-content-secondary bg-surface-alt rounded-lg px-2.5 py-1.5 min-w-0">
              <Globe className="w-3 h-3 text-primary flex-shrink-0" />
              <span className="truncate">Website</span>
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
                onClick={() => onAccept(startup.connection_id)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-primary hover:bg-primary-dark text-content-inverse font-medium disabled:opacity-40 transition-colors"
              >
                {isConnecting ? "…" : "Accept"}
              </button>
              <button
                type="button"
                disabled={isConnecting}
                onClick={() => onDecline(startup.connection_id)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-error/30 text-error hover:bg-error/10 font-medium disabled:opacity-40 transition-colors"
              >
                Decline
              </button>
            </>
          ) : relationship?.showInteractionActions && relationship.canInitiateConnection ? (
            <button
              type="button"
              disabled={!canConnect || isConnecting}
              onClick={() => onConnect(startup.user_id)}
              className={`flex-1 px-3 py-2 text-xs btn-connect-token ${connectButtonClass} shadow-md`}
            >
              {connectLabel}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const StartupsPage = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState(defaultFilters);
  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [connectingUserId, setConnectingUserId] = useState(null);
  const [isListView, setIsListView] = useState(false);

  // Debounce only the free-text search; other filter changes apply immediately.
  // When the input is cleared we want the empty state to take effect right
  // away (otherwise the previous search term lingers for the debounce window
  // and shows stale/zero results to the user).
  const debouncedQ = useDebounce(filters.q, 350);
  const effectiveQ = filters.q.trim() === "" ? "" : debouncedQ;
  const effectiveFilters = useMemo(
    () => ({ ...filters, q: effectiveQ }),
    [filters, effectiveQ],
  );

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await apiService.getStartups({
      ...effectiveFilters,
      page,
      limit: 9,
    });

    if (!result.success) {
      setError(result.error || "Failed to load startups");
      setStartups([]);
      setLoading(false);
      return;
    }

    const payload = result.data || {};
    setStartups(Array.isArray(payload.data) ? payload.data : []);
    setTotalPages(payload.totalPages || 1);
    setLoading(false);
  }, [effectiveFilters, page]);

  useEffect(() => {
    fetchStartups();
  }, [fetchStartups]);

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
    await fetchStartups();
  };

  const handleAccept = async (connectionId) => {
    if (!connectionId) return;
    setConnectingUserId(connectionId);
    const response = await apiService.respondToConnection(connectionId, "accepted");
    setConnectingUserId(null);
    if (!response.success) {
      setError(response.error || "Failed to accept request");
      return;
    }
    await fetchStartups();
  };

  const handleDecline = async (connectionId) => {
    if (!connectionId) return;
    setConnectingUserId(connectionId);
    const response = await apiService.respondToConnection(connectionId, "declined");
    setConnectingUserId(null);
    if (!response.success) {
      setError(response.error || "Failed to decline request");
      return;
    }
    await fetchStartups();
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== "sort" && v !== ""
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl min-h-[calc(100vh-9rem)] flex flex-col">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-content">Discover Startups</h1>
            <p className="text-content-secondary mt-1">Browse and search startups seeking funding.</p>
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
              placeholder="Search by name, tagline, or description"
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              className="w-full h-10 rounded-lg bg-surface-alt border border-line pl-10 pr-3 text-sm text-content placeholder:text-content-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* Row 2: Dropdown filters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <select
                value={filters.industry}
                onChange={(e) => handleFilterChange("industry", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-3 pr-9 text-sm text-content focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">All Industries</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.funding_stage}
                onChange={(e) => handleFilterChange("funding_stage", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-3 pr-9 text-sm text-content focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">All Stages</option>
                {FUNDING_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.revenue_status}
                onChange={(e) => handleFilterChange("revenue_status", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-3 pr-9 text-sm text-content focus:outline-none focus:border-primary transition-colors"
              >
                <option value="">All Revenue Status</option>
                {REVENUE_STATUSES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              <input
                type="text"
                placeholder="Country"
                value={filters.location_country}
                onChange={(e) => handleFilterChange("location_country", e.target.value)}
                className="w-full h-10 rounded-lg bg-surface-alt border border-line pl-9 pr-3 text-sm text-content placeholder:text-content-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Sort + Clear (right-aligned) */}
          <div className="flex items-center gap-2 pt-1">
            <div className="ml-auto flex items-center gap-2">
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
                  className="h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-9 pr-9 text-sm text-content focus:outline-none focus:border-primary transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="recently_updated">Recently Updated</option>
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

        {loading ? (
          <div className="mt-8 text-content-secondary">Loading startups...</div>
        ) : (
          <>
            <div className={`mt-6 ${isListView ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"}`}>
              {startups.map((startup) => (
                <StartupCard
                  key={startup.startup_profile_id || startup.id || startup.user_id}
                  startup={startup}
                  onConnect={handleConnect}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isConnecting={
                    connectingUserId !== null &&
                    (connectingUserId === startup.user_id ||
                      connectingUserId === startup.connection_id)
                  }
                  isListView={isListView}
                  relationship={getProfileRelationship({
                    viewerUserId: user?.id,
                    viewerUserType: user?.userType,
                    profileUserId: startup.user_id,
                    profileOwnerType: PROFILE_OWNER_TYPES.STARTUP,
                    connectionStatus: startup.connection_status,
                    connectionRequesterId: startup.connection_requester_id,
                  })}
                />
              ))}
            </div>

            {!startups.length && (
              <div className="mt-8 text-content-secondary">No startups found.</div>
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
                onClick={() => setPage((prev) => Math.min(totalPages || 1, prev + 1))}
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

export default StartupsPage;
