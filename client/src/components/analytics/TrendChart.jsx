import React from "react";

const TrendChart = ({ title, series = [], emptyLabel = "No data yet" }) => {
  const maxValue = Math.max(...series.map((p) => p.value), 1);

  if (!series.length) {
    return (
      <div className="rounded-2xl border border-line bg-surface p-5">
        <h3 className="text-sm font-semibold text-content mb-3">{title}</h3>
        <p className="text-sm text-content-muted">{emptyLabel}</p>
      </div>
    );
  }

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
