import { getStartupProfileById, getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import { canViewProfile } from "../utils/profileVisibility.js";
import {
  isUsersConnected,
  getConnectionsForUser,
  getUserById,
} from "../repositories/ConnectionRepository.js";
import {
  getFrontendBaseUrl,
  sendDataRoomAccessGrantedEmail,
} from "../utils/emailServices.js";
import {
  uploadDataRoomDocument,
  BUCKETS,
  downloadStorageObject,
  parseLegacyStorageFromUrl,
} from "../utils/supabaseStorage.js";
import {
  createDocument,
  createFolder,
  deleteDocument,
  deleteFolder,
  getAccessGrantById,
  getDocumentById,
  getFolderById,
  grantDataRoomAccess,
  hasActiveDataRoomAccess,
  listAccessGrantsForStartup,
  listAuditLogForStartup,
  listDocumentsForStartup,
  listFoldersForStartup,
  recordDataRoomAudit,
  recordDataRoomAuditAsync,
  revokeDataRoomAccess,
  updateDocument,
  updateFolder,
} from "../repositories/DataRoomRepository.js";
import {
  upsertDataRoomAccessRequest,
  markDataRoomRequestGranted,
  getDataRoomAccessRequest,
} from "../repositories/DataRoomAccessRequestRepository.js";
import { generateGeminiFinancialDocumentAnalysis } from "../utils/geminiService.js";
import {
  advancePipelineStageIfEligible,
  getConnectionIdForInvestorAndStartup,
} from "../services/pipelineStageService.js";
import { validateFileMagicBytes, scanUploadedFile } from "../utils/fileSecurity.js";
import { getClientIp } from "../repositories/UserActivityRepository.js";

const resolveDocumentBuffer = async (document) => {
  const bucket = document.storage_bucket;
  const objectPath = document.storage_path;

  if (bucket && objectPath) {
    return downloadStorageObject(bucket, objectPath);
  }

  const parsed = parseLegacyStorageFromUrl(document.file_url);
  if (parsed?.bucket && parsed?.path) {
    return downloadStorageObject(parsed.bucket, parsed.path);
  }

  if (document.file_url?.startsWith("http")) {
    const upstream = await fetch(document.file_url);
    if (!upstream.ok) {
      throw new Error("Unable to load document file");
    }
    return Buffer.from(await upstream.arrayBuffer());
  }

  throw new Error("Document storage location is not configured");
};

const auditMeta = (req, extra = {}) => ({
  ...extra,
  client_ip: getClientIp(req),
  session_ref: req.cookies?.access_token
    ? String(req.cookies.access_token).slice(-12)
    : null,
});

const assertStartupOwner = async (req) => {
  if (req.user.user_type !== "startup") {
    const error = new Error("Only startup accounts can manage a data room");
    error.statusCode = 403;
    throw error;
  }

  const profile = await getStartupProfileByUserId(req.user.id);
  if (!profile) {
    const error = new Error("Startup profile not found");
    error.statusCode = 404;
    throw error;
  }

  return profile;
};

const assertDataRoomViewAccess = async (req, startupProfileId) => {
  const profile = await getStartupProfileById(startupProfileId);
  if (!profile) {
    const error = new Error("Startup profile not found");
    error.statusCode = 404;
    throw error;
  }

  const userId = req.user.id;
  const isOwner = String(profile.user_id) === String(userId);

  if (isOwner) {
    return { profile, accessLevel: "owner" };
  }

  if (req.user.user_type !== "investor") {
    const error = new Error("Only granted investors can view this data room");
    error.statusCode = 403;
    throw error;
  }

  const connected = await isUsersConnected(profile.user_id, userId);
  if (!connected) {
    const error = new Error("Connect with this startup to request data room access");
    error.statusCode = 403;
    throw error;
  }

  const hasAccess = await hasActiveDataRoomAccess(startupProfileId, userId);
  if (!hasAccess) {
    const error = new Error("You do not have access to this startup's data room");
    error.statusCode = 403;
    throw error;
  }

  return { profile, accessLevel: "investor" };
};

const assertDocumentAccess = async (req, documentId) => {
  const document = await getDocumentById(documentId);
  if (!document) {
    const error = new Error("Document not found");
    error.statusCode = 404;
    throw error;
  }

  const { profile, accessLevel } = await assertDataRoomViewAccess(
    req,
    document.startup_profile_id,
  );

  return { document, profile, accessLevel };
};

const sanitizeDocument = (row, { includeFileUrl = false } = {}) => ({
  id: row.id,
  startup_profile_id: row.startup_profile_id,
  folder_id: row.folder_id,
  name: row.name,
  file_name: row.file_name,
  description: row.description,
  mime_type: row.mime_type,
  file_size_bytes: row.file_size_bytes,
  uploaded_by: row.uploaded_by,
  uploaded_by_name: row.uploaded_by_name,
  created_at: row.created_at,
  updated_at: row.updated_at,
  ...(includeFileUrl ? { file_url: row.file_url } : {}),
});

export const getMyDataRoom = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);

    const [folders, documents, accessGrants, auditLog] = await Promise.all([
      listFoldersForStartup(profile.startup_profile_id),
      listDocumentsForStartup(profile.startup_profile_id),
      listAccessGrantsForStartup(profile.startup_profile_id),
      listAuditLogForStartup(profile.startup_profile_id, { limit: 30 }),
    ]);

    res.json({
      success: true,
      data: {
        startup_profile_id: profile.startup_profile_id,
        company_name: profile.company_name,
        folders,
        documents: documents.map((doc) => sanitizeDocument(doc)),
        access_grants: accessGrants.map((grant) => ({
          id: grant.id,
          investor_user_id: grant.investor_user_id,
          investor_name: grant.investor_name,
          investor_firm: grant.investor_firm,
          investor_profile_id: grant.investor_profile_id,
          granted_at: grant.granted_at,
          revoked_at: grant.revoked_at,
          is_active: !grant.revoked_at,
        })),
        audit_log: auditLog,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getStartupDataRoom = async (req, res, next) => {
  try {
    const { profile, accessLevel } = await assertDataRoomViewAccess(
      req,
      req.params.startupProfileId,
    );

    const [folders, documents] = await Promise.all([
      listFoldersForStartup(profile.startup_profile_id),
      listDocumentsForStartup(profile.startup_profile_id),
    ]);

    if (accessLevel === "investor") {
      await recordDataRoomAudit({
        startupProfileId: profile.startup_profile_id,
        investorUserId: req.user.id,
        actionType: "view_data_room",
        performedBy: req.user.id,
      });
    }

    res.json({
      success: true,
      data: {
        startup_profile_id: profile.startup_profile_id,
        company_name: profile.company_name,
        access_level: accessLevel,
        folders,
        documents: documents.map((doc) => sanitizeDocument(doc)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDataRoomMeta = async (req, res, next) => {
  try {
    const profile = await getStartupProfileById(req.params.startupProfileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Startup profile not found" });
    }

    const isOwner = String(profile.user_id) === String(req.user.id);

    if (!isOwner) {
      const { canView } = await canViewProfile(profile.user_id, req.user.id);
      if (!canView) {
        return res.status(403).json({
          success: false,
          error: "This profile is private",
        });
      }
    }

    let canAccess = isOwner;
    let hasGrant = false;

    let accessRequestStatus = null;

    if (!isOwner && req.user.user_type === "investor") {
      const connected = await isUsersConnected(profile.user_id, req.user.id);
      hasGrant = connected
        ? await hasActiveDataRoomAccess(profile.startup_profile_id, req.user.id)
        : false;
      canAccess = hasGrant;

      if (connected && !hasGrant) {
        const request = await getDataRoomAccessRequest(
          profile.startup_profile_id,
          req.user.id,
        );
        accessRequestStatus = request?.status || null;
      }
    }

    res.json({
      success: true,
      data: {
        startup_profile_id: profile.startup_profile_id,
        company_name: profile.company_name,
        is_owner: isOwner,
        can_access: canAccess,
        has_grant: hasGrant,
        access_request_status: accessRequestStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createDataRoomFolder = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const name = String(req.body.name || "").trim();

    if (!name) {
      return res.status(400).json({ success: false, error: "Folder name is required" });
    }

    const folder = await createFolder(profile.startup_profile_id, name);

    await recordDataRoomAudit({
      startupProfileId: profile.startup_profile_id,
      folderId: folder.id,
      actionType: "create_folder",
      performedBy: req.user.id,
      metadata: { folder_name: folder.name },
    });

    res.status(201).json({ success: true, data: folder });
  } catch (error) {
    next(error);
  }
};

export const updateDataRoomFolder = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const folder = await getFolderById(req.params.folderId);

    if (!folder || String(folder.startup_profile_id) !== String(profile.startup_profile_id)) {
      return res.status(404).json({ success: false, error: "Folder not found" });
    }

    const name = String(req.body.name || "").trim();
    if (!name) {
      return res.status(400).json({ success: false, error: "Folder name is required" });
    }

    const updated = await updateFolder(folder.id, name);

    await recordDataRoomAudit({
      startupProfileId: profile.startup_profile_id,
      folderId: folder.id,
      actionType: "update_folder",
      performedBy: req.user.id,
      metadata: { folder_name: updated.name },
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
};

export const deleteDataRoomFolder = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const folder = await getFolderById(req.params.folderId);

    if (!folder || String(folder.startup_profile_id) !== String(profile.startup_profile_id)) {
      return res.status(404).json({ success: false, error: "Folder not found" });
    }

    await deleteFolder(folder.id);

    await recordDataRoomAudit({
      startupProfileId: profile.startup_profile_id,
      folderId: folder.id,
      actionType: "delete_folder",
      performedBy: req.user.id,
      metadata: { folder_name: folder.name },
    });

    res.json({ success: true, message: "Folder deleted" });
  } catch (error) {
    next(error);
  }
};

export const uploadDataRoomDocumentHandler = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);

    if (!req.file) {
      return res.status(400).json({ success: false, error: "Document file is required" });
    }

    const folderId = req.body.folder_id || null;
    if (folderId) {
      const folder = await getFolderById(folderId);
      if (!folder || String(folder.startup_profile_id) !== String(profile.startup_profile_id)) {
        return res.status(400).json({ success: false, error: "Invalid folder" });
      }
    }

    const magic = validateFileMagicBytes(req.file.buffer, req.file.mimetype);
    if (!magic.ok) {
      return res.status(400).json({ success: false, error: magic.error });
    }

    const scan = await scanUploadedFile(req.file.buffer, {
      userId: req.user.id,
      context: "data_room_upload",
    });
    if (!scan.clean) {
      return res.status(400).json({
        success: false,
        error: "File failed security scanning and was rejected",
      });
    }

    const uploadResult = await uploadDataRoomDocument(
      req.file,
      req.file.originalname,
      profile.startup_profile_id,
    );

    const displayName =
      String(req.body.name || "").trim() || uploadResult.name;

    const document = await createDocument({
      startupProfileId: profile.startup_profile_id,
      folderId,
      name: displayName,
      fileName: uploadResult.name,
      description: req.body.description,
      fileUrl: uploadResult.internalUrl,
      storageBucket: uploadResult.bucket,
      storagePath: uploadResult.path,
      mimeType: req.file.mimetype,
      fileSizeBytes: uploadResult.size,
      uploadedBy: req.user.id,
    });

    recordDataRoomAuditAsync({
      startupProfileId: profile.startup_profile_id,
      documentId: document.id,
      folderId: document.folder_id,
      actionType: "upload_document",
      performedBy: req.user.id,
      metadata: auditMeta(req, { document_name: document.name }),
    });

    res.status(201).json({
      success: true,
      data: sanitizeDocument(document),
    });
  } catch (error) {
    next(error);
  }
};

export const updateDataRoomDocumentHandler = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const document = await getDocumentById(req.params.documentId);

    if (!document || String(document.startup_profile_id) !== String(profile.startup_profile_id)) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    if (req.body.folder_id) {
      const folder = await getFolderById(req.body.folder_id);
      if (!folder || String(folder.startup_profile_id) !== String(profile.startup_profile_id)) {
        return res.status(400).json({ success: false, error: "Invalid folder" });
      }
    }

    const updated = await updateDocument(document.id, {
      name: req.body.name,
      description: req.body.description,
      folder_id: req.body.folder_id,
    });

    await recordDataRoomAudit({
      startupProfileId: profile.startup_profile_id,
      documentId: updated.id,
      folderId: updated.folder_id,
      actionType: "update_document",
      performedBy: req.user.id,
      metadata: { document_name: updated.name },
    });

    res.json({ success: true, data: sanitizeDocument(updated) });
  } catch (error) {
    next(error);
  }
};

export const deleteDataRoomDocumentHandler = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const document = await getDocumentById(req.params.documentId);

    if (!document || String(document.startup_profile_id) !== String(profile.startup_profile_id)) {
      return res.status(404).json({ success: false, error: "Document not found" });
    }

    await deleteDocument(document.id);

    await recordDataRoomAudit({
      startupProfileId: profile.startup_profile_id,
      documentId: document.id,
      actionType: "delete_document",
      performedBy: req.user.id,
      metadata: { document_name: document.name },
    });

    res.json({ success: true, message: "Document deleted" });
  } catch (error) {
    next(error);
  }
};

export const streamDataRoomDocument = async (req, res, next) => {
  try {
    const { document, profile, accessLevel } = await assertDocumentAccess(
      req,
      req.params.documentId,
    );

    const buffer = await resolveDocumentBuffer(document);
    const contentType =
      document.mime_type || "application/octet-stream";
    const disposition = contentType.includes("pdf")
      ? "inline"
      : "attachment";

    await recordDataRoomAudit({
      startupProfileId: profile.startup_profile_id,
      investorUserId: accessLevel === "investor" ? req.user.id : null,
      documentId: document.id,
      actionType: disposition === "inline" ? "view_document" : "download_document",
      performedBy: req.user.id,
      metadata: auditMeta(req, { document_name: document.name }),
    });

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${document.file_name.replace(/"/g, "")}"`,
    );
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  } catch (error) {
    next(error);
  }
};

export const listConnectedInvestorsForGrant = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const connections = await getConnectionsForUser(req.user.id);
    const grants = await listAccessGrantsForStartup(profile.startup_profile_id);

    const grantByInvestor = new Map(
      grants.map((grant) => [String(grant.investor_user_id), grant]),
    );

    const investors = connections
      .filter(
        (conn) =>
          conn.normalized_status === "accepted" &&
          conn.other_user_type === "investor",
      )
      .map((conn) => {
        const grant = grantByInvestor.get(String(conn.other_user_id));
        return {
          user_id: conn.other_user_id,
          name: conn.other_user_name,
          investor_profile_id: conn.other_user_profile_id,
          connection_id: conn.id,
          has_data_room_access: Boolean(grant && !grant.revoked_at),
          grant_id: grant && !grant.revoked_at ? grant.id : null,
          granted_at: grant && !grant.revoked_at ? grant.granted_at : null,
        };
      });

    res.json({ success: true, data: investors });
  } catch (error) {
    next(error);
  }
};

export const requestDataRoomAccessHandler = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res.status(403).json({
        success: false,
        error: "Only investors can request data room access",
      });
    }

    const profile = await getStartupProfileById(req.params.startupProfileId);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Startup profile not found",
      });
    }

    const connected = await isUsersConnected(profile.user_id, req.user.id);
    if (!connected) {
      return res.status(403).json({
        success: false,
        error: "Connect with this startup before requesting data room access",
      });
    }

    const hasAccess = await hasActiveDataRoomAccess(
      profile.startup_profile_id,
      req.user.id,
    );
    if (hasAccess) {
      return res.status(400).json({
        success: false,
        error: "You already have data room access",
      });
    }

    const request = await upsertDataRoomAccessRequest(
      profile.startup_profile_id,
      req.user.id,
    );

    res.status(201).json({
      success: true,
      data: {
        id: request.id,
        status: request.status,
        requested_at: request.requested_at,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const grantDataRoomAccessHandler = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const investorUserId = req.body.investor_user_id;

    if (!investorUserId) {
      return res.status(400).json({
        success: false,
        error: "investor_user_id is required",
      });
    }

    const connected = await isUsersConnected(profile.user_id, investorUserId);
    if (!connected) {
      return res.status(400).json({
        success: false,
        error: "You can only grant data room access to connected investors",
      });
    }

    const grant = await grantDataRoomAccess({
      startupProfileId: profile.startup_profile_id,
      investorUserId,
      grantedBy: req.user.id,
    });

    await markDataRoomRequestGranted(
      profile.startup_profile_id,
      investorUserId,
    );

    await recordDataRoomAudit({
      startupProfileId: profile.startup_profile_id,
      investorUserId,
      actionType: "grant_access",
      performedBy: req.user.id,
      metadata: { grant_id: grant.id },
    });

    (async () => {
      try {
        const investor = await getUserById(investorUserId);
        if (!investor?.email) return;

        const base = getFrontendBaseUrl();
        await sendDataRoomAccessGrantedEmail(
          investor.email,
          investor.full_name,
          {
            companyName: profile.company_name,
            dataRoomUrl: `${base}/startups/${profile.startup_profile_id}/data-room`,
            profileUrl: `${base}/startups/${profile.startup_profile_id}`,
          },
        );
      } catch (emailError) {
        console.error(
          "Failed to send data room access email:",
          emailError.message,
        );
      }
    })();

    const connectionId = await getConnectionIdForInvestorAndStartup(
      investorUserId,
      profile.user_id,
    );
    const pipelineAdvance = await advancePipelineStageIfEligible({
      investorUserId,
      connectionId,
      startupProfileId: profile.startup_profile_id,
      targetStage: "REVIEWING",
    });

    res.status(201).json({
      success: true,
      data: {
        id: grant.id,
        investor_user_id: grant.investor_user_id,
        granted_at: grant.granted_at,
        is_active: true,
        pipeline_stage: pipelineAdvance?.stage || pipelineAdvance?.card?.stage || null,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const revokeDataRoomAccessHandler = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const grant = await getAccessGrantById(req.params.grantId);

    if (!grant || String(grant.startup_profile_id) !== String(profile.startup_profile_id)) {
      return res.status(404).json({ success: false, error: "Access grant not found" });
    }

    if (grant.revoked_at) {
      return res.status(400).json({ success: false, error: "Access already revoked" });
    }

    const revoked = await revokeDataRoomAccess(grant.id);

    await recordDataRoomAudit({
      startupProfileId: profile.startup_profile_id,
      investorUserId: revoked.investor_user_id,
      actionType: "revoke_access",
      performedBy: req.user.id,
      metadata: { grant_id: revoked.id },
    });

    res.json({
      success: true,
      data: {
        id: revoked.id,
        revoked_at: revoked.revoked_at,
        is_active: false,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getInvestorDataRoomAuditLog = async (req, res, next) => {
  try {
    const { profile } = await assertDataRoomViewAccess(
      req,
      req.params.startupProfileId,
    );

    const auditLog = await listAuditLogForStartup(profile.startup_profile_id, {
      limit: Math.min(Number(req.query.limit) || 100, 200),
      investorUserId: req.user.id,
      documentId: req.query.document_id || null,
      actionType: req.query.action_type || null,
    });

    res.json({ success: true, count: auditLog.length, data: auditLog });
  } catch (error) {
    next(error);
  }
};

export const analyzeDataRoomDocument = async (req, res, next) => {
  try {
    const { document, profile } = await assertDocumentAccess(
      req,
      req.params.documentId,
    );

    const mime = document.mime_type || "";
    const fileName = (document.file_name || document.name || "").toLowerCase();
    const isPdf = mime.includes("pdf") || fileName.endsWith(".pdf");
    if (!isPdf) {
      return res.status(400).json({
        success: false,
        error: "AI summarisation is available for PDF documents only",
      });
    }

    const buffer = await resolveDocumentBuffer(document);
    const analysis = await generateGeminiFinancialDocumentAnalysis({
      documentName: document.name || document.file_name,
      companyName: profile.company_name,
      pdfBuffer: buffer,
    });

    const { buildFinancialDocAnalysisFallback } = await import(
      "../utils/aiFallbacks.js"
    );
    const resolved =
      analysis ||
      buildFinancialDocAnalysisFallback(
        document.name || document.file_name,
        profile.company_name,
      );

    if (resolved.error) {
      return res.status(400).json({ success: false, error: resolved.error });
    }

    res.json({ success: true, data: resolved });
  } catch (error) {
    next(error);
  }
};

export const getDataRoomAuditLog = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const auditLog = await listAuditLogForStartup(profile.startup_profile_id, {
      limit: Math.min(Number(req.query.limit) || 200, 500),
      investorUserId: req.query.investor_user_id || null,
      documentId: req.query.document_id || null,
      actionType: req.query.action_type || null,
    });

    res.json({ success: true, count: auditLog.length, data: auditLog });
  } catch (error) {
    next(error);
  }
};

export const dataRoomErrorHandler = (error, req, res, next) => {
  if (error.statusCode) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
    });
  }

  if (error.message?.includes("Invalid file type")) {
    return res.status(400).json({ success: false, error: error.message });
  }

  next(error);
};
