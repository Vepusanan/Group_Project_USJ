import pool from "../config/database.js";

export const PIPELINE_STAGES = [
  "DISCOVERED",
  "CONNECTED",
  "REVIEWING",
  "DUE_DILIGENCE",
  "DECISION",
  "ARCHIVED",
];

export const PIPELINE_STAGE_SET = new Set(PIPELINE_STAGES);

let tablesReadyPromise = null;

export const ensureDealPipelineTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.deal_pipeline_cards (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        investor_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        connection_id UUID NOT NULL REFERENCES public.connections(id) ON DELETE CASCADE,
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        stage VARCHAR(30) NOT NULL DEFAULT 'CONNECTED',
        private_notes TEXT,
        stage_entered_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT deal_pipeline_cards_pkey PRIMARY KEY (id),
        CONSTRAINT deal_pipeline_cards_connection_unique UNIQUE (connection_id)
      );

      ALTER TABLE public.deal_pipeline_cards
        ADD COLUMN IF NOT EXISTS decision_outcome VARCHAR(20);

      CREATE TABLE IF NOT EXISTS public.deal_pipeline_stage_events (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        card_id UUID NOT NULL REFERENCES public.deal_pipeline_cards(id) ON DELETE CASCADE,
        stage VARCHAR(30) NOT NULL,
        entered_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        exited_at TIMESTAMP WITHOUT TIME ZONE,
        CONSTRAINT deal_pipeline_stage_events_pkey PRIMARY KEY (id)
      );
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

async function recordStageEntry(cardId, stage) {
  await pool.query(
    `
      INSERT INTO public.deal_pipeline_stage_events (card_id, stage, entered_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `,
    [cardId, stage],
  );
}

async function closeOpenStageEvent(cardId) {
  await pool.query(
    `
      UPDATE public.deal_pipeline_stage_events
      SET exited_at = CURRENT_TIMESTAMP
      WHERE card_id = $1 AND exited_at IS NULL
    `,
    [cardId],
  );
}

export async function ensurePipelineCardForConnection({
  investorUserId,
  connectionId,
  startupProfileId,
  stage = "CONNECTED",
}) {
  await ensureDealPipelineTables();

  const existing = await pool.query(
    `SELECT * FROM public.deal_pipeline_cards WHERE connection_id = $1`,
    [connectionId],
  );

  if (existing.rows[0]) {
    return existing.rows[0];
  }

  const inserted = await pool.query(
    `
      INSERT INTO public.deal_pipeline_cards
        (investor_user_id, connection_id, startup_profile_id, stage, stage_entered_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
      RETURNING *
    `,
    [investorUserId, connectionId, startupProfileId, stage],
  );

  await recordStageEntry(inserted.rows[0].id, stage);
  return inserted.rows[0];
}

export async function syncPipelineCardsForInvestor(investorUserId) {
  await ensureDealPipelineTables();

  const connections = await pool.query(
    `
      SELECT c.id AS connection_id, sp.startup_profile_id
      FROM public.connections c
      JOIN public.startup_profiles sp ON sp.user_id = c.startup_id
      WHERE c.investor_id = $1
        AND LOWER(c.status) IN ('accepted', 'connected')
    `,
    [investorUserId],
  );

  for (const row of connections.rows) {
    const existing = await pool.query(
      `SELECT id FROM public.deal_pipeline_cards WHERE connection_id = $1`,
      [row.connection_id],
    );

    if (existing.rows.length > 0) continue;

    const inserted = await pool.query(
      `
        INSERT INTO public.deal_pipeline_cards
          (investor_user_id, connection_id, startup_profile_id, stage, stage_entered_at)
        VALUES ($1, $2, $3, 'CONNECTED', CURRENT_TIMESTAMP)
        RETURNING id
      `,
      [investorUserId, row.connection_id, row.startup_profile_id],
    );

    await recordStageEntry(inserted.rows[0].id, "CONNECTED");
  }
}

export async function listPipelineCardsForInvestor(investorUserId) {
  await ensureDealPipelineTables();
  await syncPipelineCardsForInvestor(investorUserId);

  const result = await pool.query(
    `
      SELECT
        dpc.id,
        dpc.investor_user_id,
        dpc.connection_id,
        dpc.startup_profile_id,
        dpc.stage,
        dpc.private_notes,
        dpc.stage_entered_at,
        dpc.created_at,
        dpc.updated_at,
        sp.company_name AS startup_name,
        sp.logo_url AS startup_logo_url,
        sp.industry,
        sp.funding_stage
      FROM public.deal_pipeline_cards dpc
      JOIN public.startup_profiles sp ON sp.startup_profile_id = dpc.startup_profile_id
      WHERE dpc.investor_user_id = $1
      ORDER BY dpc.stage_entered_at DESC
    `,
    [investorUserId],
  );

  return result.rows;
}

export async function getPipelineCardById(cardId) {
  await ensureDealPipelineTables();

  const result = await pool.query(
    `SELECT * FROM public.deal_pipeline_cards WHERE id = $1`,
    [cardId],
  );

  return result.rows[0] || null;
}

export async function getPipelineCardByConnectionId(connectionId) {
  await ensureDealPipelineTables();

  const result = await pool.query(
    `SELECT * FROM public.deal_pipeline_cards WHERE connection_id = $1`,
    [connectionId],
  );

  return result.rows[0] || null;
}

export async function movePipelineCard(cardId, investorUserId, newStage) {
  await ensureDealPipelineTables();

  const card = await getPipelineCardById(cardId);
  if (!card || String(card.investor_user_id) !== String(investorUserId)) {
    return null;
  }

  if (card.stage === newStage) {
    return card;
  }

  await closeOpenStageEvent(cardId);

  const result = await pool.query(
    `
      UPDATE public.deal_pipeline_cards
      SET stage = $2,
          stage_entered_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `,
    [cardId, newStage],
  );

  await recordStageEntry(cardId, newStage);

  return result.rows[0];
}

export async function updatePipelineCardNotes(
  cardId,
  investorUserId,
  { privateNotes, decisionOutcome } = {},
) {
  await ensureDealPipelineTables();

  const sets = ["updated_at = CURRENT_TIMESTAMP"];
  const values = [cardId, investorUserId];
  let idx = 3;

  if (privateNotes !== undefined) {
    sets.push(`private_notes = $${idx}`);
    values.push(privateNotes?.trim() || null);
    idx += 1;
  }

  if (decisionOutcome !== undefined) {
    sets.push(`decision_outcome = $${idx}`);
    values.push(decisionOutcome || null);
    idx += 1;
  }

  const result = await pool.query(
    `
      UPDATE public.deal_pipeline_cards
      SET ${sets.join(", ")}
      WHERE id = $1 AND investor_user_id = $2
      RETURNING *
    `,
    values,
  );

  return result.rows[0] || null;
}

export async function getPipelineStats(investorUserId) {
  await ensureDealPipelineTables();

  const countResult = await pool.query(
    `
      SELECT stage, COUNT(*)::int AS count
      FROM public.deal_pipeline_cards
      WHERE investor_user_id = $1
      GROUP BY stage
    `,
    [investorUserId],
  );

  const avgTimeResult = await pool.query(
    `
      SELECT
        e.stage,
        ROUND(AVG(EXTRACT(EPOCH FROM (e.exited_at - e.entered_at)) / 86400.0)::numeric, 1) AS avg_days
      FROM public.deal_pipeline_stage_events e
      JOIN public.deal_pipeline_cards c ON c.id = e.card_id
      WHERE c.investor_user_id = $1
        AND e.exited_at IS NOT NULL
      GROUP BY e.stage
    `,
    [investorUserId],
  );

  const velocityResult = await pool.query(
    `
      SELECT
        COUNT(*) FILTER (WHERE e.stage IN ('DECISION', 'ARCHIVED'))::int AS completed_moves,
        ROUND(AVG(
          EXTRACT(EPOCH FROM (
            COALESCE(
              (SELECT MIN(e2.entered_at)
               FROM public.deal_pipeline_stage_events e2
               WHERE e2.card_id = c.id AND e2.stage IN ('DECISION', 'ARCHIVED')),
              e.exited_at
            ) - c.created_at
          )) / 86400.0
        )::numeric, 1) AS avg_days_to_completion
      FROM public.deal_pipeline_cards c
      LEFT JOIN public.deal_pipeline_stage_events e ON e.card_id = c.id
      WHERE c.investor_user_id = $1
        AND c.stage IN ('DECISION', 'ARCHIVED')
    `,
    [investorUserId],
  );

  const recentMovesResult = await pool.query(
    `
      SELECT COUNT(*)::int AS moves_last_30_days
      FROM public.deal_pipeline_stage_events e
      JOIN public.deal_pipeline_cards c ON c.id = e.card_id
      WHERE c.investor_user_id = $1
        AND e.entered_at >= NOW() - INTERVAL '30 days'
    `,
    [investorUserId],
  );

  const dealsPerStage = Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [stage, 0]),
  );
  for (const row of countResult.rows) {
    dealsPerStage[row.stage] = row.count;
  }

  const avgDaysPerStage = Object.fromEntries(
    PIPELINE_STAGES.map((stage) => [stage, null]),
  );
  for (const row of avgTimeResult.rows) {
    avgDaysPerStage[row.stage] = Number(row.avg_days);
  }

  const velocityRow = velocityResult.rows[0] || {};
  const recentRow = recentMovesResult.rows[0] || {};

  return {
    deals_per_stage: dealsPerStage,
    avg_days_per_stage: avgDaysPerStage,
    total_cards: Object.values(dealsPerStage).reduce((sum, n) => sum + n, 0),
    pipeline_velocity: {
      avg_days_to_completion: velocityRow.avg_days_to_completion
        ? Number(velocityRow.avg_days_to_completion)
        : null,
      stage_moves_last_30_days: recentRow.moves_last_30_days || 0,
      completed_deals: velocityRow.completed_moves || 0,
    },
  };
}
