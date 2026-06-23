import {
  getVerificationRequestById,
  listPendingVerificationRequests,
  resolveVerificationRequest,
} from "../repositories/VerificationRepository.js";
import { sendVerificationDecisionEmail } from "../utils/emailServices.js";
import { logAdminAction } from "../repositories/AdminActionLogRepository.js";
import { getClientIp } from "../repositories/UserActivityRepository.js";

export const listPendingVerifications = async (req, res, next) => {
  try {
    const requests = await listPendingVerificationRequests();
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

export const approveVerificationRequest = async (req, res, next) => {
  try {
    const existing = await getVerificationRequestById(req.params.requestId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }
    if (existing.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "This request has already been reviewed",
      });
    }

    const tier =
      existing.requested_tier === "BUSINESS_VERIFIED"
        ? "BUSINESS_VERIFIED"
        : "IDENTITY_VERIFIED";

    const resolved = await resolveVerificationRequest({
      requestId: req.params.requestId,
      status: "approved",
      reviewedBy: req.user.id,
      approvedTier: tier,
    });

    if (!resolved) {
      return res.status(400).json({
        success: false,
        error: "Unable to approve request",
      });
    }

    await sendVerificationDecisionEmail({
      email: existing.email,
      fullName: existing.full_name,
      approved: true,
      tier,
    });

    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "verification_approved",
      targetType: "verification_request",
      targetId: req.params.requestId,
      metadata: { tier, user_id: existing.user_id },
      clientIp: getClientIp(req),
    });

    res.json({ success: true, data: resolved });
  } catch (error) {
    next(error);
  }
};

export const rejectVerificationRequest = async (req, res, next) => {
  try {
    const reason = String(req.body.reason || "").trim();
    if (!reason) {
      return res.status(400).json({
        success: false,
        error: "A rejection reason is required",
      });
    }

    const existing = await getVerificationRequestById(req.params.requestId);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Request not found" });
    }
    if (existing.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: "This request has already been reviewed",
      });
    }

    const resolved = await resolveVerificationRequest({
      requestId: req.params.requestId,
      status: "rejected",
      reviewedBy: req.user.id,
      rejectionReason: reason,
    });

    if (!resolved) {
      return res.status(400).json({
        success: false,
        error: "Unable to reject request",
      });
    }

    await sendVerificationDecisionEmail({
      email: existing.email,
      fullName: existing.full_name,
      approved: false,
      tier: existing.requested_tier,
      rejectionReason: reason,
    });

    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "verification_rejected",
      targetType: "verification_request",
      targetId: req.params.requestId,
      metadata: { reason, user_id: existing.user_id },
      clientIp: getClientIp(req),
    });

    res.json({ success: true, data: resolved });
  } catch (error) {
    next(error);
  }
};
