// Role-Based Access Control (RBAC) middleware — Task T1.2
//
// Centralizes the role + relationship checks that every V2 feature is gated by.
// These guards run AFTER `protect` (which populates `req.user`), so they assume
// `req.user` exists. Apply `protect` first, then one or more of these.
//
// Error shape matches the rest of the codebase: { success: false, error: "..." }.
//
// Design notes:
// - `requireRole` is opt-in per route. We do NOT retrofit existing V1 routes in
//   T1.2 (that risks breaking working flows); new V2 routes apply it by default.
// - `requireConnection` reuses ConnectionRepository.isUsersConnected — no new
//   "are these two connected?" logic is introduced.
// - `requireResourceAccess` is the data-room access hook. The per-document
//   permission table does not exist until T3.2, so this guard accepts an
//   injectable checker and, until one is wired, denies private access by
//   default (fail-closed) while always allowing the resource owner through.

import { isUsersConnected } from "../repositories/ConnectionRepository.js";

const KNOWN_ROLES = new Set(["startup", "investor", "admin"]);

const deny = (res, status, error) =>
  res.status(status).json({ success: false, error });

/**
 * requireRole("admin") or requireRole("startup", "investor")
 * Passes if req.user.user_type is one of the allowed roles.
 */
export const requireRole = (...allowedRoles) => {
  // Guard against typos at wiring time so a misspelled role can't silently
  // lock everyone out.
  for (const role of allowedRoles) {
    if (!KNOWN_ROLES.has(role)) {
      throw new Error(
        `requireRole: unknown role "${role}". Known roles: ${[...KNOWN_ROLES].join(", ")}`,
      );
    }
  }

  return (req, res, next) => {
    if (!req.user) {
      return deny(res, 401, "Not authorized, no user on request.");
    }
    if (!allowedRoles.includes(req.user.user_type)) {
      return deny(
        res,
        403,
        "Access denied. You do not have the required role for this action.",
      );
    }
    return next();
  };
};

/** Convenience guard for admin-only routes (verification review, admin analytics). */
export const requireAdmin = requireRole("admin");

/**
 * requireConnection(getOtherUserId)
 *
 * Ensures the authenticated user has an ACCEPTED connection with another user.
 * `getOtherUserId` is a function (req) => userId that pulls the other party's id
 * from the request (params/body/query) — kept injectable because different
 * routes carry that id in different places.
 *
 * Reuses ConnectionRepository.isUsersConnected (T1.1 finding: it already exists).
 */
export const requireConnection = (getOtherUserId) => {
  return async (req, res, next) => {
    if (!req.user) {
      return deny(res, 401, "Not authorized, no user on request.");
    }

    let otherUserId;
    try {
      otherUserId = getOtherUserId(req);
    } catch {
      otherUserId = null;
    }

    if (!otherUserId) {
      return deny(res, 400, "Could not determine the other user for this request.");
    }

    if (String(otherUserId) === String(req.user.id)) {
      // Self is trivially "related"; let it through so owner-style routes work.
      return next();
    }

    try {
      const connected = await isUsersConnected(req.user.id, otherUserId);
      if (!connected) {
        return deny(
          res,
          403,
          "Access denied. You must be connected with this user.",
        );
      }
      return next();
    } catch (error) {
      console.error("requireConnection check failed:", error.message);
      return deny(res, 500, "Could not verify connection.");
    }
  };
};

/**
 * requireResourceAccess({ getOwnerId, checkAccess })
 *
 * The data-room access guard (used heavily by T3.2). Allows a request if EITHER:
 *   - the requester owns the resource (getOwnerId(req) === req.user.id), OR
 *   - checkAccess(req, req.user) resolves truthy.
 *
 * `checkAccess` is injected so this guard has no hard dependency on the
 * data-room permission table that doesn't exist yet. When T3.2 lands, it passes
 * a checker backed by the per-investor-per-document permission table. Until
 * then, with no checker supplied, non-owners are denied (fail-closed).
 *
 * Both `getOwnerId` and `checkAccess` may be sync or async.
 */
export const requireResourceAccess = ({ getOwnerId, checkAccess } = {}) => {
  return async (req, res, next) => {
    if (!req.user) {
      return deny(res, 401, "Not authorized, no user on request.");
    }

    try {
      if (typeof getOwnerId === "function") {
        const ownerId = await getOwnerId(req);
        if (ownerId && String(ownerId) === String(req.user.id)) {
          return next(); // Owner always has access to their own resource.
        }
      }

      if (typeof checkAccess === "function") {
        const allowed = await checkAccess(req, req.user);
        if (allowed) {
          return next();
        }
      }

      return deny(
        res,
        403,
        "Access denied. You do not have access to this resource.",
      );
    } catch (error) {
      console.error("requireResourceAccess check failed:", error.message);
      return deny(res, 500, "Could not verify resource access.");
    }
  };
};
