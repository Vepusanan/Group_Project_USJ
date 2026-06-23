import React, { useEffect, useMemo, useState } from "react";
import { Document, Page } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { dataRoomService } from "../../services/dataRoomService";
import { getPdfDocumentOptions, setupPdfWorker } from "../../utils/setupPdfWorker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

setupPdfWorker();

const SESSION_CACHE_PREFIX = "dataroom-ai-summary:";

const readCachedAnalysis = (documentId) => {
  try {
    const raw = sessionStorage.getItem(`${SESSION_CACHE_PREFIX}${documentId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeCachedAnalysis = (documentId, analysis) => {
  try {
    sessionStorage.setItem(
      `${SESSION_CACHE_PREFIX}${documentId}`,
      JSON.stringify(analysis),
    );
  } catch {
    // ignore quota errors
  }
};

const DataRoomPdfViewer = ({
  open,
  documentId,
  documentName,
  onClose,
}) => {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(760);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  useEffect(() => {
    const updateWidth = () => {
      setPageWidth(Math.min(760, window.innerWidth - 96));
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (!open || !documentId) return undefined;

    let active = true;
    setLoading(true);
    setError("");
    setPdfData(null);
    setNumPages(null);
    setPageNumber(1);
    setAnalysis(null);
    setAnalysisError("");

    const cached = readCachedAnalysis(documentId);
    if (cached) {
      setAnalysis(cached);
    }

    (async () => {
      const result = await dataRoomService.fetchDocument(documentId);
      if (!active) return;
      if (!result.success) {
        setError(result.error || "Unable to load document");
        setLoading(false);
        return;
      }
      setPdfData(result.data);
      setLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [open, documentId]);

  const pdfFile = useMemo(
    () => (pdfData ? { data: pdfData.slice() } : null),
    [pdfData],
  );

  const goToPage = (next) => {
    if (!numPages) return;
    setPageNumber(Math.min(Math.max(1, next), numPages));
  };

  const handleAnalyze = async () => {
    const cached = readCachedAnalysis(documentId);
    if (cached) {
      setAnalysis(cached);
      return;
    }

    setAnalysisLoading(true);
    setAnalysisError("");
    const result = await dataRoomService.analyzeDocument(documentId);
    setAnalysisLoading(false);
    if (!result.success) {
      setAnalysisError(result.error);
      return;
    }
    setAnalysis(result.data);
    writeCachedAnalysis(documentId, result.data);
  };

  const handleDownload = async () => {
    const result = await dataRoomService.downloadDocument(documentId);
    if (!result.success) {
      setError(result.error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface/60 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl max-h-[92vh] rounded-2xl border border-line bg-surface shadow-card flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-content truncate">
              {documentName || "Document"}
            </p>
            <p className="text-xs text-content-muted">Secure in-platform viewer</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={analysisLoading}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-primary/30 text-xs text-primary hover:bg-primary/5 disabled:opacity-50"
            >
              {analysisLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              AI summary
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line text-xs text-content-secondary hover:text-content"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg border border-line text-content-secondary hover:text-content"
              aria-label="Close viewer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 px-4 py-2 border-b border-line bg-surface-alt">
          <button
            type="button"
            onClick={() => goToPage(pageNumber - 1)}
            disabled={pageNumber <= 1}
            className="p-1.5 rounded-lg border border-line disabled:opacity-40"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-content-secondary">
            {pageNumber}{numPages ? ` / ${numPages}` : ""}
          </span>
          <button
            type="button"
            onClick={() => goToPage(pageNumber + 1)}
            disabled={!numPages || pageNumber >= numPages}
            className="p-1.5 rounded-lg border border-line disabled:opacity-40"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {(analysis || analysisError) && (
          <div className="px-4 py-3 border-b border-line bg-primary/5 max-h-48 overflow-y-auto">
            {analysisError && (
              <p className="text-xs text-error">{analysisError}</p>
            )}
            {analysis && (
              <div className="text-xs text-content-secondary space-y-2">
                {analysis.business_overview && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-content-muted mb-0.5">
                      Business overview
                    </p>
                    <p className="text-content">{analysis.business_overview}</p>
                  </div>
                )}
                {analysis.market_opportunity && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-content-muted mb-0.5">
                      Market opportunity
                    </p>
                    <p>{analysis.market_opportunity}</p>
                  </div>
                )}
                {analysis.revenue_model && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-content-muted mb-0.5">
                      Revenue model
                    </p>
                    <p>{analysis.revenue_model}</p>
                  </div>
                )}
                {analysis.traction && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-content-muted mb-0.5">
                      Traction
                    </p>
                    <p>{analysis.traction}</p>
                  </div>
                )}
                {analysis.funding_requirements && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-content-muted mb-0.5">
                      Funding requirements
                    </p>
                    <p>{analysis.funding_requirements}</p>
                  </div>
                )}
                {analysis.key_risks?.length > 0 && (
                  <div>
                    <p className="text-[10px] uppercase tracking-wide text-content-muted mb-0.5">
                      Key risks
                    </p>
                    <ul className="list-disc pl-4">
                      {analysis.key_risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {!analysis.business_overview && analysis.summary && (
                  <p className="font-medium text-content">{analysis.summary}</p>
                )}
                {analysis.document_type && (
                  <p>
                    <span className="text-content-muted">Type:</span> {analysis.document_type}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <div className="flex-1 overflow-auto bg-white p-4">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-error text-center py-12">{error}</p>
          ) : pdfFile ? (
            <Document
              file={pdfFile}
              options={getPdfDocumentOptions()}
              onLoadSuccess={(pdf) => setNumPages(pdf.numPages)}
              loading={
                <div className="flex justify-center py-20">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              }
              className="flex justify-center"
            >
              {numPages != null && (
                <Page
                  pageNumber={pageNumber}
                  width={pageWidth}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              )}
            </Document>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default DataRoomPdfViewer;
