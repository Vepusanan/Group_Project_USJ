import pool from "../config/database.js";
import { StartupProfile } from "../models/StartupProfiles.js";
import { InvestorProfile } from "../models/InvestorProfile.js";
import { getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import { getInvestorProfileByUserId } from "../repositories/InvestorProfileRepository.js";
import { ensureUserActivityColumns } from "../repositories/UserActivityRepository.js";

const MS_48H = 48 * 60 * 60 * 1000;

const qualitativeResponseRate = (pct) => {
  if (pct == null) return null;
  if (pct >= 90) return "Excellent";
  if (pct >= 75) return "Good";
  if (pct >= 50) return "Fair";
  return "Needs improvement";
};

export async function getCredibilitySignals(userId, userType) {
  await ensureUserActivityColumns();

  let profileCompletion = null;
  let milestoneUpdatesPerMonth = null;

  if (userType === "startup") {
    const profile = await getStartupProfileByUserId(userId);
    if (profile) {
      const model = new StartupProfile(profile);
      model.parseJsonFields();
      profileCompletion = model.calculateCompletion().completionPercentage;

      const milestoneResult = await pool.query(
        `
          SELECT COUNT(*)::int AS count
          FROM public.startup_milestones sm
          JOIN public.startup_profiles sp ON sp.startup_profile_id = sm.startup_profile_id
          WHERE sp.user_id = $1
            AND sm.created_at >= NOW() - INTERVAL '90 days'
        `,
        [userId],
      );
      const count = milestoneResult.rows[0]?.count || 0;
      milestoneUpdatesPerMonth = Math.round((count / 3) * 10) / 10;
    }
  } else if (userType === "investor") {
    const profile = await getInvestorProfileByUserId(userId);
    if (profile) {
      const model = new InvestorProfile(profile);
      profileCompletion = model.calculateCompletion().completionPercentage;
    }
  }

  const responseResult = await pool.query(
    `
      WITH inbound_connections AS (
        SELECT
          c.id,
          c.created_at AS requested_at,
          c.updated_at AS responded_at,
          LOWER(c.status) AS status
        FROM public.connections c
        WHERE (
          (c.startup_id = $1 AND c.requester_id IS NOT NULL AND c.requester_id != $1)
          OR (c.investor_id = $1 AND c.requester_id IS NOT NULL AND c.requester_id != $1)
        )
      ),
      inbound_meetings AS (
        SELECT
          m.id,
          m.created_at AS requested_at,
          m.responded_at,
          LOWER(m.status) AS status
        FROM public.connection_meetings m
        JOIN public.connections c ON c.id = m.connection_id
        WHERE m.requested_by != $1
          AND (c.startup_id = $1 OR c.investor_id = $1)
      ),
      combined AS (
        SELECT requested_at, responded_at, status FROM inbound_connections
        UNION ALL
        SELECT requested_at, responded_at, status FROM inbound_meetings
      )
      SELECT
        COUNT(*)::int AS total_requests,
        COUNT(*) FILTER (
          WHERE status IN ('accepted', 'connected', 'declined')
            AND responded_at IS NOT NULL
            AND EXTRACT(EPOCH FROM (responded_at - requested_at)) * 1000 <= $2
        )::int AS responded_within_48h
      FROM combined
    `,
    [userId, MS_48H],
  );

  const responseRow = responseResult.rows[0] || {};
  const totalRequests = responseRow.total_requests || 0;
  const respondedWithin48h = responseRow.responded_within_48h || 0;
  const responseRatePct =
    totalRequests > 0
      ? Math.round((respondedWithin48h / totalRequests) * 100)
      : null;

  const activityResult = await pool.query(
    `
      SELECT
        u.last_activity_at,
        GREATEST(
          COALESCE(sp.updated_at, 'epoch'::timestamp),
          COALESCE(ip.updated_at, 'epoch'::timestamp)
        ) AS profile_updated_at
      FROM public.users u
      LEFT JOIN public.startup_profiles sp ON sp.user_id = u.id
      LEFT JOIN public.investor_profiles ip ON ip.user_id = u.id
      WHERE u.id = $1
    `,
    [userId],
  );

  const activityRow = activityResult.rows[0] || {};

  return {
    profile_completion_percentage: profileCompletion,
    milestone_updates_per_month: milestoneUpdatesPerMonth,
    response_rate_percentage: responseRatePct,
    response_rate_label: qualitativeResponseRate(responseRatePct),
    last_profile_update_at: activityRow.profile_updated_at || null,
    last_activity_at: activityRow.last_activity_at || null,
  };
}
