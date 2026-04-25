import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  MapPin, Calendar, Globe, Linkedin, DollarSign, Briefcase,
  TrendingUp, Target, Lock, Share2, CheckCircle, Clock,
  MessageCircle, ArrowLeft, PenLine, Award, Users, BarChart2,
} from "lucide-react";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

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
  ["from-violet-500", "to-indigo-600"],
  ["from-purple-500", "to-pink-600"],
  ["from-blue-500",   "to-violet-600"],
  ["from-indigo-500", "to-purple-700"],
  ["from-fuchsia-500","to-indigo-600"],
];

const getGradient = (name = "") =>
  INVESTOR_GRADIENTS[(name.charCodeAt(0) || 0) % INVESTOR_GRADIENTS.length];

// ─── sub-components ───────────────────────────────────────────────────────────

const SectionCard = ({ title, icon: Icon, accent = "purple", badge, children }) => {
  const bar = {
    purple:  "from-purple-500 to-indigo-500",
    violet:  "from-violet-500 to-purple-500",
    blue:    "from-blue-500 to-cyan-500",
    emerald: "from-emerald-500 to-teal-500",
    amber:   "from-amber-500 to-orange-500",
    rose:    "from-rose-500 to-pink-500",
  }[accent] || "from-purple-500 to-indigo-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <div className={`h-0.5 w-full bg-gradient-to-r ${bar}`} />
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

const Pill = ({ children, color = "default", href }) => {
  const cls = {
    default: "bg-white/8 border-white/15 text-gray-300",
    purple:  "bg-purple-500/15 border-purple-400/25 text-purple-200",
    violet:  "bg-violet-500/15 border-violet-400/25 text-violet-200",
    blue:    "bg-blue-500/15 border-blue-400/25 text-blue-200",
    emerald: "bg-emerald-500/15 border-emerald-400/25 text-emerald-200",
    amber:   "bg-amber-500/15 border-amber-400/25 text-amber-200",
    indigo:  "bg-indigo-500/15 border-indigo-400/25 text-indigo-200",
  }[color] || "bg-white/8 border-white/15 text-gray-300";

  const inner = (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border font-medium ${cls}`}>
      {children}
    </span>
  );
  return href
    ? <a href={href} target="_blank" rel="noreferrer">{inner}</a>
    : inner;
};

const TagGrid = ({ items, color = "default" }) => {
  if (!items?.length) return <p className="text-sm text-gray-500">—</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => <Pill key={i} color={color}>{item}</Pill>)}
    </div>
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

const StatBox = ({ label, value, color = "purple" }) => {
  if (!value) return null;
  const bg = {
    purple:  "bg-purple-500/10 border-purple-400/20",
    violet:  "bg-violet-500/10 border-violet-400/20",
    emerald: "bg-emerald-500/10 border-emerald-400/20",
    blue:    "bg-blue-500/10 border-blue-400/20",
    amber:   "bg-amber-500/10 border-amber-400/20",
  }[color];
  const text = {
    purple:  "text-purple-400",
    violet:  "text-violet-400",
    emerald: "text-emerald-400",
    blue:    "text-blue-400",
    amber:   "text-amber-400",
  }[color];
  return (
    <div className={`rounded-xl border p-4 ${bg}`}>
      <p className={`text-[10px] font-semibold uppercase tracking-widest mb-1 ${text}`}>{label}</p>
      <p className="text-white font-semibold text-base">{value}</p>
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
  const [showModal, setShowModal]           = useState(false);
  const [connectMsg, setConnectMsg]         = useState("");
  const [actionLoading, setActionLoading]   = useState(false);
  const [shareToast, setShareToast]         = useState(false);

  useEffect(() => {
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
      setLoading(false);
    })();
  }, [id]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
    </div>
  );

  if (error || !profile) return (
    <div className="min-h-screen px-6 py-10">
      <div className="max-w-4xl mx-auto rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-100">
        {error || "Profile not found"}
      </div>
    </div>
  );

  const isOwn              = Boolean(user?.id && profile?.user_id && user.id === profile.user_id);
  const isConnected        = connectionStatus === "accepted";
  const isPending          = connectionStatus === "pending";
  const canSendRequest     = user?.userType === "startup";
  // Investors always send requests; if there's a pending connection on this investor's profile,
  // the investor is always the requester — so the current (startup) user is always the receiver.
  const isReceivedRequest  = isPending && !isOwn && (
    connectionRequesterId
      ? String(connectionRequesterId) !== String(user?.id)
      : String(profile.user_id) !== String(user?.id)
  );

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

  const cancelRequest = async () => {
    if (!connectionId) return;
    setActionLoading(true);
    const res = await apiService.removeConnection(connectionId);
    setActionLoading(false);
    if (res.success) { setConnectionStatus(null); setConnectionId(null); setConnectionRequesterId(null); }
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
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-5">

        {/* back */}
        <Link to="/investors" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Investors
        </Link>

        {/* ── HERO HEADER ─────────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-white/10 overflow-hidden">
          {/* cover */}
          <div className={`h-28 sm:h-36 bg-gradient-to-br ${gFrom} ${gTo} relative`}>
            <div className="absolute inset-0 bg-black/20" />
            <div className="absolute top-4 right-4 flex gap-2">
              <button type="button" onClick={share}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/20 text-white text-xs backdrop-blur-sm hover:bg-black/50 transition-colors">
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              {isOwn && (
                <Link to="/profile/edit"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/30 border border-white/20 text-white text-xs backdrop-blur-sm hover:bg-black/50 transition-colors">
                  <PenLine className="w-3.5 h-3.5" /> Edit Profile
                </Link>
              )}
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-sm px-6 pb-6">
            {/* avatar row: sits half inside cover, half below */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* avatar + name */}
              <div className="flex items-center gap-4 -mt-10">
                <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${gFrom} ${gTo} border-4 border-[#0d0d0d] flex items-center justify-center flex-shrink-0 shadow-xl overflow-hidden`}>
                  {(profile.photo_url || profile.profile_photo_url)
                    ? <img src={profile.photo_url || profile.profile_photo_url} alt={name} className="w-full h-full object-cover" />
                    : <span className="text-3xl font-bold text-white">{initial}</span>
                  }
                </div>
                <div className="mt-10">
                  <h1 className="text-2xl font-bold text-white">{name}</h1>
                  {profile.investor_type && (
                    <p className="text-purple-200/80 text-sm font-medium mt-0.5">{profile.investor_type}</p>
                  )}
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
                  ) : isReceivedRequest ? (
                    <>
                      <button type="button" onClick={acceptRequest} disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium disabled:opacity-50 transition-colors">
                        {actionLoading ? "…" : "Accept"}
                      </button>
                      <button type="button" onClick={declineRequest} disabled={actionLoading}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-sm font-medium disabled:opacity-50 transition-colors">
                        Decline
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
            <div className="mt-4 flex flex-wrap gap-2">
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
        </div>

        {/* ── ABOUT ─────────────────────────────────────────────────────────── */}
        {(profile.professional_background || profile.bio || profile.background || profile.investment_thesis) && (
          <SectionCard title="About" icon={BarChart2} accent="violet">
            <div className="space-y-5">
              {(profile.professional_background || profile.bio || profile.background) && (
                <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                  {profile.professional_background || profile.bio || profile.background}
                </p>
              )}
              {profile.investment_thesis && (
                <div className="rounded-xl bg-purple-500/8 border border-purple-400/15 p-4">
                  <p className="text-[10px] font-semibold text-purple-400 uppercase tracking-widest mb-2">Investment Thesis</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{profile.investment_thesis}</p>
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
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Industries</p>
                <TagGrid items={industries} color="purple" />
              </div>
            )}
            {stages.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Stage Preferences</p>
                <TagGrid items={stages} color="blue" />
              </div>
            )}
            {geographies.length > 0 && (
              <div>
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-2">Geographies</p>
                <TagGrid items={geographies} color="indigo" />
              </div>
            )}
            {!industries.length && !stages.length && !geographies.length && (
              <p className="text-sm text-gray-500">No focus areas specified.</p>
            )}
          </div>
        </SectionCard>

        {/* ── CRITERIA ──────────────────────────────────────────────────────── */}
        {(profile.what_you_look_for || profile.deal_breakers || profile.value_add || profile.network_resources) && (
          <SectionCard title="Investment Criteria" icon={TrendingUp} accent="blue">
            <div className="space-y-5">
              {profile.what_you_look_for && (
                <div>
                  <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-2">What They Look For</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{profile.what_you_look_for}</p>
                </div>
              )}
              {profile.deal_breakers && (
                <div>
                  <p className="text-[10px] font-semibold text-rose-400 uppercase tracking-widest mb-2">Deal Breakers</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{profile.deal_breakers}</p>
                </div>
              )}
              {profile.value_add && (
                <div className="rounded-xl bg-blue-500/8 border border-blue-400/15 p-4">
                  <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-2">Value-Add Beyond Capital</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{profile.value_add}</p>
                </div>
              )}
              {profile.network_resources && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Network & Resources</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">{profile.network_resources}</p>
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
                  <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-widest mb-2">Notable Portfolio Companies</p>
                  <TagGrid items={portfolio} color="amber" />
                </div>
              )}
              {(profile.notable_achievements || profile.achievements) && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Achievements & Recognition</p>
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                    {profile.notable_achievements || profile.achievements}
                  </p>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* ── INVESTMENT DETAILS (private) ──────────────────────────────────── */}
        <SectionCard
          title="Investment Details"
          icon={DollarSign}
          accent="emerald"
          badge={!isConnected && !isOwn ? <PrivateBadge /> : null}
        >
          {isConnected || isOwn ? (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                {checkRange && (
                  <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/20 p-4">
                    <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest mb-1">Check Size</p>
                    <p className="text-white font-semibold">{checkRange}</p>
                  </div>
                )}
                {profile.investment_timeline && (
                  <div className="rounded-xl bg-blue-500/10 border border-blue-400/20 p-4">
                    <p className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest mb-1">Decision Timeline</p>
                    <p className="text-white font-semibold capitalize">{profile.investment_timeline.replace("_", " ")}</p>
                  </div>
                )}
              </div>
              {structures.length > 0 && (
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Investment Structures</p>
                  <TagGrid items={structures} color="emerald" />
                </div>
              )}
              {profile.follow_on_investment !== undefined && profile.follow_on_investment !== null && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-400">Follow-on participation:</span>
                  <span className="text-sm text-white font-medium">
                    {String(profile.follow_on_investment) === "true" || profile.follow_on_investment === true ? "Yes" : "No"}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <LockOverlay message="Connect to view investment details and check size" />
          )}
        </SectionCard>

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

            {/* private */}
            {isConnected || isOwn ? (
              <div className="rounded-xl bg-white/[0.03] border border-white/10 p-4 space-y-3">
                {profile.primary_contact_email && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Email</p>
                    <a href={`mailto:${profile.primary_contact_email}`}
                      className="text-blue-300 hover:text-blue-200 text-sm transition-colors">
                      {profile.primary_contact_email}
                    </a>
                  </div>
                )}
                {profile.phone_number && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Phone</p>
                    <a href={`tel:${profile.phone_number}`}
                      className="text-blue-300 hover:text-blue-200 text-sm transition-colors">
                      {profile.phone_number}
                    </a>
                  </div>
                )}
                {profile.preferred_contact_method && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest mb-0.5">Preferred Method</p>
                    <p className="text-gray-200 text-sm capitalize">{profile.preferred_contact_method}</p>
                  </div>
                )}
              </div>
            ) : (
              <LockOverlay message="Connect to view private contact details" />
            )}
          </div>
        </SectionCard>

        {/* ── FOOTER META ───────────────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-5 px-1 pb-2 text-xs text-gray-500">
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
      {showModal && canSendRequest && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0f0d1a] shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${gFrom} ${gTo} flex items-center justify-center flex-shrink-0`}>
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
              placeholder="Hi! I'd love to discuss investment opportunities and learn more about your thesis."
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

export default InvestorProfilePage;
