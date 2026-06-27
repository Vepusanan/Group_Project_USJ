import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Document, Page } from "react-pdf";
import { BarChart2, Loader2 } from "lucide-react";
import pitchDeckService from "../../services/pitchDeckService";
import { getPdfDocumentOptions, setupPdfWorker } from "../../utils/setupPdfWorker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

setupPdfWorker();

// Computed once. react-pdf reloads the document whenever the `options` prop
// changes by reference, so a fresh object each render makes <Document> reload
// mid-parse and surface "Failed to load PDF file".
const PDF_DOCUMENT_OPTIONS = getPdfDocumentOptions();

const PitchDeckSlidePreview = ({ startupProfileId, companyName }) => {
  const [pdfData, setPdfData] = useState(null);
  const [numPages, setNumPages] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewError, setPreviewError] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError("");

      const meta = await pitchDeckService.getMeta(startupProfileId);
      if (!active) return;
      if (!meta.success || !meta.data?.is_pdf) {
        setError(meta.error || "Pitch deck unavailable");
        setLoading(false);
        return;
      }

      const file = await pitchDeckService.fetchFileData(startupProfileId);
      if (!active) return;
      if (!file.success) {
        setError(file.error || "Unable to load preview");
        setLoading(false);
        return;
      }

      setPdfData(file.data);
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [startupProfileId]);

  const pdfFile = useMemo(
    () => (pdfData ? { data: pdfData.slice() } : null),
    [pdfData],
  );

  const viewerPath = `/startups/${startupProfileId}/pitch-deck`;

  return (
    <div className="rounded-xl border border-line bg-surface-alt overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4">
        <div className="w-full sm:w-44 flex-shrink-0">
          <div className="aspect-[4/3] rounded-lg border border-line bg-white overflow-hidden flex items-center justify-center">
            {loading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : error || !pdfFile || previewError ? (
              <BarChart2 className="w-8 h-8 text-content-muted/40" />
            ) : (
              <Document
                file={pdfFile}
                options={PDF_DOCUMENT_OPTIONS}
                onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
                onLoadError={() => setPreviewError(true)}
                loading={
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                }
                error={<BarChart2 className="w-8 h-8 text-content-muted/40" />}
                className="w-full h-full flex items-center justify-center"
              >
                <Page
                  pageNumber={1}
                  width={160}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            )}
          </div>
          {numPages ? (
            <p className="text-[11px] text-content-muted text-center mt-1.5">
              {numPages} slide{numPages === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
          <p className="text-sm font-medium text-content">Interactive Pitch Deck</p>
          <p className="text-xs text-content-muted">
            Preview the opening slide and open the secure in-platform viewer for{" "}
            {companyName || "this startup"}.
          </p>
          <Link
            to={viewerPath}
            className="inline-flex items-center justify-center gap-2 self-start px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-sm !text-content-inverse font-medium transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            View Pitch Deck
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PitchDeckSlidePreview;
