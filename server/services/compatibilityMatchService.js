import { calculateCompatibilityScore } from "../utils/compatibilityScore.js";
import {
  deleteScoresForInvestor,
  deleteScoresForStartup,
  getMatchScoresForInvestor,
  listStaleStartupProfilesForInvestor,
  recordAggregateAnalytics,
  upsertMatchScores,
} from "../repositories/CompatibilityMatchScoreRepository.js";
import { getInvestorProfileByUserId } from "../repositories/InvestorProfileRepository.js";

export async function invalidateInvestorMatchScores(investorUserId) {
  await deleteScoresForInvestor(investorUserId);
}

export async function invalidateStartupMatchScores(startupProfileId) {
  await deleteScoresForStartup(startupProfileId);
}

export async function ensureInvestorMatchScores(investorUserId) {
  if (!investorUserId) return;

  const investorProfile = await getInvestorProfileByUserId(investorUserId);
  if (!investorProfile) return;

  const staleStartups = await listStaleStartupProfilesForInvestor(
    investorUserId,
    investorProfile.updated_at,
  );

  if (staleStartups.length === 0) return;

  const scoreRows = staleStartups.map((startup) => {
    const result = calculateCompatibilityScore(startup, investorProfile);
    return {
      startup_profile_id: startup.startup_profile_id,
      match_score: result.match_score,
      dimension_scores: result.dimension_scores,
    };
  });

  await upsertMatchScores(investorUserId, scoreRows);
  await recordAggregateAnalytics(scoreRows);
}

const inFlightRefreshByInvestor = new Map();

export function scheduleInvestorMatchScores(investorUserId) {
  if (!investorUserId || inFlightRefreshByInvestor.has(investorUserId)) {
    return;
  }

  const refreshPromise = ensureInvestorMatchScores(investorUserId)
    .catch((error) => {
      console.error(
        "Background match score refresh failed:",
        error.message,
      );
    })
    .finally(() => {
      inFlightRefreshByInvestor.delete(investorUserId);
    });

  inFlightRefreshByInvestor.set(investorUserId, refreshPromise);
}

export async function getMatchScoreMapForInvestor(investorUserId, startupRows = []) {
  if (!investorUserId || startupRows.length === 0) return new Map();

  const startupProfileIds = startupRows.map((row) =>
    String(row.startup_profile_id),
  );

  return getMatchScoresForInvestor(investorUserId, startupProfileIds);
}
