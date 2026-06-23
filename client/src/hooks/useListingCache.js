// Module-level stale-while-revalidate cache for paginated discovery lists.
// Shows cached results instantly when navigating back; revalidates in background.

const store = new Map();
const inFlight = new Map();

export const buildListingCacheKey = (namespace, params) =>
  `${namespace}:${JSON.stringify(params)}`;

export const readListingCache = (key) => store.get(key) ?? null;

export const writeListingCache = (key, entry) => {
  store.set(key, entry);
};

export const invalidateListingNamespace = (namespace) => {
  const prefix = `${namespace}:`;
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
};

export const clearListingCaches = () => {
  store.clear();
  inFlight.clear();
};

export const fetchListingDeduped = async (key, fetcher) => {
  let promise = inFlight.get(key);
  if (!promise) {
    promise = fetcher().finally(() => {
      inFlight.delete(key);
    });
    inFlight.set(key, promise);
  }
  return promise;
};
