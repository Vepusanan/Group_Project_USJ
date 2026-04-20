import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const LockSection = ({ message }) => (
  <div className="rounded-xl border border-white/10 bg-black/30 p-6 flex flex-col items-center justify-center gap-3 text-center py-10">
    <svg className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
    <p className="text-gray-400 text-sm">{message}</p>
  </div>
);

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="flex flex-col sm:flex-row sm:gap-2">
      <span className="text-gray-400 text-sm min-w-[160px]">{label}</span>
      <span className="text-gray-200 text-sm">{value}</span>
    </div>
  );
};

const StartupProfilePage = () => {
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
      const result = await apiService.getStartupProfileById(id);

      if (!result.success) {
        setError(result.error || "Failed to load startup profile");
        setProfile(null);
        setLoading(false);
        return;
      }

      const data = result.data?.data || null;
      setProfile(data);
      setConnectionStatus(data?.connection_status || null);
      setConnectionId(data?.connection_id || null);
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

  const isOwnProfile = !!(user?.id && profile?.user_id && user.id === profile.user_id);
  const isConnected = connectionStatus === "accepted";
  const isPending = connectionStatus === "pending";

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
      name: profile.company_name || "Startup",
    });
    navigate(`/messages?${params.toString()}`);
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2500);
    });
  };

  const socialLinks = profile.social_media_links
    ? (typeof profile.social_media_links === "string"
        ? JSON.parse(profile.social_media_links)
        : profile.social_media_links)
    : {};

  const hasPublicSocial = Object.values(socialLinks).some(Boolean);

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link to="/startups" className="inline-flex items-center gap-1 text-sm text-blue-300 hover:text-blue-200">
          ← Back to Startups
        </Link>

        {/* ── HEADER ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
            <div className="flex gap-4 items-start">
              {/* Logo */}
              <div className="w-16 h-16 rounded-xl border border-white/15 bg-white/5 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt={`${profile.company_name} logo`} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-white/40">
                    {(profile.company_name || "S").charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  {profile.company_name || "Startup"}
                </h1>
                {profile.tagline && (
                  <p className="text-gray-300 mt-1">{profile.tagline}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {profile.industry && (
                    <span className="px-2 py-0.5 rounded-full text-xs border border-purple-400/30 bg-purple-500/10 text-purple-200">
                      {profile.industry}
                    </span>
                  )}
                  {profile.location && (
                    <span className="text-sm text-gray-400">📍 {profile.location}</span>
                  )}
                  {profile.founded_date && (
                    <span className="text-sm text-gray-400">Est. {profile.founded_date}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {isOwnProfile ? (
                <Link
                  to="/profile/edit"
                  className="px-4 py-2 rounded-lg border border-white/20 text-white text-sm hover:bg-white/5"
                >
                  Edit Profile
                </Link>
              ) : (
                <>
                  {isConnected ? (
                    <>
                      <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm border border-emerald-400/40 bg-emerald-500/20 text-emerald-100">
                        ✓ Connected
                      </span>
                      <button
                        type="button"
                        onClick={handleMessage}
                        className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors"
                      >
                        Message
                      </button>
                    </>
                  ) : isPending ? (
                    <button
                      type="button"
                      onClick={handleCancelRequest}
                      disabled={actionLoading}
                      className="px-3 py-1.5 rounded-full text-sm border border-amber-400/40 bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 disabled:opacity-50 transition-colors"
                      title="Click to cancel request"
                    >
                      {actionLoading ? "Cancelling…" : "Pending ✕"}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowConnectModal(true)}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-sm transition-opacity"
                    >
                      Connect
                    </button>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={handleShare}
                className="px-3 py-2 rounded-lg border border-white/15 text-gray-300 hover:text-white text-sm transition-colors"
                title="Share profile"
              >
                Share
              </button>
            </div>
          </div>
        </div>

        {/* ── ABOUT (public) ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-lg font-semibold text-white mb-3">About</h2>
          <div className="space-y-3 text-sm">
            {profile.detailed_description && (
              <p className="text-gray-200 whitespace-pre-line">{profile.detailed_description}</p>
            )}
            {(profile.problem_statement || profile.solution) && (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {profile.problem_statement && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Problem</p>
                    <p className="text-gray-200">{profile.problem_statement}</p>
                  </div>
                )}
                {profile.solution && (
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Solution</p>
                    <p className="text-gray-200">{profile.solution}</p>
                  </div>
                )}
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-2 pt-2">
              <InfoRow label="Target Market" value={profile.target_market} />
              <InfoRow label="Current Stage" value={profile.current_stage} />
              <InfoRow label="Founded" value={profile.founded_date} />
            </div>
          </div>
        </div>

        {/* ── TEAM (public) ── */}
        {(profile.key_team_members || profile.team_size) && (
          <div className="rounded-xl border border-white/15 bg-black/45 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Team</h2>
            <div className="space-y-2 text-sm">
              <InfoRow label="Team Size" value={profile.team_size} />
              {profile.key_team_members && (
                <p className="text-gray-200 whitespace-pre-line mt-2">{profile.key_team_members}</p>
              )}
              {profile.team_photo_url && (
                <img
                  src={profile.team_photo_url}
                  alt="Team"
                  className="mt-4 rounded-lg max-h-64 border border-white/10"
                />
              )}
            </div>
          </div>
        )}

        {/* ── TRACTION & METRICS (public) ── */}
        {(profile.key_metrics || profile.major_achievements || profile.customer_testimonials) && (
          <div className="rounded-xl border border-white/15 bg-black/45 p-6">
            <h2 className="text-lg font-semibold text-white mb-3">Traction & Metrics</h2>
            <div className="space-y-4 text-sm">
              {profile.key_metrics && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Key Metrics</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.key_metrics}</p>
                </div>
              )}
              {profile.major_achievements && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Major Achievements</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.major_achievements}</p>
                </div>
              )}
              {profile.customer_testimonials && (
                <div>
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Testimonials</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.customer_testimonials}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FUNDING (private) ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Funding Details</h2>
            {!isConnected && !isOwnProfile && (
              <span className="text-xs text-gray-500 border border-white/10 rounded-full px-2 py-0.5">Private</span>
            )}
          </div>
          {isConnected || isOwnProfile ? (
            <div className="space-y-2 text-sm">
              <InfoRow label="Funding Stage Seeking" value={profile.funding_stage} />
              <InfoRow label="Revenue Status" value={profile.revenue_status} />
              {profile.amount_seeking && (
                <InfoRow label="Amount Seeking" value={`$${parseFloat(profile.amount_seeking).toLocaleString()}`} />
              )}
              {profile.previous_funding && (
                <InfoRow label="Previous Funding Raised" value={`$${parseFloat(profile.previous_funding).toLocaleString()}`} />
              )}
              {profile.use_of_funds && (
                <div className="pt-2">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Use of Funds</p>
                  <p className="text-gray-200 whitespace-pre-line">{profile.use_of_funds}</p>
                </div>
              )}
            </div>
          ) : (
            <LockSection message="Connect to view funding details" />
          )}
        </div>

        {/* ── DOCUMENTS (private) ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-white">Documents & Resources</h2>
            {!isConnected && !isOwnProfile && (
              <span className="text-xs text-gray-500 border border-white/10 rounded-full px-2 py-0.5">Private</span>
            )}
          </div>
          {isConnected || isOwnProfile ? (
            <div className="space-y-2">
              {profile.pitch_deck_url ? (
                <a href={profile.pitch_deck_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200">
                  <span>📊</span> Pitch Deck
                </a>
              ) : null}
              {profile.business_plan_url ? (
                <a href={profile.business_plan_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200">
                  <span>📄</span> Business Plan
                </a>
              ) : null}
              {profile.product_demo_url ? (
                <a href={profile.product_demo_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-300 hover:text-blue-200">
                  <span>🎥</span> Product Demo
                </a>
              ) : null}
              {!profile.pitch_deck_url && !profile.business_plan_url && !profile.product_demo_url && (
                <p className="text-sm text-gray-400">No documents uploaded yet.</p>
              )}
            </div>
          ) : (
            <LockSection message="Connect to view documents and resources" />
          )}
        </div>

        {/* ── CONTACT ── */}
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-lg font-semibold text-white mb-3">Contact</h2>
          <div className="space-y-2 text-sm">
            {/* Public: social links / website */}
            {hasPublicSocial && (
              <div className="flex flex-wrap gap-3 mb-2">
                {Object.entries(socialLinks).map(([key, value]) =>
                  value ? (
                    <a key={key} href={value} target="_blank" rel="noreferrer"
                      className="capitalize text-blue-300 hover:text-blue-200">
                      {key}
                    </a>
                  ) : null
                )}
              </div>
            )}

            {/* Private: email + phone */}
            {isConnected || isOwnProfile ? (
              <div className="space-y-2 pt-1">
                {profile.primary_contact_name && (
                  <InfoRow label="Contact Person" value={profile.primary_contact_name} />
                )}
                {profile.contact_email && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 min-w-[160px]">Email</span>
                    <a href={`mailto:${profile.contact_email}`} className="text-blue-300 hover:text-blue-200">
                      {profile.contact_email}
                    </a>
                  </div>
                )}
                {profile.phone_number && (
                  <div className="flex gap-2">
                    <span className="text-gray-400 min-w-[160px]">Phone</span>
                    <a href={`tel:${profile.phone_number}`} className="text-blue-300 hover:text-blue-200">
                      {profile.phone_number}
                    </a>
                  </div>
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
              Connect with {profile.company_name || "this startup"}
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Add an optional intro message (max 300 characters).
            </p>
            <textarea
              value={connectMessage}
              onChange={(e) => setConnectMessage(e.target.value.slice(0, 300))}
              rows={4}
              className="mt-4 w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500 resize-none"
              placeholder="Hi! I'd like to connect and learn more about your startup."
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

export default StartupProfilePage;
