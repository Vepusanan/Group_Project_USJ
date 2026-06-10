export const CONNECTION_COOLING_DAYS = 30;

const COOLING_MS = CONNECTION_COOLING_DAYS * 24 * 60 * 60 * 1000;

export function getCoolingEndDate(declinedAt) {
  if (!declinedAt) return null;
  const end = new Date(new Date(declinedAt).getTime() + COOLING_MS);
  return Number.isNaN(end.getTime()) ? null : end;
}

export function isInConnectionCooling(declinedAt, now = Date.now()) {
  const end = getCoolingEndDate(declinedAt);
  if (!end) return false;
  return now < end.getTime();
}

export function formatCoolingEnd(declinedAt) {
  const end = getCoolingEndDate(declinedAt);
  if (!end) return null;
  return end.toLocaleDateString();
}
