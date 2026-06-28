// Request validation
//
// Centralised input validation + sanitisation built on express-validator
// (NFR 17.2 — Security). Each route defines a chain of validators; `runValidation`
// is appended to the chain and short-circuits the request with a 400 if any
// rule fails, BEFORE the controller runs.
//
// Error shape matches what the existing controllers already return
// ({ success: false, error: "<message>" }) so the frontend's error handling
// stays unchanged. An `errors` array is also included for clients that want
// field-level detail.

import { validationResult } from "express-validator";

/**
 * Terminal middleware for a validator chain. Collects the results gathered by
 * the preceding express-validator middlewares and, if any failed, responds with
 * a 400 in the project's standard error shape. Otherwise calls next().
 */
export const runValidation = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array({ onlyFirstError: true });

  return res.status(400).json({
    success: false,
    // First message keeps parity with the controllers' single-string errors.
    error: errors[0]?.msg || "Invalid request data",
    errors: errors.map((e) => ({
      field: e.path,
      message: e.msg,
    })),
  });
};

/**
 * Helper to attach `runValidation` to the end of a chain so route files can
 * write `validate(rules)` instead of `[...rules, runValidation]`.
 *
 * @param {import('express-validator').ValidationChain[]} chain
 * @returns {Array}
 */
export const validate = (chain) => [...chain, runValidation];
