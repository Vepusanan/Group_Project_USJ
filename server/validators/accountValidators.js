// Validation chains for /api/account routes (NFR 17.2).
//
// Mirrors the existing controller checks (changeEmail / changePassword /
// deleteAccount) but enforces them before the handler runs. Kept lenient enough
// not to reject any request the controllers currently accept.

import { body } from "express-validator";

export const changeEmailValidator = [
  body("newEmail")
    .exists({ checkFalsy: true })
    .withMessage("New email address is required")
    .bail()
    .isString()
    .withMessage("Email must be a string")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 254 })
    .withMessage("Email is too long"),
];

export const changePasswordValidator = [
  body("currentPassword")
    .exists({ checkFalsy: true })
    .withMessage("Current password is required")
    .bail()
    .isString()
    .withMessage("Current password must be a string"),
  body("newPassword")
    .exists({ checkFalsy: true })
    .withMessage("New password is required")
    .bail()
    .isString()
    .withMessage("New password must be a string")
    .isLength({ min: 8, max: 200 })
    .withMessage("New password must be at least 8 characters"),
];

export const deleteAccountValidator = [
  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required to delete your account")
    .bail()
    .isString()
    .withMessage("Password must be a string"),
];
