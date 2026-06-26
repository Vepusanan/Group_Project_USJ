/**
 * CI guard: auth state machine contract must stay aligned across server and client.
 */
import fs from "node:fs";
import path from "node:path";
import {
  AUTH_STATUS,
  buildAuthStatePayload,
  getAuthState,
  validateAuthSessionContract,
} from "../shared/authStateMachine.mjs";

const root = process.cwd();
const errors = [];

const ONBOARDED_AT = "2024-06-01T12:00:00.000Z";

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function requirePattern(label, source, pattern, message) {
  if (!pattern.test(source)) {
    errors.push(`${label}: ${message}`);
  }
}

const samples = [
  {
    label: "EMAIL_UNVERIFIED",
    session: {
      user: { id: "1", email: "a@test.com" },
      redirectPath: "/verify-email?email=a%40test.com",
      authState: buildAuthStatePayload({
        emailVerified: false,
        onboardingCompletedAt: null,
        requiredRoute: "/verify-email?email=a%40test.com",
      }),
    },
    expected: AUTH_STATUS.EMAIL_UNVERIFIED,
  },
  {
    label: "ONBOARDING_REQUIRED",
    session: {
      user: { id: "1" },
      redirectPath: "/onboarding",
      authState: buildAuthStatePayload({
        emailVerified: true,
        onboardingCompletedAt: null,
        requiredRoute: "/onboarding",
      }),
    },
    expected: AUTH_STATUS.ONBOARDING_REQUIRED,
  },
  {
    label: "AUTHENTICATED_READY",
    session: {
      user: { id: "1" },
      redirectPath: "/dashboard",
      authState: buildAuthStatePayload({
        emailVerified: true,
        onboardingCompletedAt: ONBOARDED_AT,
        requiredRoute: null,
      }),
    },
    expected: AUTH_STATUS.AUTHENTICATED_READY,
  },
];

for (const sample of samples) {
  const { valid, errors: contractErrors } = validateAuthSessionContract(
    sample.session,
  );
  if (!valid) {
    errors.push(
      `${sample.label} contract invalid: ${contractErrors.join("; ")}`,
    );
  }
  const machine = getAuthState(sample.session);
  if (machine.status !== sample.expected) {
    errors.push(
      `${sample.label}: expected ${sample.expected}, got ${machine.status}`,
    );
  }
}

const frontendFiles = [
  {
    file: "client/src/context/AuthContext.jsx",
    patterns: [/getAuthState/],
  },
  {
    file: "client/src/hooks/useAuthRouteGuard.js",
    patterns: [/getAuthState/, /resolveAuthRouteDecision/],
  },
  {
    file: "client/src/components/routing/ProtectedAppLayout.jsx",
    patterns: [/useAuthRouteGuard/],
  },
];

for (const { file, patterns } of frontendFiles) {
  const source = read(file);
  for (const pattern of patterns) {
    requirePattern(file, source, pattern, `must match ${pattern}`);
  }
  requirePattern(
    file,
    source,
    /authStateMachine/,
    "must import authStateMachine",
  );
}

const sharedMachine = read("shared/authStateMachine.mjs").replace(/\r\n/g, "\n");
const clientMachine = read("client/src/utils/authStateMachine.js").replace(/\r\n/g, "\n");
if (sharedMachine !== clientMachine) {
  errors.push(
    "client/src/utils/authStateMachine.js must stay in sync with shared/authStateMachine.mjs",
  );
}

requirePattern(
  "server/utils/authSession.js",
  read("server/utils/authSession.js"),
  /validateAuthSessionContract/,
  "must validate session contract in buildAuthSession",
);

requirePattern(
  "server/utils/authSession.js",
  read("server/utils/authSession.js"),
  /onboarding_completed_at|hasCompletedOnboarding/,
  "must derive onboarding from users.onboarding_completed_at",
);

requirePattern(
  "server/routes/auth.js",
  read("server/routes/auth.js"),
  /protectSession/,
  "GET /auth/me must use protectSession",
);

if (errors.length) {
  console.error("Auth state contract validation failed:\n");
  for (const err of errors) {
    console.error(`  • ${err}`);
  }
  process.exit(1);
}

console.log("Auth state contract validation passed.");
