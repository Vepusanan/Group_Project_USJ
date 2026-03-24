import React, { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/apiService";

const statusTagClass = {
  pending: "bg-amber-500/20 text-amber-200 border-amber-400/30",
  accepted: "bg-emerald-500/20 text-emerald-200 border-emerald-400/30",
  declined: "bg-rose-500/20 text-rose-200 border-rose-400/30",
};

const tabs = [
  { key: "connected", label: "Connected" },
  { key: "pending-sent", label: "Pending Sent" },
  { key: "pending-received", label: "Pending Received" },
];

const ConnectionsPage = () => {
  const [activeTab, setActiveTab] = useState("connected");
  const [connections, setConnections] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const [connectionsResult, pendingSentResult, pendingReceivedResult] =
      await Promise.all([
        apiService.getConnections(),
        apiService.getPendingSentConnections(),
        apiService.getPendingReceivedConnections(),
      ]);

    if (!connectionsResult.success) {
      setError(connectionsResult.error || "Failed to load connections");
      setConnections([]);
      setPendingSent([]);
      setPendingReceived([]);
      setLoading(false);
      return;
    }

    setConnections(connectionsResult.data?.data || []);
    setPendingSent(
      pendingSentResult.success ? pendingSentResult.data?.data || [] : [],
    );
    setPendingReceived(
      pendingReceivedResult.success
        ? pendingReceivedResult.data?.data || []
        : [],
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRespond = async (connectionId, status) => {
    setActionLoadingId(connectionId);
    const result = await apiService.respondToConnection(connectionId, status);
    setActionLoadingId(null);

    if (!result.success) {
      setError(result.error || "Failed to update request");
      return;
    }

    await loadData();
  };

  const handleRemoveConnection = async (connectionId) => {
    const confirmed = window.confirm(
      "Are you sure you want to remove this connection?",
    );
    if (!confirmed) return;

    setActionLoadingId(connectionId);
    const result = await apiService.removeConnection(connectionId);
    setActionLoadingId(null);

    if (!result.success) {
      setError(result.error || "Failed to remove connection");
      return;
    }

    await loadData();
  };

  const acceptedConnections = connections.filter(
    (item) => item.normalized_status === "accepted",
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl space-y-6">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          My Connections
        </h1>

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-gray-300">Loading connections...</div>
        ) : (
          <>
            <section className="rounded-xl border border-white/15 bg-black/45 p-5">
              <div className="flex flex-wrap gap-2 mb-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-3 py-1.5 rounded-full text-sm border ${
                      activeTab === tab.key
                        ? "bg-purple-500/30 border-purple-400/60 text-white"
                        : "bg-white/5 border-white/15 text-gray-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "connected" && (
                <div className="space-y-3">
                  {acceptedConnections.length === 0 && (
                    <div className="text-gray-300">
                      No accepted connections yet.
                    </div>
                  )}

                  {acceptedConnections.map((connection) => (
                    <div
                      key={connection.id}
                      className="rounded-lg border border-white/15 bg-black/30 p-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {connection.other_user_name || "User"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {connection.other_user_type || "member"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-1 text-xs border rounded-full ${statusTagClass.accepted}`}
                        >
                          accepted
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveConnection(connection.id)}
                          disabled={actionLoadingId === connection.id}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white disabled:opacity-50"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "pending-sent" && (
                <div className="space-y-3">
                  {pendingSent.length === 0 && (
                    <div className="text-gray-300">
                      No pending sent requests.
                    </div>
                  )}
                  {pendingSent.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-white/15 bg-black/30 p-4 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {request.target_user_name || "User"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {request.target_user_type || "member"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs border rounded-full ${statusTagClass.pending}`}
                      >
                        pending
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "pending-received" && (
                <div className="space-y-3">
                  {pendingReceived.length === 0 && (
                    <div className="text-gray-300">
                      No pending received requests.
                    </div>
                  )}
                  {pendingReceived.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border border-white/15 bg-black/30 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                    >
                      <div>
                        <p className="text-white font-medium">
                          {request.requester_name || "User"}
                        </p>
                        <p className="text-sm text-gray-400">
                          {request.requester_user_type || "member"}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleRespond(request.id, "accepted")}
                          disabled={actionLoadingId === request.id}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRespond(request.id, "declined")}
                          disabled={actionLoadingId === request.id}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white disabled:opacity-50"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
};

export default ConnectionsPage;
