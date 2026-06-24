import test from "node:test";
import assert from "node:assert/strict";
import pool from "../config/database.js";
import {
  uid,
  startServer,
  jsonRequest,
  createUser,
  createStartupProfile,
  createInvestorProfile,
  setProfileVisibility,
  ensureAcceptedConnection,
  authCookies,
} from "./helpers/securityTestHarness.js";

test("pitch deck IDOR: investor cannot stream private startup deck without profile access", async () => {
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be set");

  const startupUser = await createUser({
    email: `${uid("startup")}@test.com`,
    userType: "startup",
    fullName: "Pitch Deck Owner",
  });
  const strangerInvestor = await createUser({
    email: `${uid("investor")}@test.com`,
    userType: "investor",
    fullName: "Stranger Investor",
  });

  const profile = await createStartupProfile(startupUser.id, {
    pitchDeckUrl: "https://example.com/deck.pdf",
  });
  await setProfileVisibility(startupUser.id, "connections_only");
  await createInvestorProfile(strangerInvestor.id, { complete: true });

  const srv = await startServer();
  try {
    const blocked = await jsonRequest(
      srv.baseUrl,
      "GET",
      `/api/pitch-decks/${profile.startup_profile_id}/meta`,
      { cookies: authCookies(strangerInvestor) },
    );
    assert.equal(blocked.res.status, 403);

    const blockedFile = await jsonRequest(
      srv.baseUrl,
      "GET",
      `/api/pitch-decks/${profile.startup_profile_id}/file`,
      { cookies: authCookies(strangerInvestor) },
    );
    assert.equal(blockedFile.res.status, 403);
  } finally {
    await srv.close();
  }
});

test("pitch deck access: connected investor can view connections_only startup deck", async () => {
  const startupUser = await createUser({
    email: `${uid("startup")}@test.com`,
    userType: "startup",
    fullName: "Pitch Deck Owner Connected",
  });
  const investorUser = await createUser({
    email: `${uid("investor")}@test.com`,
    userType: "investor",
    fullName: "Connected Investor",
  });

  const profile = await createStartupProfile(startupUser.id, {
    pitchDeckUrl: "https://example.com/deck.pdf",
  });
  await setProfileVisibility(startupUser.id, "connections_only");
  await createInvestorProfile(investorUser.id, { complete: true });
  await ensureAcceptedConnection(investorUser.id, startupUser.id);

  const srv = await startServer();
  try {
    const allowed = await jsonRequest(
      srv.baseUrl,
      "GET",
      `/api/pitch-decks/${profile.startup_profile_id}/meta`,
      { cookies: authCookies(investorUser) },
    );
    assert.equal(allowed.res.status, 200);
    assert.ok(allowed.data?.data?.has_deck || allowed.data?.data);
  } finally {
    await srv.close();
  }
});

test("funding round IDOR: investor cannot read private startup funding round", async () => {
  const startupUser = await createUser({
    email: `${uid("startup")}@test.com`,
    userType: "startup",
    fullName: "Funding Round Owner",
  });
  const strangerInvestor = await createUser({
    email: `${uid("investor")}@test.com`,
    userType: "investor",
    fullName: "Funding Stranger",
  });

  const profile = await createStartupProfile(startupUser.id);
  await setProfileVisibility(startupUser.id, "connections_only");
  await createInvestorProfile(strangerInvestor.id, { complete: true });

  await pool.query(
    `
      INSERT INTO public.funding_rounds (
        startup_profile_id, funding_stage, target_amount, committed_amount,
        currency, opening_date, target_closing_date, status
      )
      VALUES ($1, 'SEED', 500000, 100000, 'USD', CURRENT_DATE, CURRENT_DATE + 90, 'active')
    `,
    [profile.startup_profile_id],
  );

  const srv = await startServer();
  try {
    const blocked = await jsonRequest(
      srv.baseUrl,
      "GET",
      `/api/funding-rounds/startup/${profile.startup_profile_id}`,
      { cookies: authCookies(strangerInvestor) },
    );
    assert.equal(blocked.res.status, 403);
  } finally {
    await srv.close();
  }
});

test("data room meta IDOR: non-connected user cannot probe private startup data room", async () => {
  const startupUser = await createUser({
    email: `${uid("startup")}@test.com`,
    userType: "startup",
    fullName: "Data Room Owner",
  });
  const strangerInvestor = await createUser({
    email: `${uid("investor")}@test.com`,
    userType: "investor",
    fullName: "Data Room Stranger",
  });

  const profile = await createStartupProfile(startupUser.id);
  await setProfileVisibility(startupUser.id, "connections_only");
  await createInvestorProfile(strangerInvestor.id, { complete: true });

  const srv = await startServer();
  try {
    const blocked = await jsonRequest(
      srv.baseUrl,
      "GET",
      `/api/data-rooms/startup/${profile.startup_profile_id}/meta`,
      { cookies: authCookies(strangerInvestor) },
    );
    assert.equal(blocked.res.status, 403);
  } finally {
    await srv.close();
  }
});

test("deal pipeline IDOR: investor cannot move another investor pipeline card", async () => {
  const startupUser = await createUser({
    email: `${uid("startup")}@test.com`,
    userType: "startup",
    fullName: "Pipeline Startup",
  });
  const investorA = await createUser({
    email: `${uid("investorA")}@test.com`,
    userType: "investor",
    fullName: "Investor A",
  });
  const investorB = await createUser({
    email: `${uid("investorB")}@test.com`,
    userType: "investor",
    fullName: "Investor B",
  });

  await createStartupProfile(startupUser.id);
  await createInvestorProfile(investorA.id, { complete: true });
  await createInvestorProfile(investorB.id, { complete: true });
  const connectionId = await ensureAcceptedConnection(investorA.id, startupUser.id);

  const cardResult = await pool.query(
    `
      INSERT INTO public.deal_pipeline_cards (
        investor_user_id, connection_id, startup_profile_id, stage
      )
      VALUES ($1, $2, (SELECT startup_profile_id FROM public.startup_profiles WHERE user_id = $3 LIMIT 1), 'CONNECTED')
      RETURNING id
    `,
    [investorA.id, connectionId, startupUser.id],
  );
  const cardId = cardResult.rows[0].id;

  const srv = await startServer();
  try {
    const blocked = await jsonRequest(
      srv.baseUrl,
      "PATCH",
      `/api/deal-pipeline/cards/${cardId}/stage`,
      {
        cookies: authCookies(investorB),
        body: { stage: "REVIEWING" },
      },
    );
    assert.equal(blocked.res.status, 404);
  } finally {
    await srv.close();
  }
});
