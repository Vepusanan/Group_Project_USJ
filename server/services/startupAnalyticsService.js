import { StartupProfile } from "../models/StartupProfiles.js";
import { getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import {
  countProfileViews,
  profileViewTrendBuckets,
  ensureStartupProfileViewTables,
} from "../repositories/StartupProfileViewRepository.js";
import {
  ensurePitchDeckSessionTables,
  listPitchDeckSessionsForStartup,
} from "../repositories/PitchDeckViewSessionRepository.js";
import { aggregatePitchDeckEngagement } from "../utils/pitchDeckEngagement.js";
import { ensureDataRoomAccessRequestTables } from "../repositories/DataRoomAccessRequestRepository.js";
import { ensureDataRoomTables } from "../repositories/DataRoomRepository.js";
import {
  countDataRoomAccessRequests,
  dataRoomRequestTrendBuckets,
} from "../repositories/DataRoomAccessRequestRepository.js";
import {
  countPitchDeckViews,
  pitchDeckViewTrendBuckets,
  pitchDeckViewsByConnectedInvestor,
  getLastPitchDeckViewDate,
  countConnectionMetrics,
  connectionTrendBuckets,
  countDataRoomGrants,
  dataRoomGrantTrendBuckets,
  countPendingConnectionRequests,
  countDataRoomDocuments,
  getPlatformAverageProfileCompletion,
  countProfileViewToConnectionConversion,
} from "../repositories/StartupAnalyticsRepository.js";

const PROFILE_FIELD_LABELS = {
  company_name: "Company name",
  founder_names: "Founder names",
  tagline: "Tagline",
  detailed_description: "Detailed description",
  industry: "Industry",
  founded_date: "Founded date",
  current_stage: "Business stage",
  team_size: "Team size",
  funding_stage: "Funding stage",
  amount_seeking: "Amount seeking",
  use_of_funds: "Use of funds",
  revenue_status: "Revenue status",
  primary_contact_name: "Primary contact name",
  contact_email: "Contact email",
  key_team_members: "Key team members",
  previous_funding: "Previous funding",
  key_metrics: "Key metrics",
  major_achievements: "Major achievements",
  customer_testimonials: "Customer testimonials",
  team_photo_url: "Team photo",
  pitch_deck_url: "Pitch deck",
  business_plan_url: "Business plan",
  product_demo_url: "Product demo",
  founder_video_url: "Founder video",
  phone_number: "Phone number",
  social_media_links: "Social media links",
};

const SECTION_LABELS = {
  required: "Required",
  important: "Important",
  optional: "Optional",
};

const buildCompletionRecommendations = (incompleteSections = []) =>
  incompleteSections.flatMap((section) =>
    section.missingFields.slice(0, 4).map((field) => ({
      section: SECTION_LABELS[section.section] || section.section,
      field,
      label: PROFILE_FIELD_LABELS[field] || field.replace(/_/g, " "),
      action_path: "/profile/edit",
    })),
  );

const ensureAnalyticsTables = async () => {
  // Run DDL sequentially — parallel CREATE TABLE across repos deadlocks Postgres.
  await ensureStartupProfileViewTables();
  await ensurePitchDeckSessionTables();
  await ensureDataRoomAccessRequestTables();
  await ensureDataRoomTables();
};

const PERIOD_CONFIG = {
  "7d": { days: 7, bucket: "day", maxBuckets: 7 },
  "30d": { days: 30, bucket: "week", maxBuckets: 5 },
  all: { days: null, bucket: "week", maxBuckets: 12 },
};

const msForDays = (days) => days * 24 * 60 * 60 * 1000;

const calcChangePct = (current, previous) => {
  if (previous == null) return null;
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
};

const formatBucketLabel = (bucketStart, bucket) => {
  const date = new Date(bucketStart);
  if (bucket === "day") {
    return date.toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
  }
  return `Week of ${date.toLocaleDateString([], { month: "short", day: "numeric" })}`;
};

const buildTrendSeries = (rows, { bucket, maxBuckets }) => {
  const normalized = rows.map((row) => ({
    bucket_start: row.bucket_start,
    value: Number(row.value) || 0,
  }));

  const trimmed =
    maxBuckets && normalized.length > maxBuckets
      ? normalized.slice(-maxBuckets)
      : normalized;

  return trimmed.map((entry, index) => {
    const prev = index > 0 ? trimmed[index - 1].value : null;
    return {
      label: formatBucketLabel(entry.bucket_start, bucket),
      value: entry.value,
      change_pct: prev != null ? calcChangePct(entry.value, prev) : null,
    };
  });
};

const periodBounds = (periodKey) => {
  const config = PERIOD_CONFIG[periodKey] || PERIOD_CONFIG["30d"];
  const now = new Date();

  if (!config.days) {
    return {
      config,
      since: null,
      until: now,
      previousSince: null,
      previousUntil: null,
    };
  }

  const since = new Date(now.getTime() - msForDays(config.days));
  const previousUntil = since;
  const previousSince = new Date(since.getTime() - msForDays(config.days));

  return {
    config,
    since,
    until: now,
    previousSince,
    previousUntil,
  };
};

const buildInsights = ({
  profile,
  completionPct,
  platformAvgCompletion,
  lastPitchDeckView,
  pendingConnections,
  profileViews,
  pitchDeckViews,
  dataRoomDocuments,
  hasPitchDeck,
}) => {
  const insights = [];
  const now = Date.now();

  const daysSincePitchView = lastPitchDeckView
    ? (now - new Date(lastPitchDeckView).getTime()) / msForDays(1)
    : null;

  if (hasPitchDeck && (daysSincePitchView == null || daysSincePitchView >= 14)) {
    insights.push({
      severity: "warning",
      message:
        daysSincePitchView == null
          ? "Your pitch deck has not been viewed yet. Share it with connected investors."
          : `Your pitch deck has not been viewed in ${Math.floor(daysSincePitchView)} days.`,
      action_label: "Update pitch deck",
      action_path: "/profile/edit",
    });
  }

  if (completionPct < platformAvgCompletion) {
    insights.push({
      severity: "info",
      message: `Your profile completion (${completionPct}%) is below the platform average (${platformAvgCompletion}%).`,
      action_label: "Complete profile",
      action_path: "/profile/edit",
    });
  }

  if (pendingConnections > 0) {
    insights.push({
      severity: "action",
      message: `You have ${pendingConnections} pending connection request${pendingConnections > 1 ? "s" : ""} waiting for your response.`,
      action_label: "Review requests",
      action_path: "/connections",
    });
  }

  if (
    profileViews.unique_investors >= 3 &&
    pitchDeckViews.total_views < profileViews.total_views / 2
  ) {
    insights.push({
      severity: "warning",
      message:
        "Investors are viewing your profile but not your pitch deck. Consider improving your deck CTA on your profile.",
      action_label: "View profile",
      action_path: "/profile",
    });
  }

  if (dataRoomDocuments === 0) {
    insights.push({
      severity: "info",
      message: "Your data room has no documents. Upload financials to speed up investor diligence.",
      action_label: "Manage data room",
      action_path: "/data-room",
    });
  }

  if (!hasPitchDeck) {
    insights.push({
      severity: "warning",
      message: "You have not uploaded a pitch deck. Most investors expect one before connecting.",
      action_label: "Upload pitch deck",
      action_path: "/profile/edit",
    });
  }

  return insights.slice(0, 6);
};

export async function getStartupAnalyticsDashboard(userId, periodKey = "30d") {
  const profile = await getStartupProfileByUserId(userId);
  if (!profile) {
    const error = new Error("Startup profile not found");
    error.statusCode = 404;
    throw error;
  }

  const startupProfileId = profile.startup_profile_id;
  const bounds = periodBounds(periodKey);
  const { config, since, until, previousSince, previousUntil } = bounds;

  const sinceIso = since ? since.toISOString() : null;
  const untilIso = until.toISOString();
  const prevSinceIso = previousSince ? previousSince.toISOString() : null;
  const prevUntilIso = previousUntil ? previousUntil.toISOString() : null;

  await ensureAnalyticsTables();

  const [
    profileViews,
    prevProfileViews,
    pitchDeckViews,
    prevPitchDeckViews,
    connectionMetrics,
    prevConnectionMetrics,
    dataRoomRequests,
    prevDataRoomRequests,
    dataRoomGrants,
    profileTrendRows,
    pitchTrendRows,
    connectionTrendRows,
    connectionAcceptedTrendRows,
    dataRoomRequestTrendRows,
    dataRoomGrantTrendRows,
    viewToConnectionConversion,
    pitchDeckByInvestor,
    pitchDeckSessions,
    lastPitchDeckView,
    pendingConnections,
    dataRoomDocuments,
    platformAvgCompletion,
  ] = await Promise.all([
    countProfileViews(startupProfileId, { since: sinceIso, until: untilIso }),
    prevSinceIso
      ? countProfileViews(startupProfileId, {
          since: prevSinceIso,
          until: prevUntilIso,
        })
      : Promise.resolve({ total_views: 0, unique_investors: 0 }),
    countPitchDeckViews(startupProfileId, { since: sinceIso, until: untilIso }),
    prevSinceIso
      ? countPitchDeckViews(startupProfileId, {
          since: prevSinceIso,
          until: prevUntilIso,
        })
      : Promise.resolve({ total_views: 0, unique_investors: 0, avg_duration_ms: null }),
    countConnectionMetrics(userId, { since: sinceIso, until: untilIso }),
    prevSinceIso
      ? countConnectionMetrics(userId, {
          since: prevSinceIso,
          until: prevUntilIso,
        })
      : Promise.resolve({
          received: 0,
          accepted: 0,
          active_connected: 0,
          newly_accepted: 0,
        }),
    countDataRoomAccessRequests(startupProfileId, {
      since: sinceIso,
      until: untilIso,
    }),
    prevSinceIso
      ? countDataRoomAccessRequests(startupProfileId, {
          since: prevSinceIso,
          until: prevUntilIso,
        })
      : Promise.resolve({ total_requests: 0, granted_count: 0 }),
    countDataRoomGrants(startupProfileId, { since: sinceIso, until: untilIso }),
    profileViewTrendBuckets(startupProfileId, {
      since: sinceIso,
      bucket: config.bucket,
    }),
    pitchDeckViewTrendBuckets(startupProfileId, {
      since: sinceIso,
      bucket: config.bucket,
    }),
    connectionTrendBuckets(userId, {
      since: sinceIso,
      bucket: config.bucket,
      metric: "received",
    }),
    connectionTrendBuckets(userId, {
      since: sinceIso,
      bucket: config.bucket,
      metric: "accepted",
    }),
    dataRoomRequestTrendBuckets(startupProfileId, {
      since: sinceIso,
      bucket: config.bucket,
    }),
    dataRoomGrantTrendBuckets(startupProfileId, {
      since: sinceIso,
      bucket: config.bucket,
    }),
    pitchDeckViewsByConnectedInvestor(startupProfileId, userId, {
      since: sinceIso,
    }),
    listPitchDeckSessionsForStartup(startupProfileId, { since: sinceIso }),
    getLastPitchDeckViewDate(startupProfileId),
    countPendingConnectionRequests(userId),
    countDataRoomDocuments(startupProfileId),
    getPlatformAverageProfileCompletion(),
    countProfileViewToConnectionConversion(startupProfileId, userId, {
      since: sinceIso,
      until: untilIso,
    }),
  ]);

  const startupModel = new StartupProfile(profile);
  startupModel.parseJsonFields();
  const completionData = startupModel.calculateCompletion();
  const completionPct = completionData.completionPercentage;

  const acceptanceRate =
    connectionMetrics.received > 0
      ? Math.round((connectionMetrics.accepted / connectionMetrics.received) * 100)
      : null;

  const grantRate =
    dataRoomRequests.total_requests > 0
      ? Math.round(
          (dataRoomRequests.granted_count / dataRoomRequests.total_requests) * 100,
        )
      : null;

  const pitchDeckEngagement = aggregatePitchDeckEngagement(pitchDeckSessions);

  const insights = buildInsights({
    profile,
    completionPct,
    platformAvgCompletion,
    lastPitchDeckView: lastPitchDeckView,
    pendingConnections,
    profileViews,
    pitchDeckViews,
    dataRoomDocuments,
    hasPitchDeck: Boolean(profile.pitch_deck_url),
  });

  return {
    period: periodKey,
    profile_completion: {
      percentage: completionPct,
      platform_average: platformAvgCompletion,
      is_complete: completionData.isComplete,
      recommendations: buildCompletionRecommendations(
        completionData.incompleteSections,
      ).slice(0, 8),
    },
    metrics: {
      profile_views: {
        total: profileViews.total_views,
        unique_investors: profileViews.unique_investors,
        view_to_connection_rate: viewToConnectionConversion.conversion_rate,
        viewers_who_requested: viewToConnectionConversion.viewers_who_requested,
        change_pct: prevSinceIso
          ? calcChangePct(profileViews.total_views, prevProfileViews.total_views)
          : null,
      },
      pitch_deck_views: {
        total: pitchDeckViews.total_views,
        unique_investors: pitchDeckViews.unique_investors || 0,
        avg_session_seconds: pitchDeckViews.avg_duration_ms
          ? Math.round(pitchDeckViews.avg_duration_ms / 1000)
          : null,
        change_pct: prevSinceIso
          ? calcChangePct(pitchDeckViews.total_views, prevPitchDeckViews.total_views)
          : null,
      },
      connection_requests: {
        received: connectionMetrics.received,
        accepted: connectionMetrics.accepted,
        acceptance_rate: acceptanceRate,
        change_pct: prevSinceIso
          ? calcChangePct(connectionMetrics.received, prevConnectionMetrics.received)
          : null,
      },
      active_connected_investors: {
        total: connectionMetrics.active_connected,
        newly_connected_in_period: connectionMetrics.newly_accepted,
        change_pct: prevSinceIso
          ? calcChangePct(
              connectionMetrics.newly_accepted,
              prevConnectionMetrics.newly_accepted,
            )
          : null,
      },
      data_room_access: {
        requests: dataRoomRequests.total_requests,
        granted: dataRoomRequests.granted_count,
        grant_rate: grantRate,
        grants_issued: dataRoomGrants.grant_count,
        change_pct: prevSinceIso
          ? calcChangePct(
              dataRoomRequests.total_requests,
              prevDataRoomRequests.total_requests,
            )
          : null,
      },
    },
    trends: {
      profile_views: buildTrendSeries(profileTrendRows, config),
      pitch_deck_views: buildTrendSeries(pitchTrendRows, config),
      connection_requests: buildTrendSeries(connectionTrendRows, config),
      connection_requests_accepted: buildTrendSeries(
        connectionAcceptedTrendRows,
        config,
      ),
      data_room_requests: buildTrendSeries(dataRoomRequestTrendRows, config),
      data_room_grants: buildTrendSeries(dataRoomGrantTrendRows, config),
    },
    pitch_deck_by_investor: pitchDeckByInvestor.map((row) => {
      const investorEngagement = pitchDeckEngagement.by_investor.find(
        (entry) => String(entry.investor_user_id) === String(row.investor_user_id),
      );

      return {
        investor_user_id: row.investor_user_id,
        investor_name: row.investor_name,
        investor_profile_id: row.investor_profile_id,
        view_count: row.view_count,
        revisit_count: row.revisit_count ?? Math.max(row.view_count - 1, 0),
        completed_sessions: row.completed_sessions ?? 0,
        completion_rate:
          row.view_count > 0
            ? Math.round(
                ((row.completed_sessions ?? 0) / row.view_count) * 100,
              )
            : null,
        last_viewed_at: row.last_viewed_at,
        total_duration_ms: row.total_duration_ms,
        top_slides: investorEngagement?.top_slides || [],
      };
    }),
    pitch_deck_engagement: pitchDeckEngagement,
    insights,
  };
}
