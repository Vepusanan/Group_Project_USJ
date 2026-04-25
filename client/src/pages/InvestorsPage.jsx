import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, List, MapPin, DollarSign, Briefcase, TrendingUp } from "lucide-react";
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
  "ANGEL","VC","CORPORATE","FAMILY_OFFICE","ACCELERATOR","OTHER",
];

const INDUSTRIES = [
  "FinTech","HealthTech","EdTech","AgriTech","CleanTech","AI/ML","SaaS","E-commerce",
  "Logistics","LegalTech","PropTech","InsurTech","FoodTech","TravelTech","Gaming",
  "Cybersecurity","Blockchain","IoT","BioTech","SpaceTech","Other",
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

const InvestorCard = ({ investor, onConnect, onAccept, onDecline, isConnecting, isListView, currentUserId, canSendRequest }) => {
  const connectionStatus = investor.connection_status || "not_connected";
  const isReceivedRequest = connectionStatus === "pending" &&
    investor.connection_requester_id &&
    String(investor.connection_requester_id) !== String(currentUserId);
  const statusLabel =
    connectionStatus === "accepted" ? "Connected" : connectionStatus === "pending" ? "Pending" : connectionStatus === "self" ? "You" : "Connect";
  const description = truncateDescription(
    investor.investment_thesis || investor.what_you_look_for || investor.value_add,
  );
  const canConnect = !["self", "pending", "accepted"].includes(connectionStatus);
  const industries = parseList(investor.industries_of_interest).slice(0, 3);
  const name = investor.name_or_firm || investor.name || "Unnamed Investor";
  const avatarInitial = name.charAt(0).toUpperCase();
  const avatarGradient = getAvatarGradient(name);
  const location = parseList(investor.geographic_preference).slice(0, 2).join(", ");
  const checkSize = currencyRange(investor.min_investment_size, investor.max_investment_size);
  const profileUrl = `/investors/${investor.investor_profile_id || investor.id}`;

  if (isListView) {
    return (
      <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] hover:border-purple-500/30 hover:from-white/[0.07] hover:to-white/[0.03] backdrop-blur-sm transition-all duration-300 p-4 sm:p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-5">
          <div className="min-w-0 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-4 gap-y-2">
            <div className={`row-span-3 h-12 w-12 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center shrink-0 shadow-lg overflow-hidden`}>
              {investor.photo_url
                ? <img src={investor.photo_url} alt={name} className="w-full h-full object-cover" />
                : <span className="text-white font-bold text-base">{avatarInitial}</span>
              }
            </div>

            <div className="min-w-0 flex flex-wrap items-center gap-x-2 gap-y-1">
              <h3 className="truncate text-sm font-semibold text-white sm:text-base">{name}</h3>
              <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full shrink-0 ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
                {connectionStatus === "accepted" ? "Connected" : connectionStatus === "pending" ? "Pending" : connectionStatus === "self" ? "You" : "Not connected"}
              </span>
            </div>

            <p className="min-w-0 text-xs font-medium text-purple-300/80">{investor.investor_type || "Investor"}</p>

            <div className="min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1.5">
              {location && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="h-3 w-3 shrink-0" />{location}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <DollarSign className="h-3 w-3 shrink-0" />{checkSize}
              </span>
              {industries.length > 0 && (
                <span className="max-w-full truncate text-xs text-gray-500">{industries.join(" · ")}</span>
              )}
            </div>
          </div>

          <div className="flex shrink-0 items-center justify-end gap-2 md:self-center">
            <Link
              to={profileUrl}
              className="h-9 px-3 text-xs rounded-lg border border-white/20 text-gray-300 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all inline-flex items-center"
            >
              View Profile
            </Link>
            {canSendRequest && (isReceivedRequest ? (
              <>
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={() => onAccept(investor.connection_id)}
                  className="h-9 px-3 text-xs rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium disabled:opacity-40 transition-colors"
                >
                  {isConnecting ? "…" : "Accept"}
                </button>
                <button
                  type="button"
                  disabled={isConnecting}
                  onClick={() => onDecline(investor.connection_id)}
                  className="h-9 px-3 text-xs rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 font-medium disabled:opacity-40 transition-colors"
                >
                  Decline
                </button>
              </>
            ) : (
              <button
                type="button"
                disabled={!canConnect || isConnecting}
                onClick={() => onConnect(investor.user_id)}
                className="h-9 px-4 text-xs rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-purple-900/30"
              >
                {isConnecting ? "…" : canConnect ? "Connect" : statusLabel}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] hover:border-purple-500/30 hover:shadow-xl hover:shadow-purple-900/20 backdrop-blur-sm transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${avatarGradient}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden`}>
            {investor.photo_url
              ? <img src={investor.photo_url} alt={name} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-lg">{avatarInitial}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white leading-tight truncate">{name}</h3>
            <p className="text-xs text-purple-300/80 font-medium mt-0.5">{investor.investor_type || "Investor"}</p>
            {location && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />{location}
              </p>
            )}
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full flex-shrink-0 ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
            {connectionStatus === "accepted" ? "Connected" : connectionStatus === "pending" ? "Pending" : connectionStatus === "self" ? "You" : "Not connected"}
          </span>
        </div>

        {/* Check size */}
        <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-300 bg-white/5 rounded-lg px-3 py-2">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="font-medium text-emerald-300">{checkSize}</span>
        </div>

        {/* Industry tags */}
        {industries.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {industries.map((ind) => (
              <span key={ind} className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/25 text-indigo-200">
                {ind}
              </span>
            ))}
          </div>
        )}

        {/* Description */}
        <p className="mt-3 text-xs text-gray-400 leading-relaxed flex-1">{description}</p>

        {/* Divider + Actions */}
        <div className="mt-4 pt-4 border-t border-white/8 flex gap-2">
          <Link
            to={profileUrl}
            className="flex-1 text-center px-3 py-2 text-xs rounded-xl border border-white/15 text-gray-300 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all font-medium"
          >
            View Profile
          </Link>
          {canSendRequest && (isReceivedRequest ? (
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
          ) : (
            <button
              type="button"
              disabled={!canConnect || isConnecting}
              onClick={() => onConnect(investor.user_id)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-purple-900/40"
            >
              {isConnecting ? "Connecting…" : canConnect ? "Connect" : statusLabel}
            </button>
          ))}
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

  const fetchInvestors = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await apiService.getInvestors({ ...filters, page, limit: 9 });

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
  }, [filters, page]);

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
    const response = await apiService.respondToConnection(connectionId, "accepted");
    setConnectingUserId(null);
    if (!response.success) { setError(response.error || "Failed to accept request"); return; }
    await fetchInvestors();
  };

  const handleDecline = async (connectionId) => {
    if (!connectionId) return;
    setConnectingUserId(connectionId);
    const response = await apiService.respondToConnection(connectionId, "declined");
    setConnectingUserId(null);
    if (!response.success) { setError(response.error || "Failed to decline request"); return; }
    await fetchInvestors();
  };

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== "sort" && v !== ""
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl min-h-[calc(100vh-9rem)] flex flex-col">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Discover Investors</h1>
            <p className="text-gray-300 mt-1">Find investors who match your startup stage and industry.</p>
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

        {/* Filters */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search by name, firm, or keyword"
            value={filters.q}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
          />
          <select
            value={filters.investor_type}
            onChange={(e) => handleFilterChange("investor_type", e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
          >
            <option value="">All Investor Types</option>
            {INVESTOR_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <select
            value={filters.industries}
            onChange={(e) => handleFilterChange("industries", e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Location / Country"
            value={filters.location}
            onChange={(e) => handleFilterChange("location", e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
          />
          <select
            value={filters.investment_stage}
            onChange={(e) => handleFilterChange("investment_stage", e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
          >
            <option value="">All Stages</option>
            {INVESTMENT_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          {/* Investment size range */}
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min $"
              value={filters.investment_min}
              onChange={(e) => handleFilterChange("investment_min", e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
              min="0"
            />
            <span className="text-gray-500 text-sm flex-shrink-0">–</span>
            <input
              type="number"
              placeholder="Max $"
              value={filters.investment_max}
              onChange={(e) => handleFilterChange("investment_max", e.target.value)}
              className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
              min="0"
            />
          </div>
        </div>

        {/* Sort + clear */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <select
            value={filters.sort}
            onChange={(e) => handleFilterChange("sort", e.target.value)}
            className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="most_experienced">Most Experienced</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-sm text-gray-400 hover:text-white underline"
            >
              Clear filters
            </button>
          )}
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
            <div className={`mt-6 ${isListView ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"}`}>
              {investors.map((investor) => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  onConnect={handleConnect}
                  onAccept={handleAccept}
                  onDecline={handleDecline}
                  isConnecting={connectingUserId !== null && (connectingUserId === investor.user_id || connectingUserId === investor.connection_id)}
                  isListView={isListView}
                  currentUserId={user?.id}
                  canSendRequest={user?.userType === "startup"}
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
                onClick={() => setPage((prev) => Math.min(totalPages || 1, prev + 1))}
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
