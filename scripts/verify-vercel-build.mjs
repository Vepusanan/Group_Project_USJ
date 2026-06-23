import fs from "fs";
import path from "path";

const dist = path.join(process.cwd(), "client", "dist");
const indexHtml = path.join(dist, "index.html");
const assetsDir = path.join(dist, "assets");

if (!fs.existsSync(indexHtml)) {
  console.error("Vercel build failed: client/dist/index.html is missing.");
  process.exit(1);
}

const html = fs.readFileSync(indexHtml, "utf8");
if (!html.includes("/assets/") || !html.includes(".js")) {
  console.error("Vercel build failed: index.html has no bundled JS asset references.");
  process.exit(1);
}

if (!fs.existsSync(assetsDir)) {
  console.error("Vercel build failed: client/dist/assets is missing.");
  process.exit(1);
}

const jsBundles = fs.readdirSync(assetsDir).filter((file) => file.endsWith(".js"));
if (!jsBundles.length) {
  console.error("Vercel build failed: no JS bundles in client/dist/assets.");
  process.exit(1);
}

console.log(`Vercel build verified (${jsBundles.length} JS bundles in client/dist).`);
