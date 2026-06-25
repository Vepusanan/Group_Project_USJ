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
    label: "UNVERIFIED",
    session: {
      user: { id: "1", email: "a@test.com" },
      redirectPath: "/verify-email?email=a%40test.com",
      authState: buildAuthStatePayload({
        emailVerified: false,
        onboardingComplete: false,
        requiredRoute: "/verify-email?email=a%40test.com",
      }),
    },
    expected: AUTH_STATUS.UNVERIFIED,
  },
  {
    label: "ONBOARDING_INCOMPLETE",
    session: {
      user: { id: "1" },
      redirectPath: "/onboarding",
      authState: buildAuthStatePayload({
        emailVerified: true,
        onboardingComplete: false,
        requiredRoute: "/onboarding",
      }),
    },
    expected: AUTH_STATUS.ONBOARDING_INCOMPLETE,
  },
  {
    label: "VERIFIED_READY",
    session: {
      user: { id: "1" },
      redirectPath: "/dashboard",
      authState: buildAuthStatePayload({
        emailVerified: true,
        onboardingComplete: true,
        requiredRoute: null,
      }),
    },
    expected: AUTH_STATUS.VERIFIED_READY,
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
    /@shared\/authStateMachine/,
    "must import from @shared/authStateMachine",
  );
}

requirePattern(
  "server/utils/authSession.js",
  read("server/utils/authSession.js"),
  /validateAuthSessionContract/,
  "must validate session contract in buildAuthSession",
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
