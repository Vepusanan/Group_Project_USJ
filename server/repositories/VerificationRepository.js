import pool from "../config/database.js";

const TIER_RANK = {
  UNVERIFIED: 0,
  IDENTITY_VERIFIED: 1,
  BUSINESS_VERIFIED: 2,
};

let tablesReadyPromise = null;

export const ensureVerificationTables = async () => {
  if (tablesReadyPromise) return tablesReadyPromise;

  tablesReadyPromise = pool
    .query(`
      DO $$ BEGIN
        CREATE TYPE public.verification_tier_enum AS ENUM (
          'UNVERIFIED', 'IDENTITY_VERIFIED', 'BUSINESS_VERIFIED'
        );
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;

      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS verification_tier public.verification_tier_enum NOT NULL DEFAULT 'UNVERIFIED';

      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS linkedin_profile_url VARCHAR(500);

      ALTER TABLE public.users
        ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        ADD COLUMN IF NOT EXISTS inactive_cleanup_notice_at TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN IF NOT EXISTS business_verified_at TIMESTAMP WITHOUT TIME ZONE,
        ADD COLUMN IF NOT EXISTS fraud_flagged BOOLEAN NOT NULL DEFAULT FALSE;

      CREATE TABLE IF NOT EXISTS public.verification_requests (
        id UUID NOT NULL DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
        requested_tier VARCHAR(30) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        linkedin_profile_url VARCHAR(500),
        document_url TEXT,
        document_name VARCHAR(255),
        rejection_reason TEXT,
        reviewed_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT verification_requests_pkey PRIMARY KEY (id)
      );
    `)
    .then(() => undefined);

  return tablesReadyPromise;
};

export const getTierRank = (tier) => TIER_RANK[tier] ?? 0;

export async function getUserVerification(userId) {
  await ensureVerificationTables();

  const result = await pool.query(
    `
      SELECT id, email_verified, verification_tier, linkedin_profile_url, full_name, email,
             business_verified_at, fraud_flagged
      FROM public.users WHERE id = $1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

export async function setUserVerificationTier(userId, tier) {
  await ensureVerificationTables();

  const result = await pool.query(
    `
      UPDATE public.users
      SET verification_tier = $2::public.verification_tier_enum
      WHERE id = $1
      RETURNING id, verification_tier
    `,
    [userId, tier],
  );

  return result.rows[0];
}

export async function setUserLinkedIn(userId, linkedinUrl) {
  await ensureVerificationTables();

  await pool.query(
    `UPDATE public.users SET linkedin_profile_url = $2 WHERE id = $1`,
    [userId, linkedinUrl],
  );
}

export async function createVerificationRequest({
  userId,
  requestedTier,
  linkedinProfileUrl = null,
  documentUrl = null,
  documentName = null,
}) {
  await ensureVerificationTables();

  const result = await pool.query(
    `
      INSERT INTO public.verification_requests
        (user_id, requested_tier, status, linkedin_profile_url, document_url, document_name)
      VALUES ($1, $2, 'pending', $3, $4, $5)
      RETURNING *
    `,
    [userId, requestedTier, linkedinProfileUrl, documentUrl, documentName],
  );

  return result.rows[0];
}

export async function getLatestVerificationRequest(userId) {
  await ensureVerificationTables();

  const result = await pool.query(
    `
      SELECT * FROM public.verification_requests
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [userId],
  );

  return result.rows[0] || null;
}

export async function listPendingVerificationRequests() {
  await ensureVerificationTables();

  const result = await pool.query(
    `
      SELECT
        vr.*,
        u.full_name,
        u.email,
        u.user_type,
        u.verification_tier,
        ROUND(EXTRACT(EPOCH FROM (NOW() - vr.created_at)) / 3600.0, 1) AS hours_pending
      FROM public.verification_requests vr
      JOIN public.users u ON u.id = vr.user_id
      WHERE vr.status = 'pending'
      ORDER BY vr.created_at ASC
    `,
  );

  return result.rows;
}

export async function getVerificationRequestById(requestId) {
  await ensureVerificationTables();

  const result = await pool.query(
    `
      SELECT vr.*, u.full_name, u.email, u.user_type, u.verification_tier
      FROM public.verification_requests vr
      JOIN public.users u ON u.id = vr.user_id
      WHERE vr.id = $1
    `,
    [requestId],
  );

  return result.rows[0] || null;
}

export async function resolveVerificationRequest({
  requestId,
  status,
  reviewedBy,
  rejectionReason = null,
  approvedTier = null,
}) {
  await ensureVerificationTables();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const updated = await client.query(
      `
        UPDATE public.verification_requests
        SET status = $2,
            rejection_reason = $3,
            reviewed_by = $4,
            reviewed_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND status = 'pending'
        RETURNING *
      `,
      [requestId, status, rejectionReason, reviewedBy],
    );

    if (!updated.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    const request = updated.rows[0];

    if (status === "approved" && approvedTier) {
      const businessVerifiedAtClause =
        approvedTier === "BUSINESS_VERIFIED"
          ? ", business_verified_at = CURRENT_TIMESTAMP"
          : "";

      await client.query(
        `
          UPDATE public.users
          SET verification_tier = $2::public.verification_tier_enum${businessVerifiedAtClause}
          WHERE id = $1
        `,
        [request.user_id, approvedTier],
      );

      if (request.linkedin_profile_url) {
        await client.query(
          `UPDATE public.users SET linkedin_profile_url = $2 WHERE id = $1`,
          [request.user_id, request.linkedin_profile_url],
        );
      }
    }

    await client.query("COMMIT");
    return request;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
