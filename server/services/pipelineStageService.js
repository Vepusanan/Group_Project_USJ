import pool from "../config/database.js";
import {
  ensurePipelineCardForConnection,
  getPipelineCardByConnectionId,
  movePipelineCard,
} from "../repositories/DealPipelineRepository.js";

export const PIPELINE_STAGE_ORDER = [
  "DISCOVERED",
  "CONNECTED",
  "REVIEWING",
  "DUE_DILIGENCE",
  "DECISION",
  "ARCHIVED",
];

export async function getConnectionIdForInvestorAndStartup(
  investorUserId,
  startupUserId,
) {
  const result = await pool.query(
    `
      SELECT id
      FROM public.connections
      WHERE investor_id = $1
        AND startup_id = $2
        AND LOWER(status) IN ('accepted', 'connected')
      LIMIT 1
    `,
    [investorUserId, startupUserId],
  );

  return result.rows[0]?.id || null;
}

/**
 * Advance pipeline card forward only (never backward). No-op if card missing or already at/ past target.
 */
export async function advancePipelineStageIfEligible({
  investorUserId,
  connectionId,
  startupProfileId = null,
  targetStage,
}) {
  if (!connectionId || !investorUserId || !targetStage) {
    return { moved: false, reason: "missing_params" };
  }

  let card = await getPipelineCardByConnectionId(connectionId);
  if (!card && startupProfileId) {
    card = await ensurePipelineCardForConnection({
      investorUserId,
      connectionId,
      startupProfileId,
      stage: "CONNECTED",
    });
  }

  if (!card) {
    return { moved: false, reason: "no_card" };
  }

  const currentIdx = PIPELINE_STAGE_ORDER.indexOf(card.stage);
  const targetIdx = PIPELINE_STAGE_ORDER.indexOf(targetStage);

  if (currentIdx < 0 || targetIdx < 0 || targetIdx <= currentIdx) {
    return {
      moved: false,
      reason: "already_at_or_past",
      card,
      current_stage: card.stage,
    };
  }

  const updated = await movePipelineCard(card.id, investorUserId, targetStage);
  return {
    moved: true,
    card: updated,
    previous_stage: card.stage,
    stage: updated?.stage,
  };
}
