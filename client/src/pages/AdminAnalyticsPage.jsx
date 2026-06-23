import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BarChart3,
  Bot,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import { SectionCard } from "../components/common/SectionCard";
import TrendChart from "../components/analytics/TrendChart";
import { adminAnalyticsService } from "../services/adminAnalyticsService";

const MetricCard = ({ icon: Icon, label, value, sub }) => (
  <div className="rounded-2xl border border-line bg-surface p-5">
    <div className="p-2 rounded-xl border bg-primary/10 text-primary border-primary/20 w-fit">
      <Icon className="w-5 h-5" />
    </div>
    <p className="text-sm text-content-secondary mt-4">{label}</p>
    <p className="text-3xl font-bold text-content mt-1 tabular-nums">{value}</p>
    {sub && <p className="text-xs text-content-muted mt-1">{sub}</p>}
  </div>
);

const AdminAnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");

    const result = await adminAnalyticsService.getDashboard();
    if (!result.success) {
      setError(result.error);
      setData(null);
      setLoading(false);
      return;
    }
    setData(result.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const adoption = data?.feature_adoption || {};
  const aiFeatures = data?.ai_usage?.last_30_days || {};

  return (
    <PageLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-2">
              <BarChart3 className="w-5 h-5" />
              <span className="text-sm font-medium">Platform analytics</span>
            </div>
            <h1 className="text-3xl font-bold text-content">Administrator Dashboard</h1>
            <p className="text-content-secondary text-sm mt-1">
              Platform health, growth, trust quality, and feature adoption.
            </p>
          </div>
          <Link
            to="/admin/verification"
            className="text-sm text-primary hover:underline"
          >
            Verification queue →
          </Link>
        </div>

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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={Users}
                label="Registered startups"
                value={data?.users?.startups ?? 0}
                sub={`${data?.users?.monthly_growth_rate ?? 0}% growth vs prior month`}
              />
              <MetricCard
                icon={Users}
                label="Registered investors"
                value={data?.users?.investors ?? 0}
              />
              <MetricCard
                icon={Activity}
                label="Monthly active users"
                value={data?.mau?.mau_30d ?? 0}
                sub="Meaningful action in last 30 days"
              />
              <MetricCard
                icon={Shield}
                label="Pending verifications"
                value={data?.verification?.pending_requests ?? 0}
              />
            </div>

            <SectionCard title="Verification tiers" icon={Shield} accent="blue">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {Object.entries(data?.verification?.by_tier || {}).map(([tier, count]) => (
                  <div key={tier} className="rounded-xl border border-line bg-surface-alt px-4 py-3">
                    <p className="text-xs text-content-muted">{tier.replace(/_/g, " ")}</p>
                    <p className="text-2xl font-bold text-content">{count}</p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <div>
              <h2 className="text-lg font-semibold text-content mb-4">Platform activity</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TrendChart
                  title="New registrations per month"
                  series={data?.users?.registrations_per_month}
                />
                <TrendChart
                  title="Connections established per month"
                  series={data?.connections_per_month}
                />
                <TrendChart
                  title="Pitch deck sessions per month"
                  series={data?.pitch_deck_sessions_per_month}
                />
                <TrendChart
                  title="Data room uploads per month"
                  series={data?.data_room?.uploads_per_month}
                />
                <TrendChart
                  title="Data room access grants per month"
                  series={data?.data_room?.grants_per_month}
                />
              </div>
            </div>

            <SectionCard title="Feature adoption (V2)" icon={TrendingUp} accent="purple">
              <p className="text-xs text-content-muted mb-3">
                Based on {adoption.mau_basis || "active users"}.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  ["Watchlist", adoption.watchlist],
                  ["Deal pipeline", adoption.deal_pipeline],
                  ["Due diligence", adoption.due_diligence],
                  ["Pitch deck review", adoption.pitch_deck_review],
                  ["Data room", adoption.data_room],
                ].map(([label, pct]) => (
                  <div key={label} className="rounded-xl border border-line bg-surface-alt px-4 py-3">
                    <p className="text-xs text-content-muted">{label}</p>
                    <p className="text-2xl font-bold text-content">
                      {pct != null ? `${pct}%` : "—"}
                    </p>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="AI feature usage (last 30 days)" icon={Bot} accent="blue">
              {Object.keys(aiFeatures).length === 0 ? (
                <p className="text-sm text-content-muted">No AI calls logged yet.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {Object.entries(aiFeatures).map(([feature, total]) => (
                    <div key={feature} className="rounded-xl border border-line bg-surface-alt px-4 py-3">
                      <p className="text-xs text-content-muted">{feature.replace(/_/g, " ")}</p>
                      <p className="text-2xl font-bold text-content">{total}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {data?.fraud_report_rate?.note && (
              <p className="text-xs text-content-muted">{data.fraud_report_rate.note}</p>
            )}
          </>
        )}
      </div>
    </PageLayout>
  );
};

export default AdminAnalyticsPage;
