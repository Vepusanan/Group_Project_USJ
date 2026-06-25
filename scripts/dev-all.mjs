#!/usr/bin/env node
/**
 * Start API (5001) + Vite (3000) for local development.
 * Usage: npm run dev:all
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const children = [];

function start(label, command, args, cwd) {
  const child = spawn(command, args, {
    cwd,
    stdio: "inherit",
    env: process.env,
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      console.error(`[dev:${label}] exited with code ${code}`);
    }
  });
  children.push(child);
  return child;
}

console.log("Starting API on http://127.0.0.1:5001");
start("server", "node", ["server.js"], path.join(root, "server"));

console.log("Starting client on http://127.0.0.1:3000");
start(
  "client",
  "npm",
  ["run", "dev", "--", "--port", "3000", "--host", "127.0.0.1"],
  path.join(root, "client"),
);

const shutdown = () => {
  for (const child of children) {
    child.kill("SIGTERM");
  }
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
