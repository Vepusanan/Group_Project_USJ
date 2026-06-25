import test from "node:test";
import assert from "node:assert/strict";
import { onboardingPathForUserType } from "../utils/authRedirects.js";

test("onboardingPathForUserType maps startup and investor roles", () => {
  assert.equal(onboardingPathForUserType("startup"), "/onboarding");
  assert.equal(onboardingPathForUserType("investor"), "/investor-onboarding");
});
