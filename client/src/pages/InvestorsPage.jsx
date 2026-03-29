import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiService } from "../services/apiService";

const defaultFilters = {
  q: "",
  investor_type: "",
  location: "",
  sort: "newest",
};

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
  return `${format(min)} - ${format(max)}`;
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

const InvestorCard = ({ investor, onConnect, isConnecting }) => {
  const connectionStatus = investor.connection_status || "not_connected";
  const statusLabel =
    connectionStatus === "accepted"
      ? "connected"
      : connectionStatus.replace("_", " ");
  const description = truncateDescription(
    investor.investment_thesis ||
      investor.what_you_look_for ||
      investor.value_add,
  );
  const canConnect = !["self", "pending", "accepted"].includes(
    connectionStatus,
  );

  return (
    <div className="rounded-xl border border-white/15 bg-black/40 p-4 backdrop-blur-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {investor.name_or_firm || investor.name || "Unnamed Investor"}
          </h3>
          <p className="text-sm text-gray-300">
            {investor.investor_type || "Investor"}
          </p>
          <p className="text-xs text-gray-400 mt-1">
            {parseList(investor.geographic_preference).join(", ") || "No location available"}
          </p>
        </div>
        <span
          className={`px-2 py-1 text-xs border rounded-full ${statusBadgeClass[connectionStatus] || statusBadgeClass.not_connected}`}
        >
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 text-sm text-gray-300">
        <p>
          {currencyRange(
            investor.min_investment_size,
            investor.max_investment_size,
          )}
        </p>
      </div>

      <p className="mt-2 text-sm text-gray-300 leading-relaxed">
        {description}
      </p>

      <div className="mt-4 flex gap-2">
        <Link
          to={`/investors/${investor.investor_profile_id || investor.id}`}
          className="px-3 py-1.5 text-sm rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
        >
          View Profile
        </Link>

        <button
          type="button"
          disabled={!canConnect || isConnecting}
          onClick={() => onConnect(investor.user_id)}
          className="px-3 py-1.5 text-sm rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isConnecting
            ? "Connecting..."
            : canConnect
              ? "Connect"
              : "Connected"}
        </button>
      </div>
    </div>
  );
};

const InvestorsPage = () => {
  const [filters, setFilters] = useState(defaultFilters);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [connectingUserId, setConnectingUserId] = useState(null);

  const fetchInvestors = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await apiService.getInvestors({
      ...filters,
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
  }, [filters, page]);

  useEffect(() => {
    fetchInvestors();
  }, [fetchInvestors]);

  const handleFilterChange = (key, value) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleConnect = async (userId) => {
    if (!userId) {
      return;
    }

    setConnectingUserId(userId);
    const response = await apiService.createConnection(userId);
    setConnectingUserId(null);

    if (!response.success) {
      setError(response.error || "Failed to send connection request");
      return;
    }

    await fetchInvestors();
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl min-h-[calc(100vh-9rem)] flex flex-col">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Discover Investors
        </h1>
        <p className="text-gray-300 mt-1">
          Find investors who match your startup stage and industry.
        </p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search by name, firm, or keyword"
            value={filters.q}
            onChange={(event) => handleFilterChange("q", event.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
          />
          <input
            type="text"
            placeholder="Investor type"
            value={filters.investor_type}
            onChange={(event) =>
              handleFilterChange("investor_type", event.target.value)
            }
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
          />
          <input
            type="text"
            placeholder="Location"
            value={filters.location}
            onChange={(event) =>
              handleFilterChange("location", event.target.value)
            }
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500"
          />
          <select
            value={filters.sort}
            onChange={(event) => handleFilterChange("sort", event.target.value)}
            className="w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
          >
            <option value="newest">Newest First</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="most_experienced">Most Experienced</option>
          </select>
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
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {investors.map((investor) => (
                <InvestorCard
                  key={investor.id}
                  investor={investor}
                  onConnect={handleConnect}
                  isConnecting={connectingUserId === investor.user_id}
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
