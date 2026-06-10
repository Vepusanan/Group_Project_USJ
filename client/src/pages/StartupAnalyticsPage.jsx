import React, { useCallback, useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  BarChart3,
  Eye,
  FileText,
  Link2,
  Lock,
  TrendingUp,
  Users,
  Lightbulb,
} from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import { SectionCard } from "../components/common/SectionCard";
import TrendChart from "../components/analytics/TrendChart";
import SlideHeatmap from "../components/analytics/SlideHeatmap";
import { useAuth } from "../hooks/useAuth";
import {
  ANALYTICS_PERIODS,
  startupAnalyticsService,
} from "../services/startupAnalyticsService";

const fmtChange = (pct) => {
  if (pct == null) return null;
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct}% vs prior period`;
};

const MetricCard = ({ icon: Icon, label, value, sub, changePct, accent = "primary" }) => {
  const accentCls =
    accent === "emerald"
      ? "bg-success/10 text-success border-success/20"
      : "bg-primary/10 text-primary border-primary/20";

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className={`p-2 rounded-xl border ${accentCls}`}>
          <Icon className="w-5 h-5" />
        </div>
        {changePct != null && (
          <span
            className={`text-xs font-medium ${
              changePct >= 0 ? "text-success" : "text-error"
            }`}
          >
            {fmtChange(changePct)}
          </span>
        )}
      </div>
      <p className="text-sm text-content-secondary mt-4">{label}</p>
      <p className="text-3xl font-bold text-content mt-1 tabular-nums">{value}</p>
      {sub && <p className="text-xs text-content-muted mt-1">{sub}</p>}
    </div>
  );
};

const severityStyles = {
  warning: "border-warning/30 bg-warning/10 text-warning",
  info: "border-primary-light/30 bg-primary/8 text-content",
  action: "border-success/30 bg-success/10 text-content",
};

const StartupAnalyticsPage = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await startupAnalyticsService.getDashboard(period);
    if (!result.success) {
      setError(result.error);
      setData(null);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  if (user?.userType === "investor") {
    return <Navigate to="/startups" replace />;
  }

  const metrics = data?.metrics;
  const trends = data?.trends;
  const completion = data?.profile_completion;

  return (
    <PageLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium">Engagement analytics</span>
            </div>
            <h1 className="text-3xl font-bold text-content">Analytics Dashboard</h1>
            <p className="text-content-secondary text-sm mt-1 max-w-xl">
              See how investors engage with your profile, pitch deck, and data room so
              you can refine your fundraising strategy.
            </p>
          </div>

          <div className="flex rounded-xl border border-line bg-surface p-1">
            {ANALYTICS_PERIODS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  period === opt.value
                    ? "bg-primary text-white font-medium"
                    : "text-content-secondary hover:text-content"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {completion && (
          <div className="rounded-2xl border border-line bg-surface p-5 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-content-muted uppercase tracking-wide">
                Profile completion
              </p>
              <p className="text-2xl font-bold text-content mt-1">
                {completion.percentage}%
              </p>
            </div>
            <div className="h-10 w-px bg-line hidden sm:block" />
            <div>
              <p className="text-xs text-content-muted uppercase tracking-wide">
                Platform average
              </p>
              <p className="text-2xl font-bold text-content-secondary mt-1">
                {completion.platform_average}%
              </p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${completion.percentage}%` }}
                />
              </div>
            </div>
            {completion.recommendations?.length > 0 && (
              <div className="w-full mt-2 pt-4 border-t border-line">
                <p className="text-xs text-content-muted uppercase tracking-wide mb-2">
                  Recommended improvements
                </p>
                <ul className="flex flex-wrap gap-2">
                  {completion.recommendations.map((rec) => (
                    <li key={`${rec.section}-${rec.field}`}>
                      <Link
                        to={rec.action_path}
                        className="inline-flex items-center rounded-lg border border-line bg-surface-alt px-2.5 py-1 text-xs text-content hover:border-primary-light hover:text-primary"
                      >
                        <span className="text-content-muted mr-1">{rec.section}:</span>
                        {rec.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-error/30 bg-error/10 p-6 text-error">
            {error}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard
                icon={Eye}
                label="Profile views"
                value={metrics?.profile_views?.total ?? 0}
                sub={`${metrics?.profile_views?.unique_investors ?? 0} unique investors`}
                changePct={metrics?.profile_views?.change_pct}
              />
              <MetricCard
                icon={TrendingUp}
                label="View → connection rate"
                value={
                  metrics?.profile_views?.view_to_connection_rate != null
                    ? `${metrics.profile_views.view_to_connection_rate}%`
                    : "—"
                }
                sub={
                  metrics?.profile_views?.viewers_who_requested != null
                    ? `${metrics.profile_views.viewers_who_requested} of ${metrics?.profile_views?.unique_investors ?? 0} viewers requested`
                    : "Unique viewers who sent a request"
                }
              />
              <MetricCard
                icon={FileText}
                label="Pitch deck views"
                value={metrics?.pitch_deck_views?.total ?? 0}
                sub={`${metrics?.pitch_deck_views?.unique_investors ?? 0} unique investors`}
                changePct={metrics?.pitch_deck_views?.change_pct}
              />
              <MetricCard
                icon={BarChart3}
                label="Avg. time per deck session"
                value={
                  metrics?.pitch_deck_views?.avg_session_seconds != null
                    ? `${metrics.pitch_deck_views.avg_session_seconds}s`
                    : data?.pitch_deck_engagement?.avg_session_seconds != null
                      ? `${data.pitch_deck_engagement.avg_session_seconds}s`
                      : "—"
                }
                sub="Average investor viewing session length"
              />
              <MetricCard
                icon={Link2}
                label="Connection requests received"
                value={metrics?.connection_requests?.received ?? 0}
                sub={
                  metrics?.connection_requests?.acceptance_rate != null
                    ? `${metrics.connection_requests.accepted} accepted (${metrics.connection_requests.acceptance_rate}% rate)`
                    : `${metrics?.connection_requests?.accepted ?? 0} accepted`
                }
                changePct={metrics?.connection_requests?.change_pct}
              />
              <MetricCard
                icon={Users}
                label="Active connected investors"
                value={metrics?.active_connected_investors?.total ?? 0}
                sub={
                  metrics?.active_connected_investors?.newly_connected_in_period
                    ? `${metrics.active_connected_investors.newly_connected_in_period} new in period`
                    : null
                }
                changePct={metrics?.active_connected_investors?.change_pct}
                accent="emerald"
              />
              <MetricCard
                icon={Lock}
                label="Data room access requests"
                value={metrics?.data_room_access?.requests ?? 0}
                sub={
                  metrics?.data_room_access?.grant_rate != null
                    ? `${metrics.data_room_access.granted} granted (${metrics.data_room_access.grant_rate}% rate)`
                    : `${metrics?.data_room_access?.grants_issued ?? 0} grants issued`
                }
                changePct={metrics?.data_room_access?.change_pct}
              />
              <MetricCard
                icon={TrendingUp}
                label="Data room grants issued"
                value={metrics?.data_room_access?.grants_issued ?? 0}
              />
            </div>

            {data?.insights?.length > 0 && (
              <SectionCard title="Actionable insights" icon={Lightbulb} accent="blue">
                <div className="space-y-3">
                  {data.insights.map((insight) => (
                    <div
                      key={insight.message}
                      className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${
                        severityStyles[insight.severity] || severityStyles.info
                      }`}
                    >
                      <p className="text-sm">{insight.message}</p>
                      {insight.action_path && (
                        <Link
                          to={insight.action_path}
                          className="text-sm font-medium text-primary hover:underline shrink-0"
                        >
                          {insight.action_label}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            )}

            <div>
              <h2 className="text-lg font-semibold text-content mb-4">
                Engagement trends
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TrendChart
                  title="Profile views"
                  series={trends?.profile_views}
                />
                <TrendChart
                  title="Pitch deck views"
                  series={trends?.pitch_deck_views}
                />
                <TrendChart
                  title="Connection requests received"
                  series={trends?.connection_requests}
                />
                <TrendChart
                  title="Connections accepted"
                  series={trends?.connection_requests_accepted}
                />
                <TrendChart
                  title="Data room requests"
                  series={trends?.data_room_requests}
                />
                <TrendChart
                  title="Data room grants"
                  series={trends?.data_room_grants}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <MetricCard
                icon={FileText}
                label="Deck completion rate"
                value={
                  data?.pitch_deck_engagement?.completion_rate != null
                    ? `${data.pitch_deck_engagement.completion_rate}%`
                    : "—"
                }
                sub={`${data?.pitch_deck_engagement?.completed_sessions ?? 0} of ${data?.pitch_deck_engagement?.total_sessions ?? 0} sessions finished all slides`}
              />
              <MetricCard
                icon={TrendingUp}
                label="Top slide by time"
                value={
                  data?.pitch_deck_engagement?.top_slides?.[0]
                    ? `Slide ${data.pitch_deck_engagement.top_slides[0].slide}`
                    : "—"
                }
                sub={
                  data?.pitch_deck_engagement?.top_slides?.[0]
                    ? `${data.pitch_deck_engagement.top_slides[0].total_seconds}s total attention`
                    : "No slide data yet"
                }
              />
              <MetricCard
                icon={Users}
                label="Investor revisits"
                value={
                  data?.pitch_deck_by_investor?.reduce(
                    (sum, row) => sum + (row.revisit_count || 0),
                    0,
                  ) ?? 0
                }
                sub="Extra sessions beyond first view"
              />
            </div>

            {data?.pitch_deck_engagement?.slide_engagement?.length > 0 && (
              <SectionCard title="Slide attention heatmap" icon={BarChart3} accent="blue">
                <SlideHeatmap slides={data.pitch_deck_engagement.slide_engagement} />
              </SectionCard>
            )}

            <SectionCard title="Pitch deck by investor" icon={FileText} accent="purple">
              {data?.pitch_deck_by_investor?.length === 0 ? (
                <p className="text-sm text-content-muted">
                  No pitch deck views from connected investors in this period.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-content-muted border-b border-line">
                        <th className="pb-3 pr-4 font-medium">Investor</th>
                        <th className="pb-3 pr-4 font-medium">Views</th>
                        <th className="pb-3 pr-4 font-medium">Revisits</th>
                        <th className="pb-3 pr-4 font-medium">Completion</th>
                        <th className="pb-3 pr-4 font-medium">Top slide</th>
                        <th className="pb-3 pr-4 font-medium">Last viewed</th>
                        <th className="pb-3 font-medium">Time on deck</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.pitch_deck_by_investor.map((row) => (
                        <tr
                          key={row.investor_user_id}
                          className="border-b border-line/60 last:border-0"
                        >
                          <td className="py-3 pr-4">
                            {row.investor_profile_id ? (
                              <Link
                                to={`/investors/${row.investor_profile_id}`}
                                className="text-primary hover:underline"
                              >
                                {row.investor_name || "Investor"}
                              </Link>
                            ) : (
                              row.investor_name || "Investor"
                            )}
                          </td>
                          <td className="py-3 pr-4 tabular-nums">{row.view_count}</td>
                          <td className="py-3 pr-4 tabular-nums">{row.revisit_count ?? 0}</td>
                          <td className="py-3 pr-4 tabular-nums">
                            {row.completion_rate != null ? `${row.completion_rate}%` : "—"}
                          </td>
                          <td className="py-3 pr-4 text-content-secondary">
                            {row.top_slides?.[0]
                              ? `Slide ${row.top_slides[0].slide}`
                              : "—"}
                          </td>
                          <td className="py-3 pr-4 text-content-secondary">
                            {row.last_viewed_at
                              ? new Date(row.last_viewed_at).toLocaleString()
                              : "—"}
                          </td>
                          <td className="py-3 text-content-secondary tabular-nums">
                            {row.total_duration_ms
                              ? `${Math.round(row.total_duration_ms / 1000)}s`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default StartupAnalyticsPage;
