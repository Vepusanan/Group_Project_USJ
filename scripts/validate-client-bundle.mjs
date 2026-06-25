/**
 * Static + build-time guards for client startup dependencies.
 * Catches missing imports (e.g. axios) before deployment.
 */
import fs from "node:fs";
import path from "node:path";

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

const criticalModules = [
  {
    file: "client/src/services/apiClient.js",
    checks: [
      {
        pattern: /^import\s+axios\s+from\s+["']axios["'];?\s*$/m,
        message: 'must include `import axios from "axios"`',
      },
      {
        pattern: /axios\.create\s*\(/,
        message: "uses axios.create()",
      },
    ],
  },
  {
    file: "client/src/main.jsx",
    checks: [
      {
        pattern: /ReactDOM\.createRoot/,
        message: "must mount React via createRoot",
      },
      {
        pattern: /installStartupMonitoring/,
        message: "must install startup monitoring before render",
      },
    ],
  },
  {
    file: "client/src/App.jsx",
    checks: [
      {
        pattern: /ErrorBoundary/,
        message: "must wrap the app in ErrorBoundary",
      },
    ],
  },
  {
    file: "client/src/components/routing/ProtectedAppLayout.jsx",
    checks: [
      {
        pattern: /useAuthRouteGuard/,
        message: "route guards must use useAuthRouteGuard (state machine)",
      },
      {
        pattern: /@shared\/authStateMachine/,
        message: "must import auth state machine from @shared",
      },
    ],
  },
];

for (const mod of criticalModules) {
  if (!fs.existsSync(path.join(root, mod.file))) {
    errors.push(`${mod.file}: file missing`);
    continue;
  }
  const source = read(mod.file);
  for (const check of mod.checks) {
    requirePattern(mod.file, source, check.pattern, check.message);
  }
}

const distIndex = path.join(root, "client", "dist", "index.html");
if (fs.existsSync(distIndex)) {
  const html = read("client/dist/index.html");
  if (!html.includes('type="module"') || !html.includes("/assets/")) {
    errors.push("client/dist/index.html: missing module script asset references");
  }

  const assetsDir = path.join(root, "client", "dist", "assets");
  const jsFiles = fs.readdirSync(assetsDir).filter((f) => f.endsWith(".js"));
  const mainBundle = jsFiles.find((f) => f.startsWith("index-"));
  if (mainBundle) {
    const bundle = fs.readFileSync(path.join(assetsDir, mainBundle), "utf8");
    if (/\baxios\.create\s*\(/.test(bundle)) {
      const hasAxiosChunk =
        html.includes("axios-vendor") ||
        jsFiles.some((f) => f.startsWith("axios-vendor"));
      if (!hasAxiosChunk) {
        errors.push(
          `${mainBundle}: references axios.create but axios-vendor chunk is not linked from index.html`,
        );
      }
    }
  }
} else {
  console.warn(
    "validate-client-bundle: client/dist not found — skipping built bundle checks (run after build in CI).",
  );
}

if (errors.length) {
  console.error("Client bundle validation failed:\n");
  for (const err of errors) {
    console.error(`  • ${err}`);
  }
  process.exit(1);
}

console.log("Client bundle validation passed.");
