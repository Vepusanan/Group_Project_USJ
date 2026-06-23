import express from "express";
import { protect } from "../middleware/auth.js";
import {
  addChecklistItemHandler,
  deleteChecklistItemHandler,
  ddChecklistUpload,
  getConnectionChecklist,
  linkDataRoomToChecklistItem,
  respondToChecklistItem,
  shareChecklistHandler,
  streamChecklistItemFile,
  updateChecklistItemHandler,
} from "../controllers/ddChecklistController.js";

const router = express.Router();

router.use(protect);

router.get("/connection/:connectionId", getConnectionChecklist);
router.post("/connection/:connectionId/items", addChecklistItemHandler);
router.post("/connection/:connectionId/share", shareChecklistHandler);
router.patch("/items/:itemId", updateChecklistItemHandler);
router.get("/items/:itemId/file", streamChecklistItemFile);
router.delete("/items/:itemId", deleteChecklistItemHandler);
router.post("/items/:itemId/link-data-room", linkDataRoomToChecklistItem);
router.post(
  "/items/:itemId/response",
  (req, res, next) => {
    ddChecklistUpload(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: err.message || "Upload failed",
        });
      }
      next();
    });
  },
  respondToChecklistItem,
);

export default router;
