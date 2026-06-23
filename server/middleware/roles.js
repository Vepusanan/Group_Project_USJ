export const requireStartup = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authorized" });
  }
  if (req.user.user_type !== "startup") {
    return res.status(403).json({
      success: false,
      error: "Startup account required",
    });
  }
  next();
};

export const requireInvestor = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authorized" });
  }
  if (req.user.user_type !== "investor") {
    return res.status(403).json({
      success: false,
      error: "Investor account required",
    });
  }
  next();
};
