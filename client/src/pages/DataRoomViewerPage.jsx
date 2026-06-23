import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FileText, Folder, Lock, Download, ArrowLeft, Eye } from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import { SectionCard } from "../components/common/SectionCard";
import DataRoomPdfViewer from "../components/dataRoom/DataRoomPdfViewer";
import { dataRoomService } from "../services/dataRoomService";

const formatBytes = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const isPdfDocument = (doc) =>
  String(doc?.mime_type || "").includes("pdf") ||
  String(doc?.file_name || "").toLowerCase().endsWith(".pdf");

const DataRoomViewerPage = () => {
  const { id: startupProfileId } = useParams();
  const [dataRoom, setDataRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState(null);
  const [viewerDoc, setViewerDoc] = useState(null);
  const [auditLog, setAuditLog] = useState([]);

  const loadDataRoom = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await dataRoomService.getStartupDataRoom(startupProfileId);
    if (!result.success) {
      setError(result.error);
      setDataRoom(null);
      setLoading(false);
      return;
    }
    setDataRoom(result.data);
    const auditResult = await dataRoomService.getInvestorAuditLog(startupProfileId, {
      limit: 50,
    });
    if (auditResult.success) {
      setAuditLog(auditResult.data || []);
    }
    setLoading(false);
  }, [startupProfileId]);

  useEffect(() => {
    loadDataRoom();
  }, [loadDataRoom]);

  const documentsByFolder = useMemo(() => {
    const docs = dataRoom?.documents || [];
    const grouped = new Map();
    grouped.set(
      "uncategorized",
      docs.filter((doc) => !doc.folder_id),
    );
    for (const folder of dataRoom?.folders || []) {
      grouped.set(
        folder.id,
        docs.filter((doc) => doc.folder_id === folder.id),
      );
    }
    return grouped;
  }, [dataRoom]);

  const handleOpenDocument = async (doc) => {
    if (isPdfDocument(doc)) {
      setViewerDoc(doc);
      return;
    }

    setOpeningId(doc.id);
    const result = await dataRoomService.openDocument(doc.id, doc.file_name || doc.name);
    setOpeningId(null);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleDownloadDocument = async (doc) => {
    setOpeningId(doc.id);
    const result = await dataRoomService.downloadDocument(
      doc.id,
      doc.file_name || doc.name,
    );
    setOpeningId(null);
    if (!result.success) {
      setError(result.error);
    }
  };

  const renderDocumentActions = (doc) => (
    <div className="flex items-center gap-2 shrink-0">
      {isPdfDocument(doc) ? (
        <button
          type="button"
          disabled={openingId === doc.id}
          onClick={() => handleOpenDocument(doc)}
          className="inline-flex items-center gap-1.5 text-sm btn-primary-token px-3 py-1.5"
        >
          <Eye className="w-4 h-4" />
          View
        </button>
      ) : (
        <button
          type="button"
          disabled={openingId === doc.id}
          onClick={() => handleOpenDocument(doc)}
          className="inline-flex items-center gap-1.5 text-sm btn-primary-token px-3 py-1.5"
        >
          <Download className="w-4 h-4" />
          {openingId === doc.id ? "Opening…" : "Open"}
        </button>
      )}
      <button
        type="button"
        disabled={openingId === doc.id}
        onClick={() => handleDownloadDocument(doc)}
        className="inline-flex items-center gap-1.5 text-sm border border-line rounded-lg px-3 py-1.5 text-content-secondary hover:text-content"
      >
        <Download className="w-4 h-4" />
        Download
      </button>
    </div>
  );

  const renderDocumentRow = (doc) => (
    <li
      key={doc.id}
      className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-alt p-4"
    >
      <div className="min-w-0">
        <p className="font-medium text-content text-sm">{doc.name}</p>
        {doc.description && (
          <p className="text-xs text-content-muted mt-0.5">{doc.description}</p>
        )}
        <p className="text-[10px] text-content-muted mt-1">
          {formatBytes(doc.file_size_bytes)}
          {isPdfDocument(doc) ? " · PDF" : ""}
        </p>
      </div>
      {renderDocumentActions(doc)}
    </li>
  );

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  if (error && !dataRoom) {
    return (
      <PageLayout>
        <div className="py-16 text-center space-y-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-error/10 text-error">
            <Lock className="w-7 h-7" />
          </div>
          <h1 className="text-xl font-bold text-content">Data Room Unavailable</h1>
          <p className="text-content-secondary text-sm">{error}</p>
          <Link
            to={`/startups/${startupProfileId}`}
            className="inline-flex items-center gap-2 btn-secondary-token text-sm px-4 py-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Startup Profile
          </Link>
        </div>
      </PageLayout>
    );
  }

  const isOwner = dataRoom?.access_level === "owner";

  return (
    <PageLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">Private Data Room</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-content">
              {dataRoom?.company_name || "Startup"} Data Room
            </h1>
            <p className="text-content-secondary text-sm mt-1">
              {isOwner
                ? "You are viewing your own data room."
                : "Confidential documents shared with you for due diligence."}
            </p>
          </div>
          <div className="flex gap-2">
            {isOwner && (
              <Link to="/data-room" className="btn-primary-token text-sm px-4 py-2">
                Manage Data Room
              </Link>
            )}
            <Link
              to={`/startups/${startupProfileId}`}
              className="btn-secondary-token text-sm px-4 py-2"
            >
              Back to Profile
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <SectionCard title="Documents" icon={FileText} accent="blue">
          {(dataRoom?.documents || []).length === 0 ? (
            <p className="text-sm text-content-muted">No documents in this data room yet.</p>
          ) : (
            <div className="space-y-6">
              {(dataRoom?.folders || []).map((folder) => {
                const docs = documentsByFolder.get(folder.id) || [];
                if (docs.length === 0) return null;
                return (
                  <div key={folder.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <Folder className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold text-content">{folder.name}</h3>
                    </div>
                    <ul className="space-y-2">
                      {docs.map(renderDocumentRow)}
                    </ul>
                  </div>
                );
              })}

              {(documentsByFolder.get("uncategorized") || []).length > 0 && (
                <div>
                  <h3 className="font-semibold text-content mb-2">Other Documents</h3>
                  <ul className="space-y-2">
                    {(documentsByFolder.get("uncategorized") || []).map(renderDocumentRow)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </SectionCard>

        {auditLog.length > 0 && (
          <SectionCard title="Your access activity" icon={Lock} accent="slate">
            <p className="text-xs text-content-muted mb-3">
              Recent views and downloads you performed in this data room (for due diligence tracking).
            </p>
            <ul className="space-y-2 text-sm">
              {auditLog.map((entry) => (
                <li
                  key={entry.id}
                  className="flex flex-wrap items-center gap-2 text-content-secondary border-b border-line/50 pb-2"
                >
                  <span className="text-xs text-content-muted">
                    {new Date(entry.created_at).toLocaleString()}
                  </span>
                  <span className="capitalize">{entry.action_type?.replace(/_/g, " ")}</span>
                  <span>{entry.document_name || "Document"}</span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      <DataRoomPdfViewer
        open={Boolean(viewerDoc)}
        documentId={viewerDoc?.id}
        documentName={viewerDoc?.name}
        onClose={() => setViewerDoc(null)}
      />
    </PageLayout>
  );
};

export default DataRoomViewerPage;
