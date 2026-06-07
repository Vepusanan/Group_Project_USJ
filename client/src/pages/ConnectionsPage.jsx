import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import {
  cardIdentityClass,
  cardIdentitySubtitleMutedClass,
  cardIdentityTitleClass,
} from "../styles/theme";

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
          <h1 className="text-3xl md:text-4xl font-bold text-content">My Connections</h1>
          <p className="text-content-muted mt-1 text-sm">
            {acceptedConnections.length} connection{acceptedConnections.length !== 1 ? "s" : ""}
          </p>
        </div>

        {error && (
          <div className="rounded-lg border border-error/40 bg-error/10 px-4 py-3 text-error text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-light/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <section className="rounded-xl border border-line bg-surface shadow-sm p-5">
            {/* Tab bar */}
            <div className="flex flex-wrap gap-2 mb-5 border-b border-line pb-4">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm border transition-colors ${
                    activeTab === tab.key
                      ? "bg-primary-light/30 border-primary-light/60 text-content"
                      : "bg-surface-alt border-line text-content-secondary hover:text-content"
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      activeTab === tab.key
                        ? "bg-primary-light/50 text-content"
                        : "bg-surface-alt text-content-muted"
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
                    <p className="text-content-secondary mb-2">No connections yet.</p>
                    <p className="text-content-muted text-sm">
                      Visit{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/startups")}
                        className="text-primary hover:text-primary-dark underline"
                      >
                        startups
                      </button>{" "}
                      or{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/investors")}
                        className="text-primary hover:text-primary-dark underline"
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
                        className="rounded-lg border border-line bg-surface-alt p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-alt border border-line flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {connection.other_user_photo_url
                              ? <img src={connection.other_user_photo_url} alt={connection.other_user_name} className="w-full h-full object-cover" />
                              : <span className="text-sm font-semibold text-content/50">{(connection.other_user_name || "U").charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div className={cardIdentityClass}>
                            {profilePath ? (
                              <button
                                type="button"
                                onClick={() => navigate(profilePath)}
                                className={`${cardIdentityTitleClass} hover:text-primary transition-colors text-left`}
                              >
                                {connection.other_user_name || "User"}
                              </button>
                            ) : (
                              <p className={cardIdentityTitleClass}>
                                {connection.other_user_name || "User"}
                              </p>
                            )}
                            <p className={`${cardIdentitySubtitleMutedClass} capitalize`}>
                              {connection.other_user_type || "member"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {profilePath && (
                            <button
                              type="button"
                              onClick={() => navigate(profilePath)}
                              className="px-3 py-1.5 rounded-lg border border-line text-content-secondary hover:text-content text-sm transition-colors"
                            >
                              View Profile
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleMessage(connection)}
                            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-sm !text-content-inverse transition-colors"
                          >
                            Message
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveConnection(connection.id)}
                            disabled={actionLoadingId === connection.id}
                            className="px-3 py-1.5 rounded-lg border border-error/30 text-error hover:bg-error/10 text-sm disabled:opacity-50 transition-colors"
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
                    <p className="text-content-secondary">No pending sent requests.</p>
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
                        className="rounded-lg border border-line bg-surface-alt p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-alt border border-line flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {request.other_user_photo_url
                              ? <img src={request.other_user_photo_url} alt={request.target_user_name} className="w-full h-full object-cover" />
                              : <span className="text-sm font-semibold text-content/50">{(request.target_user_name || "U").charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div className={cardIdentityClass}>
                            {profilePath ? (
                              <button
                                type="button"
                                onClick={() => navigate(profilePath)}
                                className={`${cardIdentityTitleClass} hover:text-primary transition-colors text-left`}
                              >
                                {request.target_user_name || "User"}
                              </button>
                            ) : (
                              <p className={cardIdentityTitleClass}>
                                {request.target_user_name || "User"}
                              </p>
                            )}
                            <p className={`${cardIdentitySubtitleMutedClass} capitalize`}>
                              {request.target_user_type || "member"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {profilePath && (
                            <button
                              type="button"
                              onClick={() => navigate(profilePath)}
                              className="px-3 py-1.5 rounded-lg border border-line text-content-secondary hover:text-content text-sm transition-colors"
                            >
                              View Profile
                            </button>
                          )}
                          <span className="px-2.5 py-1 text-xs border border-warning/30 bg-warning/15 text-warning rounded-full">
                            Pending
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCancelRequest(request.id)}
                            disabled={actionLoadingId === request.id}
                            className="px-3 py-1.5 rounded-lg border border-line text-content-muted hover:text-content text-sm disabled:opacity-50 transition-colors"
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
                    <p className="text-content-secondary">No pending received requests.</p>
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
                        className="rounded-lg border border-line bg-surface-alt p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-surface-alt border border-line flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {request.other_user_photo_url
                              ? <img src={request.other_user_photo_url} alt={request.requester_name} className="w-full h-full object-cover" />
                              : <span className="text-sm font-semibold text-content/50">{(request.requester_name || "U").charAt(0).toUpperCase()}</span>
                            }
                          </div>
                          <div className={cardIdentityClass}>
                            {profilePath ? (
                              <button
                                type="button"
                                onClick={() => navigate(profilePath)}
                                className={`${cardIdentityTitleClass} hover:text-primary transition-colors text-left`}
                              >
                                {request.requester_name || "User"}
                              </button>
                            ) : (
                              <p className={cardIdentityTitleClass}>
                                {request.requester_name || "User"}
                              </p>
                            )}
                            <p className={`${cardIdentitySubtitleMutedClass} capitalize`}>
                              {request.requester_user_type || "member"}
                            </p>
                            {request.message && (
                              <p className="text-sm text-content-secondary mt-1 italic">
                                "{request.message}"
                              </p>
                            )}
                            {request.created_at && (
                              <p className="text-xs text-content-muted mt-1">
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
                              className="px-3 py-1.5 rounded-lg border border-line text-content-secondary hover:text-content text-sm transition-colors"
                            >
                              View Profile
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRespond(request.id, "accepted")}
                            disabled={actionLoadingId === request.id}
                            className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-sm text-content-inverse disabled:opacity-50 transition-colors"
                          >
                            {actionLoadingId === request.id ? "…" : "Accept"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRespond(request.id, "declined")}
                            disabled={actionLoadingId === request.id}
                            className="px-3 py-1.5 rounded-lg border border-error/30 text-error hover:bg-error/10 text-sm disabled:opacity-50 transition-colors"
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
