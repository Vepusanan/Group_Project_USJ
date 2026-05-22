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

const INVESTOR_TYPES = [
  "ANGEL",
  "VC",
  "CORPORATE",
  "FAMILY_OFFICE",
  "ACCELERATOR",
  "OTHER",
];

const INDUSTRIES = [
  "FinTech",
  "HealthTech",
  "EdTech",
  "AgriTech",
  "CleanTech",
  "AI/ML",
  "SaaS",
  "E-commerce",
  "Logistics",
  "LegalTech",
  "PropTech",
  "InsurTech",
  "FoodTech",
  "TravelTech",
  "Gaming",
  "Cybersecurity",
  "Blockchain",
  "IoT",
  "BioTech",
  "SpaceTech",
  "Other",
];

const INVESTMENT_STAGES = [
  { value: "PRE_SEED", label: "Pre-seed" },
  { value: "SEED", label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "SERIES_D_PLUS", label: "Series D+" },
];

const statusBadgeClass = {
  self: "bg-slate-500/20 text-slate-200 border-slate-400/30",
  not_connected: "bg-orange-500/20 text-orange-200 border-orange-400/30",
  pending: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  accepted: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  declined: "bg-rose-500/20 text-rose-200 border-rose-400/30",
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
  "from-violet-600 to-indigo-600",
  "from-purple-600 to-pink-600",
  "from-blue-600 to-cyan-600",
  "from-indigo-600 to-violet-600",
  "from-fuchsia-600 to-purple-600",
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
  currentUserId,
  canSendRequest,
  canInitiateRequest,
}) => {
  const connectionStatus = investor.connection_status || "not_connected";
  const isReceivedRequest =
    connectionStatus === "pending" &&
    investor.connection_requester_id &&
    String(investor.connection_requester_id) !== String(currentUserId);
  const statusLabel =
    connectionStatus === "accepted"
      ? "Connected"
      : connectionStatus === "pending"
        ? "Pending"
        : connectionStatus === "self"
          ? "You"
          : "Connect";
  const description = truncateDescription(
    investor.investment_thesis ||
      investor.what_you_look_for ||
      investor.value_add,
  );
  const canConnect = !["self", "pending", "accepted"].includes(
    connectionStatus,
  );
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
      <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] hover:border-purple-500/30 hover:from-white/[0.07] hover:to-white/[0.03] backdrop-blur-sm transition-all duration-300 overflow-hidden">
        {/* Top accent bar */}
        <div className={`h-1 w-full bg-gradient-to-r ${avatarGradient}`} />

        <div className="p-5 flex items-stretch gap-5">
          {/* Avatar */}
          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden self-start`}>
            {investor.photo_url
              ? <img src={investor.photo_url} alt={name} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-3xl">{avatarInitial}</span>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 flex flex-col">
            <h3 className="text-base font-semibold text-white leading-tight truncate">{name}</h3>
            <p className="text-xs text-purple-300/80 mt-1 font-medium uppercase tracking-wide truncate">{investorTypeLabel}</p>

            {/* Check size hero stat + Industries/Stages pills */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-200 font-medium">
                <DollarSign className="w-3 h-3" />{checkSize}
              </span>
              {industries.map((ind) => (
                <span key={ind} className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-200">
                  {ind}
                </span>
              ))}
              {stages.map((s) => (
                <span key={s} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-200">
                  <Layers className="w-2.5 h-2.5" />{s}
                </span>
              ))}
            </div>

            {/* Meta strip */}
            <div className="mt-3 flex items-center gap-4 flex-wrap text-xs text-gray-400">
              {location && (
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-purple-400" />{location}
                </span>
              )}
              {yearsExp != null && yearsExp !== "" && (
                <span className="flex items-center gap-1.5">
                  <Briefcase className="w-3 h-3 text-purple-400" />{yearsExp} yr{Number(yearsExp) === 1 ? "" : "s"} exp
                </span>
              )}
              {investor.follow_on_investment && (
                <span className="flex items-center gap-1.5">
                  <Target className="w-3 h-3 text-purple-400" />Follow-on open
                </span>
              )}
            </div>
          </div>

          {/* Actions column — status on top, buttons grouped below */}
          <div className="flex flex-col items-end justify-between gap-3 shrink-0 w-[150px]">
            <span className={`px-2.5 py-1 text-[11px] font-medium border rounded-full whitespace-nowrap ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
              {connectionStatus === "accepted" ? "Connected" : connectionStatus === "pending" ? "Pending" : connectionStatus === "self" ? "You" : "Not connected"}
            </span>
            <div className="flex flex-col items-stretch gap-2 w-full">
              <Link
                to={profileUrl}
                className="text-center px-4 py-2.5 text-sm rounded-xl border border-white/20 text-gray-200 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all font-medium"
              >
                View Profile
              </Link>
              {canSendRequest && isReceivedRequest ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={() => onAccept(investor.connection_id)}
                    className="px-2 py-2.5 text-sm rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-40 transition-colors"
                  >
                    {isConnecting ? "…" : "Accept"}
                  </button>
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={() => onDecline(investor.connection_id)}
                    className="px-2 py-2.5 text-sm rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 font-medium disabled:opacity-40 transition-colors"
                  >
                    Decline
                  </button>
                </div>
              ) : canInitiateRequest ? (
                <button
                  type="button"
                  disabled={!canConnect || isConnecting}
                  onClick={() => onConnect(investor.user_id)}
                  className="px-4 py-2.5 text-sm rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-purple-900/30"
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
    <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-900/20 backdrop-blur-sm transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${avatarGradient}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start gap-3">
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
              <span className="text-white font-bold text-xl">
                {avatarInitial}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white leading-tight truncate">
              {name}
            </h3>
            <p className="text-xs text-purple-300/80 font-medium mt-0.5 truncate uppercase tracking-wide">
              {investorTypeLabel}
            </p>
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
        <div className="mt-4 flex items-center justify-between gap-2 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 border border-emerald-400/20 rounded-xl px-3 py-2.5">
          <div className="flex items-center gap-2 min-w-0">
            <DollarSign className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-emerald-300/70 uppercase tracking-wide font-medium leading-none">Check size</p>
              <p className="text-sm font-semibold text-emerald-200 truncate mt-0.5">{checkSize}</p>
            </div>
          </div>
        </div>

        {/* Industry tags */}
        {industries.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">Industries of interest</p>
            <div className="flex flex-wrap gap-1.5">
              {industries.map((ind) => (
                <span
                  key={ind}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-200"
                >
                  {ind}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stage tags */}
        {stages.length > 0 && (
          <div className="mt-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1.5">Investment stages</p>
            <div className="flex flex-wrap gap-1.5">
              {stages.map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-200"
                >
                  <Layers className="w-2.5 h-2.5" />{s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Stats grid — fills card with substantive content */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          {location && (
            <div className="flex items-center gap-1.5 text-gray-300 bg-white/5 rounded-lg px-2.5 py-1.5 min-w-0">
              <Globe className="w-3 h-3 text-purple-400 flex-shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          )}
          {yearsExp != null && yearsExp !== "" && (
            <div className="flex items-center gap-1.5 text-gray-300 bg-white/5 rounded-lg px-2.5 py-1.5 min-w-0">
              <Briefcase className="w-3 h-3 text-purple-400 flex-shrink-0" />
              <span className="truncate">{yearsExp} yr{Number(yearsExp) === 1 ? "" : "s"} exp</span>
            </div>
          )}
          {followOn && (
            <div className="flex items-center gap-1.5 text-gray-300 bg-white/5 rounded-lg px-2.5 py-1.5 min-w-0 col-span-2">
              <Target className="w-3 h-3 text-purple-400 flex-shrink-0" />
              <span className="truncate">Open to follow-on rounds</span>
            </div>
          )}
        </div>


        {/* Divider + Actions */}
        <div className="mt-auto pt-4 flex gap-2">
          <Link
            to={profileUrl}
            className="flex-1 text-center px-3 py-2 text-xs rounded-xl border border-white/15 text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all font-medium"
          >
            View Profile
          </Link>
          {canSendRequest && isReceivedRequest ? (
            <>
              <button
                type="button"
                disabled={isConnecting}
                onClick={() => onAccept(investor.connection_id)}
                className="flex-1 px-3 py-2 text-xs rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-40 transition-colors"
              >
                {isConnecting ? "…" : "Accept"}
              </button>
              <button
                type="button"
                disabled={isConnecting}
                onClick={() => onDecline(investor.connection_id)}
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 font-medium disabled:opacity-40 transition-colors"
              >
                Decline
              </button>
            </>
          ) : canInitiateRequest ? (
            <button
              type="button"
              disabled={!canConnect || isConnecting}
              onClick={() => onConnect(investor.user_id)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-purple-900/40"
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
  const [connectingUserId, setConnectingUserId] = useState(null);
  const [isListView, setIsListView] = useState(false);

  // Debounce free-text fields so we don't fetch on every keystroke.
  // When a free-text input is cleared we want the empty state to apply
  // immediately (otherwise the previous value lingers for the debounce
  // window and the user sees stale/empty results).
  const debouncedQ = useDebounce(filters.q, 350);
  const debouncedLocation = useDebounce(filters.location, 350);
  const effectiveQ = filters.q.trim() === "" ? "" : debouncedQ;
  const effectiveLocation = filters.location.trim() === "" ? "" : debouncedLocation;
  const effectiveFilters = useMemo(
    () => ({ ...filters, q: effectiveQ, location: effectiveLocation }),
    [filters, effectiveQ, effectiveLocation],
  );

  const fetchInvestors = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await apiService.getInvestors({
      ...effectiveFilters,
      page,
      limit: 9,
    });

    if (!result.success) {
      setError(result.error || "Failed to load investors");
      setInvestors([]);
      setLoading(false);
      return;
    }

    const payload = result.data || {};
    setInvestors(Array.isArray(payload.data) ? payload.data : []);
    setTotalPages(payload.totalPages || 1);
    setLoading(false);
  }, [effectiveFilters, page]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

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
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Discover Investors
            </h1>
            <p className="text-gray-300 mt-1">
              Find investors who match your startup stage and industry.
            </p>
          </div>
          {/* Grid / List toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-white/15 bg-black/30 p-1">
            <button
              type="button"
              onClick={() => setIsListView(false)}
              className={`p-1.5 rounded-md transition-colors ${!isListView ? "bg-purple-500/30 text-white" : "text-gray-400 hover:text-white"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsListView(true)}
              className={`p-1.5 rounded-md transition-colors ${isListView ? "bg-purple-500/30 text-white" : "text-gray-400 hover:text-white"}`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filters Panel */}
        <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-sm p-4 space-y-3">
          {/* Row 1: Search (wide) */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, firm, or keyword"
              value={filters.q}
              onChange={(e) => handleFilterChange("q", e.target.value)}
              className="w-full h-10 rounded-lg bg-black/40 border border-white/15 pl-10 pr-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          {/* Row 2: Dropdown filters */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <select
                value={filters.investor_type}
                onChange={(e) => handleFilterChange("investor_type", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-black/40 border border-white/15 pl-3 pr-9 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                <option value="">All Investor Types</option>
                {INVESTOR_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.industries}
                onChange={(e) => handleFilterChange("industries", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-black/40 border border-white/15 pl-3 pr-9 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                <option value="">All Industries</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
              <select
                value={filters.investment_stage}
                onChange={(e) => handleFilterChange("investment_stage", e.target.value)}
                className="w-full h-10 appearance-none rounded-lg bg-black/40 border border-white/15 pl-3 pr-9 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              >
                <option value="">All Stages</option>
                {INVESTMENT_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
            </div>

            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              <input
                type="text"
                placeholder="Location / Country"
                value={filters.location}
                onChange={(e) => handleFilterChange("location", e.target.value)}
                className="w-full h-10 rounded-lg bg-black/40 border border-white/15 pl-9 pr-3 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Row 3: Check-size range + Sort + Clear (right-aligned) */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-3 pt-1">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-gray-400 font-medium whitespace-nowrap">Check size:</span>
              <div className="relative flex-1 max-w-[140px]">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.investment_min}
                  onChange={(e) => handleFilterChange("investment_min", e.target.value)}
                  className="w-full h-10 rounded-lg bg-black/40 border border-white/15 pl-7 pr-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                  min="0"
                />
              </div>
              <span className="text-gray-500 text-sm flex-shrink-0">–</span>
              <div className="relative flex-1 max-w-[140px]">
                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.investment_max}
                  onChange={(e) => handleFilterChange("investment_max", e.target.value)}
                  className="w-full h-10 rounded-lg bg-black/40 border border-white/15 pl-7 pr-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-purple-500/50 transition-colors"
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 lg:ml-auto">
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 h-10 px-3 rounded-lg border border-white/15 bg-black/40 text-sm text-gray-300 hover:text-white hover:border-white/30 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Clear
                </button>
              )}
              <div className="relative">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
                <select
                  value={filters.sort}
                  onChange={(e) => handleFilterChange("sort", e.target.value)}
                  className="h-10 appearance-none rounded-lg bg-black/40 border border-white/15 pl-9 pr-9 text-sm text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                >
                  <option value="newest">Newest First</option>
                  <option value="alphabetical">Alphabetical</option>
                  <option value="most_experienced">Most Experienced</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="mt-8 text-gray-300">Loading investors...</div>
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
                  currentUserId={user?.id}
                  canSendRequest={user?.userType === "startup"}
                  canInitiateRequest={user?.userType === "startup"}
                />
              ))}
            </div>

            {!investors.length && (
              <div className="mt-8 text-gray-300">No investors found.</div>
            )}

            <div className="mt-auto pt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg border border-white/20 text-white disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-300">
                Page {page} of {Math.max(1, totalPages)}
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((prev) => Math.min(totalPages || 1, prev + 1))
                }
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-white/20 text-white disabled:opacity-40"
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
