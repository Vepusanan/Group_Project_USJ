import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  MapPin, Calendar, Users, Tag, Rocket, Globe, Linkedin,
  DollarSign, FileText, Video, BarChart2, Lock, Share2,
  CheckCircle, Clock, MessageCircle, ArrowLeft, PenLine,
} from "lucide-react";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

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
  ["from-emerald-500", "to-teal-600"],
  ["from-blue-500", "to-indigo-600"],
  ["from-orange-500", "to-rose-600"],
  ["from-violet-500", "to-purple-700"],
  ["from-cyan-500", "to-blue-600"],
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

const SectionCard = ({ title, icon: Icon, accent = "purple", badge, children }) => {
  const accentBar = {
    purple: "from-purple-500 to-indigo-500",
    emerald: "from-emerald-500 to-teal-500",
    blue: "from-blue-500 to-cyan-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
  }[accent] || "from-purple-500 to-indigo-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className={`h-0.5 w-full bg-gradient-to-r ${accentBar}`} />
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            {Icon && <Icon className="w-4 h-4 text-gray-400" />}
            <h2 className="text-base font-semibold text-white">{title}</h2>
          </div>
          {badge}
        </div>
        {children}
      </div>
    </div>
  );
};

const Pill = ({ children, color = "default" }) => {
  const cls = {
    default: "bg-white/8 border-white/15 text-gray-300",
    purple:  "bg-purple-500/15 border-purple-400/25 text-purple-200",
    emerald: "bg-emerald-500/15 border-emerald-400/25 text-emerald-200",
    blue:    "bg-blue-500/15 border-blue-400/25 text-blue-200",
    amber:   "bg-amber-500/15 border-amber-400/25 text-amber-200",
  }[color] || "bg-white/8 border-white/15 text-gray-300";
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border font-medium ${cls}`}>
      {children}
    </span>
  );
};

const PrivateBadge = () => (
  <span className="flex items-center gap-1 text-[10px] text-gray-500 border border-white/10 rounded-full px-2 py-0.5">
    <Lock className="w-2.5 h-2.5" /> Private
  </span>
);

const LockOverlay = ({ message }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
      <Lock className="w-5 h-5 text-gray-500" />
    </div>
    <p className="text-sm text-gray-400">{message}</p>
  </div>
);

const DocLink = ({ href, icon: Icon, label }) => {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] hover:border-white/20 transition-all group"
    >
      <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-300" />
      </div>
      <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{label}</span>
    </a>
  );
};

const StatChip = ({ icon: Icon, label, value, color = "gray" }) => {
  if (!value) return null;
  const textCls = { gray: "text-gray-300", emerald: "text-emerald-300", blue: "text-blue-300", purple: "text-purple-300" }[color];
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Icon className={`w-3.5 h-3.5 ${textCls}`} />
      <span className="text-gray-500">{label}:</span>
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
      const res = await apiService.getStartupProfileById(id);
      if (!res.success) { setError(res.error || "Failed to load profile"); setLoading(false); return; }
      const data = res.data?.data || null;
      setProfile(data);
      setConnectionStatus(data?.connection_status || null);
      setConnectionId(data?.connection_id || null);
      setLoading(false);
      // Ensure we're at the top after the new content paints.
      window.scrollTo({ top: 0, behavior: "auto" });
    })();
  }, [id]);

  if (loading) return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#080318]">
      <div className="w-10 h-10 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="px-6 py-10">
      <div className="max-w-4xl mx-auto rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
        {error || "Profile not found"}
      </div>
    </div>
  );

  const isOwn       = !!(user?.id && profile?.user_id && user.id === profile.user_id);
  const isConnected = connectionStatus === "accepted";
  const isPending   = connectionStatus === "pending";
  const canSendRequest = user?.userType === "investor";

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

  const cancelRequest = async () => {
    if (!connectionId) return;
    setActionLoading(true);
    const res = await apiService.removeConnection(connectionId);
    setActionLoading(false);
    if (res.success) { setConnectionStatus(null); setConnectionId(null); }
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
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* back */}
        <Link to="/startups" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Startups
        </Link>

        {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          {/* cover */}
          <div className={`h-28 sm:h-36 bg-gradient-to-br ${gFrom} ${gTo} relative`}>
            <div className="absolute inset-0 bg-black/20" />
            {/* top-right actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                type="button"
                onClick={share}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/20 text-white text-xs backdrop-blur-sm hover:bg-black/50 transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              {isOwn && (
                <Link
                  to="/profile/edit"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/20 text-white text-xs backdrop-blur-sm hover:bg-black/50 transition-colors"
                >
                  <PenLine className="w-3.5 h-3.5" /> Edit Profile
                </Link>
              )}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm px-6 pb-6">
            {/* avatar row */}
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-20">
              <div className="flex items-end gap-5 min-w-0">
                <div className={`w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br ${gFrom} ${gTo} border-4 border-black/40 flex items-center justify-center flex-shrink-0 shadow-xl overflow-hidden`}>
                  {profile.logo_url
                    ? <img src={profile.logo_url} alt={name} className="w-full h-full object-cover" />
                    : <span className="text-5xl font-bold text-white">{initial}</span>
                  }
                </div>
                <div className="min-w-0 pb-2">
                  <h1 className="text-2xl font-bold text-white leading-tight truncate">{name}</h1>
                  {profile.tagline && <p className="text-gray-300 text-sm mt-1 line-clamp-2">{profile.tagline}</p>}
                </div>
              </div>

              {/* CTA */}
              {!isOwn && (canSendRequest || isConnected) && (
                <div className="flex gap-2 pb-1">
                  {isConnected ? (
                    <>
                      <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-emerald-400/40 bg-emerald-500/15 text-emerald-200 text-sm font-medium">
                        <CheckCircle className="w-4 h-4" /> Connected
                      </span>
                      <button type="button" onClick={goMessage}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors">
                        <MessageCircle className="w-4 h-4" /> Message
                      </button>
                    </>
                  ) : isPending ? (
                    <button type="button" onClick={cancelRequest} disabled={actionLoading}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-amber-400/40 bg-amber-500/15 text-amber-200 text-sm font-medium hover:bg-amber-500/25 disabled:opacity-50 transition-colors"
                      title="Click to cancel">
                      <Clock className="w-4 h-4" />
                      {actionLoading ? "Cancelling…" : "Pending · Cancel"}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setShowModal(true)}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-sm font-medium transition-opacity shadow-lg shadow-purple-900/40">
                      Connect
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* meta chips */}
            <div className="mt-4 flex flex-wrap gap-3">
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
        </div>

        {/* ── ABOUT ─────────────────────────────────────────────────────────── */}
        {(profile.detailed_description || profile.problem_statement || profile.solution) && (
          <SectionCard title="About" icon={BarChart2} accent="purple">
            {profile.detailed_description && (
              <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line mb-4">
                {profile.detailed_description}
              </p>
            )}
            {(profile.problem_statement || profile.solution) && (
              <div className="grid sm:grid-cols-2 gap-4">
                {profile.problem_statement && (
                  <div className="rounded-xl bg-rose-500/8 border border-rose-400/15 p-4">
                    <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest mb-2">Problem</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{profile.problem_statement}</p>
                  </div>
                )}
                {profile.solution && (
                  <div className="rounded-xl bg-emerald-500/8 border border-emerald-400/15 p-4">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-2">Solution</p>
                    <p className="text-gray-300 text-sm leading-relaxed">{profile.solution}</p>
                  </div>
                )}
              </div>
            )}
          </SectionCard>
        )}

        {/* ── TEAM ──────────────────────────────────────────────────────────── */}
        {(profile.key_team_members || profile.team_size) && (
          <SectionCard title="Team" icon={Users} accent="blue">
            <div className="space-y-3">
              {profile.team_size && (
                <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-500/10 border border-blue-400/20">
                  <Users className="w-4 h-4 text-blue-300" />
                  <span className="text-sm text-blue-200 font-medium">{profile.team_size} team members</span>
                </div>
              )}
              {profile.key_team_members && (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {profile.key_team_members}
                </p>
              )}
              {profile.team_photo_url && (
                <img src={profile.team_photo_url} alt="Team"
                  className="mt-3 rounded-xl max-h-64 border border-white/10 object-cover" />
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
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-2">Key Metrics</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{profile.key_metrics}</p>
                </div>
              )}
              {profile.major_achievements && (
                <div>
                  <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest mb-2">Major Achievements</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{profile.major_achievements}</p>
                </div>
              )}
              {profile.customer_testimonials && (
                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Testimonials</p>
                  <p className="text-gray-300 text-sm leading-relaxed italic whitespace-pre-line">{profile.customer_testimonials}</p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── FUNDING (private) ─────────────────────────────────────────────── */}
        <SectionCard
          title="Funding Details"
          icon={DollarSign}
          accent="amber"
          badge={!isConnected && !isOwn ? <PrivateBadge /> : null}
        >
          {isConnected || isOwn ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {profile.funding_stage && (
                  <div className="rounded-xl bg-amber-500/8 border border-amber-400/15 p-4">
                    <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-1">Stage Seeking</p>
                    <p className="text-white font-semibold">{STAGE_LABELS[profile.funding_stage] || profile.funding_stage}</p>
                  </div>
                )}
                {profile.amount_seeking && (
                  <div className="rounded-xl bg-emerald-500/8 border border-emerald-400/15 p-4">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-1">Amount Seeking</p>
                    <p className="text-white font-semibold">{fmtMoney(profile.amount_seeking)}</p>
                  </div>
                )}
                {profile.revenue_status && (
                  <div className="rounded-xl bg-blue-500/8 border border-blue-400/15 p-4">
                    <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-1">Revenue Status</p>
                    <p className="text-white font-semibold">{STAGE_LABELS[profile.revenue_status] || profile.revenue_status}</p>
                  </div>
                )}
                {profile.previous_funding && (
                  <div className="rounded-xl bg-purple-500/8 border border-purple-400/15 p-4">
                    <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest mb-1">Previously Raised</p>
                    <p className="text-white font-semibold">{fmtMoney(profile.previous_funding)}</p>
                  </div>
                )}
              </div>
              {profile.use_of_funds && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Use of Funds</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{profile.use_of_funds}</p>
                </div>
              )}
            </div>
          ) : (
            <LockOverlay message="Connect with this startup to view funding details" />
          )}
        </SectionCard>

        {/* ── DOCUMENTS (private) ───────────────────────────────────────────── */}
        <SectionCard
          title="Documents & Resources"
          icon={FileText}
          accent="blue"
          badge={!isConnected && !isOwn ? <PrivateBadge /> : null}
        >
          {isConnected || isOwn ? (
            <div className="space-y-2">
              <DocLink href={profile.pitch_deck_url}    icon={BarChart2}   label="Pitch Deck" />
              <DocLink href={profile.business_plan_url} icon={FileText}    label="Business Plan" />
              <DocLink href={profile.product_demo_url}  icon={Video}       label="Product Demo" />
              {!profile.pitch_deck_url && !profile.business_plan_url && !profile.product_demo_url && (
                <p className="text-sm text-gray-500">No documents uploaded yet.</p>
              )}
            </div>
          ) : (
            <LockOverlay message="Connect to access documents and resources" />
          )}
        </SectionCard>

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
            {isConnected || isOwn ? (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
                {profile.primary_contact_name && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Contact Person</p>
                    <p className="text-gray-200 text-sm">{profile.primary_contact_name}</p>
                  </div>
                )}
                {profile.contact_email && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Email</p>
                    <a href={`mailto:${profile.contact_email}`} className="text-blue-300 hover:text-blue-200 text-sm transition-colors">
                      {profile.contact_email}
                    </a>
                  </div>
                )}
                {profile.phone_number && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Phone</p>
                    <a href={`tel:${profile.phone_number}`} className="text-blue-300 hover:text-blue-200 text-sm transition-colors">
                      {profile.phone_number}
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <LockOverlay message="Connect to view private contact details" />
            )}
          </div>
        </SectionCard>

        {/* ── FOOTER META ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-5 px-1 pb-2">
          <StatChip icon={Calendar} label="Member since" value={fmtDate(profile.created_at)} color="gray" />
          <StatChip icon={Calendar} label="Last updated"  value={fmtDate(profile.updated_at)}  color="gray" />
        </div>
      </div>

      {/* ── CONNECT MODAL ─────────────────────────────────────────────────── */}
      {showModal && canSendRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0f0d1a] shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gFrom} ${gTo} flex items-center justify-center flex-shrink-0`}>
                <span className="text-white font-bold">{initial}</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Connect with {name}</h3>
                <p className="text-xs text-gray-400">Add an optional intro message</p>
              </div>
            </div>
            <textarea
              value={connectMsg}
              onChange={(e) => setConnectMsg(e.target.value.slice(0, 300))}
              rows={4}
              className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-sm text-white placeholder:text-gray-500 resize-none focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-all"
              placeholder="Hi! I'd love to learn more about your startup and explore how we might work together."
            />
            <div className="text-xs text-gray-600 text-right mt-1 mb-4">{connectMsg.length}/300</div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-white/15 text-gray-300 text-sm hover:bg-white/5 hover:text-white transition-all">
                Cancel
              </button>
              <button type="button" onClick={sendConnection} disabled={actionLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
                {actionLoading ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARE TOAST ───────────────────────────────────────────────────── */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-gray-900 border border-white/15 text-white text-sm px-4 py-2.5 rounded-xl shadow-xl">
          <CheckCircle className="w-4 h-4 text-emerald-400" /> Link copied to clipboard
        </div>
      )}
    </div>
  );
};

export default StartupProfilePage;
