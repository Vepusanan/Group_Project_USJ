import {
  listPipelineCardsForInvestor,
  movePipelineCard,
  PIPELINE_STAGES,
  PIPELINE_STAGE_SET,
  updatePipelineCardNotes,
} from "../repositories/DealPipelineRepository.js";
import { getIntentMapForInvestor } from "../repositories/InvestorIntentRepository.js";
import { listPassedStartupsForInvestor } from "../repositories/InvestorPassedRepository.js";
import { listDiscoveredProfileIntentsForInvestor } from "../repositories/InvestorProfileIntentRepository.js";
import { getInvestorAnalytics } from "../services/investorAnalyticsService.js";

const assertInvestor = (req) => {
  if (req.user.user_type !== "investor") {
    const error = new Error("Only investors can access the deal pipeline");
    error.statusCode = 403;
    throw error;
  }
};

const serializeCard = (row, intentMap = new Map()) => {
  const intent = intentMap.get(String(row.connection_id));
  return {
    id: row.id,
    connection_id: row.connection_id,
    startup_profile_id: row.startup_profile_id,
    stage: row.stage,
    private_notes: row.private_notes,
    stage_entered_at: row.stage_entered_at,
    created_at: row.created_at,
    startup_name: row.startup_name,
    startup_logo_url: row.startup_logo_url,
    industry: row.industry,
    funding_stage: row.funding_stage,
    intent_level: intent?.intent_level || null,
    decision_outcome: row.decision_outcome || null,
  };
};

export const getDealPipeline = async (req, res, next) => {
  try {
    assertInvestor(req);

    const period = String(req.query.period || "30d");

    const [cards, intentMap, passedStartups, discoveredIntents] =
      await Promise.all([
      listPipelineCardsForInvestor(req.user.id),
      getIntentMapForInvestor(req.user.id),
      listPassedStartupsForInvestor(req.user.id),
      listDiscoveredProfileIntentsForInvestor(req.user.id),
    ]);

    const stats = await getInvestorAnalytics(req.user.id, {
      discoveredCount: discoveredIntents.length,
      passedCount: passedStartups.length,
      period,
    });

    const cardsByStage = {};
    for (const stage of PIPELINE_STAGES) {
      cardsByStage[stage] = [];
    }
    for (const card of cards) {
      if (cardsByStage[card.stage]) {
        cardsByStage[card.stage].push(serializeCard(card, intentMap));
      }
    }

    for (const discovered of discoveredIntents) {
      cardsByStage.DISCOVERED.push({
        id: `discovered-${discovered.startup_profile_id}`,
        connection_id: null,
        startup_profile_id: discovered.startup_profile_id,
        stage: "DISCOVERED",
        private_notes: null,
        stage_entered_at: discovered.updated_at,
        created_at: discovered.updated_at,
        startup_name: discovered.startup_name,
        startup_logo_url: discovered.startup_logo_url,
        industry: discovered.industry,
        funding_stage: discovered.funding_stage,
        intent_level: discovered.intent_level,
        is_discovered_without_connection: true,
      });
    }

    for (const passed of passedStartups) {
      cardsByStage.ARCHIVED.push({
        id: `passed-${passed.startup_profile_id}`,
        connection_id: null,
        startup_profile_id: passed.startup_profile_id,
        stage: "ARCHIVED",
        private_notes: null,
        stage_entered_at: passed.passed_at,
        created_at: passed.passed_at,
        startup_name: passed.startup_name,
        startup_logo_url: passed.startup_logo_url,
        industry: passed.industry,
        funding_stage: passed.funding_stage,
        intent_level: "PASSED",
        is_passed_without_connection: true,
      });
    }

    res.json({
      success: true,
      data: {
        stages: PIPELINE_STAGES,
        cards_by_stage: cardsByStage,
        cards: cards.map((card) => serializeCard(card, intentMap)),
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const moveDealPipelineCard = async (req, res, next) => {
  try {
    assertInvestor(req);

    const stage = String(req.body.stage || "").trim().toUpperCase();
    if (!PIPELINE_STAGE_SET.has(stage)) {
      return res.status(400).json({
        success: false,
        error: "Invalid pipeline stage",
      });
    }

    const updated = await movePipelineCard(
      req.params.cardId,
      req.user.id,
      stage,
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Pipeline card not found",
      });
    }

    res.json({ success: true, data: { id: updated.id, stage: updated.stage } });
  } catch (error) {
    next(error);
  }
};

const DECISION_OUTCOMES = new Set(["INVEST", "PASS", "DEFER"]);

export const updateDealPipelineNotes = async (req, res, next) => {
  try {
    assertInvestor(req);

    let decisionOutcome;
    if (Object.prototype.hasOwnProperty.call(req.body, "decision_outcome")) {
      const raw = req.body.decision_outcome;
      if (raw === null || raw === "") {
        decisionOutcome = null;
      } else {
        const normalized = String(raw).trim().toUpperCase();
        if (!DECISION_OUTCOMES.has(normalized)) {
          return res.status(400).json({
            success: false,
            error: "decision_outcome must be INVEST, PASS, or DEFER",
          });
        }
        decisionOutcome = normalized;
      }
    }

    const updated = await updatePipelineCardNotes(
      req.params.cardId,
      req.user.id,
      {
        privateNotes: req.body.private_notes,
        decisionOutcome,
      },
    );

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Pipeline card not found",
      });
    }

    res.json({
      success: true,
      data: {
        id: updated.id,
        private_notes: updated.private_notes,
        decision_outcome: updated.decision_outcome,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const dealPipelineErrorHandler = (error, req, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }
  next(error);
};
