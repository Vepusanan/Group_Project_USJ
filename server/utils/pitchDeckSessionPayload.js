export const MAX_TRACKED_PAGES = 200;
const MAX_PAGE_DWELL_MS = 3_600_000;
const MAX_SESSION_DURATION_MS = 86_400_000;

export const parseStoredJson = (value, fallback) => {
  if (Array.isArray(value) || (value && typeof value === "object")) {
    return value;
  }
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
};

export const sanitizeSessionPayload = (body = {}) => {
  const pagesViewed = Array.isArray(body.pages_viewed)
    ? [
        ...new Set(
          body.pages_viewed
            .map((page) => Number(page))
            .filter(
              (page) =>
                Number.isFinite(page) && page > 0 && page <= MAX_TRACKED_PAGES,
            ),
        ),
      ].slice(0, MAX_TRACKED_PAGES)
    : null;

  const timePerPageMs =
    body.time_per_page_ms && typeof body.time_per_page_ms === "object"
      ? Object.fromEntries(
          Object.entries(body.time_per_page_ms)
            .filter(([page, ms]) => {
              const pageNum = Number(page);
              const dwell = Number(ms);
              return (
                Number.isFinite(pageNum) &&
                pageNum > 0 &&
                pageNum <= MAX_TRACKED_PAGES &&
                Number.isFinite(dwell) &&
                dwell >= 0 &&
                dwell <= MAX_PAGE_DWELL_MS
              );
            })
            .slice(0, MAX_TRACKED_PAGES),
        )
      : null;

  const lastPage = Number(body.last_page);
  const totalDurationMs = Number(body.total_duration_ms);
  const totalPages = Number(body.total_pages);

  return {
    pages_viewed: pagesViewed,
    time_per_page_ms: timePerPageMs,
    last_page:
      Number.isFinite(lastPage) && lastPage > 0 && lastPage <= MAX_TRACKED_PAGES
        ? lastPage
        : null,
    total_duration_ms:
      Number.isFinite(totalDurationMs) && totalDurationMs >= 0
        ? Math.min(Math.round(totalDurationMs), MAX_SESSION_DURATION_MS)
        : null,
    total_pages:
      Number.isFinite(totalPages) && totalPages > 0 && totalPages <= MAX_TRACKED_PAGES
        ? totalPages
        : null,
  };
};
