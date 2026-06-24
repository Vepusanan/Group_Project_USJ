/**
 * Staged API QA for Data Room and Due Diligence workflows.
 * Run with server available: node e2e/qa-workflows.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const API_BASE = process.env.E2E_API_URL || "http://localhost:5001/api";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_PATH = path.join(__dirname, ".fixtures.json");

const MINIMAL_PDF = Buffer.from(
  `%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 200 200]/Parent 2 0 R>>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000052 00000 n 
0000000101 00000 n 
trailer<</Size 4/Root 1 0 R>>
startxref
178
%%EOF`,
);

class ApiClient {
  constructor() {
    this.cookies = [];
  }

  storeCookies(response) {
    const raw = response.headers.getSetCookie?.() || [];
    for (const entry of raw) {
      const pair = entry.split(";")[0];
      const name = pair.split("=")[0];
      this.cookies = this.cookies.filter((c) => !c.startsWith(`${name}=`));
      this.cookies.push(pair);
    }
  }

  async request(method, route, { body, json = true, headers: extraHeaders = {} } = {}) {
    const headers = { ...extraHeaders };
    if (this.cookies.length) {
      headers.Cookie = this.cookies.join("; ");
    }
    if (json && body !== undefined && !(body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE}${route}`, {
      method,
      headers,
      body:
        body === undefined
          ? undefined
          : json && !(body instanceof FormData)
            ? JSON.stringify(body)
            : body,
    });

    this.storeCookies(response);

    let data = null;
    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    return { status: response.status, data, ok: response.ok };
  }

  async login(email, password) {
    const result = await this.request("POST", "/auth/login", {
      body: { email, password, rememberMe: true },
    });
    if (!result.ok) {
      throw new Error(`Login failed for ${email}: ${JSON.stringify(result.data)}`);
    }
    return result;
  }

  async uploadDataRoomDocument(folderId, fileName = "e2e-financials.pdf") {
    const form = new FormData();
    form.append("file", new Blob([MINIMAL_PDF], { type: "application/pdf" }), fileName);
    if (folderId) form.append("folder_id", folderId);
    return this.request("POST", "/data-rooms/documents", { body: form, json: false });
  }
}

function assertStep(name, condition, detail = "") {
  if (!condition) {
    throw new Error(`QA FAIL — ${name}${detail ? `: ${detail}` : ""}`);
  }
  console.log(`  ✓ ${name}`);
}

async function runDataRoomQa(startupClient, investorClient, fixtures) {
  console.log("\n📁 Data Room workflow");

  const meRoom = await startupClient.request("GET", "/data-rooms/me");
  assertStep("Startup can load own data room", meRoom.ok, JSON.stringify(meRoom.data));

  const folderName = `E2E Folder ${Date.now()}`;
  const createFolder = await startupClient.request("POST", "/data-rooms/folders", {
    body: { name: folderName },
  });
  assertStep("Startup can create folder", createFolder.ok, JSON.stringify(createFolder.data));

  const folderId = createFolder.data?.data?.id || createFolder.data?.data?.folder_id;
  assertStep("Folder id returned", Boolean(folderId));

  const uploadDoc = await startupClient.uploadDataRoomDocument(folderId);
  assertStep("Startup can upload data room document", uploadDoc.ok, JSON.stringify(uploadDoc.data));
  const documentId = uploadDoc.data?.data?.id || uploadDoc.data?.data?.document_id;
  assertStep("Document id returned", Boolean(documentId));

  const connectedInvestors = await startupClient.request(
    "GET",
    "/data-rooms/connected-investors",
  );
  assertStep(
    "Startup can list connected investors for grants",
    connectedInvestors.ok,
    JSON.stringify(connectedInvestors.data),
  );

  const investorUserId = fixtures.users.investor.id;
  const grant = await startupClient.request("POST", "/data-rooms/access", {
    body: { investor_user_id: investorUserId },
  });
  assertStep("Startup can grant data room access", grant.ok, JSON.stringify(grant.data));

  const startupProfileId = fixtures.users.startup.profileId;
  const investorView = await investorClient.request(
    "GET",
    `/data-rooms/startup/${startupProfileId}`,
  );
  assertStep(
    "Investor can view granted data room",
    investorView.ok,
    JSON.stringify(investorView.data),
  );

  const meta = await investorClient.request(
    "GET",
    `/data-rooms/startup/${startupProfileId}/meta`,
  );
  assertStep("Investor can read data room meta", meta.ok);

  const audit = await startupClient.request("GET", "/data-rooms/audit-log?limit=5");
  assertStep("Startup can read audit log", audit.ok);

  return { folderId, startupProfileId, documentId };
}

async function runDdQa(startupClient, investorClient, connectionId, documentId) {
  console.log("\n📋 Due Diligence workflow");

  const checklist = await investorClient.request(
    "GET",
    `/dd-checklists/connection/${connectionId}`,
  );
  assertStep("Investor can load connection checklist", checklist.ok, JSON.stringify(checklist.data));

  const addItem = await investorClient.request(
    "POST",
    `/dd-checklists/connection/${connectionId}/items`,
    {
      body: {
        description: "Provide latest financial overview for E2E QA",
      },
    },
  );
  assertStep("Investor can add checklist item", addItem.ok, JSON.stringify(addItem.data));

  const itemId = addItem.data?.data?.id || addItem.data?.data?.item_id;
  assertStep("Checklist item id returned", Boolean(itemId));

  const share = await investorClient.request(
    "POST",
    `/dd-checklists/connection/${connectionId}/share`,
    { body: {} },
  );
  assertStep("Investor can share checklist with startup", share.ok, JSON.stringify(share.data));

  const link = await startupClient.request(
    "POST",
    `/dd-checklists/items/${itemId}/link-data-room`,
    {
      body: {
        response_type: "data_room_document",
        data_room_document_id: documentId,
      },
    },
  );
  assertStep("Startup can link data room document to checklist item", link.ok, JSON.stringify(link.data));

  const refreshed = await investorClient.request(
    "GET",
    `/dd-checklists/connection/${connectionId}`,
  );
  assertStep("Investor sees updated checklist", refreshed.ok);

  const items = refreshed.data?.data?.items || refreshed.data?.items || [];
  const updated = items.find((item) => String(item.id) === String(itemId));
  assertStep(
    "Checklist item moves to IN_REVIEW with linked document",
    updated &&
      String(updated.status).toUpperCase() === "IN_REVIEW" &&
      updated.has_response_document,
    JSON.stringify(updated),
  );

  const complete = await investorClient.request("PATCH", `/dd-checklists/items/${itemId}`, {
    body: { status: "COMPLETED" },
  });
  assertStep("Investor can mark checklist item completed", complete.ok, JSON.stringify(complete.data));

  const finalCheck = await investorClient.request(
    "GET",
    `/dd-checklists/connection/${connectionId}`,
  );
  const finalItems = finalCheck.data?.data?.items || finalCheck.data?.items || [];
  const completed = finalItems.find((item) => String(item.id) === String(itemId));
  assertStep(
    "Checklist item reaches COMPLETED status",
    completed && String(completed.status).toUpperCase() === "COMPLETED",
    JSON.stringify(completed),
  );
}

async function runWatchlistQa(investorClient, fixtures) {
  console.log("\n⭐ Watchlist workflow");
  const startupProfileId = fixtures.users.startup.profileId;

  const listInitial = await investorClient.request("GET", "/watchlist");
  assertStep("Investor can list watchlist", listInitial.ok, JSON.stringify(listInitial.data));

  const add = await investorClient.request("POST", "/watchlist", {
    body: { startup_profile_id: startupProfileId },
  });
  assertStep("Investor can add watchlist item", add.ok, JSON.stringify(add.data));

  const listAfter = await investorClient.request("GET", "/watchlist");
  assertStep("Watchlist reflects added startup", listAfter.ok);

  const items = listAfter.data?.data || listAfter.data?.watchlist || listAfter.data?.items || [];
  assertStep(
    "Watchlist contains startup profile id",
    Array.isArray(items) && items.some((row) => String(row.startup_profile_id || row.startupProfileId) === String(startupProfileId)),
    JSON.stringify(items.slice(0, 3)),
  );

  const remove = await investorClient.request("DELETE", `/watchlist/${startupProfileId}`);
  assertStep("Investor can remove watchlist item", remove.ok, JSON.stringify(remove.data));
}

async function runComparisonQa(investorClient, fixtures) {
  console.log("\n📊 Startup comparison workflow");
  const startupProfileId = fixtures.users.startup.profileId;

  const compare = await investorClient.request("POST", "/comparisons/compare", {
    body: { startup_profile_ids: [startupProfileId] },
  });
  assertStep("Investor can request comparison", compare.ok, JSON.stringify(compare.data));

  const save = await investorClient.request("POST", "/comparisons/snapshots", {
    body: { name: `E2E Snapshot ${Date.now()}`, startup_profile_ids: [startupProfileId] },
  });
  assertStep("Investor can save comparison snapshot", save.ok, JSON.stringify(save.data));

  const list = await investorClient.request("GET", "/comparisons/snapshots");
  assertStep("Investor can list comparison snapshots", list.ok, JSON.stringify(list.data));
}

async function runPitchDeckQa(investorClient, fixtures) {
  console.log("\n📄 Pitch deck viewing workflow");
  const startupProfileId = fixtures.users.startup.profileId;

  const meta = await investorClient.request("GET", `/pitch-decks/${startupProfileId}/meta`);
  assertStep("Investor can load pitch deck meta", meta.ok, JSON.stringify(meta.data));
  assertStep("Pitch deck meta indicates deck present", meta.data?.data?.has_pitch_deck === true);

  const startSession = await investorClient.request(
    "POST",
    `/pitch-decks/${startupProfileId}/sessions`,
    { body: {} },
  );
  assertStep("Investor can start pitch deck session", startSession.ok, JSON.stringify(startSession.data));
  const sessionId = startSession.data?.data?.session_id;
  assertStep("Session id returned", Boolean(sessionId));

  const updateSession = await investorClient.request("PATCH", `/pitch-decks/sessions/${sessionId}`, {
    body: {
      pages_viewed: [1],
      last_page: 1,
      time_per_page_ms: { 1: 1000 },
      total_duration_ms: 1000,
    },
  });
  assertStep("Investor can update pitch deck session", updateSession.ok, JSON.stringify(updateSession.data));

  const complete = await investorClient.request(
    "POST",
    `/pitch-decks/sessions/${sessionId}/complete`,
    { body: { pages_viewed: [1], total_pages: 1, last_page: 1 } },
  );
  assertStep("Investor can complete pitch deck session", complete.ok, JSON.stringify(complete.data));
  assertStep("Pitch deck session marked completed", complete.data?.data?.completed === true);
}

async function runInvestorIntentQa(investorClient, fixtures) {
  console.log("\n🧭 Investor intent tracking workflow");
  const startupProfileId = fixtures.users.startup.profileId;
  const connectionId = fixtures.connections.accepted;

  const setProfileIntent = await investorClient.request(
    "PUT",
    `/investor-intents/startup/${startupProfileId}`,
    { body: { intent: "INTERESTED" } },
  );
  assertStep("Investor can set profile intent", setProfileIntent.ok, JSON.stringify(setProfileIntent.data));

  const setConnectionIntent = await investorClient.request(
    "PUT",
    `/investor-intents/connection/${connectionId}`,
    { body: { intent: "INTERESTED" } },
  );
  assertStep("Investor can set connection intent", setConnectionIntent.ok, JSON.stringify(setConnectionIntent.data));

  const list = await investorClient.request("GET", "/investor-intents");
  assertStep("Investor can list intents", list.ok, JSON.stringify(list.data));
}

async function runDealPipelineQa(investorClient, fixtures) {
  console.log("\n🗂️ Deal pipeline workflow");
  const pipeline = await investorClient.request("GET", "/deal-pipeline");
  assertStep("Investor can load deal pipeline", pipeline.ok, JSON.stringify(pipeline.data));

  const cards = pipeline.data?.data?.cards || pipeline.data?.cards || [];
  assertStep("Pipeline returns cards array", Array.isArray(cards), JSON.stringify(pipeline.data));

  const firstCard = cards[0];
  if (!firstCard?.id) {
    console.log("  (no existing pipeline cards to move; skipping move step)");
    return;
  }

  const move = await investorClient.request("PATCH", `/deal-pipeline/cards/${firstCard.id}/stage`, {
    body: { stage: "REVIEWING" },
  });
  assertStep("Investor can move a pipeline card stage", move.ok, JSON.stringify(move.data));

  const notes = await investorClient.request("PATCH", `/deal-pipeline/cards/${firstCard.id}/notes`, {
    body: { notes: `E2E notes ${Date.now()}` },
  });
  assertStep("Investor can update pipeline card notes", notes.ok, JSON.stringify(notes.data));
}

async function runMeetingsQa(startupClient, investorClient, fixtures) {
  console.log("\n📅 Meetings workflow");
  const connectionId = fixtures.connections.accepted;
  const list = await investorClient.request("GET", `/meetings/connection/${connectionId}`);
  assertStep("Investor can list meetings for connection", list.ok, JSON.stringify(list.data));

  const create = await investorClient.request("POST", `/meetings/connection/${connectionId}`, {
    body: {
      proposed_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      format: "VIDEO_CALL",
      agenda: "E2E meeting request agenda",
      message: "Seeded from QA workflow",
    },
  });
  assertStep("Investor can create meeting request", create.ok, JSON.stringify(create.data));

  const meetingId = create.data?.data?.id || create.data?.data?.meeting_id;
  if (!meetingId) return;

  const accept = await startupClient.request("PATCH", `/meetings/${meetingId}/respond`, {
    body: { status: "accepted" },
  });
  assertStep("Startup can accept meeting request", accept.ok, JSON.stringify(accept.data));

  const ics = await investorClient.request(
    "GET",
    `/meetings/${meetingId}/calendar.ics`,
    { json: false, headers: { Accept: "text/calendar" } },
  );
  assertStep("Investor can download meeting calendar invite", ics.ok, `status ${ics.status}`);
}

async function runNotificationsQa(client) {
  console.log("\n🔔 Notifications workflow");
  const list = await client.request("GET", "/notifications");
  assertStep("User can list notifications", list.ok, JSON.stringify(list.data));
}

async function runRealtimeQa(client) {
  console.log("\n🟢 Realtime workflow");
  const token = await client.request("GET", "/realtime/token");
  const tokenNotConfigured =
    !token.ok &&
    typeof token.data?.error === "string" &&
    token.data.error.toLowerCase().includes("not configured");
  assertStep(
    "User can request realtime token",
    token.ok || tokenNotConfigured,
    JSON.stringify(token.data),
  );

  const presence = await client.request("POST", "/realtime/presence", {
    body: { status: "online" },
  });
  const presenceNotConfigured =
    !presence.ok &&
    typeof presence.data?.error === "string" &&
    presence.data.error.toLowerCase().includes("not configured");
  assertStep(
    "User can update presence",
    presence.ok || presenceNotConfigured,
    JSON.stringify(presence.data),
  );
}

async function runSessionRefreshQa(client) {
  console.log("\n♻️ Session refresh workflow");
  const refresh = await client.request("POST", "/auth/token", { body: {} });
  assertStep("Client can refresh session token", refresh.ok, JSON.stringify(refresh.data));
}

async function main() {
  if (!fs.existsSync(FIXTURES_PATH)) {
    console.error("Missing e2e/.fixtures.json — run: node server/scripts/seed-e2e-fixtures.js");
    process.exit(1);
  }

  const fixtures = JSON.parse(fs.readFileSync(FIXTURES_PATH, "utf8"));
  const startupClient = new ApiClient();
  const investorClient = new ApiClient();

  console.log("🔎 Running staged Data Room + DD QA against", API_BASE);

  const health = await fetch(`${API_BASE}/health`);
  assertStep("API health check", health.ok, `status ${health.status}`);

  await startupClient.login(fixtures.users.startup.email, fixtures.password);
  assertStep("Startup login", true);

  await investorClient.login(fixtures.users.investor.email, fixtures.password);
  assertStep("Investor login", true);

  const { documentId } = await runDataRoomQa(startupClient, investorClient, fixtures);

  const connectionId = fixtures.connections.accepted;
  assertStep("Accepted connection fixture present", Boolean(connectionId));
  await runDdQa(startupClient, investorClient, connectionId, documentId);

  await runSessionRefreshQa(investorClient);
  await runWatchlistQa(investorClient, fixtures);
  await runComparisonQa(investorClient, fixtures);
  await runPitchDeckQa(investorClient, fixtures);
  await runInvestorIntentQa(investorClient, fixtures);
  await runDealPipelineQa(investorClient, fixtures);
  await runMeetingsQa(startupClient, investorClient, fixtures);
  await runNotificationsQa(investorClient);
  await runRealtimeQa(investorClient);

  console.log("\n✅ Data Room and DD staged QA passed");
}

main().catch((error) => {
  console.error("\n❌", error.message);
  process.exit(1);
});
