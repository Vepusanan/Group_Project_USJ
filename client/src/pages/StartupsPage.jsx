import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, List, MapPin, Tag, Rocket } from "lucide-react";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

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
  self: "bg-slate-500/20 text-slate-200 border-slate-400/30",
  not_connected: "bg-orange-500/20 text-orange-200 border-orange-400/30",
  pending: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  accepted: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  declined: "bg-rose-500/20 text-rose-200 border-rose-400/30",
};

const truncateDescription = (value, maxLength = 130) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "No startup description provided yet.";
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trimEnd()}...`;
};

const STARTUP_AVATAR_GRADIENTS = [
  "from-emerald-600 to-teal-600",
  "from-blue-600 to-indigo-600",
  "from-orange-500 to-rose-600",
  "from-teal-600 to-cyan-600",
  "from-violet-600 to-purple-600",
];

const getStartupGradient = (name = "") => {
  const idx = (name.charCodeAt(0) || 0) % STARTUP_AVATAR_GRADIENTS.length;
  return STARTUP_AVATAR_GRADIENTS[idx];
};

const STAGE_LABEL = {
  PRE_SEED: "Pre-seed", SEED: "Seed", SERIES_A: "Series A",
  SERIES_B: "Series B", SERIES_C: "Series C", SERIES_D_PLUS: "Series D+",
};

const StartupCard = ({ startup, onConnect, isConnecting, isListView, canSendRequest }) => {
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

  if (isListView) {
    return (
      <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.04] to-white/[0.02] hover:border-emerald-500/25 hover:from-white/[0.07] hover:to-white/[0.03] backdrop-blur-sm transition-all duration-300 p-4">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden`}>
            {startup.logo_url
              ? <img src={startup.logo_url} alt={name} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-base">{avatarInitial}</span>
            }
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-semibold text-white truncate">{name}</h3>
              <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
                {statusDisplayLabel}
              </span>
            </div>
            <p className="text-xs text-emerald-300/80 mt-0.5 font-medium truncate">{startup.tagline || "No tagline"}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              {startup.industry && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Tag className="w-3 h-3" />{startup.industry}
                </span>
              )}
              {locationParts.length > 0 && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <MapPin className="w-3 h-3" />{locationParts.join(", ")}
                </span>
              )}
              {stage && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Rocket className="w-3 h-3" />{stage}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to={profileUrl}
              className="px-3 py-1.5 text-xs rounded-lg border border-white/20 text-gray-300 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all"
            >
              View Profile
            </Link>
            {canSendRequest && (
              <button
                type="button"
                disabled={!canConnect || isConnecting}
                onClick={() => onConnect(startup.user_id)}
                className="px-3 py-1.5 text-xs rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-purple-900/30"
              >
                {connectLabel}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] to-white/[0.02] hover:border-emerald-500/25 hover:shadow-xl hover:shadow-emerald-900/15 backdrop-blur-sm transition-all duration-300 overflow-hidden flex flex-col">
      {/* Top accent bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${avatarGradient}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${avatarGradient} flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden`}>
            {startup.logo_url
              ? <img src={startup.logo_url} alt={name} className="w-full h-full object-cover" />
              : <span className="text-white font-bold text-lg">{avatarInitial}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white leading-tight truncate">{name}</h3>
            <p className="text-xs text-emerald-300/80 font-medium mt-0.5 truncate">{startup.tagline || "No tagline"}</p>
            {locationParts.length > 0 && (
              <p className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                <MapPin className="w-3 h-3 flex-shrink-0" />{locationParts.join(", ")}
              </p>
            )}
          </div>
          <span className={`px-2 py-0.5 text-[10px] font-medium border rounded-full flex-shrink-0 ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
            {statusDisplayLabel}
          </span>
        </div>

        {/* Meta pills */}
        <div className="mt-4 flex flex-wrap gap-1.5">
          {startup.industry && (
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-200">
              <Tag className="w-2.5 h-2.5" />{startup.industry}
            </span>
          )}
          {stage && (
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full bg-blue-500/15 border border-blue-400/25 text-blue-200">
              <Rocket className="w-2.5 h-2.5" />{stage}
            </span>
          )}
        </div>

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
          {canSendRequest && (
            <button
              type="button"
              disabled={!canConnect || isConnecting}
              onClick={() => onConnect(startup.user_id)}
              className="flex-1 px-3 py-2 text-xs rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity shadow-md shadow-purple-900/40"
            >
              {connectLabel}
            </button>
          )}
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

  const fetchStartups = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await apiService.getStartups({ ...filters, page, limit: 9 });

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
  }, [filters, page]);

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

  const hasActiveFilters = Object.entries(filters).some(
    ([k, v]) => k !== "sort" && v !== ""
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl min-h-[calc(100vh-9rem)] flex flex-col">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Discover Startups</h1>
            <p className="text-gray-300 mt-1">Browse and search startups seeking funding.</p>
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
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          <input
            type="text"
            placeholder="Search by name, tagline, or description"
            value={filters.q}
            onChange={(e) => handleFilterChange("q", e.target.value)}
            className="xl:col-span-2 w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
          />
          <select
            value={filters.industry}
            onChange={(e) => handleFilterChange("industry", e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
          >
            <option value="">All Industries</option>
            {INDUSTRIES.map((ind) => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Country"
            value={filters.location_country}
            onChange={(e) => handleFilterChange("location_country", e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
          />
          <select
            value={filters.funding_stage}
            onChange={(e) => handleFilterChange("funding_stage", e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
          >
            <option value="">All Stages</option>
            {FUNDING_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
          <select
            value={filters.revenue_status}
            onChange={(e) => handleFilterChange("revenue_status", e.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
          >
            <option value="">All Revenue Status</option>
            {REVENUE_STATUSES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
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
            <option value="recently_updated">Recently Updated</option>
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
          <div className="mt-8 text-gray-300">Loading startups...</div>
        ) : (
          <>
            <div className={`mt-6 ${isListView ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"}`}>
              {startups.map((startup) => (
                <StartupCard
                  key={startup.startup_profile_id || startup.id || startup.user_id}
                  startup={startup}
                  onConnect={handleConnect}
                  isConnecting={connectingUserId === startup.user_id}
                  isListView={isListView}
                  canSendRequest={user?.userType === "investor"}
                />
              ))}
            </div>

            {!startups.length && (
              <div className="mt-8 text-gray-300">No startups found.</div>
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

export default StartupsPage;
