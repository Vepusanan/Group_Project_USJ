import { useCallback, useEffect, useRef } from "react";
import pitchDeckService from "../services/pitchDeckService";

const HEARTBEAT_MS = 5000;

export const usePitchDeckSession = ({
  startupProfileId,
  enabled,
  currentPage,
  totalPages = null,
}) => {
  const sessionIdRef = useRef(null);
  const sessionStartRef = useRef(null);
  const pageEnteredAtRef = useRef(Date.now());
  const pagesViewedRef = useRef(new Set());
  const timePerPageRef = useRef({});

  const buildPayload = useCallback(() => {
    const now = Date.now();
    const currentPageKey = String(currentPage);
    const elapsedOnPage = now - pageEnteredAtRef.current;
    const mergedTimePerPage = {
      ...timePerPageRef.current,
      [currentPageKey]:
        (timePerPageRef.current[currentPageKey] || 0) + elapsedOnPage,
    };

    pagesViewedRef.current.add(currentPage);

    return {
      pages_viewed: [...pagesViewedRef.current].sort((a, b) => a - b),
      time_per_page_ms: mergedTimePerPage,
      last_page: currentPage,
      total_pages: totalPages,
      total_duration_ms: sessionStartRef.current
        ? now - sessionStartRef.current
        : 0,
    };
  }, [currentPage, totalPages]);

  const flushProgress = useCallback(async () => {
    if (!sessionIdRef.current) return;

    const payload = buildPayload();
    timePerPageRef.current = payload.time_per_page_ms;
    pageEnteredAtRef.current = Date.now();

    await pitchDeckService.updateSession(sessionIdRef.current, payload);
  }, [buildPayload]);

  const completeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    const payload = buildPayload();
    await pitchDeckService.completeSession(sessionIdRef.current, payload);
    sessionIdRef.current = null;
  }, [buildPayload]);

  useEffect(() => {
    if (!enabled || !startupProfileId) return undefined;

    let active = true;

    const start = async () => {
      const result = await pitchDeckService.startSession(startupProfileId);
      if (!active || !result.success) return;

      sessionIdRef.current = result.data.session_id;
      sessionStartRef.current = Date.now();
      pageEnteredAtRef.current = Date.now();
      pagesViewedRef.current = new Set([currentPage]);
    };

    start();

    const heartbeat = setInterval(() => {
      flushProgress();
    }, HEARTBEAT_MS);

    return () => {
      active = false;
      clearInterval(heartbeat);
      completeSession();
    };
  }, [enabled, startupProfileId, completeSession, flushProgress]);

  useEffect(() => {
    if (!enabled || !sessionIdRef.current) return;
    pagesViewedRef.current.add(currentPage);
    pageEnteredAtRef.current = Date.now();
    flushProgress();
  }, [currentPage, enabled, flushProgress]);

  return { flushProgress, completeSession };
};

export default usePitchDeckSession;
