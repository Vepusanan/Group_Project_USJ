import React from "react";

const heatColor = (ratio) => {
  if (ratio >= 0.75) return "bg-primary";
  if (ratio >= 0.5) return "bg-primary/80";
  if (ratio >= 0.25) return "bg-primary/55";
  if (ratio > 0) return "bg-primary/35";
  return "bg-surface-alt";
};

const SlideHeatmap = ({ slides = [], emptyLabel = "No slide data yet" }) => {
  if (!slides.length) {
    return <p className="text-sm text-content-muted">{emptyLabel}</p>;
  }

  const maxSeconds = Math.max(...slides.map((s) => s.total_seconds), 1);
  const sorted = [...slides].sort((a, b) => a.slide - b.slide);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {sorted.map((slide) => {
          const ratio = slide.total_seconds / maxSeconds;
          return (
            <div
              key={slide.slide}
              className="rounded-xl border border-line overflow-hidden"
              title={`Slide ${slide.slide}: ${slide.total_seconds}s total attention`}
            >
              <div
                className={`h-16 flex items-end justify-center pb-2 ${heatColor(ratio)} transition-colors`}
              >
                <span className="text-[10px] font-semibold text-white/90 tabular-nums">
                  {slide.total_seconds}s
                </span>
              </div>
              <p className="text-center text-xs text-content-muted py-1.5">
                Slide {slide.slide}
              </p>
            </div>
          );
        })}
      </div>
      <p className="text-xs text-content-muted">
        Darker cells indicate slides where investors spent more cumulative time.
      </p>
    </div>
  );
};

export default SlideHeatmap;
