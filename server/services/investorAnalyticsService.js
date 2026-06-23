import { getPipelineStats } from "../repositories/DealPipelineRepository.js";
import {
  getStageConversionRates,
  countNewPipelineCardsPerMonth,
  countPitchDecksReviewed,
  countDdChecklistStats,
  countMeetingStats,
  watchlistAddsPerMonth,
} from "../repositories/InvestorAnalyticsRepository.js";

const PERIOD_DAYS = {
  "7d": 7,
  "30d": 30,
  all: null,
};

export async function getInvestorAnalytics(
  investorUserId,
  { discoveredCount = 0, passedCount = 0, period = "30d" } = {},
) {
  const days = PERIOD_DAYS[period] ?? PERIOD_DAYS["30d"];
  const since = days
    ? new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const [
    pipelineStats,
    stageConversion,
    newCardsPerMonth,
    pitchDeckStats,
    ddStats,
    meetingStats,
    watchlistActivity,
  ] = await Promise.all([
    getPipelineStats(investorUserId),
    getStageConversionRates(investorUserId),
    countNewPipelineCardsPerMonth(investorUserId),
    countPitchDecksReviewed(investorUserId, { since }),
    countDdChecklistStats(investorUserId, { since }),
    countMeetingStats(investorUserId, { since }),
    watchlistAddsPerMonth(investorUserId),
  ]);

  const dealsPerStage = { ...pipelineStats.deals_per_stage };
  dealsPerStage.DISCOVERED =
    (dealsPerStage.DISCOVERED || 0) + discoveredCount;
  dealsPerStage.ARCHIVED = (dealsPerStage.ARCHIVED || 0) + passedCount;

  const totalActive = Object.entries(dealsPerStage).reduce(
    (sum, [stage, count]) => (stage === "ARCHIVED" ? sum : sum + count),
    0,
  );

  const newCardsThisMonth =
    newCardsPerMonth[newCardsPerMonth.length - 1]?.value || 0;

  return {
    period,
    deals_per_stage: dealsPerStage,
    avg_days_per_stage: pipelineStats.avg_days_per_stage,
    total_active: totalActive,
    total_cards: Object.values(dealsPerStage).reduce((sum, n) => sum + n, 0),
    pipeline_velocity: {
      ...pipelineStats.pipeline_velocity,
      new_cards_per_month: newCardsPerMonth,
      new_cards_this_month: newCardsThisMonth,
    },
    stage_conversion: stageConversion,
    pitch_decks_reviewed: pitchDeckStats,
    due_diligence: ddStats,
    meetings: meetingStats,
    watchlist: {
      adds_per_month: watchlistActivity,
      note: "Removals are not tracked; only monthly adds are shown.",
    },
  };
}
