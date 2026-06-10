import pool from "../config/database.js";

export const MILESTONE_CATEGORIES = [
  "PRODUCT_LAUNCH",
  "REVENUE_MILESTONE",
  "NEW_CUSTOMER",
  "STRATEGIC_PARTNERSHIP",
  "TEAM_EXPANSION",
  "FUNDING_ACHIEVEMENT",
  "OTHER",
];

let tablesReadyPromise = null;

export const ensureMilestoneTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      DO $$ BEGIN
        CREATE TYPE public.milestone_category_enum AS ENUM (
          'PRODUCT_LAUNCH', 'REVENUE_MILESTONE', 'NEW_CUSTOMER',
          'STRATEGIC_PARTNERSHIP', 'TEAM_EXPANSION', 'FUNDING_ACHIEVEMENT', 'OTHER'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      CREATE TABLE IF NOT EXISTS public.startup_milestones (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        startup_profile_id UUID NOT NULL REFERENCES public.startup_profiles(startup_profile_id) ON DELETE CASCADE,
        category public.milestone_category_enum NOT NULL,
        headline VARCHAR(200) NOT NULL,
        description VARCHAR(500) NOT NULL,
        milestone_date DATE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT startup_milestones_pkey PRIMARY KEY (id)
      );
      CREATE INDEX IF NOT EXISTS idx_startup_milestones_startup
        ON public.startup_milestones (startup_profile_id, created_at DESC);
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export async function listMilestonesForStartup(startupProfileId) {
  await ensureMilestoneTables();

  const result = await pool.query(
    `
      SELECT * FROM public.startup_milestones
      WHERE startup_profile_id = $1
      ORDER BY COALESCE(milestone_date, created_at::date) DESC, created_at DESC
    `,
    [startupProfileId],
  );

  return result.rows;
}

export async function getMilestoneById(milestoneId) {
  await ensureMilestoneTables();

  const result = await pool.query(
    `SELECT * FROM public.startup_milestones WHERE id = $1`,
    [milestoneId],
  );

  return result.rows[0] || null;
}

export async function createMilestone({
  startupProfileId,
  category,
  headline,
  description,
  milestoneDate = null,
}) {
  await ensureMilestoneTables();

  const result = await pool.query(
    `
      INSERT INTO public.startup_milestones
        (startup_profile_id, category, headline, description, milestone_date)
      VALUES ($1, $2::public.milestone_category_enum, $3, $4, $5)
      RETURNING *
    `,
    [startupProfileId, category, headline, description, milestoneDate],
  );

  return result.rows[0];
}

export async function updateMilestone(milestoneId, updates) {
  await ensureMilestoneTables();

  const sets = [];
  const values = [];
  let idx = 1;

  for (const [key, col] of [
    ["category", "category"],
    ["headline", "headline"],
    ["description", "description"],
    ["milestone_date", "milestone_date"],
  ]) {
    if (updates[key] !== undefined) {
      if (key === "category") {
        sets.push(`${col} = $${idx}::public.milestone_category_enum`);
      } else {
        sets.push(`${col} = $${idx}`);
      }
      values.push(updates[key]);
      idx += 1;
    }
  }

  if (!sets.length) return getMilestoneById(milestoneId);

  sets.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(milestoneId);

  const result = await pool.query(
    `
      UPDATE public.startup_milestones
      SET ${sets.join(", ")}
      WHERE id = $${idx}
      RETURNING *
    `,
    values,
  );

  return result.rows[0] || null;
}

export async function deleteMilestone(milestoneId) {
  await ensureMilestoneTables();

  const result = await pool.query(
    `DELETE FROM public.startup_milestones WHERE id = $1 RETURNING id`,
    [milestoneId],
  );

  return result.rows[0] || null;
}
