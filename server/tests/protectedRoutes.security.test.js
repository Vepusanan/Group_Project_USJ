import test from "node:test";
import assert from "node:assert/strict";
import pool from "../config/database.js";
import { getSupabase, BUCKETS } from "../utils/supabaseStorage.js";
import {
  uid,
  signAccessToken,
  startServer,
  jsonRequest,
  createUser,
  createStartupProfile,
  createInvestorProfile,
  ensureAcceptedConnection,
} from "./helpers/securityTestHarness.js";

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

async function uploadPdfToSupabase({ startupProfileId }) {
  const supabase = getSupabase();
  const objectPath = `data-room/${startupProfileId}/security_${Date.now()}.pdf`;
  const { error } = await supabase.storage
    .from(BUCKETS.DOCUMENTS)
    .upload(objectPath, MINIMAL_PDF, {
      contentType: "application/pdf",
      cacheControl: "3600",
      upsert: true,
    });
  if (error) {
    throw new Error(`Supabase upload failed: ${error.message}`);
  }
  const internalUrl = `storage://${BUCKETS.DOCUMENTS}/${objectPath}`;
  return { bucket: BUCKETS.DOCUMENTS, path: objectPath, internalUrl };
}

async function createDataRoomDocument({
  startupProfileId,
  uploadedBy,
  storageBucket,
  storagePath,
  fileUrl,
}) {
  const result = await pool.query(
    `
      INSERT INTO public.data_room_documents (
        startup_profile_id, folder_id, name, file_name, description, file_url,
        storage_bucket, storage_path, mime_type, file_size_bytes, uploaded_by
      )
      VALUES ($1, NULL, 'Security PDF', 'security.pdf', NULL, $2, $3, $4, 'application/pdf', $5, $6)
      RETURNING id
    `,
    [startupProfileId, fileUrl, storageBucket, storagePath, MINIMAL_PDF.length, uploadedBy],
  );
  return result.rows[0].id;
}

async function grantDataRoomAccess({ startupProfileId, investorUserId, grantedBy }) {
  const result = await pool.query(
    `
      INSERT INTO public.data_room_access_grants (startup_profile_id, investor_user_id, granted_by)
      VALUES ($1, $2, $3)
      RETURNING id
    `,
    [startupProfileId, investorUserId, grantedBy],
  );
  return result.rows[0].id;
}

async function revokeGrant(grantId) {
  await pool.query(
    `UPDATE public.data_room_access_grants SET revoked_at = NOW() WHERE id = $1`,
    [grantId],
  );
}

test("protected route security matrix", async () => {
  assert.ok(process.env.JWT_SECRET, "JWT_SECRET must be set");

  const startupEmail = `${uid("startup")}@test.com`;
  const investorEmail = `${uid("investor")}@test.com`;
  const nonAdminEmail = `${uid("nonadmin")}@test.com`;

  const startupUser = await createUser({
    email: startupEmail,
    userType: "startup",
    fullName: "SecTest Startup User",
  });
  const investorUser = await createUser({
    email: investorEmail,
    userType: "investor",
    fullName: "SecTest Investor User",
  });
  const nonAdminUser = await createUser({
    email: nonAdminEmail,
    userType: "investor",
    fullName: "SecTest NonAdmin",
  });

  const startupProfile = await createStartupProfile(startupUser.id, { complete: true });
  await createInvestorProfile(investorUser.id, { complete: true });
  await createInvestorProfile(nonAdminUser.id, { complete: true });

  const connectionId = await ensureAcceptedConnection(
    investorUser.id,
    startupUser.id,
  );

  const startupCookies = [`access_token=${signAccessToken(startupUser)}`];
  const investorCookies = [`access_token=${signAccessToken(investorUser)}`];
  const nonAdminCookies = [`access_token=${signAccessToken(nonAdminUser)}`];

  const previousAdmins = process.env.ADMIN_EMAILS;
  process.env.ADMIN_EMAILS = `${uid("admin")}@test.com`; // ensure none of these users are admin

  const srv = await startServer();
  try {
    // Anonymous users cannot access protected endpoints.
    const anonProtected = [
      ["GET", "/api/auth/me"],
      ["GET", "/api/messages/conversations"],
      ["GET", "/api/watchlist"],
      ["GET", "/api/notifications"],
      ["GET", "/api/data-rooms/me"],
      ["GET", "/api/settings/privacy"],
    ];
    for (const [method, path] of anonProtected) {
      const out = await jsonRequest(srv.baseUrl, method, path);
      assert.equal(out.res.status, 401, `${method} ${path} should 401`);
    }

    // Startup cannot access investor-only endpoints.
    const investorOnly = [
      ["GET", "/api/watchlist"],
      ["POST", "/api/watchlist"],
      ["POST", "/api/comparisons/compare"],
      ["GET", "/api/deal-pipeline"],
      ["GET", "/api/investor-intents"],
    ];
    for (const [method, path] of investorOnly) {
      const out = await jsonRequest(srv.baseUrl, method, path, {
        cookies: startupCookies,
        body: method === "POST" ? {} : undefined,
      });
      assert.equal(out.res.status, 403, `${method} ${path} should 403 for startup`);
    }

    // Investor cannot access startup-only endpoints.
    const startupOnly = [
      ["GET", "/api/startup-analytics/me"],
      ["GET", "/api/funding-rounds/me"],
      ["POST", "/api/funding-rounds"],
    ];
    for (const [method, path] of startupOnly) {
      const out = await jsonRequest(srv.baseUrl, method, path, {
        cookies: investorCookies,
        body: method === "POST" ? {} : undefined,
      });
      assert.equal(out.res.status, 403, `${method} ${path} should 403 for investor`);
    }

    // Non-admin cannot access admin endpoints.
    const adminRoutes = [
      ["GET", "/api/admin/analytics"],
      ["GET", "/api/admin/verification-requests"],
    ];
    for (const [method, path] of adminRoutes) {
      const out = await jsonRequest(srv.baseUrl, method, path, {
        cookies: nonAdminCookies,
      });
      assert.equal(out.res.status, 403, `${method} ${path} should 403 for non-admin`);
    }

    // Data room document access rules:
    // - investors cannot access documents without grants (even if connected)
    // - revoked investors lose access immediately
    // Seed a document in the startup's data room.
    const uploaded = await uploadPdfToSupabase({
      startupProfileId: startupProfile.startup_profile_id,
    });
    const documentId = await createDataRoomDocument({
      startupProfileId: startupProfile.startup_profile_id,
      uploadedBy: startupUser.id,
      storageBucket: uploaded.bucket,
      storagePath: uploaded.path,
      fileUrl: uploaded.internalUrl,
    });

    // Investor (connected) still cannot fetch without explicit grant.
    const noGrant = await jsonRequest(
      srv.baseUrl,
      "GET",
      `/api/data-rooms/documents/${documentId}/file`,
      { cookies: investorCookies },
    );
    assert.equal(noGrant.res.status, 403, "investor without grant must be blocked");

    // Grant access and verify access allowed.
    const grantId = await grantDataRoomAccess({
      startupProfileId: startupProfile.startup_profile_id,
      investorUserId: investorUser.id,
      grantedBy: startupUser.id,
    });

    const withGrant = await jsonRequest(
      srv.baseUrl,
      "GET",
      `/api/data-rooms/documents/${documentId}/file`,
      { cookies: investorCookies },
    );
    assert.equal(withGrant.res.status, 200, "investor with grant must be allowed");

    // Revoke access and verify immediate loss.
    await revokeGrant(grantId);
    const afterRevoke = await jsonRequest(
      srv.baseUrl,
      "GET",
      `/api/data-rooms/documents/${documentId}/file`,
      { cookies: investorCookies },
    );
    assert.equal(afterRevoke.res.status, 403, "revoked investor must be blocked");

    // Startup owner always allowed to fetch its own document.
    const owner = await jsonRequest(
      srv.baseUrl,
      "GET",
      `/api/data-rooms/documents/${documentId}/file`,
      { cookies: startupCookies },
    );
    assert.equal(owner.res.status, 200, "startup owner must be allowed");

    // Sanity: the meeting creation endpoint is investor-only.
    const meetingAsStartup = await jsonRequest(
      srv.baseUrl,
      "POST",
      `/api/meetings/connection/${connectionId}`,
      { cookies: startupCookies, body: { proposed_at: new Date(Date.now() + 86400000).toISOString(), format: "VIDEO_CALL", agenda: "x" } },
    );
    assert.equal(meetingAsStartup.res.status, 403);
  } finally {
    process.env.ADMIN_EMAILS = previousAdmins;
    await srv.close();

    // Best-effort cleanup.
    await pool
      .query(`DELETE FROM public.users WHERE id = ANY($1::uuid[])`, [
        [startupUser.id, investorUser.id, nonAdminUser.id],
      ])
      .catch(() => undefined);
  }
});

