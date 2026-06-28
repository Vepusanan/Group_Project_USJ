import {
  listReports,
  getReportById,
  dismissReport,
  resolveReportsForUser,
  suspendUser,
  deactivateUser,
  reactivateUser,
} from "../repositories/ProfileReportRepository.js";
import { getUserById } from "../repositories/ConnectionRepository.js";
import { logAdminAction } from "../repositories/AdminActionLogRepository.js";
import { getClientIp } from "../repositories/UserActivityRepository.js";

export const listFraudReports = async (req, res, next) => {
  try {
    const status = req.query.status ? String(req.query.status) : undefined;
    const reports = await listReports({ status });
    res.json({ success: true, data: reports });
  } catch (error) {
    next(error);
  }
};

export const dismissFraudReport = async (req, res, next) => {
  try {
    const existing = await getReportById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, error: "Report not found" });
    }
    const report = await dismissReport({ id: req.params.id });
    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "fraud_report_dismissed",
      targetType: "profile_report",
      targetId: req.params.id,
      metadata: { reported_user_id: existing.reported_user_id },
      clientIp: getClientIp(req),
    });
    res.json({ success: true, data: report });
  } catch (error) {
    next(error);
  }
};

const ensureTargetUser = async (req, res) => {
  const userId = req.params.userId;
  if (String(userId) === String(req.user.id)) {
    res.status(400).json({ success: false, error: "You cannot moderate your own account" });
    return null;
  }
  const target = await getUserById(userId);
  if (!target) {
    res.status(404).json({ success: false, error: "User not found" });
    return null;
  }
  return userId;
};

export const suspendUserAccount = async (req, res, next) => {
  try {
    const userId = await ensureTargetUser(req, res);
    if (!userId) return;
    const days = Number(req.body.days);
    if (!Number.isFinite(days) || days < 1) {
      return res.status(400).json({ success: false, error: "Provide a suspension length in days (>= 1)" });
    }
    const reason = String(req.body.reason || "").trim();
    const result = await suspendUser(userId, days);
    await resolveReportsForUser({ userId, status: "RESOLVED", reviewedBy: req.user.id });
    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "user_suspended",
      targetType: "user",
      targetId: userId,
      metadata: { days, reason },
      clientIp: getClientIp(req),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const deactivateUserAccount = async (req, res, next) => {
  try {
    const userId = await ensureTargetUser(req, res);
    if (!userId) return;
    const reason = String(req.body.reason || "").trim();
    const result = await deactivateUser(userId);
    await resolveReportsForUser({ userId, status: "RESOLVED", reviewedBy: req.user.id });
    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "user_deactivated",
      targetType: "user",
      targetId: userId,
      metadata: { reason },
      clientIp: getClientIp(req),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const reactivateUserAccount = async (req, res, next) => {
  try {
    const userId = req.params.userId;
    const target = await getUserById(userId);
    if (!target) {
      return res.status(404).json({ success: false, error: "User not found" });
    }
    const result = await reactivateUser(userId);
    await logAdminAction({
      adminUserId: req.user.id,
      actionType: "user_reactivated",
      targetType: "user",
      targetId: userId,
      metadata: {},
      clientIp: getClientIp(req),
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
