import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ClipboardList,
  Eye,
  FolderOpen,
  HelpCircle,
  Share2,
  Trash2,
  X,
} from "lucide-react";
import ddChecklistService from "../../services/ddChecklistService";
import { dataRoomService } from "../../services/dataRoomService";
import { useAuth } from "../../hooks/useAuth";
import ChecklistItemPdfViewer from "./ChecklistItemPdfViewer";
import DataRoomPdfViewer from "../dataRoom/DataRoomPdfViewer";

const STATUS_OPTIONS = ["REQUESTED", "IN_REVIEW", "COMPLETED"];

const STATUS_LABELS = {
  REQUESTED: "Requested",
  IN_REVIEW: "In Review",
  COMPLETED: "Completed",
};

const hasViewableResponse = (item) =>
  item.has_response_document ||
  item.response_type === "data_room_document" ||
  item.response_type === "data_room_folder";

const isPdfItem = (item) => {
  const mime = item.linked_document_mime_type || "";
  const name = (
    item.response_document_name ||
    item.linked_document_file_name ||
    ""
  ).toLowerCase();
  return mime.includes("pdf") || name.endsWith(".pdf");
};

const ConnectionDdChecklistPanel = ({
  connectionId,
  otherUserName,
  startupProfileId,
  onClose,
  onAskAboutItem,
}) => {
  const { user } = useAuth();
  const isInvestor = user?.userType === "investor";
  const isStartup = user?.userType === "startup";

  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [uploadingItemId, setUploadingItemId] = useState(null);
  const [linkingItemId, setLinkingItemId] = useState(null);
  const [dataRoomOptions, setDataRoomOptions] = useState(null);
  const [pdfViewerItem, setPdfViewerItem] = useState(null);
  const [dataRoomDocViewer, setDataRoomDocViewer] = useState(null);
  const [pipelineHint, setPipelineHint] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const result = await ddChecklistService.getChecklist(connectionId);
    if (!result.success) {
      setError(result.error);
      setChecklist(null);
    } else {
      setChecklist(result.data);
      if (
        isInvestor &&
        result.data.all_items_completed &&
        result.data.pipeline_card?.stage === "DUE_DILIGENCE"
      ) {
        setPipelineHint(
          "All checklist items are complete. Consider moving this deal to Decision in your pipeline.",
        );
      } else {
        setPipelineHint("");
      }
    }
    setLoading(false);
  }, [connectionId, isInvestor]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!isStartup) return;
    (async () => {
      const result = await dataRoomService.getMyDataRoom();
      if (result.success) {
        setDataRoomOptions(result.data);
      }
    })();
  }, [isStartup]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!newDescription.trim()) return;
    setBusy(true);
    setError("");
    const result = await ddChecklistService.addItem(connectionId, {
      description: newDescription.trim(),
      due_date: newDueDate || null,
    });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setNewDescription("");
    setNewDueDate("");
    await load();
  };

  const handleShare = async () => {
    setBusy(true);
    setError("");
    const result = await ddChecklistService.shareChecklist(connectionId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const handleStatusChange = async (itemId, status) => {
    setBusy(true);
    const result = await ddChecklistService.updateItem(itemId, { status });
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (result.suggest_pipeline_move) {
      setPipelineHint(
        "All checklist items are complete. Consider moving this deal to Decision in your pipeline.",
      );
    }
    await load();
  };

  const handleDelete = async (itemId) => {
    if (!window.confirm("Remove this checklist item?")) return;
    setBusy(true);
    const result = await ddChecklistService.deleteItem(itemId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const handleUpload = async (itemId, file) => {
    if (!file) return;
    setUploadingItemId(itemId);
    setError("");
    const result = await ddChecklistService.submitResponse(itemId, file);
    setUploadingItemId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const handleLinkDataRoom = async (itemId, payload) => {
    setLinkingItemId(itemId);
    setError("");
    const result = await ddChecklistService.linkDataRoom(itemId, payload);
    setLinkingItemId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await load();
  };

  const handleViewDocument = (item) => {
    if (item.response_type === "data_room_document" && item.data_room_document_id) {
      if (isPdfItem(item)) {
        setDataRoomDocViewer({
          documentId: item.data_room_document_id,
          documentName: item.linked_document_name || item.response_document_name,
        });
      }
      return;
    }

    if (item.has_response_document && isPdfItem(item)) {
      setPdfViewerItem({
        itemId: item.id,
        documentName: item.response_document_name,
      });
    }
  };

  const items = checklist?.items || [];
  const isShared = checklist?.is_shared;
  const folders = dataRoomOptions?.folders || [];
  const documents = dataRoomOptions?.documents || [];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
        <div className="w-full max-w-2xl rounded-2xl border border-line bg-surface shadow-xl max-h-[90vh] flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-line">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-content">
                Due Diligence — {otherUserName || "connection"}
              </h2>
            </div>
            <button type="button" onClick={onClose} className="p-1 rounded-lg hover:bg-surface-alt">
              <X className="w-5 h-5 text-content-muted" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {error && (
              <p className="text-sm text-error bg-error/10 border border-error/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {pipelineHint && isInvestor && (
              <div className="text-sm text-primary bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                <span>{pipelineHint}</span>
                <Link
                  to="/analytics"
                  className="shrink-0 text-xs font-semibold underline"
                >
                  Open pipeline
                </Link>
              </div>
            )}

            {loading ? (
              <p className="text-sm text-content-muted">Loading checklist…</p>
            ) : isStartup && !isShared ? (
              <p className="text-sm text-content-muted">
                The investor has not shared a due diligence checklist yet.
              </p>
            ) : (
              <>
                {isInvestor && (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs text-content-muted">
                      {isShared
                        ? "Shared with startup — they can upload documents or link data room files per item."
                        : "Private until you share with the startup."}
                    </p>
                    {!isShared && items.length > 0 && (
                      <button
                        type="button"
                        onClick={handleShare}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-content-inverse text-sm disabled:opacity-50"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        Share checklist
                      </button>
                    )}
                  </div>
                )}

                {items.length === 0 ? (
                  <p className="text-sm text-content-muted">No checklist items yet.</p>
                ) : (
                  <ul className="space-y-3">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-xl border border-line bg-surface-alt p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-content flex-1">{item.description}</p>
                          {isInvestor && (
                            <button
                              type="button"
                              onClick={() => handleDelete(item.id)}
                              className="text-content-muted hover:text-error"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          {isInvestor ? (
                            <select
                              value={item.status}
                              onChange={(e) => handleStatusChange(item.id, e.target.value)}
                              disabled={busy}
                              className="rounded-lg border border-line bg-surface px-2 py-1 text-xs"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>
                                  {STATUS_LABELS[s]}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                              {STATUS_LABELS[item.status] || item.status}
                            </span>
                          )}
                          {item.due_date && (
                            <span className="text-content-muted">
                              Due {new Date(item.due_date).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {hasViewableResponse(item) && (
                          <div className="flex flex-wrap items-center gap-2">
                            {item.response_type === "data_room_folder" ? (
                              <span className="inline-flex items-center gap-1 text-xs text-primary">
                                <FolderOpen className="w-3 h-3" />
                                Data room folder: {item.linked_folder_name || item.response_document_name}
                              </span>
                            ) : (
                              <>
                                {item.has_response_document && isPdfItem(item) && (
                                  <button
                                    type="button"
                                    onClick={() => handleViewDocument(item)}
                                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                  >
                                    <Eye className="w-3 h-3" />
                                    {item.response_document_name || "View document"}
                                  </button>
                                )}
                              </>
                            )}
                            {item.response_type === "data_room_document" &&
                              startupProfileId && (
                                <Link
                                  to={`/startups/${startupProfileId}/data-room`}
                                  className="inline-flex items-center gap-1 text-xs text-content-muted hover:text-primary"
                                >
                                  Open data room
                                </Link>
                              )}
                          </div>
                        )}

                        {isInvestor && item.status === "IN_REVIEW" && onAskAboutItem && (
                          <button
                            type="button"
                            onClick={() => onAskAboutItem(item)}
                            className="inline-flex items-center gap-1 text-xs text-content-muted hover:text-primary"
                          >
                            <HelpCircle className="w-3 h-3" />
                            Ask follow-up question
                          </button>
                        )}

                        {isStartup && isShared && item.status !== "COMPLETED" && (
                          <div className="space-y-2 pt-1">
                            <div>
                              <label className="block text-xs text-content-muted mb-1">
                                Upload document for this item
                              </label>
                              <input
                                type="file"
                                accept=".pdf,.doc,.docx,.txt,image/*"
                                disabled={uploadingItemId === item.id}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleUpload(item.id, file);
                                  e.target.value = "";
                                }}
                                className="block w-full text-xs text-content-secondary file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-line file:bg-surface"
                              />
                            </div>

                            {(folders.length > 0 || documents.length > 0) && (
                              <div className="grid sm:grid-cols-2 gap-2">
                                {documents.length > 0 && (
                                  <div>
                                    <label className="block text-xs text-content-muted mb-1">
                                      Or link data room document
                                    </label>
                                    <select
                                      defaultValue=""
                                      disabled={linkingItemId === item.id}
                                      onChange={(e) => {
                                        const docId = e.target.value;
                                        if (!docId) return;
                                        handleLinkDataRoom(item.id, {
                                          response_type: "data_room_document",
                                          data_room_document_id: docId,
                                        });
                                        e.target.value = "";
                                      }}
                                      className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-xs"
                                    >
                                      <option value="">Select document…</option>
                                      {documents.map((doc) => (
                                        <option key={doc.id} value={doc.id}>
                                          {doc.name || doc.file_name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                                {folders.length > 0 && (
                                  <div>
                                    <label className="block text-xs text-content-muted mb-1">
                                      Or link data room folder
                                    </label>
                                    <select
                                      defaultValue=""
                                      disabled={linkingItemId === item.id}
                                      onChange={(e) => {
                                        const folderId = e.target.value;
                                        if (!folderId) return;
                                        handleLinkDataRoom(item.id, {
                                          response_type: "data_room_folder",
                                          data_room_folder_id: folderId,
                                        });
                                        e.target.value = "";
                                      }}
                                      className="w-full rounded-lg border border-line bg-surface px-2 py-1.5 text-xs"
                                    >
                                      <option value="">Select folder…</option>
                                      {folders.map((folder) => (
                                        <option key={folder.id} value={folder.id}>
                                          {folder.name}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>

          {isInvestor && (
            <form onSubmit={handleAddItem} className="px-5 py-4 border-t border-line space-y-2">
              <textarea
                rows={2}
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Add a document or information request…"
                className="w-full rounded-xl border border-line bg-surface-alt px-3 py-2 text-sm resize-none"
              />
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="rounded-lg border border-line bg-surface-alt px-2 py-1.5 text-sm"
                />
                <button
                  type="submit"
                  disabled={busy || !newDescription.trim()}
                  className="ml-auto px-4 py-2 rounded-lg bg-primary text-content-inverse text-sm disabled:opacity-50"
                >
                  Add item
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {pdfViewerItem && (
        <ChecklistItemPdfViewer
          open
          itemId={pdfViewerItem.itemId}
          documentName={pdfViewerItem.documentName}
          onClose={() => setPdfViewerItem(null)}
        />
      )}

      {dataRoomDocViewer && (
        <DataRoomPdfViewer
          open
          documentId={dataRoomDocViewer.documentId}
          documentName={dataRoomDocViewer.documentName}
          onClose={() => setDataRoomDocViewer(null)}
        />
      )}
    </>
  );
};

export default ConnectionDdChecklistPanel;
