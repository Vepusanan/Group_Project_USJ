import { getUserById } from "../repositories/ConnectionRepository.js";
import { createProfileReport } from "../repositories/ProfileReportRepository.js";

export const reportProfile = async (req, res, next) => {
  try {
    const reportedUserId = req.params.userId;
    const reason = String(req.body.reason || "").trim();

    if (!reportedUserId) {
      return res.status(400).json({
        success: false,
        error: "Reported user ID is required",
      });
    }

    if (reason.length < 10 || reason.length > 2000) {
      return res.status(400).json({
        success: false,
        error: "Please provide a reason between 10 and 2000 characters",
      });
    }

    if (String(reportedUserId) === String(req.user.id)) {
      return res.status(400).json({
        success: false,
        error: "You cannot report your own profile",
      });
    }

    const reportedUser = await getUserById(reportedUserId);
    if (!reportedUser) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    const { report, pendingCount, autoFlagged } = await createProfileReport({
      reporterUserId: req.user.id,
      reportedUserId,
      reason,
    });

    res.status(201).json({
      success: true,
      data: {
        id: report.id,
        status: report.status,
        pending_reports: pendingCount,
        auto_flagged: autoFlagged,
      },
      message: autoFlagged
        ? "Report submitted. This account has been flagged for administrator review due to multiple reports."
        : "Report submitted for administrator review. Thank you for helping keep the platform safe.",
    });
  } catch (error) {
    next(error);
  }
};
