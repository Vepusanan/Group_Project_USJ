import test from "node:test";
import assert from "node:assert/strict";
import {
  startServer,
  jsonRequest,
  createUser,
  createStartupProfile,
  createInvestorProfile,
  authCookies,
  uid,
} from "./helpers/securityTestHarness.js";

const PLACEHOLDER_UUID = "00000000-0000-4000-8000-000000000001";

/**
 * Protected routes that must return 401 without authentication.
 * Public routes (register, login, health, optional-auth search) are excluded.
 * Onboarding-gated routes return 403 onboarding_required for incomplete profiles (see onboarding.security.test.js).
 */
const PROTECTED_ROUTES = [
  ["GET", "/api/auth/me"],
  ["POST", "/api/auth/logout"],
  ["POST", "/api/auth/logout-all"],
  ["GET", "/api/auth/sessions"],
  ["DELETE", `/api/auth/sessions/${PLACEHOLDER_UUID}`],
  ["PUT", "/api/account/email"],
  ["PUT", "/api/account/password"],
  ["DELETE", "/api/account"],
  ["GET", "/api/account/export"],
  ["GET", "/api/settings/privacy"],
  ["PUT", "/api/settings/privacy"],
  ["GET", "/api/settings/notifications"],
  ["PUT", "/api/settings/notifications"],
  ["POST", "/api/startups/profile"],
  ["GET", "/api/startups/profile/me"],
  ["GET", "/api/startups/profile/completion"],
  ["GET", `/api/startups/profile/${PLACEHOLDER_UUID}`],
  ["PUT", `/api/startups/profile/${PLACEHOLDER_UUID}`],
  ["GET", `/api/startups/profile/${PLACEHOLDER_UUID}/match-explanation`],
  ["POST", "/api/investors/profile"],
  ["GET", "/api/investors/profile/me"],
  ["GET", "/api/investors/profile/completion"],
  ["GET", `/api/investors/profile/${PLACEHOLDER_UUID}`],
  ["PUT", `/api/investors/profile/${PLACEHOLDER_UUID}`],
  ["POST", "/api/uploads/message"],
  ["GET", "/api/messages/conversations"],
  ["GET", `/api/messages/conversation/${PLACEHOLDER_UUID}`],
  ["POST", "/api/messages"],
  ["POST", "/api/messages/attachments"],
  ["POST", "/api/startups/natural-language"],
  ["GET", "/api/connections"],
  ["POST", "/api/connections"],
  ["GET", "/api/connections/pending"],
  ["GET", "/api/connections/pending/sent"],
  ["GET", "/api/connections/pending/received"],
  ["GET", `/api/connections/${PLACEHOLDER_UUID}/notes`],
  ["POST", `/api/connections/${PLACEHOLDER_UUID}/notes`],
  ["PATCH", `/api/connections/${PLACEHOLDER_UUID}`],
  ["DELETE", `/api/connections/${PLACEHOLDER_UUID}`],
  ["GET", "/api/notifications"],
  ["POST", "/api/notifications/read"],
  ["GET", `/api/pitch-decks/${PLACEHOLDER_UUID}/meta`],
  ["GET", `/api/pitch-decks/${PLACEHOLDER_UUID}/file`],
  ["POST", `/api/pitch-decks/${PLACEHOLDER_UUID}/analyze`],
  ["POST", `/api/pitch-decks/${PLACEHOLDER_UUID}/sessions`],
  ["PATCH", `/api/pitch-decks/sessions/${PLACEHOLDER_UUID}`],
  ["POST", `/api/pitch-decks/sessions/${PLACEHOLDER_UUID}/complete`],
  ["GET", "/api/data-rooms/me"],
  ["GET", "/api/data-rooms/audit-log"],
  ["GET", "/api/data-rooms/connected-investors"],
  ["GET", `/api/data-rooms/startup/${PLACEHOLDER_UUID}/meta`],
  ["POST", `/api/data-rooms/startup/${PLACEHOLDER_UUID}/request-access`],
  ["GET", `/api/data-rooms/startup/${PLACEHOLDER_UUID}`],
  ["GET", `/api/data-rooms/startup/${PLACEHOLDER_UUID}/audit-log`],
  ["POST", "/api/data-rooms/folders"],
  ["PATCH", `/api/data-rooms/folders/${PLACEHOLDER_UUID}`],
  ["DELETE", `/api/data-rooms/folders/${PLACEHOLDER_UUID}`],
  ["POST", "/api/data-rooms/documents"],
  ["PATCH", `/api/data-rooms/documents/${PLACEHOLDER_UUID}`],
  ["DELETE", `/api/data-rooms/documents/${PLACEHOLDER_UUID}`],
  ["GET", `/api/data-rooms/documents/${PLACEHOLDER_UUID}/file`],
  ["POST", `/api/data-rooms/documents/${PLACEHOLDER_UUID}/analyze`],
  ["POST", "/api/data-rooms/access"],
  ["DELETE", `/api/data-rooms/access/${PLACEHOLDER_UUID}`],
  ["GET", "/api/funding-rounds/me"],
  ["GET", `/api/funding-rounds/startup/${PLACEHOLDER_UUID}`],
  ["POST", "/api/funding-rounds"],
  ["PUT", `/api/funding-rounds/${PLACEHOLDER_UUID}`],
  ["POST", `/api/funding-rounds/${PLACEHOLDER_UUID}/close`],
  ["GET", "/api/deal-pipeline"],
  ["PATCH", `/api/deal-pipeline/cards/${PLACEHOLDER_UUID}/stage`],
  ["PATCH", `/api/deal-pipeline/cards/${PLACEHOLDER_UUID}/notes`],
  ["GET", "/api/investor-intents"],
  ["PUT", `/api/investor-intents/connection/${PLACEHOLDER_UUID}`],
  ["PUT", `/api/investor-intents/startup/${PLACEHOLDER_UUID}`],
  ["POST", `/api/investor-intents/pass/${PLACEHOLDER_UUID}`],
  ["DELETE", `/api/investor-intents/pass/${PLACEHOLDER_UUID}`],
  ["GET", "/api/startup-analytics/me"],
  ["GET", "/api/verification/me"],
  ["POST", "/api/verification/identity"],
  ["POST", "/api/verification/business"],
  ["GET", "/api/admin/analytics"],
  ["GET", "/api/admin/verification-requests"],
  ["POST", `/api/admin/verification-requests/${PLACEHOLDER_UUID}/approve`],
  ["POST", `/api/admin/verification-requests/${PLACEHOLDER_UUID}/reject`],
  ["GET", "/api/watchlist"],
  ["POST", "/api/watchlist"],
  ["DELETE", `/api/watchlist/${PLACEHOLDER_UUID}`],
  ["GET", `/api/milestones/startup/${PLACEHOLDER_UUID}`],
  ["POST", "/api/milestones"],
  ["PATCH", `/api/milestones/${PLACEHOLDER_UUID}`],
  ["DELETE", `/api/milestones/${PLACEHOLDER_UUID}`],
  ["GET", `/api/meetings/connection/${PLACEHOLDER_UUID}`],
  ["POST", `/api/meetings/connection/${PLACEHOLDER_UUID}`],
  ["PATCH", `/api/meetings/${PLACEHOLDER_UUID}/respond`],
  ["POST", `/api/meetings/${PLACEHOLDER_UUID}/brief`],
  ["GET", `/api/meetings/${PLACEHOLDER_UUID}/calendar.ics`],
  ["POST", `/api/meetings/${PLACEHOLDER_UUID}/notes`],
  ["GET", `/api/dd-checklists/connection/${PLACEHOLDER_UUID}`],
  ["POST", `/api/dd-checklists/connection/${PLACEHOLDER_UUID}/items`],
  ["POST", `/api/dd-checklists/connection/${PLACEHOLDER_UUID}/share`],
  ["PATCH", `/api/dd-checklists/items/${PLACEHOLDER_UUID}`],
  ["GET", `/api/dd-checklists/items/${PLACEHOLDER_UUID}/file`],
  ["DELETE", `/api/dd-checklists/items/${PLACEHOLDER_UUID}`],
  ["POST", `/api/dd-checklists/items/${PLACEHOLDER_UUID}/link-data-room`],
  ["POST", `/api/dd-checklists/items/${PLACEHOLDER_UUID}/response`],
  ["POST", "/api/comparisons/compare"],
  ["GET", "/api/comparisons/snapshots"],
  ["POST", "/api/comparisons/snapshots"],
  ["DELETE", `/api/comparisons/snapshots/${PLACEHOLDER_UUID}`],
  ["GET", `/api/connection-qa/connection/${PLACEHOLDER_UUID}`],
  ["POST", `/api/connection-qa/connection/${PLACEHOLDER_UUID}`],
  ["POST", `/api/connection-qa/${PLACEHOLDER_UUID}/answer`],
  ["POST", `/api/profile-reports/${PLACEHOLDER_UUID}`],
  ["GET", "/api/realtime/token"],
  ["POST", "/api/realtime/presence"],
];

const INVESTOR_ONLY_ROUTES = [
  ["GET", "/api/watchlist"],
  ["POST", "/api/watchlist", {}],
  ["POST", "/api/comparisons/compare", { startup_profile_ids: [] }],
  ["GET", "/api/deal-pipeline"],
  ["GET", "/api/investor-intents"],
  ["GET", "/api/comparisons/snapshots"],
];

const STARTUP_ONLY_ROUTES = [
  ["GET", "/api/startup-analytics/me"],
  ["GET", "/api/funding-rounds/me"],
  ["POST", "/api/funding-rounds", {}],
  ["GET", "/api/data-rooms/me"],
  ["POST", "/api/milestones", {}],
];

test("route coverage: all protected endpoints return 401 without auth", async () => {
  const srv = await startServer();
  try {
    const failures = [];
    for (const [method, path] of PROTECTED_ROUTES) {
      const out = await jsonRequest(srv.baseUrl, method, path, {
        body: method === "GET" || method === "DELETE" ? undefined : {},
      });
      if (out.res.status !== 401) {
        failures.push(`${method} ${path} => ${out.res.status}`);
      }
    }
    assert.equal(
      failures.length,
      0,
      `Expected 401 for all protected routes:\n${failures.join("\n")}`,
    );
  } finally {
    await srv.close();
  }
});

test("route coverage: startup blocked from investor-only routes (403)", async () => {
  const startupUser = await createUser({
    email: `${uid("startup")}@test.com`,
    userType: "startup",
    fullName: "RBAC Startup",
  });
  await createStartupProfile(startupUser.id, { complete: true });
  const cookies = authCookies(startupUser);

  const srv = await startServer();
  try {
    const failures = [];
    for (const [method, path, body] of INVESTOR_ONLY_ROUTES) {
      const out = await jsonRequest(srv.baseUrl, method, path, {
        cookies,
        body: method === "GET" ? undefined : body ?? {},
      });
      if (out.res.status !== 403) {
        failures.push(`${method} ${path} => ${out.res.status}`);
      }
    }
    assert.equal(failures.length, 0, failures.join("\n"));
  } finally {
    await srv.close();
  }
});

test("route coverage: investor blocked from startup-only routes (403)", async () => {
  const investorUser = await createUser({
    email: `${uid("investor")}@test.com`,
    userType: "investor",
    fullName: "RBAC Investor",
  });
  await createInvestorProfile(investorUser.id, { complete: true });
  const cookies = authCookies(investorUser);

  const srv = await startServer();
  try {
    const failures = [];
    for (const [method, path, body] of STARTUP_ONLY_ROUTES) {
      const out = await jsonRequest(srv.baseUrl, method, path, {
        cookies,
        body: method === "GET" ? undefined : body ?? {},
      });
      if (out.res.status !== 403) {
        failures.push(`${method} ${path} => ${out.res.status}`);
      }
    }
    assert.equal(failures.length, 0, failures.join("\n"));
  } finally {
    await srv.close();
  }
});

test("route coverage: public search endpoints allow anonymous access", async () => {
  const srv = await startServer();
  try {
    const startups = await jsonRequest(srv.baseUrl, "GET", "/api/startups");
    assert.ok(
      startups.res.status === 200 || startups.res.status === 400,
      `GET /api/startups should be public, got ${startups.res.status}`,
    );

    const investors = await jsonRequest(srv.baseUrl, "GET", "/api/investors");
    assert.equal(investors.res.status, 200);
  } finally {
    await srv.close();
  }
});
