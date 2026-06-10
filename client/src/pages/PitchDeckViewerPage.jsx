import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Document, Page } from "react-pdf";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Shield,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { usePitchDeckSession } from "../hooks/usePitchDeckSession";
import pitchDeckService from "../services/pitchDeckService";
import { getPdfDocumentOptions, setupPdfWorker } from "../utils/setupPdfWorker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "../styles/pitchDeckViewer.css";

setupPdfWorker();

const enableAllOptionalContent = async (pdf) => {
  try {
    const config = await pdf.getOptionalContentConfig();
    if (!config) return;

    for (const [groupId] of config) {
      config.setVisibility(groupId, true);
    }
  } catch {
    // Optional content not used in this PDF.
  }
};

const PitchDeckViewerPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [meta, setMeta] = useState(null);
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [documentError, setDocumentError] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(900);
  const [analysis, setAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const trackSession = user?.userType === "investor";
  usePitchDeckSession({
    startupProfileId: id,
    enabled: trackSession,
    currentPage: pageNumber,
    totalPages: numPages,
  });

  const requestAnalysis = async () => {
    setAnalysisLoading(true);
    setAnalysisError("");
    const result = await pitchDeckService.analyzeDeck(id);
    setAnalysisLoading(false);
    if (!result.success) {
      setAnalysisError(result.error || "Analysis unavailable");
      return;
    }
    setAnalysis(result.data);
  };

  useEffect(() => {
    const updateWidth = () => {
      setPageWidth(Math.min(920, window.innerWidth - 64));
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setLoadError("");
      setDocumentError("");
      setPdfData(null);
      setNumPages(null);
      setPageNumber(1);

      const metaResult = await pitchDeckService.getMeta(id);
      if (!active) return;

      if (!metaResult.success) {
        setLoadError(metaResult.error || "Unable to open pitch deck");
        setLoading(false);
        return;
      }

      const fileResult = await pitchDeckService.fetchFileData(id);
      if (!active) return;

      if (!fileResult.success) {
        setLoadError(fileResult.error || "Unable to load pitch deck file");
        setLoading(false);
        return;
      }

      setMeta(metaResult.data);
      setPdfData(fileResult.data);
      setLoading(false);
    };

    load();
    return () => {
      active = false;
    };
  }, [id]);

  const goToPage = (nextPage) => {
    if (!numPages) return;
    setPageNumber(Math.min(Math.max(1, nextPage), numPages));
  };

  const displayError = loadError || documentError;

  const pdfFile = useMemo(
    () => (pdfData ? { data: pdfData.slice() } : null),
    [pdfData],
  );

  const pdfOptions = useMemo(() => getPdfDocumentOptions(), []);

  const handleDocumentLoad = async (pdf) => {
    setNumPages(pdf.numPages);
    setPageNumber(1);
    await enableAllOptionalContent(pdf);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-page">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-content-muted">Loading pitch deck…</p>
      </div>
    );
  }

  if (displayError || !pdfData) {
    return (
      <div className="min-h-screen px-4 py-10 bg-page">
        <div className="mx-auto max-w-lg rounded-2xl border border-line bg-surface-alt p-6 text-center">
          <p className="text-error">{displayError || "Unable to open pitch deck"}</p>
          <button
            type="button"
            onClick={() => navigate(`/startups/${id}`)}
            className="mt-4 px-4 py-2 rounded-lg border border-line text-content-secondary hover:text-content"
          >
            Back to profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-page"
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur px-4 py-2">
        <div className="mx-auto max-w-5xl flex items-center justify-between gap-3 flex-wrap">
          {/* Compact single-line header */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Link
              to={`/startups/${id}`}
              className="inline-flex items-center gap-1 text-sm leading-none text-content-secondary hover:text-content shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Link>
            <span className="text-line text-content-muted/30 shrink-0">|</span>
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <span className="text-sm font-semibold text-content truncate leading-none">
              {meta?.company_name || "Pitch Deck"}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-content-muted leading-none shrink-0">
              <Shield className="w-3 h-3" />
              Secure viewer
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            {(user?.userType === "investor" || user?.userType === "startup") && (
              <button
                type="button"
                onClick={requestAnalysis}
                disabled={analysisLoading}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary-light/40 bg-primary/10 text-sm leading-none text-primary hover:bg-primary/15 disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                {analysisLoading ? "Analysing…" : "Analyse with AI"}
              </button>
            )}
            <button
              type="button"
              onClick={() => goToPage(pageNumber - 1)}
              disabled={pageNumber <= 1}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line text-sm leading-none text-content-secondary hover:text-content disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous</span>
            </button>
            <span className="text-sm text-content-secondary px-1.5 leading-none whitespace-nowrap">
              {pageNumber}{numPages ? ` / ${numPages}` : ""}
            </span>
            <button
              type="button"
              onClick={() => goToPage(pageNumber + 1)}
              disabled={!numPages || pageNumber >= numPages}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-line text-sm leading-none text-content-secondary hover:text-content disabled:opacity-40"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {(analysis || analysisError) && (user?.userType === "investor" || user?.userType === "startup") && (
        <div className="px-4 pt-4">
          <div className="mx-auto max-w-5xl rounded-2xl border border-line bg-surface p-4 md:p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-content">AI deck analysis</h2>
            </div>
            {analysisError ? (
              <p className="text-sm text-error">{analysisError}</p>
            ) : (
              <>
                {analysis?.summary && (
                  <p className="text-sm text-content-secondary">{analysis.summary}</p>
                )}
                {analysis?.strengths?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-content-muted uppercase tracking-wide mb-1">
                      Strengths
                    </p>
                    <ul className="text-sm text-content-secondary list-disc pl-5 space-y-1">
                      {analysis.strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis?.missing_sections?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-content-muted uppercase tracking-wide mb-1">
                      Missing or weak sections
                    </p>
                    <ul className="text-sm text-content-secondary list-disc pl-5 space-y-1">
                      {analysis.missing_sections.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis?.improvement_suggestions?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-content-muted uppercase tracking-wide mb-1">
                      Improvement suggestions
                    </p>
                    <ul className="text-sm text-content-secondary list-disc pl-5 space-y-1">
                      {analysis.improvement_suggestions.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {analysis?.observations?.length > 0 && !analysis?.improvement_suggestions?.length && (
                  <div>
                    <p className="text-xs font-medium text-content-muted uppercase tracking-wide mb-1">
                      Observations
                    </p>
                    <ul className="text-sm text-content-secondary list-disc pl-5 space-y-1">
                      {analysis.observations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="px-4 py-4">
        <div className="mx-auto max-w-5xl rounded-2xl border border-line bg-white p-3 md:p-4 overflow-auto min-h-[480px]">
          <Document
            key={id}
            file={pdfFile}
            options={pdfOptions}
            onLoadSuccess={handleDocumentLoad}
            onLoadError={(loadError) => {
              console.error("Pitch deck render error:", loadError);
              setDocumentError(
                loadError?.message ||
                  "Failed to render pitch deck PDF. Ensure the file is a valid PDF.",
              );
            }}
            loading={
              <div className="flex justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            }
            className="flex justify-center"
          >
            {numPages != null && (
              <Page
                key={`page-${pageNumber}`}
                pageNumber={pageNumber}
                width={pageWidth}
                canvasBackground="#ffffff"
                devicePixelRatio={Math.min(
                  typeof window !== "undefined" ? window.devicePixelRatio : 1,
                  2,
                )}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="shadow-card select-none"
              />
            )}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PitchDeckViewerPage;
