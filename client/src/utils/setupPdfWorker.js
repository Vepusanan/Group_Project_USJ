import { pdfjs } from "react-pdf";

let configured = false;

/**
 * Configure pdf.js worker to match the API version bundled with react-pdf.
 * Worker + wasm assets are copied from node_modules/pdfjs-dist to public/ on install.
 */
export const setupPdfWorker = () => {
  if (configured) return;
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  configured = true;

  if (import.meta.env.DEV) {
    console.info(`[pitch-deck] pdfjs API v${pdfjs.version}`);
  }
};

/** Document options for full fidelity (fonts, CJK maps, JPEG2000 images). */
export const getPdfDocumentOptions = () => ({
  cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
  wasmUrl: "/pdfjs-wasm/",
  isEvalSupported: false,
});

export default setupPdfWorker;
