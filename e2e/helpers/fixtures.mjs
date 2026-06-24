import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let cached;

export function loadFixtures() {
  if (cached) return cached;
  const filePath = path.join(__dirname, "../.fixtures.json");
  cached = JSON.parse(fs.readFileSync(filePath, "utf8"));
  return cached;
}
