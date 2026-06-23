import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  FolderPlus,
  Upload,
  Shield,
  FileText,
  Trash2,
  UserCheck,
  UserX,
  ScrollText,
  Lock,
} from "lucide-react";
import PageLayout from "../components/layout/PageLayout";
import { SectionCard } from "../components/common/SectionCard";
import { dataRoomService } from "../services/dataRoomService";

const formatBytes = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatAction = (action) =>
  String(action || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

const DataRoomManagePage = () => {
  const [dataRoom, setDataRoom] = useState(null);
  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("documents");
  const [folderName, setFolderName] = useState("");
  const [uploadFolderId, setUploadFolderId] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [auditLog, setAuditLog] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilterInvestor, setAuditFilterInvestor] = useState("");
  const [auditFilterDocument, setAuditFilterDocument] = useState("");
  const [auditFilterAction, setAuditFilterAction] = useState("");

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError("");

    const [roomResult, investorsResult] = await Promise.all([
      dataRoomService.getMyDataRoom(),
      dataRoomService.getConnectedInvestors(),
    ]);

    if (!roomResult.success) {
      setError(roomResult.error);
      setDataRoom(null);
      setInvestors([]);
      setLoading(false);
      return;
    }

    setDataRoom(roomResult.data);
    setInvestors(investorsResult.success ? investorsResult.data : []);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const loadAuditLog = useCallback(async () => {
    setAuditLoading(true);
    const result = await dataRoomService.getAuditLog({
      limit: 200,
      investorUserId: auditFilterInvestor || null,
      documentId: auditFilterDocument || null,
      actionType: auditFilterAction || null,
    });
    setAuditLoading(false);
    if (!result.success) {
      setError(result.error);
      setAuditLog([]);
      return;
    }
    setAuditLog(result.data || []);
  }, [auditFilterInvestor, auditFilterDocument, auditFilterAction]);

  useEffect(() => {
    if (activeTab === "audit") {
      loadAuditLog();
    }
  }, [activeTab, loadAuditLog]);

  const auditInvestorOptions = useMemo(() => {
    const names = new Map();
    for (const grant of dataRoom?.access_grants || []) {
      if (grant.investor_user_id) {
        names.set(
          String(grant.investor_user_id),
          grant.investor_firm || grant.investor_name || "Investor",
        );
      }
    }
    for (const entry of auditLog) {
      if (entry.investor_user_id && entry.investor_name) {
        names.set(String(entry.investor_user_id), entry.investor_name);
      }
    }
    return [...names.entries()].map(([id, name]) => ({ id, name }));
  }, [dataRoom, auditLog]);

  const auditDocumentOptions = useMemo(
    () =>
      (dataRoom?.documents || []).map((doc) => ({
        id: doc.id,
        name: doc.name,
      })),
    [dataRoom],
  );

  const auditActionOptions = [
    "view_data_room",
    "view_document",
    "download_document",
    "grant_access",
    "revoke_access",
    "upload_document",
    "delete_document",
    "create_folder",
  ];

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

  const activeGrants = useMemo(
    () => (dataRoom?.access_grants || []).filter((g) => g.is_active),
    [dataRoom],
  );

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setBusy(true);
    const result = await dataRoomService.createFolder(folderName.trim());
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setFolderName("");
    await loadAll();
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setBusy(true);
    setUploadProgress(0);
    const result = await dataRoomService.uploadDocument(
      {
        file: selectedFile,
        folderId: uploadFolderId || undefined,
        description: uploadDescription,
      },
      setUploadProgress,
    );
    setBusy(false);
    setUploadProgress(0);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSelectedFile(null);
    setUploadDescription("");
    await loadAll();
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Delete this document permanently?")) return;
    setBusy(true);
    const result = await dataRoomService.deleteDocument(documentId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await loadAll();
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm("Delete this folder? Documents will move to uncategorized.")) return;
    setBusy(true);
    const result = await dataRoomService.deleteFolder(folderId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await loadAll();
  };

  const handleGrant = async (investorUserId) => {
    setBusy(true);
    const result = await dataRoomService.grantAccess(investorUserId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await loadAll();
  };

  const handleRevoke = async (grantId) => {
    if (!window.confirm("Revoke this investor's data room access immediately?")) return;
    setBusy(true);
    const result = await dataRoomService.revokeAccess(grantId);
    setBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    await loadAll();
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex justify-center py-24">
          <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-primary mb-1">
              <Lock className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-widest">US-03</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-content">Private Data Room</h1>
            <p className="text-content-secondary text-sm mt-1">
              Upload confidential documents, organise folders, and grant access to connected investors only.
            </p>
          </div>
          <Link to="/profile" className="btn-secondary-token text-sm px-4 py-2 self-start">
            Back to Profile
          </Link>
        </div>

        {error && (
          <div className="rounded-xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {[
            { id: "documents", label: "Documents", icon: FileText },
            { id: "access", label: "Access Control", icon: Shield },
            { id: "audit", label: "Audit Log", icon: ScrollText },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-primary text-content-inverse"
                  : "bg-surface-alt border border-line text-content-secondary hover:text-content"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "documents" && (
          <div className="space-y-6">
            <SectionCard title="Create Folder" icon={FolderPlus} accent="blue">
              <form onSubmit={handleCreateFolder} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={folderName}
                  onChange={(e) => setFolderName(e.target.value)}
                  placeholder="e.g. Financials, Legal, Product"
                  className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                />
                <button type="submit" disabled={busy} className="btn-primary-token text-sm px-4 py-2">
                  Add Folder
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Upload Document" icon={Upload} accent="purple">
              <form onSubmit={handleUpload} className="space-y-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.mp4,image/*"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-content-secondary"
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  <select
                    value={uploadFolderId}
                    onChange={(e) => setUploadFolderId(e.target.value)}
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                  >
                    <option value="">Uncategorized</option>
                    {(dataRoom?.folders || []).map((folder) => (
                      <option key={folder.id} value={folder.id}>
                        {folder.name}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    placeholder="Document description (optional)"
                    className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
                  />
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="h-2 rounded-full bg-surface-alt overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
                <button
                  type="submit"
                  disabled={busy || !selectedFile}
                  className="btn-primary-token text-sm px-4 py-2"
                >
                  Upload
                </button>
              </form>
            </SectionCard>

            <SectionCard title="Documents & Folders" icon={FileText} accent="blue">
              <div className="space-y-6">
                {(dataRoom?.folders || []).map((folder) => (
                  <div key={folder.id} className="rounded-xl border border-line p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-content">{folder.name}</h3>
                      <button
                        type="button"
                        onClick={() => handleDeleteFolder(folder.id)}
                        className="text-error hover:text-error/80 p-1"
                        aria-label={`Delete folder ${folder.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    {(documentsByFolder.get(folder.id) || []).length === 0 ? (
                      <p className="text-sm text-content-muted">No documents in this folder.</p>
                    ) : (
                      <ul className="space-y-2">
                        {(documentsByFolder.get(folder.id) || []).map((doc) => (
                          <li
                            key={doc.id}
                            className="flex items-start justify-between gap-3 rounded-lg bg-surface-alt p-3"
                          >
                            <div className="min-w-0">
                              <p className="font-medium text-content text-sm">{doc.name}</p>
                              {doc.description && (
                                <p className="text-xs text-content-muted mt-0.5">{doc.description}</p>
                              )}
                              <p className="text-[10px] text-content-muted mt-1">
                                {formatBytes(doc.file_size_bytes)} · {doc.mime_type || "file"}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-error shrink-0 p-1"
                              aria-label={`Delete ${doc.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}

                <div className="rounded-xl border border-line p-4">
                  <h3 className="font-semibold text-content mb-3">Uncategorized</h3>
                  {(documentsByFolder.get("uncategorized") || []).length === 0 ? (
                    <p className="text-sm text-content-muted">No documents uploaded yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {(documentsByFolder.get("uncategorized") || []).map((doc) => (
                        <li
                          key={doc.id}
                          className="flex items-start justify-between gap-3 rounded-lg bg-surface-alt p-3"
                        >
                          <div className="min-w-0">
                            <p className="font-medium text-content text-sm">{doc.name}</p>
                            {doc.description && (
                              <p className="text-xs text-content-muted mt-0.5">{doc.description}</p>
                            )}
                            <p className="text-[10px] text-content-muted mt-1">
                              {formatBytes(doc.file_size_bytes)} · {doc.mime_type || "file"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-error shrink-0 p-1"
                            aria-label={`Delete ${doc.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "access" && (
          <SectionCard
            title="Investor Access"
            icon={Shield}
            accent="purple"
          >
            <p className="text-sm text-content-secondary mb-4">
              By default, no investor can see your data room. Grant access only to connected investors you trust.
            </p>
            {investors.length === 0 ? (
              <p className="text-sm text-content-muted">
                No connected investors yet.{" "}
                <Link to="/connections" className="text-primary hover:underline">
                  View connections
                </Link>
              </p>
            ) : (
              <ul className="space-y-3">
                {investors.map((investor) => (
                  <li
                    key={investor.user_id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-alt p-4"
                  >
                    <div>
                      <p className="font-medium text-content">{investor.name}</p>
                      <p className="text-xs text-content-muted mt-0.5">
                        {investor.has_data_room_access ? "Access granted" : "No access"}
                      </p>
                    </div>
                    {investor.has_data_room_access ? (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleRevoke(investor.grant_id)}
                        className="inline-flex items-center gap-1.5 text-sm text-error border border-error/30 rounded-lg px-3 py-1.5 hover:bg-error/10"
                      >
                        <UserX className="w-4 h-4" />
                        Revoke
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleGrant(investor.user_id)}
                        className="inline-flex items-center gap-1.5 text-sm btn-primary-token px-3 py-1.5"
                      >
                        <UserCheck className="w-4 h-4" />
                        Grant Access
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {activeGrants.length > 0 && (
              <div className="mt-6 pt-4 border-t border-line">
                <p className="text-xs font-semibold text-content-muted uppercase tracking-widest mb-2">
                  Active grants ({activeGrants.length})
                </p>
                <ul className="space-y-1 text-sm text-content-secondary">
                  {activeGrants.map((grant) => (
                    <li key={grant.id}>
                      {grant.investor_firm || grant.investor_name} — since{" "}
                      {new Date(grant.granted_at).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </SectionCard>
        )}

        {activeTab === "audit" && (
          <SectionCard title="Audit Log" icon={ScrollText} accent="blue">
            <div className="grid sm:grid-cols-3 gap-3 mb-4">
              <select
                value={auditFilterInvestor}
                onChange={(e) => setAuditFilterInvestor(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <option value="">All investors</option>
                {auditInvestorOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <select
                value={auditFilterDocument}
                onChange={(e) => setAuditFilterDocument(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <option value="">All documents</option>
                {auditDocumentOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
              <select
                value={auditFilterAction}
                onChange={(e) => setAuditFilterAction(e.target.value)}
                className="rounded-lg border border-line bg-surface px-3 py-2 text-sm"
              >
                <option value="">All actions</option>
                {auditActionOptions.map((action) => (
                  <option key={action} value={action}>
                    {formatAction(action)}
                  </option>
                ))}
              </select>
            </div>

            {auditLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
              </div>
            ) : auditLog.length === 0 ? (
              <p className="text-sm text-content-muted">No activity recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-content-muted border-b border-line">
                      <th className="py-2 pr-4">Time</th>
                      <th className="py-2 pr-4">Action</th>
                      <th className="py-2 pr-4">Investor</th>
                      <th className="py-2 pr-4">Document</th>
                      <th className="py-2">Performed by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLog.map((entry) => (
                      <tr key={entry.id} className="border-b border-line/60">
                        <td className="py-2 pr-4 text-content-secondary whitespace-nowrap">
                          {new Date(entry.created_at).toLocaleString()}
                        </td>
                        <td className="py-2 pr-4 text-content">
                          {formatAction(entry.action_type)}
                        </td>
                        <td className="py-2 pr-4 text-content-secondary">
                          {entry.investor_name || "—"}
                        </td>
                        <td className="py-2 pr-4 text-content-muted">
                          {entry.document_name || entry.folder_name || "—"}
                        </td>
                        <td className="py-2 text-content-muted">
                          {entry.performed_by_name || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}
      </div>
    </PageLayout>
  );
};

export default DataRoomManagePage;
