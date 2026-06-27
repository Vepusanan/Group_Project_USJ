import React from "react";

// A trend needs at least two points to be meaningful. With 0 or 1 points the
// chart would just repeat the single total already shown in the metric cards
// above, so we render nothing and let the parent omit it.
export const hasTrend = (series) => Array.isArray(series) && series.length >= 2;

const TrendChart = ({ title, series = [] }) => {
  if (!hasTrend(series)) return null;

  const maxValue = Math.max(...series.map((p) => p.value), 1);

  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <h3 className="text-sm font-semibold text-content mb-4">{title}</h3>
      <div className="flex items-end gap-2 h-32">
        {series.map((point) => (
          <div
            key={point.label}
            className="flex-1 min-w-0 flex flex-col items-center gap-1"
          >
            <span className="text-[10px] text-content-muted tabular-nums">
              {point.value}
            </span>
            <div
              className="w-full rounded-t-md bg-primary/70 min-h-[4px] transition-all"
              style={{ height: `${(point.value / maxValue) * 100}%` }}
              title={`${point.label}: ${point.value}`}
            />
            <span className="text-[9px] text-content-muted truncate w-full text-center">
              {point.label}
            </span>
          </div>
        ))}
      </div>
      {series.length > 1 && series[series.length - 1].change_pct != null && (
        <p className="text-xs text-content-secondary mt-3">
          Latest period change:{" "}
          <span
            className={
              series[series.length - 1].change_pct >= 0
                ? "text-success"
                : "text-error"
            }
          >
            {series[series.length - 1].change_pct > 0 ? "+" : ""}
            {series[series.length - 1].change_pct}%
          </span>
        </p>
      )}
    </div>
  );
};

export default TrendChart;
