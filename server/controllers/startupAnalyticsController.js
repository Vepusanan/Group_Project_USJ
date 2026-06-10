import { getStartupAnalyticsDashboard } from "../services/startupAnalyticsService.js";

const VALID_PERIODS = new Set(["7d", "30d", "all"]);

export const getMyStartupAnalytics = async (req, res, next) => {
  try {
    if (req.user.user_type !== "startup") {
      return res.status(403).json({
        success: false,
        error: "Only startup accounts can access analytics",
      });
    }

    const period = String(req.query.period || "30d").toLowerCase();
    if (!VALID_PERIODS.has(period)) {
      return res.status(400).json({
        success: false,
        error: "Invalid period. Use 7d, 30d, or all",
      });
    }

    const data = await getStartupAnalyticsDashboard(req.user.id, period);

    res.json({ success: true, data });
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
};
