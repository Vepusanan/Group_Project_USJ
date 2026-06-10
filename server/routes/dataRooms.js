import express from "express";
import { protect } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { upload } from "../utils/fileUpload.js";
import {
  createDataRoomFolder,
  deleteDataRoomDocumentHandler,
  deleteDataRoomFolder,
  analyzeDataRoomDocument,
  getDataRoomAuditLog,
  getInvestorDataRoomAuditLog,
  getDataRoomMeta,
  getMyDataRoom,
  getStartupDataRoom,
  grantDataRoomAccessHandler,
  requestDataRoomAccessHandler,
  listConnectedInvestorsForGrant,
  revokeDataRoomAccessHandler,
  streamDataRoomDocument,
  updateDataRoomDocumentHandler,
  updateDataRoomFolder,
  uploadDataRoomDocumentHandler,
  dataRoomErrorHandler,
} from "../controllers/dataRoomController.js";

const router = express.Router();

const runUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.message || "File upload failed",
      });
    }
    next();
  });
};

router.use(protect);

router.get("/me", getMyDataRoom);
router.get("/audit-log", getDataRoomAuditLog);
router.get("/connected-investors", listConnectedInvestorsForGrant);

router.get("/startup/:startupProfileId/meta", getDataRoomMeta);
router.post("/startup/:startupProfileId/request-access", requestDataRoomAccessHandler);
router.get("/startup/:startupProfileId", getStartupDataRoom);
router.get("/startup/:startupProfileId/audit-log", getInvestorDataRoomAuditLog);

router.post("/folders", createDataRoomFolder);
router.patch("/folders/:folderId", updateDataRoomFolder);
router.delete("/folders/:folderId", deleteDataRoomFolder);

router.post("/documents", runUpload, uploadDataRoomDocumentHandler);
router.patch("/documents/:documentId", updateDataRoomDocumentHandler);
router.delete("/documents/:documentId", deleteDataRoomDocumentHandler);
router.get("/documents/:documentId/file", streamDataRoomDocument);
router.post("/documents/:documentId/analyze", aiLimiter, analyzeDataRoomDocument);

router.post("/access", grantDataRoomAccessHandler);
router.delete("/access/:grantId", revokeDataRoomAccessHandler);

router.use(dataRoomErrorHandler);

export default router;
