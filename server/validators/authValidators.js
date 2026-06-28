// Validation chains for /api/auth routes (NFR 17.2).
//
// These run BEFORE the auth controllers and only reject input the controllers
// would reject anyway (missing/malformed fields) plus obvious abuse (oversized
// payloads, bad types). They are intentionally NOT stricter than the existing
// frontend rules, so no currently-valid request is broken.
//
// Notably, the LOGIN password is only required to be a non-empty string — it is
// NOT length-checked, because legacy accounts may predate the 10-char rule and
// must still be able to log in.

import { body } from "express-validator";

const email = () =>
  body("email")
    .exists({ checkFalsy: true })
    .withMessage("Email is required")
    .bail()
    .isString()
    .withMessage("Email must be a string")
    .trim()
    .isEmail()
    .withMessage("A valid email address is required")
    .normalizeEmail({ gmail_remove_dots: false })
    .isLength({ max: 254 })
    .withMessage("Email is too long");

export const registerValidator = [
  email(),
  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string")
    .isLength({ min: 8, max: 200 })
    .withMessage("Password must be at least 8 characters"),
  body("fullName")
    .exists({ checkFalsy: true })
    .withMessage("Full name is required")
    .bail()
    .isString()
    .withMessage("Full name must be a string")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("Full name must be between 2 and 120 characters"),
  body("userType")
    .exists({ checkFalsy: true })
    .withMessage("User type is required")
    .bail()
    .isIn(["startup", "investor"])
    .withMessage("User type must be startup or investor"),
  body("agreedToTerms")
    .custom((value) => value === true || value === "true")
    .withMessage("You must accept the terms and conditions"),
];

export const loginValidator = [
  email(),
  // Length intentionally NOT enforced — legacy passwords must still log in.
  body("password")
    .exists({ checkFalsy: true })
    .withMessage("Password is required")
    .bail()
    .isString()
    .withMessage("Password must be a string"),
  body("rememberMe")
    .optional()
    .isBoolean()
    .withMessage("rememberMe must be a boolean"),
];

export const forgotPasswordValidator = [email()];

export const resetPasswordValidator = [
  body("token")
    .exists({ checkFalsy: true })
    .withMessage("Reset token is required")
    .bail()
    .isString()
    .withMessage("Reset token must be a string")
    .trim(),
  body("newPassword")
    .exists({ checkFalsy: true })
    .withMessage("New password is required")
    .bail()
    .isString()
    .withMessage("New password must be a string")
    .isLength({ min: 8, max: 200 })
    .withMessage("New password must be at least 8 characters"),
];

export const resendVerificationValidator = [email()];
