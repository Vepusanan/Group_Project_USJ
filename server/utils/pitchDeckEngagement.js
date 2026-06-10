const parseJsonField = (value, fallback) => {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return value;
  }
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

export const aggregatePitchDeckEngagement = (sessions = []) => {
  const slideTimeMs = {};
  let completedSessions = 0;
  const investorSessions = new Map();

  for (const session of sessions) {
    if (session.completed) completedSessions += 1;

    const timePerPage = parseJsonField(session.time_per_page_ms, {});
    for (const [page, ms] of Object.entries(timePerPage)) {
      const key = String(page);
      slideTimeMs[key] = (slideTimeMs[key] || 0) + Number(ms || 0);
    }

    const investorId = String(session.investor_user_id);
    if (!investorSessions.has(investorId)) {
      investorSessions.set(investorId, []);
    }
    investorSessions.get(investorId).push(session);
  }

  const totalSessions = sessions.length;
  const totalDurationMs = sessions.reduce(
    (sum, session) => sum + Number(session.total_duration_ms || 0),
    0,
  );
  const sessionsWithDuration = sessions.filter(
    (session) => Number(session.total_duration_ms || 0) > 0,
  ).length;
  const avgSessionDurationMs =
    sessionsWithDuration > 0
      ? Math.round(totalDurationMs / sessionsWithDuration)
      : null;
  const completionRate =
    totalSessions > 0
      ? Math.round((completedSessions / totalSessions) * 100)
      : null;

  const slideEngagement = Object.entries(slideTimeMs)
    .map(([slide, total_ms]) => ({
      slide: Number(slide),
      total_ms: Math.round(total_ms),
      total_seconds: Math.round(total_ms / 1000),
    }))
    .filter((row) => row.slide > 0)
    .sort((a, b) => b.total_ms - a.total_ms);

  const topSlides = slideEngagement.slice(0, 5);
  const bottomSlides = [...slideEngagement]
    .sort((a, b) => a.total_ms - b.total_ms)
    .slice(0, 5);

  const byInvestor = [...investorSessions.entries()].map(
    ([investorUserId, investorRows]) => {
      const investorAgg = aggregatePitchDeckEngagement(investorRows);
      return {
        investor_user_id: investorUserId,
        session_count: investorRows.length,
        revisit_count: Math.max(investorRows.length - 1, 0),
        completed_sessions: investorRows.filter((row) => row.completed).length,
        completion_rate:
          investorRows.length > 0
            ? Math.round(
                (investorRows.filter((row) => row.completed).length /
                  investorRows.length) *
                  100,
              )
            : null,
        top_slides: investorAgg.top_slides,
        total_duration_ms: investorRows.reduce(
          (sum, row) => sum + Number(row.total_duration_ms || 0),
          0,
        ),
      };
    },
  );

  return {
    total_sessions: totalSessions,
    completed_sessions: completedSessions,
    completion_rate: completionRate,
    total_duration_ms: totalDurationMs,
    avg_session_duration_ms: avgSessionDurationMs,
    avg_session_seconds: avgSessionDurationMs
      ? Math.round(avgSessionDurationMs / 1000)
      : null,
    slide_engagement: slideEngagement,
    top_slides: topSlides,
    bottom_slides: bottomSlides,
    by_investor: byInvestor,
  };
};

export const isDeckFullyViewed = ({
  pagesViewed = [],
  totalPages = null,
}) => {
  const total = Number(totalPages);
  if (!Number.isFinite(total) || total <= 0) return false;

  const viewed = new Set(
    pagesViewed.map((page) => Number(page)).filter((page) => page > 0),
  );

  for (let page = 1; page <= total; page += 1) {
    if (!viewed.has(page)) return false;
  }

  return true;
};
