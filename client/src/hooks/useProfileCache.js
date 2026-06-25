import { useEffect, useReducer } from "react";
import { useAuth } from "./useAuth";
import { profileService } from "../services/profileService";
import { investorProfileService } from "../services/investorProfileService";

// Module-local caches. One per concern so consumers that only need
// "does this user have a profile?" don't pay for fetching the full object.
//
// existenceCache: userId -> { hasProfile, isOnboardingComplete, onboardingPath }
// dataCache:      userId -> { profile, error }
// inFlight:       cacheKey -> Promise  (de-dupes concurrent reads of the same
//                 underlying request — keyed by `${cacheTier}:${userId}`)
//
// Subscribers re-render via `force()` after a fetch resolves; the source of
// truth is always the Map, never component state.
const existenceCache = new Map();
const dataCache = new Map();
const inFlight = new Map();
const subscribers = new Set();

const notifySubscribers = () => {
  for (const sub of subscribers) sub();
};

export const clearProfileCaches = () => {
  existenceCache.clear();
  dataCache.clear();
  inFlight.clear();
  notifySubscribers();
};

const getServiceFor = (userType) =>
  userType === "investor" ? investorProfileService : profileService;

const onboardingPathFor = (userType) =>
  userType === "investor" ? "/investor-onboarding" : "/onboarding";

const extractProfile = (result) => result?.data?.data || result?.data || null;

const profileHasId = (profile) =>
  Boolean(
    profile?.startup_profile_id ||
      profile?.investor_profile_id ||
      profile?.id,
  );

const extractCompletion = (result) => result?.data?.data ?? result?.data ?? null;

// Imperative: fetch & cache onboarding status. Safe to call from event handlers.
export const checkProfileExistence = async (user) => {
  if (!user?.id) {
    return { hasProfile: false, isOnboardingComplete: false, onboardingPath: null };
  }

  const cached = existenceCache.get(user.id);
  if (cached) return cached;

  const key = `existence:${user.id}`;
  let promise = inFlight.get(key);
  if (!promise) {
    promise = (async () => {
      const service = getServiceFor(user.userType);
      const profileResult = await service.getMyProfile();
      const profile = extractProfile(profileResult);
      const has = profileHasId(profile);

      if (!has) {
        const entry = {
          hasProfile: false,
          isOnboardingComplete: false,
          onboardingPath: onboardingPathFor(user.userType),
        };
        existenceCache.set(user.id, entry);
        return entry;
      }

      let isOnboardingComplete = false;
      if (typeof service.getProfileCompletion === "function") {
        const completionResult = await service.getProfileCompletion();
        const completion = extractCompletion(completionResult);
        isOnboardingComplete = Boolean(completion?.isComplete);
      }

      const entry = {
        hasProfile: true,
        isOnboardingComplete,
        onboardingPath: isOnboardingComplete
          ? null
          : onboardingPathFor(user.userType),
      };
      existenceCache.set(user.id, entry);
      return entry;
    })();
    inFlight.set(key, promise);
    promise.finally(() => {
      inFlight.delete(key);
      notifySubscribers();
    });
  }
  return promise;
};

// Imperative: fetch & cache the full profile object.
export const fetchProfileData = async (user) => {
  if (!user?.id) return { profile: null, error: null };

  const cached = dataCache.get(user.id);
  if (cached) return cached;

  const key = `data:${user.id}`;
  let promise = inFlight.get(key);
  if (!promise) {
    promise = (async () => {
      const service = getServiceFor(user.userType);
      const result = await service.getMyProfile();
      if (!result.success) {
        const entry = { profile: null, error: result.error || "Failed to load profile" };
        // Do NOT cache failures — let the next read retry.
        return entry;
      }
      const profile = extractProfile(result);
      const entry = { profile, error: null };
      dataCache.set(user.id, entry);
      return entry;
    })();
    inFlight.set(key, promise);
    promise.finally(() => {
      inFlight.delete(key);
      notifySubscribers();
    });
  }
  return promise;
};

// Hook: existence only. Sites that just need "should I redirect to onboarding?".
//
// Returns { isReady, hasProfile, onboardingPath, markComplete, invalidate }.
// `isReady` is false until the first fetch resolves; consumers should show a
// spinner during that window. After that, all subsequent reads for the same
// user are synchronous from the cache.
export const useProfileExistence = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, force] = useReducer((n) => n + 1, 0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading || !isAuthenticated || !userId) return;
    if (existenceCache.has(userId)) return;
    // Trigger fetch; the shared subscriber list will re-render us on completion.
    checkProfileExistence(user);
  }, [authLoading, isAuthenticated, userId, user]);

  useEffect(() => {
    subscribers.add(force);
    return () => {
      subscribers.delete(force);
    };
  }, []);

  const cached = userId ? existenceCache.get(userId) : null;

  return {
    isReady: !!cached,
    hasProfile: cached?.hasProfile ?? false,
    onboardingPath: cached?.onboardingPath ?? null,
    markComplete: (id = userId) => {
      if (!id) return;
      existenceCache.set(id, {
        hasProfile: true,
        isOnboardingComplete: true,
        onboardingPath: null,
      });
      // The data cache may hold a stale {profile: null, error: null} from
      // before onboarding (returned by the 404 path of getMyProfile). Drop
      // it so the next read fetches the freshly-created profile.
      dataCache.delete(id);
      notifySubscribers();
    },
    invalidate: (id = userId) => {
      if (!id) return;
      existenceCache.delete(id);
      notifySubscribers();
    },
  };
};

// Hook: full profile data. Sites that need photo_url, logo_url, all fields.
export const useProfileData = () => {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, force] = useReducer((n) => n + 1, 0);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading || !isAuthenticated || !userId) return;
    if (dataCache.has(userId)) return;
    fetchProfileData(user);
  }, [authLoading, isAuthenticated, userId, user]);

  useEffect(() => {
    subscribers.add(force);
    return () => {
      subscribers.delete(force);
    };
  }, []);

  const cached = userId ? dataCache.get(userId) : null;
  // While the fetch is in flight `cached` is undefined; once it resolves the
  // subscriber re-render fires and we read the populated entry.
  const inFlightFetch = userId ? inFlight.has(`data:${userId}`) : false;

  return {
    isLoading: !cached && inFlightFetch,
    isReady: !!cached,
    profile: cached?.profile ?? null,
    error: cached?.error ?? null,
    invalidate: (id = userId) => {
      if (!id) return;
      dataCache.delete(id);
      notifySubscribers();
    },
  };
};
