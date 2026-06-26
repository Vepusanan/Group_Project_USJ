import React, { Suspense, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  MapPin, Calendar, Users, Tag, Rocket, Globe, Linkedin,
  DollarSign, FileText, Video, BarChart2, Share2,
  CheckCircle, Clock, MessageCircle, ArrowLeft, PenLine, Lock, Bookmark, Sparkles, Ban,
} from "lucide-react";
import ConnectModal from "../components/connections/ConnectModal";
import ConnectionMeetingsPanel from "../components/connections/ConnectionMeetingsPanel";
const PitchDeckSlidePreview = React.lazy(
  () => import("../components/pitchDeck/PitchDeckSlidePreview"),
);
import investorIntentService from "../services/investorIntentService";
import IntentLevelControl from "../components/investor/IntentLevelControl";
import MatchExplanationBlock from "../components/investor/MatchExplanationBlock";
import { apiService } from "../services/apiService";
import { dataRoomService } from "../services/dataRoomService";
import FundingRoundTracker from "../components/funding/FundingRoundTracker";
import VerificationBadge from "../components/common/VerificationBadge";
import CredibilitySignals from "../components/trust/CredibilitySignals";
import ReportProfileButton from "../components/trust/ReportProfileButton";
import MilestoneFeed from "../components/milestones/MilestoneFeed";
import engagementService from "../services/engagementService";
import { useAuth } from "../hooks/useAuth";
import {
  getProfileRelationship,
  PROFILE_OWNER_TYPES,
  shouldShowPrivateSection,
} from "../utils/profileRelationship";
import TeamMembersDisplay from "../components/profile/TeamMembersDisplay";
import {
  SectionCard,
  Pill,
  PrivateBadge,
  LockOverlay,
} from "../components/common/SectionCard";
import {
  cardIdentityClass,
  profileIdentityTitleClass,
  profileIdentitySubtitleMutedClass,
  pageContainerClass,
  pageContentClass,
} from "../styles/theme";

// ─── helpers ─────────────────────────────────────────────────────────────────

const fmtDate = (ds) => {
  if (!ds) return null;
  return new Date(ds).toLocaleDateString([], { month: "short", year: "numeric" });
};

const fmtMoney = (val) => {
  if (!val) return null;
  const n = parseFloat(val);
  if (isNaN(n)) return null;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
};

const parseJson = (val, fallback = {}) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

const STARTUP_GRADIENTS = [
  ["from-primary", "to-primary-dark"],
  ["from-primary", "to-primary-dark"],
  ["from-primary-dark", "to-primary"],
  ["from-primary", "to-primary-dark"],
  ["from-primary", "to-primary-dark"],
];

const getGradient = (name = "") =>
  STARTUP_GRADIENTS[(name.charCodeAt(0) || 0) % STARTUP_GRADIENTS.length];

const STAGE_LABELS = {
  PRE_SEED: "Pre-seed", SEED: "Seed", SERIES_A: "Series A",
  SERIES_B: "Series B", SERIES_C: "Series C", SERIES_D_PLUS: "Series D+",
  PRE_REVENUE: "Pre-revenue", REVENUE_GENERATING: "Revenue-generating", PROFITABLE: "Profitable",
  IDEA: "Idea", MVP: "MVP", EARLY_TRACTION: "Early Traction", GROWTH: "Growth", SCALE: "Scale",
};

// ─── sub-components ───────────────────────────────────────────────────────────

const DocLink = ({ href, icon: Icon, label }) => {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-line bg-surface-alt hover:bg-surface-alt hover:border-line transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary-light flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm text-content-secondary group-hover:text-content transition-colors">{label}</span>
    </a>
  );
};

const DataRoomRequestButton = ({
  startupProfileId,
  companyName,
  requestStatus,
  onRequested,
  busy,
}) => (
  <button
    type="button"
    disabled={busy || requestStatus === "pending"}
    onClick={onRequested}
    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-line bg-surface-alt hover:border-primary-light transition-all text-left disabled:opacity-60"
  >
    <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary-light flex items-center justify-center flex-shrink-0">
      <Lock className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <span className="text-sm text-content-secondary block">
        {requestStatus === "pending"
          ? "Data room access requested"
          : "Request data room access"}
      </span>
      <span className="text-[11px] text-content-muted">
        {requestStatus === "pending"
          ? "The startup will review your request"
          : `Ask ${companyName || "this startup"} for due diligence documents`}
      </span>
    </div>
  </button>
);

const DataRoomLink = ({ startupProfileId, companyName, isOwner }) => (
  <Link
    to={isOwner ? "/data-room" : `/startups/${startupProfileId}/data-room`}
    className="flex items-center gap-3 px-4 py-3 rounded-xl border border-line bg-surface-alt hover:border-primary-light transition-all group"
  >
    <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary-light flex items-center justify-center flex-shrink-0">
      <Lock className="w-4 h-4 text-primary" />
    </div>
    <div className="min-w-0">
      <span className="text-sm text-content-secondary group-hover:text-content transition-colors block">
        {isOwner ? "Manage Private Data Room" : "Open Private Data Room"}
      </span>
      <span className="text-[11px] text-content-muted">
        {isOwner
          ? "Upload and grant investor access to confidential documents"
          : `Due diligence documents from ${companyName || "this startup"}`}
      </span>
    </div>
  </Link>
);

const StatChip = ({ icon: Icon, label, value, color = "gray" }) => {
  if (!value) return null;
  const textCls = { gray: "text-content-secondary", emerald: "text-primary", blue: "text-primary", purple: "text-primary" }[color];
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={`w-3.5 h-3.5 ${textCls}`} />
      <span className="text-content-muted">{label}:</span>
      <span className={`font-medium ${textCls}`}>{value}</span>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

const StartupProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profile, setProfile]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState("");
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectionId, setConnectionId]     = useState(null);
  const [connectionRequesterId, setConnectionRequesterId] = useState(null);
  const [connectionDeclinedAt, setConnectionDeclinedAt] = useState(null);
  const [showModal, setShowModal]           = useState(false);
  const [connectMsg, setConnectMsg]         = useState("");
  const [actionLoading, setActionLoading]   = useState(false);
  const [shareToast, setShareToast]         = useState(false);
  const [dataRoomAccess, setDataRoomAccess] = useState(null);
  const [dataRoomRequestBusy, setDataRoomRequestBusy] = useState(false);
  const [isWatchlisted, setIsWatchlisted] = useState(false);
  const [passing, setPassing] = useState(false);
  const [showVideoPitch, setShowVideoPitch] = useState(false);
  const [showMeetingsPanel, setShowMeetingsPanel] = useState(false);
  const [profileIntent, setProfileIntent] = useState(null);

  useEffect(() => {
    // Scroll to top when navigating between profiles.
    window.scrollTo({ top: 0, behavior: "auto" });
    (async () => {
      setLoading(true);
      setError("");
      const res = await apiService.getStartupProfileById(id);
      if (!res.success) { setError(res.error || "Failed to load profile"); setLoading(false); return; }
      const data = res.data?.data || null;
      setProfile(data);
      setConnectionStatus(data?.connection_status || null);
      setConnectionId(data?.connection_id || null);
      setConnectionRequesterId(data?.connection_requester_id || null);
      setConnectionDeclinedAt(data?.connection_declined_at || null);
      setProfileIntent(data?.intent_level || data?.profile_intent_level || null);
      setLoading(false);
      // Ensure we're at the top after the new content paints.
      window.scrollTo({ top: 0, behavior: "auto" });
    })();
  }, [id]);

  useEffect(() => {
    if (!user?.id || !id) return;
    (async () => {
      const result = await dataRoomService.getMeta(id);
      if (result.success) {
        setDataRoomAccess(result.data);
      } else {
        setDataRoomAccess(null);
      }
    })();
  }, [id, user?.id]);

  useEffect(() => {
    if (user?.userType !== "investor" || !id) return;
    (async () => {
      const list = await engagementService.getWatchlist();
      if (list.success) {
        const saved = (list.data || []).some(
          (item) => String(item.startup_profile_id) === String(id),
        );
        setIsWatchlisted(saved);
      }
    })();
  }, [id, user?.userType]);

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-surface">
      <div className="w-10 h-10 border-4 border-primary-light/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className={pageContainerClass}>
      <div className={`${pageContentClass} rounded-2xl border border-error/30 bg-error/10 p-6 text-error`}>
        {error || "Profile not found"}
      </div>
    </div>
  );

  const relationship = getProfileRelationship({
    viewerUserId: user?.id,
    viewerUserType: user?.userType,
    profileUserId: profile.user_id,
    profileOwnerType: PROFILE_OWNER_TYPES.STARTUP,
    connectionStatus,
    connectionRequesterId,
    connectionDeclinedAt,
  });

  const isOwn = relationship.kind === "self";
  const isConnected = relationship.kind === "connected";
  const isPending = relationship.kind === "pending_sent" || relationship.kind === "pending_received";

  const name = profile.company_name || "Startup";
  const [gFrom, gTo] = getGradient(name);
  const initial = name.charAt(0).toUpperCase();
  const socialLinks = parseJson(profile.social_media_links);

  const sendConnection = async () => {
    setActionLoading(true);
    const res = await apiService.createConnection(profile.user_id, connectMsg.trim());
    setActionLoading(false);
    if (!res.success) { setError(res.error || "Failed to send request"); return; }
    setConnectionStatus("pending");
    setConnectionId(res.data?.data?.id || null);
    setShowModal(false);
    setConnectMsg("");
  };

  const handlePass = async () => {
    const profileId = profile?.startup_profile_id || id;
    if (!profileId) return;
    setPassing(true);
    const result = await investorIntentService.passStartup(profileId);
    setPassing(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    navigate("/startups");
  };

  const toggleWatchlist = async () => {
    const profileId = profile?.startup_profile_id || id;
    const result = isWatchlisted
      ? await engagementService.removeFromWatchlist(profileId)
      : await engagementService.addToWatchlist(profileId);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setIsWatchlisted(!isWatchlisted);
  };

  const requestDataRoomAccess = async () => {
    const profileId = profile?.startup_profile_id || id;
    setDataRoomRequestBusy(true);
    const result = await dataRoomService.requestAccess(profileId);
    setDataRoomRequestBusy(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setDataRoomAccess((prev) => ({
      ...prev,
      access_request_status: result.data?.status || "pending",
    }));
  };

  const acceptRequest = async () => {
    if (!connectionId) return;
    setActionLoading(true);
    const res = await apiService.respondToConnection(connectionId, "accepted");
    setActionLoading(false);
    if (res.success) {
      setConnectionStatus("accepted");
    } else {
      setError(res.error || "Failed to accept request");
    }
  };

  const declineRequest = async () => {
    if (!connectionId) return;
    setActionLoading(true);
    const res = await apiService.respondToConnection(connectionId, "declined");
    setActionLoading(false);
    if (res.success) {
      setConnectionStatus(null);
      setConnectionId(null);
      setConnectionRequesterId(null);
    } else {
      setError(res.error || "Failed to decline request");
    }
  };

  const goMessage = () => {
    const p = new URLSearchParams({ userId: String(profile.user_id), name });
    if (profile.logo_url) p.set("photo", profile.logo_url);
    navigate(`/messages?${p}`);
  };

  const share = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    });
  };

  return (
    <div className={pageContainerClass}>
      <div className={`${pageContentClass} space-y-6`}>

        <Link to="/startups" className="inline-flex items-center gap-1.5 text-sm text-outline hover:text-on-surface transition-colors font-label uppercase tracking-wide">
          <ArrowLeft className="w-4 h-4" /> Back to Startups
        </Link>

        <div className="surface-card p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
                <div className={`w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br ${gFrom} ${gTo} border border-line flex items-center justify-center flex-shrink-0 shadow-soft overflow-hidden`}>
                  {profile.logo_url
                    ? <img src={profile.logo_url} alt={name} className="w-full h-full object-cover" />
                    : <span className="avatar-initial text-5xl">{initial}</span>
                  }
                </div>
                <div className={cardIdentityClass}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={profileIdentityTitleClass}>{name}</h1>
                    <VerificationBadge tier={profile.verification_tier} size="lg" />
                  </div>
                  {profile.tagline && (
                    <p className={profileIdentitySubtitleMutedClass}>{profile.tagline}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                {user?.userType === "investor" && !isOwn && (
                  <button
                    type="button"
                    onClick={toggleWatchlist}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors ${
                      isWatchlisted
                        ? "border-primary bg-primary/10 text-primary"
                        : "bg-surface border-line text-content-secondary hover:bg-surface-alt"
                    }`}
                  >
                    <Bookmark className={`w-3.5 h-3.5 ${isWatchlisted ? "fill-current" : ""}`} />
                    {isWatchlisted ? "Saved" : "Watchlist"}
                  </button>
                )}
                <button
                  type="button"
                  onClick={share}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line text-content-secondary text-xs hover:bg-surface-alt transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                {!isOwn && user && (
                  <ReportProfileButton
                    reportedUserId={profile.user_id}
                    reportedName={name}
                  />
                )}
                {isOwn && (
                  <Link
                    to="/profile/edit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line text-content-secondary text-xs hover:bg-surface-alt transition-colors"
                  >
                    <PenLine className="w-3.5 h-3.5" /> Edit Profile
                  </Link>
                )}
              {relationship.showInteractionActions && (
                <>
                  {isConnected ? (
                    <>
                      <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-success/30 bg-success/10 text-success text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Connected
                      </span>
                      {(profile.can_view_pitch_deck || profile.pitch_deck_url) && (
                        <Link
                          to={`/startups/${profile.startup_profile_id || id}/pitch-deck`}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-primary-light/40 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                        >
                          <BarChart2 className="w-4 h-4" /> View Pitch Deck
                        </Link>
                      )}
                      {(profile.can_view_founder_video || profile.founder_video_url) && profile.founder_video_url && (
                        <button
                          type="button"
                          onClick={() => setShowVideoPitch(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-surface-alt text-content-secondary text-sm font-medium hover:text-content transition-colors"
                        >
                          <Video className="w-4 h-4" /> Video Pitch
                        </button>
                      )}
                      <button type="button" onClick={goMessage}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-sm text-content-inverse font-medium transition-colors">
                        <MessageCircle className="w-4 h-4" /> Message
                      </button>
                      {user?.userType === "investor" && connectionId && (
                        <button
                          type="button"
                          onClick={() => setShowMeetingsPanel(true)}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line bg-surface-alt text-content-secondary text-sm font-medium hover:text-content transition-colors"
                        >
                          <Calendar className="w-4 h-4" /> Request Meeting
                        </button>
                      )}
                    </>
                  ) : relationship.canRespondToConnection ? (
                    <>
                      <button type="button" onClick={acceptRequest} disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-sm text-content-inverse font-medium disabled:opacity-50 transition-colors">
                        {actionLoading ? "…" : "Accept"}
                      </button>
                      <button type="button" onClick={declineRequest} disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-error/30 text-error hover:bg-error/10 text-sm font-medium disabled:opacity-50 transition-colors">
                        Decline
                      </button>
                    </>
                  ) : isPending ? (
                    <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-warning/40 bg-warning/15 text-warning text-sm font-medium">
                      <Clock className="w-4 h-4" />
                      Pending
                    </span>
                  ) : relationship.kind === "declined_cooling" ? (
                    <span
                      className="px-3 py-2 rounded-xl border border-line bg-surface-alt text-content-muted text-sm"
                      title="30-day cooling period after a declined request"
                    >
                      Connect available {relationship.coolingEndsLabel ? `after ${relationship.coolingEndsLabel}` : "later"}
                    </span>
                  ) : relationship.canInitiateConnection ? (
                    <>
                      <button type="button" onClick={() => setShowModal(true)}
                        className="px-5 py-2 rounded-xl btn-connect-token bg-primary hover:bg-primary-dark text-sm !text-content-inverse font-medium transition-colors shadow-soft">
                        Connect
                      </button>
                      <button
                        type="button"
                        onClick={handlePass}
                        disabled={passing}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-line text-content-muted text-sm hover:text-content hover:bg-surface-alt disabled:opacity-50"
                      >
                        <Ban className="w-4 h-4" />
                        {passing ? "Passing…" : "Pass"}
                      </button>
                    </>
                  ) : null}
                </>
              )}
              </div>
            </div>

            {/* meta chips */}
            <div className="mt-3 flex flex-wrap gap-3">
              {profile.industry && (
                <Pill color="purple"><Tag className="w-3 h-3" />{profile.industry}</Pill>
              )}
              {(profile.location_city || profile.location_country) && (
                <Pill><MapPin className="w-3 h-3" />
                  {[profile.location_city, profile.location_country].filter(Boolean).join(", ")}
                </Pill>
              )}
              {profile.founded_date && (
                <Pill><Calendar className="w-3 h-3" />Est. {fmtDate(profile.founded_date)}</Pill>
              )}
              {profile.current_stage && (
                <Pill color="blue"><Rocket className="w-3 h-3" />{STAGE_LABELS[profile.current_stage] || profile.current_stage}</Pill>
              )}
              {profile.team_size && (
                <Pill><Users className="w-3 h-3" />{profile.team_size} people</Pill>
              )}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noreferrer">
                  <Pill color="emerald"><Globe className="w-3 h-3" />Website</Pill>
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                  <Pill><Linkedin className="w-3 h-3" />LinkedIn</Pill>
                </a>
              )}
            </div>
        </div>

        {user?.userType === "investor" && profile.match_score != null && (
          <div className="rounded-2xl border border-primary-light/30 bg-primary-light/10 p-5 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="text-2xl font-bold text-content">{Math.round(profile.match_score)}%</span>
              <span className="text-sm font-medium text-content-secondary">compatibility match</span>
            </div>
            <MatchExplanationBlock
              startupProfileId={profile.startup_profile_id || id}
              matchScore={profile.match_score}
            />
          </div>
        )}

        {user?.userType === "investor" && !isOwn && (
          <div className="rounded-2xl border border-line bg-surface-alt p-4 max-w-md">
            <IntentLevelControl
              connectionId={isConnected ? connectionId : null}
              startupProfileId={profile.startup_profile_id || id}
              value={profileIntent}
              preConnection={!isConnected}
              onChange={setProfileIntent}
            />
            {!isConnected && profileIntent && (
              <p className="text-xs text-content-muted mt-2">
                This startup appears in your pipeline under <strong>Discovered</strong>.
              </p>
            )}
          </div>
        )}

        {/* ── ABOUT ─────────────────────────────────────────────────────────── */}
        {(profile.detailed_description || profile.problem_statement || profile.solution) && (
          <SectionCard title="About" icon={BarChart2} accent="purple">
            {profile.detailed_description && (
              <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line mb-4">
                {profile.detailed_description}
              </p>
            )}
            {(profile.problem_statement || profile.solution) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {profile.problem_statement && (
                  <div className="rounded-xl bg-error/10 border border-error/20 p-4">
                    <p className="text-[10px] font-semibold text-error uppercase tracking-widest mb-2">Problem</p>
                    <p className="text-content-secondary text-sm leading-relaxed">{profile.problem_statement}</p>
                  </div>
                )}
                {profile.solution && (
                  <div className="rounded-xl bg-primary/8 border border-primary-light p-4">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Solution</p>
                    <p className="text-content-secondary text-sm leading-relaxed">{profile.solution}</p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        )}

        {profile.credibility_signals && (
          <CredibilitySignals
            signals={profile.credibility_signals}
            userType="startup"
          />
        )}

        <MilestoneFeed startupProfileId={profile.startup_profile_id || id} />

        {/* ── TEAM ──────────────────────────────────────────────────────────── */}
        {(profile.key_team_members || profile.team_size) && (
          <SectionCard title="Team" icon={Users} accent="blue">
            <div className="space-y-3">
              {profile.team_size && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-primary/10 border border-primary-light">
                  <Users className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">{profile.team_size} team members</span>
                </div>
              )}
              {profile.key_team_members && (
                <TeamMembersDisplay value={profile.key_team_members} />
              )}
              {profile.team_photo_url && (
                <img src={profile.team_photo_url} alt="Team"
                  className="mt-3 rounded-xl max-h-64 border border-line object-cover" />
              )}
            </div>
          </SectionCard>
        )}

        {/* ── TRACTION ──────────────────────────────────────────────────────── */}
        {(profile.key_metrics || profile.major_achievements || profile.customer_testimonials) && (
          <SectionCard title="Traction & Achievements" icon={Rocket} accent="emerald">
            <div className="space-y-5">
              {profile.key_metrics && (
                <div>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Key Metrics</p>
                  <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">{profile.key_metrics}</p>
                </div>
              )}
              {profile.major_achievements && (
                <div>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Major Achievements</p>
                  <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">{profile.major_achievements}</p>
                </div>
              )}
              {profile.customer_testimonials && (
                <div className="rounded-xl bg-surface-alt border border-line p-4">
                  <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-2">Testimonials</p>
                  <p className="text-content-secondary text-sm leading-relaxed italic whitespace-pre-line">{profile.customer_testimonials}</p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── FUNDING ROUND TRACKER (public summary, financials gated) ─────── */}
        {profile.funding_round && (
          <FundingRoundTracker
            round={profile.funding_round}
            isOwner={isOwn}
          />
        )}

        {/* ── FUNDING (private) ─────────────────────────────────────────────── */}
        {shouldShowPrivateSection(relationship) && (
        <SectionCard
          title="Funding Details"
          icon={DollarSign}
          accent="amber"
          badge={relationship.showPrivateBadge ? <PrivateBadge /> : null}
        >
          {relationship.canViewPrivate ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {profile.funding_stage && (
                  <div className="rounded-xl bg-warning/8 border border-warning/20 p-4">
                    <p className="text-[10px] font-semibold text-warning uppercase tracking-widest mb-1">Stage Seeking</p>
                    <p className="text-content font-semibold">{STAGE_LABELS[profile.funding_stage] || profile.funding_stage}</p>
                  </div>
                )}
                {profile.amount_seeking && (
                  <div className="rounded-xl bg-primary/8 border border-primary-light p-4">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1">Amount Seeking</p>
                    <p className="text-content font-semibold">{fmtMoney(profile.amount_seeking)}</p>
                  </div>
                )}
                {profile.revenue_status && (
                  <div className="rounded-xl bg-primary/8 border border-primary-light p-4">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1">Revenue Status</p>
                    <p className="text-content font-semibold">{STAGE_LABELS[profile.revenue_status] || profile.revenue_status}</p>
                  </div>
                )}
                {profile.previous_funding && (
                  <div className="rounded-xl bg-primary-light/8 border border-primary-light/15 p-4">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1">Previously Raised</p>
                    <p className="text-content font-semibold">{fmtMoney(profile.previous_funding)}</p>
                  </div>
                )}
              </div>
              {profile.use_of_funds && (
                <div>
                  <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-2">Use of Funds</p>
                  <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">{profile.use_of_funds}</p>
                </div>
              )}
            </div>
          ) : (
            <LockOverlay message="Connect with this startup to view funding details" />
          )}
        </SectionCard>
        )}

        {/* ── DOCUMENTS (private) ───────────────────────────────────────────── */}
        {shouldShowPrivateSection(relationship) && (
        <SectionCard
          title="Documents & Resources"
          icon={FileText}
          accent="blue"
          badge={relationship.showPrivateBadge ? <PrivateBadge /> : null}
        >
          {relationship.canViewPrivate ? (
            <div className="space-y-2">
              {(profile.can_view_pitch_deck || profile.pitch_deck_url) && (
                <Suspense
                  fallback={
                    <div className="h-40 animate-pulse rounded-xl bg-surface-container" />
                  }
                >
                  <PitchDeckSlidePreview
                    startupProfileId={profile.startup_profile_id || id}
                    companyName={profile.company_name}
                  />
                </Suspense>
              )}
              {dataRoomAccess?.can_access ? (
                <DataRoomLink
                  startupProfileId={profile.startup_profile_id || id}
                  companyName={profile.company_name}
                  isOwner={dataRoomAccess.is_owner}
                />
              ) : (
                isConnected &&
                user?.userType === "investor" &&
                dataRoomAccess && (
                  <DataRoomRequestButton
                    startupProfileId={profile.startup_profile_id || id}
                    companyName={profile.company_name}
                    requestStatus={dataRoomAccess.access_request_status}
                    onRequested={requestDataRoomAccess}
                    busy={dataRoomRequestBusy}
                  />
                )
              )}
              <DocLink href={profile.business_plan_url} icon={FileText} label="Business Plan" />
              <DocLink href={profile.product_demo_url} icon={Video} label="Product Demo" />
              {(profile.can_view_founder_video || profile.founder_video_url) && (
                <div id="founder-video" className="rounded-xl border border-line bg-surface-alt p-3">
                  <p className="text-sm font-medium text-content mb-2 flex items-center gap-2">
                    <Video className="w-4 h-4 text-primary" />
                    Founder Video Introduction
                  </p>
                  {profile.founder_video_url ? (
                    <video
                      src={profile.founder_video_url}
                      controls
                      playsInline
                      poster={profile.founder_video_thumbnail_url || undefined}
                      className="w-full rounded-lg border border-line max-h-80 bg-black"
                    />
                  ) : (
                    <p className="text-xs text-content-muted">Video available to connected investors.</p>
                  )}
                </div>
              )}
              {!profile.has_pitch_deck &&
                !profile.pitch_deck_url &&
                !profile.business_plan_url &&
                !profile.product_demo_url &&
                !profile.has_founder_video &&
                !profile.founder_video_url && (
                <p className="text-sm text-content-muted">No documents uploaded yet.</p>
              )}
            </div>
          ) : (
            <LockOverlay message="Connect to access documents and resources" />
          )}
        </SectionCard>
        )}

        {/* ── CONTACT ───────────────────────────────────────────────────────── */}
        <SectionCard title="Contact" icon={MessageCircle} accent="purple">
          <div className="space-y-4">
            {/* Public social links */}
            <div className="flex flex-wrap gap-2">
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noreferrer">
                  <Pill color="blue"><Globe className="w-3 h-3" />Website</Pill>
                </a>
              )}
              {profile.linkedin_url && (
                <a href={profile.linkedin_url} target="_blank" rel="noreferrer">
                  <Pill><Linkedin className="w-3 h-3" />LinkedIn</Pill>
                </a>
              )}
              {Object.entries(socialLinks).map(([k, v]) =>
                v ? (
                  <a key={k} href={v} target="_blank" rel="noreferrer">
                    <Pill><Globe className="w-3 h-3" />{k}</Pill>
                  </a>
                ) : null
              )}
            </div>

            {/* Private */}
            {relationship.canViewPrivate ? (
              <div className="rounded-xl bg-surface-alt border border-line p-4 space-y-3">
                {profile.primary_contact_name && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-0.5">Contact Person</p>
                    <p className="text-content-secondary text-sm">{profile.primary_contact_name}</p>
                  </div>
                )}
                {profile.contact_email && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-0.5">Email</p>
                    <a href={`mailto:${profile.contact_email}`} className="text-primary hover:text-primary-dark text-sm transition-colors">
                      {profile.contact_email}
                    </a>
                  </div>
                )}
                {profile.phone_number && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-0.5">Phone</p>
                    <a href={`tel:${profile.phone_number}`} className="text-primary hover:text-primary-dark text-sm transition-colors">
                      {profile.phone_number}
                    </a>
                  </div>
                )}
              </div>
            ) : relationship.showPrivateLock ? (
              <LockOverlay message="Connect to view private contact details" />
            ) : null}
          </div>
        </SectionCard>

        {/* ── FOOTER META ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-5 px-1 pb-2">
          <StatChip icon={Calendar} label="Member since" value={fmtDate(profile.created_at)} color="gray" />
          <StatChip icon={Calendar} label="Last updated"  value={fmtDate(profile.updated_at)}  color="gray" />
        </div>
      </div>

      {showVideoPitch && profile.founder_video_url && (
        <div className="fixed inset-0 z-50 bg-surface/50 flex items-center justify-center p-4">
          <div className="w-full max-w-3xl rounded-2xl border border-line bg-surface shadow-card p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold text-content flex items-center gap-2">
                <Video className="w-5 h-5 text-primary" />
                Video Pitch — {name}
              </h3>
              <button
                type="button"
                onClick={() => setShowVideoPitch(false)}
                className="px-3 py-1.5 rounded-lg border border-line text-sm text-content-secondary hover:text-content"
              >
                Close
              </button>
            </div>
            <video
              src={profile.founder_video_url}
              controls
              playsInline
              autoPlay
              poster={profile.founder_video_thumbnail_url || undefined}
              className="w-full rounded-xl border border-line max-h-[70vh] bg-black"
            />
          </div>
        </div>
      )}

      {showMeetingsPanel && connectionId && (
        <ConnectionMeetingsPanel
          connectionId={connectionId}
          otherUserName={name}
          initialShowRequestForm
          onClose={() => setShowMeetingsPanel(false)}
        />
      )}

      <ConnectModal
        open={showModal && relationship.canInitiateConnection}
        companyName={name}
        initial={initial}
        gradientFrom={gFrom}
        gradientTo={gTo}
        message={connectMsg}
        onMessageChange={setConnectMsg}
        onCancel={() => {
          setShowModal(false);
          setConnectMsg("");
        }}
        onSubmit={sendConnection}
        loading={actionLoading}
      />

      {/* ── SHARE TOAST ───────────────────────────────────────────────────── */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-surface border border-line text-sm text-content px-4 py-2.5 rounded-xl shadow-card">
          <CheckCircle className="w-4 h-4 text-primary" /> Link copied to clipboard
        </div>
      )}
    </div>
  );
};

export default StartupProfilePage;
