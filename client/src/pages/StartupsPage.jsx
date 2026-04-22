import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LayoutGrid, List } from "lucide-react";
import { apiService } from "../services/apiService";

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

const StartupCard = ({ startup, onConnect, isConnecting, isListView }) => {
  const startupProfileId = startup.startup_profile_id || startup.id;
  const connectionStatus = startup.connection_status || "not_connected";
  const statusLabel =
    connectionStatus === "accepted" ? "connected" : connectionStatus.replace("_", " ");
  const description = truncateDescription(startup.detailed_description || startup.description);
  const canConnect = !["self", "pending", "accepted"].includes(connectionStatus);

  if (isListView) {
    return (
      <div className="rounded-xl border border-white/15 bg-black/40 p-4 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-base font-semibold text-white">
              {startup.company_name || "Unnamed Startup"}
            </h3>
            <span className={`px-2 py-0.5 text-xs border rounded-full ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
              {statusLabel}
            </span>
          </div>
          <p className="text-sm text-gray-300 mt-0.5">{startup.tagline || "No tagline"}</p>
          <p className="text-xs text-gray-400 mt-1">
            {[startup.industry, startup.city || startup.location_city, startup.country || startup.location_country]
              .filter(Boolean).join(" • ") || "No details"}
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Link
            to={`/startups/${startupProfileId}`}
            className="px-3 py-1.5 text-sm rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
          >
            View Profile
          </Link>
          <button
            type="button"
            disabled={!canConnect || isConnecting}
            onClick={() => onConnect(startup.user_id)}
            className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isConnecting ? "Connecting..." : canConnect ? "Connect" : "Connected"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/15 bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {startup.company_name || "Unnamed Startup"}
          </h3>
          <p className="text-sm text-gray-300">{startup.tagline || "No tagline available"}</p>
          <p className="text-xs text-gray-400 mt-1">
            {[startup.industry, startup.city || startup.location_city, startup.country || startup.location_country]
              .filter(Boolean).join(" • ") || "No location/industry details"}
          </p>
        </div>
        <span className={`px-2 py-1 text-xs border rounded-full flex-shrink-0 ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}>
          {statusLabel}
        </span>
      </div>

      <p className="mt-3 text-sm text-gray-300 leading-relaxed">{description}</p>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/startups/${startupProfileId}`}
          className="px-3 py-1.5 text-sm rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
        >
          View Profile
        </Link>
        <button
          type="button"
          disabled={!canConnect || isConnecting}
          onClick={() => onConnect(startup.user_id)}
          className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting ? "Connecting..." : canConnect ? "Connect" : "Connected"}
        </button>
      </div>
    </div>
  );
};

const StartupsPage = () => {
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
            <div className={`mt-6 ${isListView ? "flex flex-col gap-3" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"}`}>
              {startups.map((startup) => (
                <StartupCard
                  key={startup.startup_profile_id || startup.id || startup.user_id}
                  startup={startup}
                  onConnect={handleConnect}
                  isConnecting={connectingUserId === startup.user_id}
                  isListView={isListView}
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
