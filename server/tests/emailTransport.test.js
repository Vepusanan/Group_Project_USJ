import test from "node:test";
import assert from "node:assert/strict";
import {
  getEmailFromAddress,
  hasEmailCredentials,
} from "../utils/emailTransport.js";

test("getEmailFromAddress prefers EMAIL_FROM", () => {
  const prevFrom = process.env.EMAIL_FROM;
  const prevUser = process.env.EMAIL_USER;
  process.env.EMAIL_FROM = "from@example.com";
  process.env.EMAIL_USER = "user@example.com";
  assert.equal(getEmailFromAddress(), "from@example.com");
  process.env.EMAIL_FROM = prevFrom;
  process.env.EMAIL_USER = prevUser;
});

test("hasEmailCredentials requires user and pass", () => {
  const prevUser = process.env.EMAIL_USER;
  const prevPass = process.env.EMAIL_PASS;
  const prevHost = process.env.EMAIL_SMTP_HOST;
  delete process.env.EMAIL_SMTP_HOST;
  process.env.EMAIL_USER = "a@b.com";
  process.env.EMAIL_PASS = "secret";
  assert.equal(hasEmailCredentials(), true);
  delete process.env.EMAIL_PASS;
  assert.equal(hasEmailCredentials(), false);
  process.env.EMAIL_USER = prevUser;
  process.env.EMAIL_PASS = prevPass;
  process.env.EMAIL_SMTP_HOST = prevHost;
});
