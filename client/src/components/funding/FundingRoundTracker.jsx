import React from "react";
import { Link } from "react-router-dom";
import { DollarSign, Lock, Calendar, TrendingUp } from "lucide-react";
import { SectionCard } from "../common/SectionCard";

const STAGE_LABELS = {
  PRE_SEED: "Pre-seed",
  SEED: "Seed",
  SERIES_A: "Series A",
  SERIES_B: "Series B",
  SERIES_C: "Series C",
  SERIES_D_PLUS: "Series D+",
};

const formatMoney = (amount, currency = "USD") => {
  const value = Number(amount);
  if (Number.isNaN(value)) return "—";
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${currency} ${value.toLocaleString()}`;
  }
};

const formatDate = (value) => {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const FundingRoundTracker = ({ round, isOwner = false }) => {
  if (!round) return null;

  const stageLabel = STAGE_LABELS[round.funding_stage] || round.funding_stage;
  const isClosed = round.status === "closed";
  const canViewFinancials = round.can_view_financials;
  const progress = round.progress_percent ?? 0;

  return (
    <SectionCard
      title="Funding Round"
      icon={DollarSign}
      accent="amber"
      badge={
        isClosed ? (
          <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-content-muted/15 text-content-muted">
            Closed
          </span>
        ) : (
          <span className="text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full bg-primary/15 text-primary">
            Active
          </span>
        )
      }
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-warning/10 border border-warning/20">
            <TrendingUp className="w-4 h-4 text-warning" />
            <span className="text-sm font-semibold text-content">{stageLabel}</span>
          </div>
          <div className="inline-flex items-center gap-2 text-xs text-content-muted">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {formatDate(round.opening_date)} → {formatDate(round.target_closing_date)}
            </span>
          </div>
        </div>

        {canViewFinancials ? (
          <>
            <div>
              <div className="flex justify-between items-end mb-2">
                <div>
                  <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest">
                    Committed
                  </p>
                  <p className="text-lg font-bold text-content">
                    {formatMoney(round.committed_amount, round.currency)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest">
                    Target
                  </p>
                  <p className="text-lg font-bold text-primary">
                    {formatMoney(round.target_amount, round.currency)}
                  </p>
                </div>
              </div>
              <div className="h-3 rounded-full bg-surface-alt border border-line overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-primary-dark transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-content-muted mt-1.5 text-right">
                {progress}% committed
              </p>
            </div>
            {isOwner && !isClosed && (
              <Link
                to="/funding-round"
                className="inline-flex text-sm text-primary hover:underline"
              >
                Update committed amount →
              </Link>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-line bg-surface-alt p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-content-muted shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-content">
                Active fundraising round in progress
              </p>
              <p className="text-xs text-content-muted mt-1">
                {round.message || "Connect with this startup to view funding progress and amounts"}
              </p>
            </div>
          </div>
        )}
      </div>
    </SectionCard>
  );
};

export default FundingRoundTracker;
