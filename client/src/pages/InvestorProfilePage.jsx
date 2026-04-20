import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const parseJsonValue = (value, fallback = []) => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return value;
};

const toList = (value) => {
  const parsed = parseJsonValue(value, null);
  if (!parsed) return [];
  if (Array.isArray(parsed)) return parsed.filter(Boolean);
  if (typeof parsed === "object") return Object.values(parsed).filter(Boolean);
  if (typeof parsed === "string" && parsed.trim()) return [parsed];
  return [];
};

const TagList = ({ items }) => {
  if (!items?.length) return <span className="text-gray-400 text-sm">N/A</span>;
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {items.map((item, i) => (
        <span key={i} className="px-2 py-0.5 rounded-full text-xs border border-white/15 bg-white/5 text-gray-300">
          {item}
        </span>
      ))}
    </div>
  );
};

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2">
      <span className="text-gray-400 text-sm min-w-[200px]">{label}</span>
      <span className="text-gray-200 text-sm">{value}</span>
    </div>
  );
};

const LockSection = ({ message }) => (
  <div className="flex flex-col items-center justify-center gap-3 text-center py-8">
    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
);

const InvestorProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [connectionId, setConnectionId] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectMessage, setConnectMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [shareToast, setShareToast] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError("");
      const result = await apiService.getInvestorProfileById(id);

      if (!result.success) {
        setError(result.error || "Failed to load investor profile");
        setProfile(null);
        setLoading(false);
        return;
      }

      const data = result.data?.data || null;
      if (!data) {
        setError("Profile not found");
        setLoading(false);
        return;
      }

      setProfile(data);
      setConnectionStatus(data.connection_status || null);
      setConnectionId(data.connection_id || null);
      setLoading(false);
    };

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-purple-600/30 border-t-purple-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="max-w-4xl mx-auto rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-100">
          {error || "Profile not found"}
        </div>
      </div>
    );
  }

  const isOwnProfile = Boolean(user?.id && profile?.user_id && user.id === profile.user_id);
  const isConnected = connectionStatus === "accepted";
  const isPending = connectionStatus === "pending";

  const industries = toList(profile.industries_of_interest);
  const stages = toList(profile.stage_preference);
  const geographies = toList(profile.geographic_preference);
  const structures = toList(profile.investment_structure);
  const portfolio = toList(profile.portfolio_companies);
  const social = parseJsonValue(profile.social_media, {});

  const handleSendConnectionRequest = async () => {
    if (!profile?.user_id) return;
    setActionLoading(true);
    const result = await apiService.createConnection(profile.user_id, connectMessage.trim());
    setActionLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to send connection request");
      return;
    }

    setConnectionStatus("pending");
    setConnectionId(result.data?.data?.id || null);
    setShowConnectModal(false);
    setConnectMessage("");
  };

  const handleCancelRequest = async () => {
    if (!connectionId) return;
    setActionLoading(true);
    const result = await apiService.removeConnection(connectionId);
    setActionLoading(false);
    if (result.success) {
      setConnectionStatus(null);
      setConnectionId(null);
    }
  };

  const handleMessage = () => {
    if (!profile?.user_id) return;
    const params = new URLSearchParams({
      userId: String(profile.user_id),
      name: profile.name_or_firm || "Investor",
    });
    navigate(`/messages?${params.toString()}`);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    });
  };

  const formatCurrency = (val) => {
    if (!val) return null;
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000) return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link to="/investors" className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200">
          ← Back to Investors
        </Link>

        {/* ── HEADER ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex gap-4 items-start">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full border border-white/15 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.profile_photo_url ? (
                  <img src={profile.profile_photo_url} alt={profile.name_or_firm} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white/40">
                    {(profile.name_or_firm || "I").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {profile.name_or_firm || "Investor"}
                </h1>
                {profile.investor_type && (
                  <p className="text-gray-300 mt-1">{profile.investor_type}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {geographies.length > 0 && (
                    <span className="text-sm text-gray-400">
                      📍 {geographies.slice(0, 2).join(", ")}
                      {geographies.length > 2 ? ` +${geographies.length - 2}` : ""}
                    </span>
                  )}
                  {profile.years_of_experience && (
                    <span className="px-2 py-0.5 rounded-full text-xs border border-purple-400/30 bg-purple-500/10 text-purple-200">
                      {profile.years_of_experience}+ yrs experience
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {isOwnProfile ? (
                <Link to="/profile/edit"
                  className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm hover:bg-white/5">
                  Edit Profile
                </Link>
              ) : (
                <>
                  {isConnected ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-emerald-400/40 bg-emerald-500/20 text-emerald-100">
                        ✓ Connected
                      </span>
                      <button type="button" onClick={handleMessage}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors">
                        Message
                      </button>
                    </>
                  ) : isPending ? (
                    <button type="button" onClick={handleCancelRequest} disabled={actionLoading}
                      className="px-3 py-1.5 rounded-full text-sm border border-amber-400/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
                      title="Click to cancel request">
                      {actionLoading ? "Cancelling…" : "Pending ✕"}
                    </button>
                  ) : (
                    <button type="button" onClick={() => setShowConnectModal(true)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-sm transition-opacity">
                      Connect
                    </button>
                  )}
                </>
              )}
              <button type="button" onClick={handleShare}
                className="px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white text-sm transition-colors"
                title="Share profile">
                Share
              </button>
            </div>
          </div>
        </div>

        {/* ── ABOUT (public) ── */}
        {(profile.bio || profile.background || profile.investment_thesis) && (
          <div className="rounded-xl border border-white/15 bg-black/45 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">About</h2>
            <div className="space-y-3 text-sm">
              {(profile.bio || profile.background) && (
                <p className="text-gray-200 whitespace-pre-line">
                  {profile.bio || profile.background}
                </p>
              )}
              {profile.investment_thesis && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Investment Thesis</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.investment_thesis}</p>
                </div>
              )}
              <InfoRow label="Years of Experience" value={profile.years_of_experience ? `${profile.years_of_experience} years` : null} />
            </div>
          </div>
        )}

        {/* ── INVESTMENT FOCUS (public) ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Investment Focus</h2>
          <div className="space-y-4 text-sm">
            {industries.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Industries</p>
                <TagList items={industries} />
              </div>
            )}
            {stages.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Stage Preferences</p>
                <TagList items={stages} />
              </div>
            )}
            {geographies.length > 0 && (
              <div>
                <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Geographic Preferences</p>
                <TagList items={geographies} />
              </div>
            )}
          </div>
        </div>

        {/* ── INVESTMENT CRITERIA (public) ── */}
        {(profile.what_you_look_for || profile.deal_breakers || profile.value_add || profile.network_resources) && (
          <div className="rounded-xl border border-white/15 bg-black/45 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Investment Criteria</h2>
            <div className="space-y-3 text-sm">
              {profile.what_you_look_for && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">What They Look For</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.what_you_look_for}</p>
                </div>
              )}
              {profile.deal_breakers && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Deal Breakers</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.deal_breakers}</p>
                </div>
              )}
              {profile.value_add && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Value-Add Beyond Capital</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.value_add}</p>
                </div>
              )}
              {profile.network_resources && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Network & Resources</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.network_resources}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PORTFOLIO & TRACK RECORD (public) ── */}
        {(portfolio.length > 0 || profile.number_of_investments || profile.successful_exits || profile.achievements) && (
          <div className="rounded-xl border border-white/15 bg-black/45 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Portfolio & Track Record</h2>
            <div className="space-y-3 text-sm">
              <div className="grid sm:grid-cols-2 gap-2">
                <InfoRow label="Investments Made" value={profile.number_of_investments} />
                <InfoRow label="Successful Exits" value={profile.successful_exits} />
              </div>
              {portfolio.length > 0 && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Notable Portfolio Companies</p>
                  <TagList items={portfolio} />
                </div>
              )}
              {profile.achievements && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Achievements & Recognition</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.achievements}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── INVESTMENT DETAILS (private) ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Investment Details</h2>
            {!isConnected && !isOwnProfile && (
              <span className="text-xs text-gray-500 border border-white/10 rounded-full px-2 py-0.5">Private</span>
            )}
          </div>
          {isConnected || isOwnProfile ? (
            <div className="space-y-2 text-sm">
              {(profile.min_investment_size || profile.max_investment_size) && (
                <InfoRow
                  label="Typical Check Size"
                  value={[formatCurrency(profile.min_investment_size), formatCurrency(profile.max_investment_size)]
                    .filter(Boolean).join(" – ")}
                />
              )}
              {structures.length > 0 && (
                <div className="flex flex-col sm:flex-row sm:gap-2">
                  <span className="text-gray-400 text-sm min-w-[200px]">Investment Structures</span>
                  <div className="flex flex-wrap gap-1 mt-1 sm:mt-0">
                    <TagList items={structures} />
                  </div>
                </div>
              )}
              <InfoRow label="Follow-on Participation" value={profile.follow_on_investment} />
              <InfoRow label="Decision Timeline" value={profile.investment_timeline} />
            </div>
          ) : (
            <LockSection message="Connect to view investment details" />
          )}
        </div>

        {/* ── CONTACT ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
          <div className="space-y-2 text-sm">
            {/* Public: website + LinkedIn */}
            <div className="flex flex-wrap gap-3 mb-1">
              {social.website && (
                <a href={social.website} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                  Website
                </a>
              )}
              {social.linkedin && (
                <a href={social.linkedin} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                  LinkedIn
                </a>
              )}
              {social.twitter && (
                <a href={social.twitter} target="_blank" rel="noreferrer" className="text-blue-300 hover:text-blue-200">
                  Twitter
                </a>
              )}
              {Object.entries(social)
                .filter(([k]) => !["website", "linkedin", "twitter"].includes(k))
                .map(([k, v]) =>
                  v ? (
                    <a key={k} href={v} target="_blank" rel="noreferrer"
                      className="capitalize text-blue-300 hover:text-blue-200">{k}</a>
                  ) : null
                )}
            </div>

            {/* Private: email + phone */}
            {isConnected || isOwnProfile ? (
              <div className="space-y-2 pt-1">
                {profile.primary_contact_email && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 min-w-[200px]">Email</span>
                    <a href={`mailto:${profile.primary_contact_email}`} className="text-blue-300 hover:text-blue-200">
                      {profile.primary_contact_email}
                    </a>
                  </div>
                )}
                {profile.phone_number && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 min-w-[200px]">Phone</span>
                    <a href={`tel:${profile.phone_number}`} className="text-blue-300 hover:text-blue-200">
                      {profile.phone_number}
                    </a>
                  </div>
                )}
                {profile.preferred_contact_method && (
                  <InfoRow label="Preferred Contact Method" value={profile.preferred_contact_method} />
                )}
              </div>
            ) : (
              <LockSection message="Connect to view contact details" />
            )}
          </div>
        </div>

        {/* ── ACTIVITY (public) ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-4">
          <div className="flex flex-wrap gap-6 text-sm text-gray-400">
            {profile.created_at && (
              <span>Member since {new Date(profile.created_at).toLocaleDateString()}</span>
            )}
            {profile.updated_at && (
              <span>Last updated {new Date(profile.updated_at).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </div>

      {/* ── CONNECT MODAL ── */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/15 bg-[#161324] p-6">
            <h3 className="text-xl font-semibold text-white">
              Connect with {profile.name_or_firm || "this investor"}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Add an optional intro message (max 300 characters).
            </p>
            <textarea
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value.slice(0, 300))}
              rows={4}
              className="mt-4 w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500 resize-none"
              placeholder="Hi! I'd like to connect and discuss investment opportunities."
            />
            <div className="mt-1 text-xs text-gray-500 text-right">{connectMessage.length}/300</div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm">
                Cancel
              </button>
              <button type="button" onClick={handleSendConnectionRequest} disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm disabled:opacity-50">
                {actionLoading ? "Sending…" : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SHARE TOAST ── */}
      {shareToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 border border-white/15 text-white text-sm px-4 py-2 rounded-lg shadow-xl">
          Link copied to clipboard
        </div>
      )}
    </div>
  );
};

export default InvestorProfilePage;
