import React, { useEffect, useMemo, useState } from "react";
import { Document, Page } from "react-pdf";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  X,
} from "lucide-react";
import ddChecklistService from "../../services/ddChecklistService";
import { getPdfDocumentOptions, setupPdfWorker } from "../../utils/setupPdfWorker";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

setupPdfWorker();

const ChecklistItemPdfViewer = ({
  open,
  itemId,
  documentName,
  onClose,
}) => {
  const [pdfData, setPdfData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(760);

  useEffect(() => {
    const updateWidth = () => {
      setPageWidth(Math.min(760, window.innerWidth - 96));
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  useEffect(() => {
    if (!open || !itemId) return undefined;

    let active = true;
    setLoading(true);
    setError("");
    setPdfData(null);
    setNumPages(null);
    setPageNumber(1);

    (async () => {
      const result = await ddChecklistService.fetchItemDocument(itemId);
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
  }, [open, itemId]);

  const pdfFile = useMemo(
    () => (pdfData ? { data: pdfData.slice() } : null),
    [pdfData],
  );

  const goToPage = (next) => {
    if (!numPages) return;
    setPageNumber(Math.min(Math.max(1, next), numPages));
  };

  const handleDownload = async () => {
    const result = await ddChecklistService.downloadItemDocument(
      itemId,
      documentName || "checklist-document",
    );
    if (!result.success) {
      setError(result.error);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/80">
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-line">
        <p className="text-sm font-medium text-content truncate">
          {documentName || "Checklist document"}
        </p>
        <div className="flex items-center gap-2">
          {numPages && (
            <div className="flex items-center gap-1 text-sm text-content-secondary">
              <button
                type="button"
                onClick={() => goToPage(pageNumber - 1)}
                disabled={pageNumber <= 1}
                className="p-1 rounded hover:bg-surface-alt disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span>
                {pageNumber} / {numPages}
              </span>
              <button
                type="button"
                onClick={() => goToPage(pageNumber + 1)}
                disabled={pageNumber >= numPages}
                className="p-1 rounded hover:bg-surface-alt disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          <button
            type="button"
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-surface-alt text-content-secondary"
            title="Download"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-surface-alt text-content-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto flex justify-center py-6">
        {loading && (
          <div className="flex items-center gap-2 text-content-inverse">
            <Loader2 className="w-5 h-5 animate-spin" />
            Loading document…
          </div>
        )}
        {error && (
          <p className="text-sm text-error bg-error/10 px-4 py-2 rounded-lg">{error}</p>
        )}
        {pdfFile && !loading && !error && (
          <Document
            file={pdfFile}
            options={getPdfDocumentOptions()}
            onLoadSuccess={({ numPages: pages }) => setNumPages(pages)}
            loading={null}
          >
            <Page pageNumber={pageNumber} width={pageWidth} />
          </Document>
        )}
      </div>
    </div>
  );
};

export default ChecklistItemPdfViewer;
