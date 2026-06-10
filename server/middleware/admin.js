const getAdminEmails = () => {
  const raw = process.env.ADMIN_EMAILS || "";
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

export const isAdminUser = (user) => {
  if (!user?.email) return false;
  const admins = getAdminEmails();
  if (!admins.length) return false;
  return admins.includes(String(user.email).trim().toLowerCase());
};

export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, error: "Not authorized" });
  }

  if (!isAdminUser(req.user)) {
    return res.status(403).json({
      success: false,
      error: "Administrator access required",
    });
  }

  next();
};
