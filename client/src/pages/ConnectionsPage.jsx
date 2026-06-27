import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  User,
  StickyNote,
  CalendarClock,
  ClipboardList,
  MessageCircleQuestion,
  MessageSquare,
  UserMinus,
} from "lucide-react";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";
import { useConnectionNotifications } from "../hooks/useConnectionNotifications";
import IntentLevelControl from "../components/investor/IntentLevelControl";
import ConnectionNotesPanel from "../components/connections/ConnectionNotesPanel";
import ConnectionMeetingsPanel from "../components/connections/ConnectionMeetingsPanel";
import ConnectionDdChecklistPanel from "../components/connections/ConnectionDdChecklistPanel";
import ConnectionQaPanel from "../components/connections/ConnectionQaPanel";
import VerificationBadge from "../components/common/VerificationBadge";
import {
  cardIdentityClass,
  cardIdentitySubtitleMutedClass,
  cardIdentityTitleClass,
  pageContainerClass,
  pageContentClass,
  pageEyebrowClass,
  pageHeadingClass,
  pageSubheadingClass,
  tabNavClass,
} from "../styles/theme";

// Shared styling for the connection action buttons (icon + label pills).
const connectionActionBtnClass =
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 border-content-muted/30 bg-surface text-sm font-medium text-content-secondary shadow-sm hover:text-primary hover:border-primary/60 hover:bg-primary/5 transition-colors";

// Red activity dot for a connection action button (top-right corner).
const ActionDot = () => (
  <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-surface" />
);

const ConnectionsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const isInvestor = user?.userType === "investor";
  const [activeTab, setActiveTab] = useState("connected");
  const [connections, setConnections] = useState([]);
  const [pendingSent, setPendingSent] = useState([]);
  const [pendingReceived, setPendingReceived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [notesConnection, setNotesConnection] = useState(null);
  const [meetingsConnection, setMeetingsConnection] = useState(null);
  const [ddConnection, setDdConnection] = useState(null);
  const [qaConnection, setQaConnection] = useState(null);
  const { flagsFor, markFeatureRead } = useConnectionNotifications();

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

  useEffect(() => {
    const panel = searchParams.get("open");
    const connectionId = searchParams.get("connectionId");
    if (panel !== "meetings" || !connectionId || loading) return;

    const connection = connections.find(
      (item) => String(item.id) === String(connectionId),
    );
    if (!connection) return;

    setMeetingsConnection({
      ...connection,
      openRequestForm: false,
    });
    setSearchParams({}, { replace: true });
  }, [connections, loading, searchParams, setSearchParams]);

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
    <div className={pageContainerClass}>
      <div className={`${pageContentClass} space-y-6`}>
        <div>
          <span className={pageEyebrowClass}>Network</span>
          <h1 className={pageHeadingClass}>Network Connections</h1>
          <p className={pageSubheadingClass}>
            Manage your venture relationships, ongoing discussions, and inbound opportunities.
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
          <section className="surface-card p-5 md:p-6">
            <div className="flex flex-wrap items-center border-b border-outline-variant gap-6 md:gap-8 mb-6">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`${tabNavClass(activeTab === tab.key)} flex items-center gap-2`}
                >
                  {tab.label.toUpperCase()}
                  {tab.count > 0 && (
                    <span className="bg-primary text-on-primary text-[10px] px-1.5 py-0.5 rounded-full font-label">
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
                            <div className="flex flex-wrap items-center gap-2">
                              <p className={`${cardIdentitySubtitleMutedClass} capitalize`}>
                                {connection.other_user_type || "member"}
                              </p>
                              {connection.other_user_verification_tier && (
                                <VerificationBadge tier={connection.other_user_verification_tier} />
                              )}
                            </div>
                            {isInvestor && connection.other_user_type === "startup" && (
                              <div className="mt-2 max-w-xs">
                                <IntentLevelControl
                                  connectionId={connection.id}
                                  value={connection.intent_level}
                                  onChange={(level) => {
                                    setConnections((prev) =>
                                      prev.map((item) =>
                                        item.id === connection.id
                                          ? { ...item, intent_level: level }
                                          : item,
                                      ),
                                    );
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                          {profilePath && (
                            <button
                              type="button"
                              onClick={() => navigate(profilePath)}
                              className={connectionActionBtnClass}
                            >
                              <User className="w-4 h-4" />
                              View Profile
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setNotesConnection(connection)}
                            className={connectionActionBtnClass}
                          >
                            <StickyNote className="w-4 h-4" />
                            Notes
                          </button>
                          {(() => {
                            const flags = flagsFor(connection.id);
                            return (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    markFeatureRead(connection.id, "meetings");
                                    setMeetingsConnection({
                                      ...connection,
                                      openRequestForm: isInvestor,
                                    });
                                  }}
                                  className={`relative ${connectionActionBtnClass}`}
                                >
                                  <CalendarClock className="w-4 h-4" />
                                  {isInvestor ? "Request Meeting" : "Meetings"}
                                  {flags.meetings && <ActionDot />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    markFeatureRead(connection.id, "dd");
                                    setDdConnection(connection);
                                  }}
                                  className={`relative ${connectionActionBtnClass}`}
                                >
                                  <ClipboardList className="w-4 h-4" />
                                  DD Checklist
                                  {flags.dd && <ActionDot />}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    markFeatureRead(connection.id, "qa");
                                    setQaConnection(connection);
                                  }}
                                  className={`relative ${connectionActionBtnClass}`}
                                >
                                  <MessageCircleQuestion className="w-4 h-4" />
                                  Q&amp;A
                                  {flags.qa && <ActionDot />}
                                </button>
                              </>
                            );
                          })()}
                          <button
                            type="button"
                            onClick={() => handleMessage(connection)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-dark text-sm font-medium !text-content-inverse transition-colors"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Message
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveConnection(connection.id)}
                            disabled={actionLoadingId === connection.id}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-error/30 text-error hover:bg-error/10 text-sm font-medium disabled:opacity-50 transition-colors"
                          >
                            <UserMinus className="w-4 h-4" />
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
                            {request.message && (
                              <p className="text-sm text-content-secondary mt-1 italic">
                                "{request.message}"
                              </p>
                            )}
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

      {notesConnection && (
        <ConnectionNotesPanel
          connectionId={notesConnection.id}
          title={`Notes — ${notesConnection.other_user_name || "connection"}`}
          onClose={() => setNotesConnection(null)}
        />
      )}
      {meetingsConnection && (
        <ConnectionMeetingsPanel
          connectionId={meetingsConnection.id}
          otherUserName={meetingsConnection.other_user_name}
          initialShowRequestForm={Boolean(meetingsConnection.openRequestForm)}
          onClose={() => setMeetingsConnection(null)}
        />
      )}
      {ddConnection && (
        <ConnectionDdChecklistPanel
          connectionId={ddConnection.id}
          otherUserName={ddConnection.other_user_name}
          startupProfileId={
            isInvestor && ddConnection.other_user_type === "startup"
              ? ddConnection.other_user_profile_id
              : null
          }
          onClose={() => setDdConnection(null)}
          onAskAboutItem={(item) => {
            const connection = ddConnection;
            setDdConnection(null);
            setQaConnection({
              id: connection.id,
              other_user_name: connection.other_user_name,
              checklistItemId: item.id,
              checklistItemDescription: item.description,
            });
          }}
        />
      )}
      {qaConnection && (
        <ConnectionQaPanel
          connectionId={qaConnection.id}
          otherUserName={qaConnection.other_user_name}
          checklistItemId={qaConnection.checklistItemId}
          checklistItemDescription={qaConnection.checklistItemDescription}
          onClose={() => setQaConnection(null)}
        />
      )}
    </div>
  );
};

export default ConnectionsPage;
