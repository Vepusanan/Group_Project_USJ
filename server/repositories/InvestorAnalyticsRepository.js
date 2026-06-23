import pool from "../config/database.js";
import { ensureDealPipelineTables } from "./DealPipelineRepository.js";
import { ensurePitchDeckSessionTables } from "./PitchDeckViewSessionRepository.js";
import { ensureDdChecklistTables } from "./DdChecklistRepository.js";
import { ensureMeetingTables } from "./MeetingRepository.js";
import { ensureWatchlistTables } from "./WatchlistRepository.js";

const STAGE_TRANSITIONS = [
  ["CONNECTED", "REVIEWING"],
  ["REVIEWING", "DUE_DILIGENCE"],
  ["DUE_DILIGENCE", "DECISION"],
  ["DECISION", "ARCHIVED"],
];

export async function getStageConversionRates(investorUserId) {
  await ensureDealPipelineTables();

  const rates = {};

  for (const [fromStage, toStage] of STAGE_TRANSITIONS) {
    const result = await pool.query(
      `
        SELECT
          COUNT(DISTINCT e1.card_id)::int AS entered,
          COUNT(DISTINCT e2.card_id)::int AS advanced
        FROM public.deal_pipeline_stage_events e1
        JOIN public.deal_pipeline_cards c ON c.id = e1.card_id
        LEFT JOIN public.deal_pipeline_stage_events e2
          ON e2.card_id = e1.card_id
          AND e2.stage = $3
          AND e2.entered_at > e1.entered_at
        WHERE c.investor_user_id = $1
          AND e1.stage = $2
      `,
      [investorUserId, fromStage, toStage],
    );

    const row = result.rows[0] || {};
    const entered = row.entered || 0;
    const advanced = row.advanced || 0;

    rates[fromStage] = {
      from_stage: fromStage,
      to_stage: toStage,
      entered,
      advanced,
      conversion_rate: entered > 0 ? Math.round((advanced / entered) * 100) : null,
    };
  }

  return rates;
}

export async function countNewPipelineCardsPerMonth(investorUserId, { months = 6 } = {}) {
  await ensureDealPipelineTables();

  const result = await pool.query(
    `
      SELECT
        date_trunc('month', created_at) AS month_start,
        COUNT(*)::int AS value
      FROM public.deal_pipeline_cards
      WHERE investor_user_id = $1
        AND created_at >= NOW() - ($2::int * INTERVAL '1 month')
      GROUP BY month_start
      ORDER BY month_start ASC
    `,
    [investorUserId, months],
  );

  return result.rows.map((row) => ({
    label: new Date(row.month_start).toLocaleDateString([], {
      month: "short",
      year: "numeric",
    }),
    value: row.value,
  }));
}

export async function countPitchDecksReviewed(investorUserId, { since = null } = {}) {
  await ensurePitchDeckSessionTables();

  const values = [investorUserId];
  let sinceClause = "";

  if (since) {
    values.push(since);
    sinceClause = "AND started_at >= $2";
  }

  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total_sessions,
        COUNT(DISTINCT startup_profile_id)::int AS unique_startups
      FROM public.pitch_deck_view_sessions
      WHERE investor_user_id = $1 ${sinceClause}
    `,
    values,
  );

  return result.rows[0] || { total_sessions: 0, unique_startups: 0 };
}

export async function countDdChecklistStats(investorUserId, { since = null } = {}) {
  await ensureDdChecklistTables();

  const values = [investorUserId];
  let sinceClause = "";

  if (since) {
    values.push(since);
    sinceClause = "AND dc.created_at >= $2";
  }

  const result = await pool.query(
    `
      SELECT
        COUNT(DISTINCT dc.id)::int AS checklists_created,
        COUNT(di.id)::int AS total_items,
        COUNT(di.id) FILTER (WHERE di.status = 'COMPLETED')::int AS completed_items
      FROM public.dd_checklists dc
      JOIN public.connections c ON c.id = dc.connection_id
      LEFT JOIN public.dd_checklist_items di ON di.checklist_id = dc.id
      WHERE c.investor_id = $1 ${sinceClause}
    `,
    values,
  );

  const row = result.rows[0] || {};
  const totalItems = row.total_items || 0;
  const completedItems = row.completed_items || 0;

  return {
    checklists_created: row.checklists_created || 0,
    total_items: totalItems,
    completed_items: completedItems,
    avg_completion_rate:
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : null,
  };
}

export async function countMeetingStats(investorUserId, { since = null } = {}) {
  await ensureMeetingTables();

  const values = [investorUserId];
  let sinceClause = "";

  if (since) {
    values.push(since);
    sinceClause = "AND m.created_at >= $2";
  }

  const result = await pool.query(
    `
      SELECT
        COUNT(*)::int AS total_scheduled,
        COUNT(*) FILTER (WHERE LOWER(m.status) = 'accepted')::int AS accepted,
        COUNT(*) FILTER (WHERE LOWER(m.status) = 'declined')::int AS declined,
        COUNT(*) FILTER (WHERE LOWER(m.status) = 'pending')::int AS pending
      FROM public.connection_meetings m
      JOIN public.connections c ON c.id = m.connection_id
      WHERE c.investor_id = $1 ${sinceClause}
    `,
    values,
  );

  const row = result.rows[0] || {};
  const responded = (row.accepted || 0) + (row.declined || 0);

  return {
    total_scheduled: row.total_scheduled || 0,
    accepted: row.accepted || 0,
    declined: row.declined || 0,
    pending: row.pending || 0,
    acceptance_rate:
      responded > 0 ? Math.round((row.accepted / responded) * 100) : null,
  };
}

export async function watchlistAddsPerMonth(investorUserId, { months = 6 } = {}) {
  await ensureWatchlistTables();

  const result = await pool.query(
    `
      SELECT
        date_trunc('month', added_at) AS month_start,
        COUNT(*)::int AS value
      FROM public.investor_watchlist
      WHERE investor_user_id = $1
        AND added_at >= NOW() - ($2::int * INTERVAL '1 month')
      GROUP BY month_start
      ORDER BY month_start ASC
    `,
    [investorUserId, months],
  );

  return result.rows.map((row) => ({
    label: new Date(row.month_start).toLocaleDateString([], {
      month: "short",
      year: "numeric",
    }),
    value: row.value,
  }));
}
