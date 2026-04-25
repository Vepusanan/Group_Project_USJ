import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";

const ConnectionsPage = () => {
  const navigate = useNavigate();
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
      "Remove this connection? They will lose access to your private information.",
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

  const handleCancelRequest = async (connectionId) => {
    setActionLoadingId(connectionId);
    const result = await apiService.removeConnection(connectionId);
    setActionLoadingId(null);

    if (!result.success) {
      setError(result.error || "Failed to cancel request");
      return;
    }

    await loadData();
  };

  const handleMessage = (connection) => {
    if (!connection?.other_user_id) return;
    const params = new URLSearchParams({
      userId: String(connection.other_user_id),
      name: connection.other_user_name || "User",
      ...(connection.other_user_photo_url ? { photo: connection.other_user_photo_url } : {}),
    });
    navigate(`/messages?${params.toString()}`);
  };

  const getProfilePath = (userType, profileId) => {
    if (!profileId) return null;
    if (userType === "investor") return `/investors/${profileId}`;
    return `/startups/${profileId}`;
  };

  const acceptedConnections = connections.filter(
    (item) => item.normalized_status === "accepted",
  );

  const tabs = [
    { key: "connected", label: "Connected", count: acceptedConnections.length },
    { key: "pending-sent", label: "Sent", count: pendingSent.length },
    { key: "pending-received", label: "Received", count: pendingReceived.length },
  ];

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-white">My Connections</h1>
          <p className="text-gray-400 mt-1 text-sm">
            {acceptedConnections.length} connection{acceptedConnections.length !== 1 ? "s" : ""}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
          </div>
        ) : (
          <section className="rounded-xl border border-white/15 bg-black/45 p-5">
            {/* Tab bar */}
            <div className="flex flex-wrap gap-2 mb-5 border-b border-white/10 pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    activeTab === tab.key
                      ? "bg-purple-500/30 border-purple-400/60 text-white"
                      : "bg-white/5 border-white/15 text-gray-300 hover:text-white"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? "bg-purple-500/50 text-white"
                        : "bg-white/10 text-gray-400"
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Connected tab */}
            {activeTab === "connected" && (
              <div className="space-y-3">
                {acceptedConnections.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-300 mb-2">No connections yet.</p>
                    <p className="text-gray-500 text-sm">
                      Visit{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/startups")}
                        className="text-blue-300 hover:text-blue-200 underline"
                      >
                        startups
                      </button>{" "}
                      or{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/investors")}
                        className="text-blue-300 hover:text-blue-200 underline"
                      >
                        investors
                      </button>{" "}
                      to send connection requests.
                    </p>
                  </div>
                ) : (
                  acceptedConnections.map((connection) => {
                    const profilePath = getProfilePath(
                      connection.other_user_type,
                      connection.other_user_profile_id || connection.other_user_id,
                    );
                    return (
                      <div
                        key={connection.id}
                        className="rounded-lg border border-white/15 bg-black/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {connection.other_user_photo_url
                              ? <img src={connection.other_user_photo_url} alt={connection.other_user_name} className="w-full h-full object-cover" />
                              : <span className="text-sm font-semibold text-white/50">{(connection.other_user_name || "U").charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            {profilePath ? (
                              <button
                                type="button"
                                onClick={() => navigate(profilePath)}
                                className="text-white font-medium hover:text-purple-300 transition-colors text-left"
                              >
                                {connection.other_user_name || "User"}
                              </button>
                            ) : (
                              <p className="text-white font-medium">
                                {connection.other_user_name || "User"}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 capitalize">
                              {connection.other_user_type || "member"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {profilePath && (
                            <button
                              type="button"
                              onClick={() => navigate(profilePath)}
                              className="px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white text-sm transition-colors"
                            >
                              View Profile
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleMessage(connection)}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
                          >
                            Message
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveConnection(connection.id)}
                            disabled={actionLoadingId === connection.id}
                            className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-sm disabled:opacity-50 transition-colors"
                          >
                            {actionLoadingId === connection.id ? "…" : "Remove"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Pending Sent tab */}
            {activeTab === "pending-sent" && (
              <div className="space-y-3">
                {pendingSent.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-300">No pending sent requests.</p>
                  </div>
                ) : (
                  pendingSent.map((request) => {
                    const profilePath = getProfilePath(
                      request.target_user_type,
                      request.target_user_profile_id || request.target_user_id,
                    );
                    return (
                      <div
                        key={request.id}
                        className="rounded-lg border border-white/15 bg-black/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/15 flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {request.other_user_photo_url
                              ? <img src={request.other_user_photo_url} alt={request.target_user_name} className="w-full h-full object-cover" />
                              : <span className="text-sm font-semibold text-white/50">{(request.target_user_name || "U").charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            {profilePath ? (
                              <button
                                type="button"
                                onClick={() => navigate(profilePath)}
                                className="text-white font-medium hover:text-purple-300 transition-colors text-left"
                              >
                                {request.target_user_name || "User"}
                              </button>
                            ) : (
                              <p className="text-white font-medium">
                                {request.target_user_name || "User"}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 capitalize">
                              {request.target_user_type || "member"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {profilePath && (
                            <button
                              type="button"
                              onClick={() => navigate(profilePath)}
                              className="px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white text-sm transition-colors"
                            >
                              View Profile
                            </button>
                          )}
                          <span className="px-2.5 py-1 text-xs border border-amber-400/30 bg-amber-500/15 text-amber-200 rounded-full">
                            Pending
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(request.id)}
                            disabled={actionLoadingId === request.id}
                            className="px-3 py-1.5 rounded-lg border border-white/15 text-gray-400 hover:text-white text-sm disabled:opacity-50 transition-colors"
                          >
                            {actionLoadingId === request.id ? "…" : "Cancel"}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Pending Received tab */}
            {activeTab === "pending-received" && (
              <div className="space-y-3">
                {pendingReceived.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-300">No pending received requests.</p>
                  </div>
                ) : (
                  pendingReceived.map((request) => {
                    const profilePath = getProfilePath(
                      request.requester_user_type,
                      request.requester_profile_id || request.requester_user_id,
                    );
                    return (
                      <div
                        key={request.id}
                        className="rounded-lg border border-white/15 bg-black/30 p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/5 border border-white/15 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                            {request.other_user_photo_url
                              ? <img src={request.other_user_photo_url} alt={request.requester_name} className="w-full h-full object-cover" />
                              : <span className="text-sm font-semibold text-white/50">{(request.requester_name || "U").charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div>
                            {profilePath ? (
                              <button
                                type="button"
                                onClick={() => navigate(profilePath)}
                                className="text-white font-medium hover:text-purple-300 transition-colors text-left"
                              >
                                {request.requester_name || "User"}
                              </button>
                            ) : (
                              <p className="text-white font-medium">
                                {request.requester_name || "User"}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 capitalize">
                              {request.requester_user_type || "member"}
                            </p>
                            {request.message && (
                              <p className="text-sm text-gray-300 mt-1 italic">
                                "{request.message}"
                              </p>
                            )}
                            {request.created_at && (
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(request.created_at).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {profilePath && (
                            <button
                              type="button"
                              onClick={() => navigate(profilePath)}
                              className="px-3 py-1.5 rounded-lg border border-white/15 text-gray-300 hover:text-white text-sm transition-colors"
                            >
                              View Profile
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRespond(request.id, "accepted")}
                            disabled={actionLoadingId === request.id}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm disabled:opacity-50 transition-colors"
                          >
                            {actionLoadingId === request.id ? "…" : "Accept"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespond(request.id, "declined")}
                            disabled={actionLoadingId === request.id}
                            className="px-3 py-1.5 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-sm disabled:opacity-50 transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
};

export default ConnectionsPage;
