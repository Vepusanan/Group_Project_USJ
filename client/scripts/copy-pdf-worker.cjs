const fs = require("fs");
const path = require("path");

const pdfjsDist = path.join(__dirname, "..", "node_modules", "pdfjs-dist");
const publicDir = path.join(__dirname, "..", "public");

const copyFile = (source, target) => {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

const copyDir = (sourceDir, targetDir) => {
  if (!fs.existsSync(sourceDir)) return;
  fs.mkdirSync(targetDir, { recursive: true });
  for (const entry of fs.readdirSync(sourceDir, { withFileTypes: true })) {
    const from = path.join(sourceDir, entry.name);
    const to = path.join(targetDir, entry.name);
    if (entry.isDirectory()) {
      copyDir(from, to);
    } else {
      fs.copyFileSync(from, to);
    }
  }
};

const workerSource = path.join(pdfjsDist, "build", "pdf.worker.min.mjs");
if (!fs.existsSync(workerSource)) {
  console.warn("[copy-pdf-worker] pdfjs-dist worker not found — run npm install first");
  process.exit(0);
}

copyFile(workerSource, path.join(publicDir, "pdf.worker.min.mjs"));
copyDir(path.join(pdfjsDist, "wasm"), path.join(publicDir, "pdfjs-wasm"));

console.log("[copy-pdf-worker] Copied pdf.worker.min.mjs and wasm assets to public/");
