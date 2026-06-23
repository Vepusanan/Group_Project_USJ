import pool from "../config/database.js";

let tablesReadyPromise = null;

export const ALLOWED_FUNDING_STAGES = new Set([
  "PRE_SEED",
  "SEED",
  "SERIES_A",
  "SERIES_B",
  "SERIES_C",
  "SERIES_D_PLUS",
]);

export const ALLOWED_CURRENCIES = new Set(["USD", "EUR", "GBP", "LKR", "AUD", "CAD", "SGD"]);

export const ensureFundingRoundTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      CREATE TABLE IF NOT EXISTS public.funding_rounds (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        funding_stage VARCHAR(50) NOT NULL,
        target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount > 0),
        committed_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (committed_amount >= 0),
        currency VARCHAR(3) NOT NULL DEFAULT 'USD',
        opening_date DATE NOT NULL,
        target_closing_date DATE NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'active',
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        closed_at TIMESTAMP WITHOUT TIME ZONE,
        CONSTRAINT funding_rounds_pkey PRIMARY KEY (id),
        CONSTRAINT funding_rounds_status_check CHECK (status IN ('active', 'closed'))
      );

      CREATE UNIQUE INDEX IF NOT EXISTS ux_funding_rounds_active_per_startup
        ON public.funding_rounds (startup_profile_id)
        WHERE status = 'active';
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function getActiveFundingRound(startupProfileId) {
  await ensureFundingRoundTables();

  const result = await pool.query(
    `
      SELECT *
      FROM public.funding_rounds
      WHERE startup_profile_id = $1 AND status = 'active'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [startupProfileId],
  );

  return result.rows[0] || null;
}

export async function getFundingRoundById(roundId) {
  await ensureFundingRoundTables();

  const result = await pool.query(
    `SELECT * FROM public.funding_rounds WHERE id = $1`,
    [roundId],
  );

  return result.rows[0] || null;
}

export async function createFundingRound({
  startupProfileId,
  fundingStage,
  targetAmount,
  committedAmount = 0,
  currency = "USD",
  openingDate,
  targetClosingDate,
}) {
  await ensureFundingRoundTables();

  const existing = await getActiveFundingRound(startupProfileId);
  if (existing) {
    const error = new Error("An active funding round already exists. Close it before creating a new one.");
    error.code = "ACTIVE_ROUND_EXISTS";
    throw error;
  }

  const result = await pool.query(
    `
      INSERT INTO public.funding_rounds
        (startup_profile_id, funding_stage, target_amount, committed_amount, currency, opening_date, target_closing_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `,
    [
      startupProfileId,
      fundingStage,
      targetAmount,
      committedAmount,
      currency,
      openingDate,
      targetClosingDate,
    ],
  );

  return result.rows[0];
}

export async function updateFundingRound(roundId, updates) {
  await ensureFundingRoundTables();

  const fields = [];
  const values = [roundId];
  let idx = 2;

  const allowed = [
    "funding_stage",
    "target_amount",
    "committed_amount",
    "currency",
    "opening_date",
    "target_closing_date",
  ];

  for (const key of allowed) {
    if (updates[key] !== undefined) {
      fields.push(`${key} = $${idx++}`);
      values.push(updates[key]);
    }
  }

  if (fields.length === 0) {
    return getFundingRoundById(roundId);
  }

  const result = await pool.query(
    `
      UPDATE public.funding_rounds
      SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'active'
      RETURNING *
    `,
    values,
  );

  return result.rows[0] || null;
}

export async function closeFundingRound(roundId) {
  await ensureFundingRoundTables();

  const result = await pool.query(
    `
      UPDATE public.funding_rounds
      SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND status = 'active'
      RETURNING *
    `,
    [roundId],
  );

  return result.rows[0] || null;
}

export function computeProgressPercent(targetAmount, committedAmount) {
  const target = Number(targetAmount);
  const committed = Number(committedAmount);
  if (!target || target <= 0) return 0;
  return Math.min(100, Math.round((committed / target) * 100));
}

export function serializeFundingRoundForViewer(round, { canViewFinancials } = {}) {
  if (!round) return null;

  const base = {
    id: round.id,
    startup_profile_id: round.startup_profile_id,
    funding_stage: round.funding_stage,
    status: round.status,
    opening_date: round.opening_date,
    target_closing_date: round.target_closing_date,
    closed_at: round.closed_at || null,
    can_view_financials: Boolean(canViewFinancials),
  };

  if (!canViewFinancials) {
    return {
      ...base,
      message: "Connect with this startup to view funding progress and amounts",
    };
  }

  const target = Number(round.target_amount);
  const committed = Number(round.committed_amount);

  return {
    ...base,
    target_amount: target,
    committed_amount: committed,
    currency: round.currency || "USD",
    progress_percent: computeProgressPercent(target, committed),
  };
}
