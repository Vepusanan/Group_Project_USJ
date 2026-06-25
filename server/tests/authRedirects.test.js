import test from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import {
  onboardingPathForUserType,
  resolvePostAuthRedirectPath,
} from "../utils/authRedirects.js";

test("resolvePostAuthRedirectPath sends new users to onboarding", async () => {
  const path = await resolvePostAuthRedirectPath({
    id: "00000000-0000-4000-8000-000000000099",
    user_type: "startup",
  });
  assert.equal(path, onboardingPathForUserType("startup"));
});

test("resolvePostAuthRedirectPath sends investors without profiles to investor onboarding", async () => {
  const path = await resolvePostAuthRedirectPath({
    id: "00000000-0000-4000-8000-000000000098",
    user_type: "investor",
  });
  assert.equal(path, "/investor-onboarding");
});
