import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  MapPin, Calendar, Globe, Linkedin, DollarSign, Briefcase,
  TrendingUp, Target, Share2, CheckCircle, Clock,
  MessageCircle, ArrowLeft, PenLine, Award, Users, BarChart2,
} from "lucide-react";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";
import {
  getProfileRelationship,
  PROFILE_OWNER_TYPES,
  shouldShowPrivateSection,
} from "../utils/profileRelationship";
import {
  SectionCard,
  Pill,
  TagGrid,
  PrivateBadge,
  LockOverlay,
} from "../components/common/SectionCard";
import {
  cardIdentityClass,
  pageContainerClass,
  pageContentClass,
  profileIdentityTitleClass,
  profileIdentitySubtitleClass,
} from "../styles/theme";
import VerificationBadge from "../components/common/VerificationBadge";
import CredibilitySignals from "../components/trust/CredibilitySignals";
import ReportProfileButton from "../components/trust/ReportProfileButton";

// ─── helpers ──────────────────────────────────────────────────────────────────

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

const parseJson = (val, fallback = []) => {
  if (!val) return fallback;
  if (typeof val === "object") return val;
  try { return JSON.parse(val); } catch { return fallback; }
};

const toList = (val) => {
  const p = parseJson(val, null);
  if (!p) return [];
  if (Array.isArray(p)) return p.filter(Boolean);
  if (typeof p === "object") return Object.values(p).filter(Boolean);
  if (typeof p === "string" && p.trim()) return [p];
  return [];
};

const INVESTOR_GRADIENTS = [
  ["from-primary", "to-primary-dark"],
  ["from-primary-dark", "to-primary"],
  ["from-primary", "to-primary-dark"],
  ["from-primary-dark", "to-primary"],
  ["from-primary", "to-primary-dark"],
];

const getGradient = (name = "") =>
  INVESTOR_GRADIENTS[(name.charCodeAt(0) || 0) % INVESTOR_GRADIENTS.length];

// ─── sub-components ───────────────────────────────────────────────────────────

const StatBox = ({ label, value, color = "purple" }) => {
  if (!value) return null;
  const bg = {
    purple:  "bg-primary-light/10 border-primary-light/20",
    violet:  "bg-primary-light border-primary-light",
    emerald: "bg-primary/10 border-primary-light",
    blue:    "bg-primary/10 border-primary-light",
    amber:   "bg-warning/10 border-warning/20",
  }[color];
  const text = {
    purple:  "text-primary",
    violet:  "text-primary",
    emerald: "text-primary",
    blue:    "text-primary",
    amber:   "text-warning",
  }[color];
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${text}`}>{label}</p>
      <p className="text-content font-semibold text-base">{value}</p>
    </div>
  );
};

// ─── main component ───────────────────────────────────────────────────────────

const InvestorProfilePage = () => {
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

  useEffect(() => {
    // Scroll to top when navigating between profiles.
    window.scrollTo({ top: 0, behavior: "auto" });
    (async () => {
      setLoading(true);
      setError("");
      const res = await apiService.getInvestorProfileById(id);
      if (!res.success) { setError(res.error || "Failed to load profile"); setLoading(false); return; }
      const data = res.data?.data || null;
      if (!data) { setError("Profile not found"); setLoading(false); return; }
      setProfile(data);
      setConnectionStatus(data.connection_status || null);
      setConnectionId(data.connection_id || null);
      setConnectionRequesterId(data.connection_requester_id || null);
      setConnectionDeclinedAt(data.connection_declined_at || null);
      setLoading(false);
      // Ensure we're at the top after the new content paints.
      window.scrollTo({ top: 0, behavior: "auto" });
    })();
  }, [id]);

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
    profileOwnerType: PROFILE_OWNER_TYPES.INVESTOR,
    connectionStatus,
    connectionRequesterId,
    connectionDeclinedAt,
  });

  const isOwn = relationship.kind === "self";
  const isConnected = relationship.kind === "connected";
  const isPending = relationship.kind === "pending_sent" || relationship.kind === "pending_received";
  const isReceivedRequest = relationship.canRespondToConnection;

  const name        = profile.name_or_firm || "Investor";
  const initial     = name.charAt(0).toUpperCase();
  const [gFrom, gTo] = getGradient(name);

  const industries   = toList(profile.industries_of_interest);
  const stages       = toList(profile.stage_preference);
  const geographies  = toList(profile.geographic_preference);
  const structures   = toList(profile.investment_structure);
  const portfolio    = toList(profile.portfolio_companies);
  const social       = parseJson(profile.social_media, {});

  const checkRange = [fmtMoney(profile.min_investment_size), fmtMoney(profile.max_investment_size)]
    .filter(Boolean).join(" – ");

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

  const acceptRequest = async () => {
    if (!connectionId) return;
    setActionLoading(true);
    const res = await apiService.respondToConnection(connectionId, "accepted");
    setActionLoading(false);
    if (res.success) { setConnectionStatus("accepted"); } else { setError(res.error || "Failed to accept request"); }
  };

  const declineRequest = async () => {
    if (!connectionId) return;
    setActionLoading(true);
    const res = await apiService.respondToConnection(connectionId, "declined");
    setActionLoading(false);
    if (res.success) { setConnectionStatus(null); setConnectionId(null); setConnectionRequesterId(null); } else { setError(res.error || "Failed to decline request"); }
  };

  const goMessage = () => {
    const p = new URLSearchParams({ userId: String(profile.user_id), name });
    if (profile.photo_url) p.set("photo", profile.photo_url);
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
      <div className={`${pageContentClass} space-y-5`}>

        {/* back */}
        <Link to="/investors" className="inline-flex items-center gap-1.5 text-sm text-content-muted hover:text-content transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Investors
        </Link>

        {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-line bg-surface overflow-hidden shadow-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 min-w-0">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gFrom} ${gTo} border border-line flex items-center justify-center flex-shrink-0 shadow-soft overflow-hidden`}>
                  {(profile.photo_url || profile.profile_photo_url)
                    ? <img src={profile.photo_url || profile.profile_photo_url} alt={name} className="w-full h-full object-cover" />
                    : <span className="avatar-initial text-3xl">{initial}</span>
                  }
                </div>
                <div className={cardIdentityClass}>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className={profileIdentityTitleClass}>{name}</h1>
                    <VerificationBadge tier={profile.verification_tier} size="lg" />
                  </div>
                  {profile.investor_type && (
                    <p className={profileIdentitySubtitleClass}>{profile.investor_type}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                <button type="button" onClick={share}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line text-content-secondary text-xs hover:bg-surface-alt transition-colors">
                  <Share2 className="w-3.5 h-3.5" /> Share
                </button>
                {!isOwn && user && (
                  <ReportProfileButton
                    reportedUserId={profile.user_id}
                    reportedName={name}
                  />
                )}
                {isOwn && (
                  <Link to="/profile/edit"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-line text-content-secondary text-xs hover:bg-surface-alt transition-colors">
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
                      <button type="button" onClick={goMessage}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-primary-dark text-sm text-content-inverse font-medium transition-colors">
                        <MessageCircle className="w-4 h-4" /> Message
                      </button>
                    </>
                  ) : isReceivedRequest ? (
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
                    <button type="button" onClick={() => setShowModal(true)}
                      className="px-5 py-2 rounded-xl btn-connect-token bg-primary hover:bg-primary-dark text-sm !text-content-inverse font-medium transition-colors shadow-soft">
                      Connect
                    </button>
                  ) : null}
                </>
              )}
              </div>
            </div>

            {/* meta chips */}
            <div className="mt-3 flex flex-wrap gap-2">
              {geographies.length > 0 && (
                <Pill><MapPin className="w-3 h-3" />
                  {geographies.slice(0, 2).join(", ")}
                  {geographies.length > 2 ? ` +${geographies.length - 2}` : ""}
                </Pill>
              )}
              {profile.years_of_experience && (
                <Pill color="violet"><Briefcase className="w-3 h-3" />{profile.years_of_experience}+ yrs experience</Pill>
              )}
              {checkRange && (
                <Pill color="emerald"><DollarSign className="w-3 h-3" />{checkRange}</Pill>
              )}
              {profile.website_url && (
                <Pill color="blue" href={profile.website_url}><Globe className="w-3 h-3" />Website</Pill>
              )}
              {profile.linkedin_url && (
                <Pill href={profile.linkedin_url}><Linkedin className="w-3 h-3" />LinkedIn</Pill>
              )}
            </div>
        </div>

        {profile.credibility_signals && (
          <CredibilitySignals
            signals={profile.credibility_signals}
            userType="investor"
          />
        )}

        {/* ── ABOUT ─────────────────────────────────────────────────────────── */}
        {(profile.professional_background || profile.bio || profile.background || profile.investment_thesis) && (
          <SectionCard title="About" icon={BarChart2} accent="violet">
            <div className="space-y-5">
              {(profile.professional_background || profile.bio || profile.background) && (
                <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">
                  {profile.professional_background || profile.bio || profile.background}
                </p>
              )}
              {profile.investment_thesis && (
                <div className="rounded-xl bg-primary-light/8 border border-primary-light/15 p-4">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Investment Thesis</p>
                  <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">{profile.investment_thesis}</p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── INVESTMENT FOCUS ──────────────────────────────────────────────── */}
        <SectionCard title="Investment Focus" icon={Target} accent="purple">
          <div className="space-y-5">
            {industries.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-2">Industries</p>
                <TagGrid items={industries} color="purple" />
              </div>
            )}
            {stages.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-2">Stage Preferences</p>
                <TagGrid items={stages} color="blue" />
              </div>
            )}
            {geographies.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-2">Geographies</p>
                <TagGrid items={geographies} color="indigo" />
              </div>
            )}
            {!industries.length && !stages.length && !geographies.length && (
              <p className="text-sm text-content-muted">No focus areas specified.</p>
            )}
          </div>
        </SectionCard>

        {/* ── CRITERIA ──────────────────────────────────────────────────────── */}
        {(profile.what_you_look_for || profile.deal_breakers || profile.value_add || profile.network_resources) && (
          <SectionCard title="Investment Criteria" icon={TrendingUp} accent="blue">
            <div className="space-y-5">
              {profile.what_you_look_for && (
                <div>
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">What They Look For</p>
                  <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">{profile.what_you_look_for}</p>
                </div>
              )}
              {profile.deal_breakers && (
                <div>
                  <p className="text-[10px] font-semibold text-error uppercase tracking-widest mb-2">Deal Breakers</p>
                  <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">{profile.deal_breakers}</p>
                </div>
              )}
              {profile.value_add && (
                <div className="rounded-xl bg-primary/8 border border-primary-light p-4">
                  <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-2">Value-Add Beyond Capital</p>
                  <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">{profile.value_add}</p>
                </div>
              )}
              {profile.network_resources && (
                <div>
                  <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-2">Network & Resources</p>
                  <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">{profile.network_resources}</p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── PORTFOLIO ─────────────────────────────────────────────────────── */}
        {(portfolio.length > 0 || profile.number_of_investments || profile.successful_exits || profile.notable_achievements) && (
          <SectionCard title="Portfolio & Track Record" icon={Award} accent="amber">
            <div className="space-y-5">
              <div className="grid sm:grid-cols-3 gap-3">
                <StatBox label="Total Investments" value={profile.number_of_investments} color="purple" />
                <StatBox label="Successful Exits"  value={profile.successful_exits}      color="emerald" />
                <StatBox label="Experience"        value={profile.years_of_experience ? `${profile.years_of_experience} yrs` : null} color="violet" />
              </div>
              {portfolio.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-warning uppercase tracking-widest mb-2">Notable Portfolio Companies</p>
                  <TagGrid items={portfolio} color="amber" />
                </div>
              )}
              {(profile.notable_achievements || profile.achievements) && (
                <div>
                  <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-2">Achievements & Recognition</p>
                  <p className="text-content-secondary text-sm leading-relaxed whitespace-pre-line">
                    {profile.notable_achievements || profile.achievements}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── INVESTMENT DETAILS (private) ──────────────────────────────────── */}
        {shouldShowPrivateSection(relationship) && (
        <SectionCard
          title="Investment Details"
          icon={DollarSign}
          accent="emerald"
          badge={relationship.showPrivateBadge ? <PrivateBadge /> : null}
        >
          {relationship.canViewPrivate ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {checkRange && (
                  <div className="rounded-xl bg-primary/10 border border-primary-light p-4">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1">Check Size</p>
                    <p className="text-content font-semibold">{checkRange}</p>
                  </div>
                )}
                {profile.investment_timeline && (
                  <div className="rounded-xl bg-primary/10 border border-primary-light p-4">
                    <p className="text-[10px] font-semibold text-primary uppercase tracking-widest mb-1">Decision Timeline</p>
                    <p className="text-content font-semibold capitalize">{profile.investment_timeline.replace("_", " ")}</p>
                  </div>
                )}
              </div>
              {structures.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-2">Investment Structures</p>
                  <TagGrid items={structures} color="emerald" />
                </div>
              )}
              {profile.follow_on_investment !== undefined && profile.follow_on_investment !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-content-muted">Follow-on participation:</span>
                  <span className="text-sm text-content font-medium">
                    {String(profile.follow_on_investment) === "true" || profile.follow_on_investment === true ? "Yes" : "No"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <LockOverlay message="Connect to view investment details and check size" />
          )}
        </SectionCard>
        )}

        {/* ── CONTACT ───────────────────────────────────────────────────────── */}
        <SectionCard title="Contact" icon={MessageCircle} accent="purple">
          <div className="space-y-4">
            {/* public links */}
            <div className="flex flex-wrap gap-2">
              {profile.website_url && (
                <Pill color="blue" href={profile.website_url}><Globe className="w-3 h-3" />Website</Pill>
              )}
              {profile.linkedin_url && (
                <Pill href={profile.linkedin_url}><Linkedin className="w-3 h-3" />LinkedIn</Pill>
              )}
              {social.website && !profile.website_url && (
                <Pill color="blue" href={social.website}><Globe className="w-3 h-3" />Website</Pill>
              )}
              {social.linkedin && !profile.linkedin_url && (
                <Pill href={social.linkedin}><Linkedin className="w-3 h-3" />LinkedIn</Pill>
              )}
              {Object.entries(social)
                .filter(([k]) => !["website", "linkedin"].includes(k))
                .map(([k, v]) =>
                  v ? <Pill key={k} href={v}><Globe className="w-3 h-3" />{k}</Pill> : null
                )}
            </div>

            {/* private — only when a valid connection path exists or already connected */}
            {relationship.canViewPrivate ? (
              <div className="rounded-xl bg-surface-alt border border-line p-4 space-y-3">
                {profile.primary_contact_email && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-0.5">Email</p>
                    <a href={`mailto:${profile.primary_contact_email}`}
                      className="text-primary hover:text-primary-dark text-sm transition-colors">
                      {profile.primary_contact_email}
                    </a>
                  </div>
                )}
                {profile.phone_number && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-0.5">Phone</p>
                    <a href={`tel:${profile.phone_number}`}
                      className="text-primary hover:text-primary-dark text-sm transition-colors">
                      {profile.phone_number}
                    </a>
                  </div>
                )}
                {profile.preferred_contact_method && (
                  <div>
                    <p className="text-[10px] font-semibold text-content-muted uppercase tracking-widest mb-0.5">Preferred Method</p>
                    <p className="text-content-secondary text-sm capitalize">{profile.preferred_contact_method}</p>
                  </div>
                )}
              </div>
            ) : relationship.showPrivateLock ? (
              <LockOverlay message="Connect to view private contact details" />
            ) : null}
          </div>
        </SectionCard>

        {/* ── FOOTER META ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-5 px-1 pb-2 text-xs text-content-muted">
          {profile.created_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Member since {fmtDate(profile.created_at)}
            </span>
          )}
          {profile.updated_at && (
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" /> Last updated {fmtDate(profile.updated_at)}
            </span>
          )}
        </div>
      </div>

      {/* ── CONNECT MODAL ─────────────────────────────────────────────────── */}
      {showModal && relationship.canInitiateConnection && (
        <div className="fixed inset-0 z-50 bg-surface/40  flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-line bg-surface shadow-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gFrom} ${gTo} flex items-center justify-center flex-shrink-0`}>
                <span className="avatar-initial text-lg">{initial}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-content">Connect with {name}</h3>
                <p className="text-xs text-content-muted">Add an optional intro message</p>
              </div>
            </div>
            <textarea
              value={connectMsg}
              onChange={(e) => setConnectMsg(e.target.value.slice(0, 300))}
              rows={4}
              className="w-full rounded-xl bg-surface-alt border border-line px-4 py-3 text-sm text-content placeholder:text-content-muted resize-none focus:outline-none focus:border-primary-light/50 focus:bg-surface-alt transition-all"
              placeholder="Hi! I'd love to discuss investment opportunities and learn more about your thesis."
            />
            <div className="text-xs text-content-secondary text-right mt-1 mb-4">{connectMsg.length}/300</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-line text-content-secondary text-sm hover:bg-surface-alt hover:text-content transition-all">
                Cancel
              </button>
              <button type="button" onClick={sendConnection} disabled={actionLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-primary text-sm !text-content-inverse font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
                {actionLoading ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARE TOAST ───────────────────────────────────────────────────── */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-surface border border-line text-sm text-content px-4 py-2.5 rounded-xl shadow-card">
          <CheckCircle className="w-4 h-4 text-primary" /> Link copied to clipboard
        </div>
      )}
    </div>
  );
};

export default InvestorProfilePage;
