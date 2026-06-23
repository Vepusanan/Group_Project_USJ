import {
  buildComparisonData,
  createSnapshot,
  deleteSnapshot,
  listSnapshots,
} from "../repositories/ComparisonRepository.js";

export const compareStartups = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ success: false, error: "Only investors can compare startups" });
    }

    const ids = Array.isArray(req.body.startup_profile_ids)
      ? req.body.startup_profile_ids
      : [];

    if (ids.length === 0 || ids.length > 4) {
      return res.status(400).json({
        success: false,
        error: "Select between 1 and 4 startups to compare",
      });
    }

    const data = await buildComparisonData(req.user.id, ids);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

export const getSnapshots = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ success: false, error: "Only investors can view snapshots" });
    }

    const snapshots = await listSnapshots(req.user.id);
    res.json({ success: true, data: snapshots });
  } catch (error) {
    next(error);
  }
};

export const saveSnapshot = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ success: false, error: "Only investors can save snapshots" });
    }

    const name = String(req.body.name || "").trim();
    const ids = Array.isArray(req.body.startup_profile_ids)
      ? req.body.startup_profile_ids
      : [];

    if (!name) {
      return res
        .status(400)
        .json({ success: false, error: "Snapshot name is required" });
    }

    if (ids.length === 0 || ids.length > 4) {
      return res.status(400).json({
        success: false,
        error: "Select between 1 and 4 startups",
      });
    }

    const snapshot = await createSnapshot({
      investorUserId: req.user.id,
      name,
      startupProfileIds: ids,
    });

    res.status(201).json({ success: true, data: snapshot });
  } catch (error) {
    next(error);
  }
};

export const removeSnapshot = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ success: false, error: "Only investors can delete snapshots" });
    }

    const removed = await deleteSnapshot(req.params.snapshotId, req.user.id);
    if (!removed) {
      return res.status(404).json({ success: false, error: "Snapshot not found" });
    }

    res.json({ success: true, message: "Snapshot deleted" });
  } catch (error) {
    next(error);
  }
};
