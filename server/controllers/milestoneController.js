import pool from "../config/database.js";
import { getStartupProfileById, getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import {
  MILESTONE_CATEGORIES,
  createMilestone,
  deleteMilestone,
  getMilestoneById,
  listMilestonesForStartup,
  updateMilestone,
} from "../repositories/MilestoneRepository.js";
import { sendMilestonePublishedEmail } from "../utils/emailServices.js";

const assertStartupOwner = async (req) => {
  const profile = await getStartupProfileByUserId(req.user.id);
  if (!profile) {
    const error = new Error("Startup profile not found");
    error.statusCode = 404;
    throw error;
  }
  return profile;
};

export const listStartupMilestones = async (req, res, next) => {
  try {
    const profile = await getStartupProfileById(req.params.startupProfileId);
    if (!profile) {
      return res.status(404).json({ success: false, error: "Profile not found" });
    }

    const milestones = await listMilestonesForStartup(profile.startup_profile_id);
    res.json({ success: true, data: milestones });
  } catch (error) {
    next(error);
  }
};

export const createStartupMilestone = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const category = String(req.body.category || "").toUpperCase();
    const headline = String(req.body.headline || "").trim();
    const description = String(req.body.description || "").trim();
    const milestoneDate = req.body.milestone_date || null;

    if (!MILESTONE_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, error: "Invalid milestone category" });
    }
    if (!headline) {
      return res.status(400).json({ success: false, error: "Headline is required" });
    }
    if (!description || description.length > 500) {
      return res.status(400).json({
        success: false,
        error: "Description is required and must be 500 characters or fewer",
      });
    }

    const milestone = await createMilestone({
      startupProfileId: profile.startup_profile_id,
      category,
      headline,
      description,
      milestoneDate,
    });

    const investors = await pool.query(
      `
        SELECT u.email, u.full_name
        FROM public.connections c
        JOIN public.users u ON u.id = c.investor_id
        WHERE c.startup_id = $1
          AND LOWER(c.status) IN ('accepted', 'connected')
      `,
      [req.user.id],
    );

    for (const investor of investors.rows) {
      sendMilestonePublishedEmail({
        email: investor.email,
        fullName: investor.full_name,
        companyName: profile.company_name,
        headline,
      }).catch(() => undefined);
    }

    res.status(201).json({ success: true, data: milestone });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

export const updateStartupMilestone = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const milestone = await getMilestoneById(req.params.milestoneId);
    if (!milestone || milestone.startup_profile_id !== profile.startup_profile_id) {
      return res.status(404).json({ success: false, error: "Milestone not found" });
    }

    const updates = {};
    if (req.body.category) {
      const category = String(req.body.category).toUpperCase();
      if (!MILESTONE_CATEGORIES.includes(category)) {
        return res.status(400).json({ success: false, error: "Invalid category" });
      }
      updates.category = category;
    }
    if (req.body.headline !== undefined) updates.headline = String(req.body.headline).trim();
    if (req.body.description !== undefined) {
      const description = String(req.body.description).trim();
      if (!description || description.length > 500) {
        return res.status(400).json({
          success: false,
          error: "Description must be 1–500 characters",
        });
      }
      updates.description = description;
    }
    if (req.body.milestone_date !== undefined) {
      updates.milestone_date = req.body.milestone_date || null;
    }

    const updated = await updateMilestone(req.params.milestoneId, updates);
    res.json({ success: true, data: updated });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};

export const deleteStartupMilestone = async (req, res, next) => {
  try {
    const profile = await assertStartupOwner(req);
    const milestone = await getMilestoneById(req.params.milestoneId);
    if (!milestone || milestone.startup_profile_id !== profile.startup_profile_id) {
      return res.status(404).json({ success: false, error: "Milestone not found" });
    }

    await deleteMilestone(req.params.milestoneId);
    res.json({ success: true });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        error: error.message,
      });
    }
    next(error);
  }
};
