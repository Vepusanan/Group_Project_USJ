import test from "node:test";
import assert from "node:assert/strict";
import {
  uid,
  startServer,
  jsonRequest,
  createUser,
  createStartupProfile,
  createInvestorProfile,
  authCookies,
} from "./helpers/securityTestHarness.js";

const STARTUP_GATED = [
  ["GET", "/api/messages/conversations"],
  ["GET", "/api/connections"],
  ["GET", "/api/notifications"],
  ["GET", "/api/data-rooms/me"],
  ["GET", "/api/startup-analytics/me"],
  ["GET", "/api/funding-rounds/me"],
  ["GET", "/api/settings/privacy"],
];

const INVESTOR_GATED = [
  ["GET", "/api/watchlist"],
  ["GET", "/api/deal-pipeline"],
  ["GET", "/api/investor-intents"],
  ["GET", "/api/comparisons/snapshots"],
  ["GET", "/api/startups"],
];

test("incomplete startup is blocked from gated features with onboarding_required", async () => {
  const startupUser = await createUser({
    email: `${uid("startup")}@test.com`,
    userType: "startup",
    fullName: "Incomplete Startup",
  });
  await createStartupProfile(startupUser.id);

  const srv = await startServer();
  try {
    for (const [method, path] of STARTUP_GATED) {
      const out = await jsonRequest(srv.baseUrl, method, path, {
        cookies: authCookies(startupUser),
      });
      assert.equal(out.res.status, 403, `${method} ${path}`);
      assert.equal(out.data?.error, "onboarding_required");
    }

    const completion = await jsonRequest(
      srv.baseUrl,
      "GET",
      "/api/startups/profile/completion",
      { cookies: authCookies(startupUser) },
    );
    assert.equal(completion.res.status, 200);
    assert.equal(completion.data?.data?.isComplete, false);
  } finally {
    await srv.close();
  }
});

test("complete startup can access gated features", async () => {
  const startupUser = await createUser({
    email: `${uid("startup")}@test.com`,
    userType: "startup",
    fullName: "Complete Startup",
  });
  await createStartupProfile(startupUser.id, { complete: true });

  const srv = await startServer();
  try {
    const messages = await jsonRequest(srv.baseUrl, "GET", "/api/messages/conversations", {
      cookies: authCookies(startupUser),
    });
    assert.notEqual(messages.res.status, 403);
    assert.notEqual(messages.data?.error, "onboarding_required");

    const connections = await jsonRequest(srv.baseUrl, "GET", "/api/connections", {
      cookies: authCookies(startupUser),
    });
    assert.notEqual(connections.res.status, 403);
    assert.notEqual(connections.data?.error, "onboarding_required");
  } finally {
    await srv.close();
  }
});

test("incomplete investor is blocked from gated features with onboarding_required", async () => {
  const investorUser = await createUser({
    email: `${uid("investor")}@test.com`,
    userType: "investor",
    fullName: "Incomplete Investor",
  });
  await createInvestorProfile(investorUser.id);

  const srv = await startServer();
  try {
    for (const [method, path] of INVESTOR_GATED) {
      const out = await jsonRequest(srv.baseUrl, method, path, {
        cookies: authCookies(investorUser),
      });
      assert.equal(out.res.status, 403, `${method} ${path}`);
      assert.equal(out.data?.error, "onboarding_required");
    }

    const completion = await jsonRequest(
      srv.baseUrl,
      "GET",
      "/api/investors/profile/completion",
      { cookies: authCookies(investorUser) },
    );
    assert.equal(completion.res.status, 200);
    assert.equal(completion.data?.data?.isComplete, false);
  } finally {
    await srv.close();
  }
});

test("complete investor can access gated features", async () => {
  const investorUser = await createUser({
    email: `${uid("investor")}@test.com`,
    userType: "investor",
    fullName: "Complete Investor",
  });
  await createInvestorProfile(investorUser.id, { complete: true });

  const srv = await startServer();
  try {
    const watchlist = await jsonRequest(srv.baseUrl, "GET", "/api/watchlist", {
      cookies: authCookies(investorUser),
    });
    assert.equal(watchlist.res.status, 200);

    const discovery = await jsonRequest(srv.baseUrl, "GET", "/api/startups", {
      cookies: authCookies(investorUser),
    });
    assert.equal(discovery.res.status, 200);
  } finally {
    await srv.close();
  }
});

test("anonymous startup discovery remains public", async () => {
  const srv = await startServer();
  try {
    const out = await jsonRequest(srv.baseUrl, "GET", "/api/startups");
    assert.equal(out.res.status, 200);
  } finally {
    await srv.close();
  }
});
