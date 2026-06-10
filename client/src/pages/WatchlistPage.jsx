import React, { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Bookmark, Columns3, MapPin, Sparkles, Tag } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import VerificationBadge from "../components/common/VerificationBadge";
import { useAuth } from "../hooks/useAuth";
import engagementService from "../services/engagementService";
import MatchExplanationBlock from "../components/investor/MatchExplanationBlock";

const STAGE_LABEL = {
  PRE_SEED: "Pre-seed", SEED: "Seed", SERIES_A: "Series A",
  SERIES_B: "Series B", SERIES_C: "Series C", SERIES_D_PLUS: "Series D+",
};

const getMatchScoreBadgeClass = (score) => {
  if (score >= 80) return "bg-success/10 text-success border-success/30";
  if (score >= 60) return "bg-primary/10 text-primary border-primary/30";
  return "bg-warning/10 text-warning border-warning/30";
};

const WatchlistPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await engagementService.getWatchlist();
    if (!result.success) {
      setError(result.error);
      setItems([]);
    } else {
      setItems(result.data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRemove = async (startupProfileId) => {
    const result = await engagementService.removeFromWatchlist(startupProfileId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  if (user?.userType !== "investor") {
    return <Navigate to="/startups" replace />;
  }

  return (
    <PageLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <div>
          <div className="flex items-center gap-2 text-primary mb-1">
            <Bookmark className="w-5 h-5" />
            <span className="text-sm font-medium">Saved startups</span>
          </div>
          <h1 className="text-3xl font-bold text-content">Watchlist</h1>
          <p className="text-content-secondary text-sm mt-1">
            Startups you saved for later — review match scores and continue evaluation.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-error/30 bg-error/10 p-4 text-error text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-content-muted text-sm">
            No saved startups. Use the bookmark icon on discovery cards to add startups here.
          </p>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-2xl border border-line bg-surface p-5 flex flex-col sm:flex-row sm:items-start gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <Link
                      to={`/startups/${item.startup_profile_id}`}
                      className="text-lg font-semibold text-content hover:text-primary"
                    >
                      {item.company_name || "Startup"}
                    </Link>
                    <VerificationBadge tier={item.verification_tier} />
                    {item.match_score != null && (
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold border rounded-full ${getMatchScoreBadgeClass(item.match_score)}`}
                      >
                        <Sparkles className="w-3 h-3" />
                        {Math.round(item.match_score)}% match
                      </span>
                    )}
                  </div>
                  {item.tagline && (
                    <p className="text-sm text-content-secondary line-clamp-2">{item.tagline}</p>
                  )}
                  <MatchExplanationBlock
                    startupProfileId={item.startup_profile_id}
                    matchScore={item.match_score}
                    compact
                    className="mt-2"
                  />
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-content-muted">
                    {item.industry && (
                      <span className="inline-flex items-center gap-1">
                        <Tag className="w-3 h-3" />{item.industry}
                      </span>
                    )}
                    {item.funding_stage && (
                      <span>{STAGE_LABEL[item.funding_stage] || item.funding_stage}</span>
                    )}
                    {(item.location_city || item.location_country) && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[item.location_city, item.location_country].filter(Boolean).join(", ")}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-content-muted mt-2">
                    Added {new Date(item.added_at).toLocaleDateString()}
                    {item.profile_intent_level && (
                      <> · In pipeline (Discovered — {item.profile_intent_level})</>
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    to={`/startups/${item.startup_profile_id}`}
                    className="px-3 py-1.5 rounded-lg border border-line text-sm text-center hover:text-primary"
                  >
                    View profile
                  </Link>
                  {item.connection_status === "accepted" ? (
                    <Link
                      to="/connections"
                      className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm text-center"
                    >
                      Connected
                    </Link>
                  ) : (
                    <Link
                      to={`/startups/${item.startup_profile_id}`}
                      className="px-3 py-1.5 rounded-lg bg-primary text-content-inverse text-sm text-center"
                    >
                      Evaluate & connect
                    </Link>
                  )}
                  <Link
                    to="/pipeline"
                    className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-line text-sm text-content-secondary hover:text-primary"
                  >
                    <Columns3 className="w-3.5 h-3.5" />
                    Pipeline
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleRemove(item.startup_profile_id)}
                    className="text-sm text-content-muted hover:text-error"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default WatchlistPage;
