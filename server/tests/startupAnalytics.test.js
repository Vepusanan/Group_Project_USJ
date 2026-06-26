import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";
import {
  uid,
  startServer,
  jsonRequest,
  createUser,
  createStartupProfile,
  markUserOnboardingComplete,
  authCookies,
} from "./helpers/securityTestHarness.js";

test("startup analytics returns 200 with zero metrics for onboarded startup", async () => {
  const startupUser = await createUser({
    email: `${uid("analytics")}@test.com`,
    userType: "startup",
    fullName: "Analytics Startup",
  });
  await createStartupProfile(startupUser.id);
  await markUserOnboardingComplete(startupUser.id);

  const srv = await startServer();
  try {
    const out = await jsonRequest(
      srv.baseUrl,
      "GET",
      "/api/startup-analytics/me?period=30d",
      { cookies: authCookies(startupUser) },
    );

    assert.equal(out.res.status, 200, JSON.stringify(out.data));
    assert.equal(out.data?.success, true);
    assert.equal(out.data?.data?.period, "30d");
    assert.equal(out.data?.data?.metrics?.profile_views?.total, 0);
    assert.equal(out.data?.data?.metrics?.pitch_deck_views?.total, 0);
    assert.equal(out.data?.data?.metrics?.connection_requests?.received, 0);
    assert.ok(Array.isArray(out.data?.data?.trends?.profile_views));
  } finally {
    await srv.close();
  }
});

test("startup analytics rejects unauthenticated requests", async () => {
  const srv = await startServer();
  try {
    const out = await jsonRequest(
      srv.baseUrl,
      "GET",
      "/api/startup-analytics/me?period=30d",
    );
    assert.equal(out.res.status, 401);
  } finally {
    await srv.close();
  }
});
