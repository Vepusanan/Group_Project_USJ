import express from "express";
import { protect } from "../middleware/auth.js";
import {
  answerConnectionQuestion,
  askConnectionQuestion,
  listConnectionQa,
} from "../controllers/connectionQaController.js";

const router = express.Router();

router.use(protect);

router.get("/connection/:connectionId", listConnectionQa);
router.post("/connection/:connectionId", askConnectionQuestion);
router.post("/:threadId/answer", answerConnectionQuestion);

export default router;
