import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LayoutGrid, List, MapPin, Tag, Rocket, Calendar, Users, TrendingUp, Globe, Search, ChevronDown, ArrowUpDown, X, Sparkles, Bookmark, Columns3, Play, Ban } from "lucide-react";
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
  cardHeaderRowClass,
  cardIdentityClass,
  cardIdentityTitleClass,
  cardIdentitySubtitleMutedClass,
} from "../styles/theme";
import { useDebounce } from "../hooks/useDebounce";
import { INVESTOR_INDUSTRY_OPTIONS } from "../utils/investorFilterOptions";
import { buildStartupApiParams } from "../utils/listingFilters";
import {
  formatCoolingEnd,
  isInConnectionCooling,
} from "../utils/connectionCooling";

const defaultFilters = {
  q: "",
  industry: "",
  location_country: "",
  funding_stage: "",
  revenue_status: "",
  min_verification: "",
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
  if (score >= 80) return "bg-success/10 text-success border-success/30";
  if (score >= 60) return "bg-primary/10 text-primary border-primary/30";
  return "bg-warning/10 text-warning border-warning/30";
};

const MatchScoreBadge = ({ score }) => {
  if (score == null || Number.isNaN(Number(score))) return null;

  const normalized = Math.round(Number(score));
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold border rounded-full ${getMatchScoreBadgeClass(normalized)}`}
      title="Compatibility based on your stated investment preferences"
    >
      <Sparkles className="w-3 h-3" />
      {normalized}% match
    </span>
  );
};

const StartupCard = ({
  startup,
  onConnect,
  onAccept,
  onDecline,
  isConnecting,
  isListView,
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
  const avatarGradient = getStartupGradient(name);
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
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cardIdentityTitleClass}>{name}</h3>
                <VerificationBadge tier={startup.verification_tier} />
              </div>
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
            {showMatchScore && (
              <MatchExplanationBlock
                startupProfileId={startupProfileId}
                matchScore={startup.match_score}
                compact
                className="mt-2"
              />
            )}

            {hasFounderVideo && (
              <div className="mt-2 relative w-28 h-16 rounded-lg overflow-hidden border border-line">
                {startup.founder_video_thumbnail_url ? (
                  <img
                    src={startup.founder_video_thumbnail_url}
                    alt="Founder video"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-alt" />
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Play className="w-4 h-4 text-white" />
                </div>
                <span className="absolute bottom-1 left-1 text-[9px] px-1 py-0.5 rounded bg-black/60 text-white">
                  Video pitch
                </span>
              </div>
            )}

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
            <div className="flex flex-col items-stretch md:items-end gap-2">
              {showMatchScore && <MatchScoreBadge score={startup.match_score} />}
              <span className={`px-2.5 py-1 text-[11px] font-medium border rounded-full whitespace-nowrap ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
                {statusDisplayLabel}
              </span>
            </div>
            <div className="flex flex-col items-stretch gap-2 w-full">
              {showCompare && (
                <label className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm rounded-xl border border-line text-content-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isSelectedForCompare}
                    onChange={() => onToggleCompare?.(startupProfileId)}
                    className="rounded border-line"
                  />
                  Compare
                </label>
              )}
              {showWatchlist && (
                <button
                  type="button"
                  onClick={() => onWatchlistToggle?.(startup)}
                  className={`flex items-center justify-center gap-1 px-4 py-2.5 text-sm rounded-xl border transition-all ${
                    startup.is_watchlisted
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-line text-content-secondary hover:border-primary-light"
                  }`}
                >
                  <Bookmark className={`w-4 h-4 ${startup.is_watchlisted ? "fill-current" : ""}`} />
                  {startup.is_watchlisted ? "Saved" : "Watchlist"}
                </button>
              )}
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
                <>
                  <button
                    type="button"
                    disabled={!canConnect || isConnecting}
                    onClick={() => onConnect(startup)}
                    className={`px-4 py-2.5 text-sm btn-connect-token ${connectButtonClass} shadow-md`}
                  >
                    {connectLabel}
                  </button>
                  {showWatchlist && canConnect && (
                    <button
                      type="button"
                      disabled={isPassing}
                      onClick={() => onPass?.(startup)}
                      className="px-4 py-2.5 text-sm rounded-xl border border-line text-content-muted hover:text-content hover:border-line-strong transition-all"
                    >
                      {isPassing ? "…" : "Pass"}
                    </button>
                  )}
                </>
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
              <div className="flex flex-wrap items-center gap-2">
                <h3 className={cardIdentityTitleClass}>{name}</h3>
                <VerificationBadge tier={startup.verification_tier} />
              </div>
              <p className={cardIdentitySubtitleMutedClass}>{startup.tagline || "No tagline provided"}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            {showMatchScore && <MatchScoreBadge score={startup.match_score} />}
            <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
              {statusDisplayLabel}
            </span>
          </div>
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
        {showMatchScore && (
          <MatchExplanationBlock
            startupProfileId={startupProfileId}
            matchScore={startup.match_score}
            compact
            className="mt-2"
          />
        )}

        {hasFounderVideo && (
          <div className="mt-3 relative w-full h-24 rounded-xl overflow-hidden border border-line">
            {startup.founder_video_thumbnail_url ? (
              <img
                src={startup.founder_video_thumbnail_url}
                alt="Founder video"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-surface-alt" />
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <Play className="w-6 h-6 text-white" />
            </div>
            <span className="absolute bottom-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-black/60 text-white">
              Video pitch available
            </span>
          </div>
        )}

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
          {showCompare && (
            <label className="inline-flex items-center gap-1.5 px-2 py-2 rounded-xl border border-line text-xs text-content-secondary cursor-pointer">
              <input
                type="checkbox"
                checked={isSelectedForCompare}
                onChange={() => onToggleCompare?.(startupProfileId)}
                className="rounded border-line"
              />
              Compare
            </label>
          )}
          {showWatchlist && (
            <button
              type="button"
              onClick={() => onWatchlistToggle?.(startup)}
              className={`px-3 py-2 rounded-xl border text-xs ${
                startup.is_watchlisted
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-line text-content-secondary hover:border-primary-light"
              }`}
              title="Save to watchlist"
            >
              <Bookmark className={`w-4 h-4 ${startup.is_watchlisted ? "fill-current" : ""}`} />
            </button>
          )}
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
            <>
              <button
                type="button"
                disabled={!canConnect || isConnecting}
                onClick={() => onConnect(startup)}
                className={`flex-1 px-3 py-2 text-xs btn-connect-token ${connectButtonClass} shadow-md`}
              >
                {connectLabel}
              </button>
              {showWatchlist && canConnect && (
                <button
                  type="button"
                  disabled={isPassing}
                  onClick={() => onPass?.(startup)}
                  className="px-3 py-2 rounded-xl border border-line text-xs text-content-muted hover:text-content"
                  title="Pass — archive from discovery"
                >
                  <Ban className="w-4 h-4" />
                </button>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

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

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await apiService.getStartups(
      buildStartupApiParams(apiFilters, { page, limit: 9 }),
    );

    if (!result.success) {
      setError(result.error || "Failed to load startups");
      setStartups([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    const payload = result.data || {};
    setStartups(Array.isArray(payload.data) ? payload.data : []);
    setTotalPages(payload.totalPages || 1);
    setTotalCount(payload.total ?? 0);
    setLoading(false);
  }, [apiFilters, page]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const result = await apiService.getStartups(
        buildStartupApiParams(apiFilters, { page, limit: 9 }),
      );

      if (!active) return;

      if (!result.success) {
        setError(result.error || "Failed to load startups");
        setStartups([]);
        setTotalCount(0);
        setLoading(false);
        return;
      }

      const payload = result.data || {};
      setStartups(Array.isArray(payload.data) ? payload.data : []);
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

  const handleOpenConnect = (startup) => {
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
  };

  const handleSubmitConnect = async () => {
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
    await fetchStartups();
  };

  const handlePass = async (startup) => {
    const profileId = startup.startup_profile_id || startup.id;
    if (!profileId) return;
    setPassingProfileId(profileId);
    const result = await investorIntentService.passStartup(profileId);
    setPassingProfileId(null);
    if (!result.success) {
      setError(result.error);
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

  const handleWatchlistToggle = async (startup) => {
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
            {isInvestorViewer && (
              <p className="mt-2 text-xs text-content-muted max-w-2xl">
                Match scores reflect alignment with your stated preferences (industry, stage, geography, check size, and revenue status). They are a guide only and may not capture every relevant factor.
              </p>
            )}
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
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
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
                className="w-full h-10 rounded-lg bg-surface-alt border border-line pl-10 pr-3 text-sm text-content placeholder:text-content-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            {isInvestorViewer && (
              <button
                type="button"
                onClick={handleAiSearch}
                disabled={aiSearchLoading || !filters.q.trim()}
                className="inline-flex items-center gap-1.5 h-10 px-3 rounded-lg border border-primary/30 bg-primary/10 text-sm text-primary hover:bg-primary/15 disabled:opacity-50 shrink-0"
                title="Parse natural language into filters"
              >
                <Sparkles className="w-4 h-4" />
                {aiSearchLoading ? "Parsing…" : "AI filters"}
              </button>
            )}
          </div>
          {aiSearchSummary && (
            <p className="text-xs text-content-secondary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
              <span className="font-medium text-primary">Applied filters:</span> {aiSearchSummary}
            </p>
          )}

          {/* Row 2: Dropdown filters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <select
                value={filters.industry}
                onChange={(e) => handleFilterChange("industry", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-3 pr-9 text-sm text-content focus:outline-none focus:border-primary transition-colors"
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

            {isInvestorViewer && (
              <div className="relative">
                <select
                  value={filters.min_verification}
                  onChange={(e) => handleFilterChange("min_verification", e.target.value)}
                  className="w-full h-10 appearance-none rounded-lg bg-surface-alt border border-line pl-3 pr-9 text-sm text-content focus:outline-none focus:border-primary transition-colors"
                >
                  {VERIFICATION_FILTERS.map((v) => (
                    <option key={v.value || "all"} value={v.value}>{v.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-content-muted pointer-events-none" />
              </div>
            )}

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
                  {isInvestorViewer && (
                    <option value="match_score">Best Match</option>
                  )}
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

        {!loading && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-content-secondary">
              {totalCount === 1 ? "1 startup found" : `${totalCount} startups found`}
            </p>
            {isInvestorViewer && compareIds.length > 0 && (
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
                  isListView={isListView}
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
