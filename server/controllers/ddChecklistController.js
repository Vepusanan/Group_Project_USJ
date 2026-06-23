import pool from "../config/database.js";
import { upload } from "../utils/fileUpload.js";
import { uploadDataRoomDocument, downloadStorageObject, parseLegacyStorageFromUrl } from "../utils/supabaseStorage.js";
import {
  sendDdChecklistResponseEmail,
  sendDdChecklistSharedEmail,
  getFrontendBaseUrl,
} from "../utils/emailServices.js";
import { getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import {
  getDocumentById,
  getFolderById,
} from "../repositories/DataRoomRepository.js";
import { getPipelineCardByConnectionId } from "../repositories/DealPipelineRepository.js";
import { advancePipelineStageIfEligible } from "../services/pipelineStageService.js";
import {
  addChecklistItem,
  areAllChecklistItemsCompleted,
  deleteChecklistItem,
  getChecklistByConnectionId,
  getChecklistItemById,
  getOrCreateChecklist,
  listChecklistItems,
  shareChecklist,
  submitDataRoomLinkResponse,
  submitItemResponse,
  updateChecklistItem,
  DD_ITEM_STATUSES,
} from "../repositories/DdChecklistRepository.js";

const resolveFileBuffer = async ({ fileUrl, document = null }) => {
  if (document) {
    const bucket = document.storage_bucket;
    const objectPath = document.storage_path;
    if (bucket && objectPath) {
      return {
        buffer: await downloadStorageObject(bucket, objectPath),
        contentTypeHint: document.mime_type || null,
        fileName: document.file_name || document.name || "document",
      };
    }
  }

  const parsed = parseLegacyStorageFromUrl(fileUrl);
  if (parsed?.bucket && parsed?.path) {
    return {
      buffer: await downloadStorageObject(parsed.bucket, parsed.path),
      contentTypeHint: document?.mime_type || null,
      fileName: document?.file_name || document?.name || "document",
    };
  }

  if (fileUrl?.startsWith("http")) {
    const upstream = await fetch(fileUrl);
    if (!upstream.ok) {
      throw Object.assign(new Error("Unable to load document file"), {
        statusCode: 502,
      });
    }
    return {
      buffer: Buffer.from(await upstream.arrayBuffer()),
      contentTypeHint:
        document?.mime_type || upstream.headers.get("content-type") || null,
      fileName: document?.file_name || document?.name || "document",
    };
  }

  throw Object.assign(new Error("Document storage location is not configured"), {
    statusCode: 404,
  });
};

const getConnectionById = async (connectionId) => {
  const result = await pool.query(
    `SELECT * FROM public.connections WHERE id = $1`,
    [connectionId],
  );
  return result.rows[0] || null;
};

const getUserContact = async (userId) => {
  const result = await pool.query(
    `SELECT email, full_name FROM public.users WHERE id = $1`,
    [userId],
  );
  return result.rows[0] || null;
};

const assertConnectionParticipant = async (connectionId, userId) => {
  const connection = await getConnectionById(connectionId);
  if (!connection) {
    const error = new Error("Connection not found");
    error.statusCode = 404;
    throw error;
  }

  const isParticipant =
    String(connection.investor_id) === String(userId) ||
    String(connection.startup_id) === String(userId);

  if (!isParticipant) {
    const error = new Error("Not authorized for this connection");
    error.statusCode = 403;
    throw error;
  }

  const normalized = String(connection.status || "").toLowerCase();
  if (!["accepted", "connected"].includes(normalized)) {
    const error = new Error("Checklist requires an accepted connection");
    error.statusCode = 400;
    throw error;
  }

  return connection;
};

const notifyChecklistResponse = async ({
  connection,
  itemDescription,
}) => {
  const [investor, startupProfile] = await Promise.all([
    getUserContact(connection.investor_id),
    getStartupProfileByUserId(connection.startup_id),
  ]);

  if (!investor?.email) return;

  await sendDdChecklistResponseEmail(investor.email, investor.full_name, {
    companyName: startupProfile?.company_name,
    itemDescription,
    connectionsUrl: `${getFrontendBaseUrl()}/connections`,
  });
};

const serializeChecklist = async (checklist, userType) => {
  const items = await listChecklistItems(checklist.id);
  const visibleToStartup = checklist.is_shared;

  if (userType === "startup" && !visibleToStartup) {
    return {
      id: checklist.id,
      connection_id: checklist.connection_id,
      is_shared: false,
      items: [],
      all_items_completed: false,
    };
  }

  const allItemsCompleted = await areAllChecklistItemsCompleted(checklist.id);
  const pipelineCard = await getPipelineCardByConnectionId(
    checklist.connection_id,
  );

  return {
    id: checklist.id,
    connection_id: checklist.connection_id,
    is_shared: checklist.is_shared,
    shared_at: checklist.shared_at,
    items: items.map((item) => {
      const { response_document_url, ...rest } = item;
      return {
        ...rest,
        has_response_document: Boolean(
          response_document_url || item.data_room_document_id,
        ),
      };
    }),
    all_items_completed: allItemsCompleted,
    pipeline_card: pipelineCard
      ? {
          id: pipelineCard.id,
          stage: pipelineCard.stage,
        }
      : null,
  };
};

export const getConnectionChecklist = async (req, res, next) => {
  try {
    const connection = await assertConnectionParticipant(
      req.params.connectionId,
      req.user.id,
    );

    let checklist = await getChecklistByConnectionId(req.params.connectionId);

    if (!checklist && req.user.user_type === "investor") {
      checklist = await getOrCreateChecklist({
        connectionId: req.params.connectionId,
        createdBy: req.user.id,
      });
    }

    if (!checklist) {
      return res.json({
        success: true,
        data: {
          id: null,
          connection_id: req.params.connectionId,
          is_shared: false,
          items: [],
          all_items_completed: false,
        },
      });
    }

    if (
      req.user.user_type === "investor" &&
      String(connection.investor_id) !== String(req.user.id)
    ) {
      return res.status(403).json({ success: false, error: "Investor only" });
    }

    const data = await serializeChecklist(checklist, req.user.user_type);
    res.json({ success: true, data });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const addChecklistItemHandler = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ success: false, error: "Only investors can add checklist items" });
    }

    await assertConnectionParticipant(req.params.connectionId, req.user.id);

    const description = String(req.body.description || "").trim();
    if (!description) {
      return res
        .status(400)
        .json({ success: false, error: "Description is required" });
    }

    const checklist = await getOrCreateChecklist({
      connectionId: req.params.connectionId,
      createdBy: req.user.id,
    });

    const item = await addChecklistItem({
      checklistId: checklist.id,
      description,
      dueDate: req.body.due_date || null,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const updateChecklistItemHandler = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ success: false, error: "Only investors can update items" });
    }

    const item = await getChecklistItemById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    const checklist = await pool.query(
      `SELECT * FROM public.dd_checklists WHERE id = $1`,
      [item.checklist_id],
    );
    const checklistRow = checklist.rows[0];
    if (!checklistRow) {
      return res.status(404).json({ success: false, error: "Checklist not found" });
    }

    await assertConnectionParticipant(
      checklistRow.connection_id,
      req.user.id,
    );

    const updates = {};
    if (req.body.description != null) {
      updates.description = String(req.body.description).trim();
    }
    if (req.body.status != null) {
      const status = String(req.body.status).toUpperCase();
      if (!DD_ITEM_STATUSES.includes(status)) {
        return res.status(400).json({ success: false, error: "Invalid status" });
      }
      updates.status = status;
    }
    if (Object.prototype.hasOwnProperty.call(req.body, "due_date")) {
      updates.due_date = req.body.due_date || null;
    }

    const updated = await updateChecklistItem(req.params.itemId, updates);
    const allItemsCompleted = await areAllChecklistItemsCompleted(
      item.checklist_id,
    );
    let pipelineCard = await getPipelineCardByConnectionId(
      checklistRow.connection_id,
    );

    let pipelineAdvance = null;
    if (allItemsCompleted) {
      pipelineAdvance = await advancePipelineStageIfEligible({
        investorUserId: req.user.id,
        connectionId: checklistRow.connection_id,
        targetStage: "DECISION",
      });
      if (pipelineAdvance?.card) {
        pipelineCard = pipelineAdvance.card;
      }
    }

    res.json({
      success: true,
      data: updated,
      all_items_completed: allItemsCompleted,
      suggest_pipeline_move: allItemsCompleted && !pipelineAdvance?.moved,
      pipeline_moved: Boolean(pipelineAdvance?.moved),
      pipeline_card: pipelineCard
        ? { id: pipelineCard.id, stage: pipelineCard.stage }
        : null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const deleteChecklistItemHandler = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ success: false, error: "Only investors can delete items" });
    }

    const item = await getChecklistItemById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    const checklistResult = await pool.query(
      `SELECT connection_id FROM public.dd_checklists WHERE id = $1`,
      [item.checklist_id],
    );
    const connectionId = checklistResult.rows[0]?.connection_id;
    if (!connectionId) {
      return res.status(404).json({ success: false, error: "Checklist not found" });
    }

    await assertConnectionParticipant(connectionId, req.user.id);
    await deleteChecklistItem(req.params.itemId);
    res.json({ success: true, message: "Item deleted" });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const shareChecklistHandler = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ success: false, error: "Only investors can share checklists" });
    }

    const connection = await assertConnectionParticipant(
      req.params.connectionId,
      req.user.id,
    );

    const checklist = await getOrCreateChecklist({
      connectionId: req.params.connectionId,
      createdBy: req.user.id,
    });

    const shared = await shareChecklist(checklist.id);

    const [startup, investor] = await Promise.all([
      getUserContact(connection.startup_id),
      getUserContact(req.user.id),
    ]);

    if (startup?.email) {
      await sendDdChecklistSharedEmail(startup.email, startup.full_name, {
        investorName: investor?.full_name,
        connectionsUrl: `${getFrontendBaseUrl()}/connections`,
      });
    }

    const pipelineAdvance = await advancePipelineStageIfEligible({
      investorUserId: req.user.id,
      connectionId: connection.id,
      targetStage: "DUE_DILIGENCE",
    });

    res.json({
      success: true,
      data: shared,
      message: "Checklist shared with startup",
      pipeline_moved: Boolean(pipelineAdvance?.moved),
      pipeline_stage: pipelineAdvance?.stage || pipelineAdvance?.card?.stage || null,
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const respondToChecklistItem = async (req, res, next) => {
  try {
    if (req.user.user_type !== "startup") {
      return res
        .status(403)
        .json({ success: false, error: "Only startups can respond to items" });
    }

    const item = await getChecklistItemById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    const checklistResult = await pool.query(
      `SELECT * FROM public.dd_checklists WHERE id = $1`,
      [item.checklist_id],
    );
    const checklist = checklistResult.rows[0];
    if (!checklist?.is_shared) {
      return res
        .status(403)
        .json({ success: false, error: "Checklist has not been shared yet" });
    }

    const connection = await assertConnectionParticipant(
      checklist.connection_id,
      req.user.id,
    );

    const file = req.file;
    if (!file) {
      return res.status(400).json({ success: false, error: "Document file is required" });
    }

    const startupProfile = await getStartupProfileByUserId(req.user.id);
    if (!startupProfile) {
      return res.status(404).json({ success: false, error: "Startup profile not found" });
    }

    const uploaded = await uploadDataRoomDocument(
      file,
      file.originalname,
      startupProfile.startup_profile_id,
    );

    const updated = await submitItemResponse({
      itemId: req.params.itemId,
      documentUrl: uploaded.internalUrl,
      documentName: uploaded.name,
    });

    await notifyChecklistResponse({
      connection,
      itemDescription: item.description,
    });

    res.json({
      success: true,
      data: updated,
      connection_id: connection.id,
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const linkDataRoomToChecklistItem = async (req, res, next) => {
  try {
    if (req.user.user_type !== "startup") {
      return res
        .status(403)
        .json({ success: false, error: "Only startups can respond to items" });
    }

    const item = await getChecklistItemById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    const checklistResult = await pool.query(
      `SELECT * FROM public.dd_checklists WHERE id = $1`,
      [item.checklist_id],
    );
    const checklist = checklistResult.rows[0];
    if (!checklist?.is_shared) {
      return res
        .status(403)
        .json({ success: false, error: "Checklist has not been shared yet" });
    }

    const connection = await assertConnectionParticipant(
      checklist.connection_id,
      req.user.id,
    );

    const startupProfile = await getStartupProfileByUserId(req.user.id);
    if (!startupProfile) {
      return res.status(404).json({ success: false, error: "Startup profile not found" });
    }

    const responseType = String(req.body.response_type || "").toLowerCase();
    const documentId = req.body.data_room_document_id || null;
    const folderId = req.body.data_room_folder_id || null;

    if (responseType === "data_room_document") {
      if (!documentId) {
        return res
          .status(400)
          .json({ success: false, error: "data_room_document_id is required" });
      }

      const document = await getDocumentById(documentId);
      if (
        !document ||
        String(document.startup_profile_id) !==
          String(startupProfile.startup_profile_id)
      ) {
        return res.status(404).json({ success: false, error: "Document not found" });
      }

      const updated = await submitDataRoomLinkResponse({
        itemId: req.params.itemId,
        responseType: "data_room_document",
        dataRoomDocumentId: document.id,
        documentUrl: document.file_url,
        documentName: document.name || document.file_name,
      });

      await notifyChecklistResponse({
        connection,
        itemDescription: item.description,
      });

      return res.json({ success: true, data: updated });
    }

    if (responseType === "data_room_folder") {
      if (!folderId) {
        return res
          .status(400)
          .json({ success: false, error: "data_room_folder_id is required" });
      }

      const folder = await getFolderById(folderId);
      if (
        !folder ||
        String(folder.startup_profile_id) !==
          String(startupProfile.startup_profile_id)
      ) {
        return res.status(404).json({ success: false, error: "Folder not found" });
      }

      const updated = await submitDataRoomLinkResponse({
        itemId: req.params.itemId,
        responseType: "data_room_folder",
        dataRoomFolderId: folder.id,
        documentName: folder.name,
      });

      await notifyChecklistResponse({
        connection,
        itemDescription: item.description,
      });

      return res.json({ success: true, data: updated });
    }

    return res.status(400).json({
      success: false,
      error: "response_type must be data_room_document or data_room_folder",
    });
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const streamChecklistItemFile = async (req, res, next) => {
  try {
    const item = await getChecklistItemById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, error: "Item not found" });
    }

    const checklistResult = await pool.query(
      `SELECT connection_id FROM public.dd_checklists WHERE id = $1`,
      [item.checklist_id],
    );
    const connectionId = checklistResult.rows[0]?.connection_id;
    if (!connectionId) {
      return res.status(404).json({ success: false, error: "Checklist not found" });
    }

    await assertConnectionParticipant(connectionId, req.user.id);

    let fileUrl = item.response_document_url;
    let fileName = item.response_document_name || "document";
    let contentTypeHint = item.linked_document_mime_type || null;
    let linkedDocument = null;

    if (item.response_type === "data_room_document" && item.data_room_document_id) {
      linkedDocument = await getDocumentById(item.data_room_document_id);
      if (!linkedDocument?.file_url && !linkedDocument?.storage_path) {
        return res.status(404).json({ success: false, error: "Linked document not found" });
      }
      fileUrl = linkedDocument.file_url;
      fileName = linkedDocument.file_name || linkedDocument.name || fileName;
      contentTypeHint = linkedDocument.mime_type || contentTypeHint;
    }

    if (!fileUrl && !linkedDocument?.storage_path) {
      return res.status(404).json({ success: false, error: "No document uploaded" });
    }

    const resolved = await resolveFileBuffer({
      fileUrl,
      document: linkedDocument,
    });
    const buffer = resolved.buffer;
    const contentType =
      contentTypeHint ||
      resolved.contentTypeHint ||
      "application/octet-stream";
    fileName = resolved.fileName || fileName;
    const safeFileName = fileName.replace(/"/g, "");
    const disposition = contentType.includes("pdf") ? "inline" : "attachment";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${safeFileName}"`,
    );
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  } catch (error) {
    if (error.statusCode) {
      return res
        .status(error.statusCode)
        .json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const ddChecklistUpload = upload.single("document");
