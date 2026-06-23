import express from "express";
import { protect } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import {
  addMeetingNoteHandler,
  createMeetingRequestHandler,
  downloadMeetingCalendar,
  generateMeetingBriefHandler,
  listConnectionMeetings,
  respondToMeetingRequest,
} from "../controllers/meetingController.js";

const router = express.Router();

router.use(protect);

router.get("/connection/:connectionId", listConnectionMeetings);
router.post("/connection/:connectionId", createMeetingRequestHandler);
router.patch("/:meetingId/respond", respondToMeetingRequest);
router.post("/:meetingId/brief", aiLimiter, generateMeetingBriefHandler);
router.get("/:meetingId/calendar.ics", downloadMeetingCalendar);
router.post("/:meetingId/notes", addMeetingNoteHandler);

export default router;
