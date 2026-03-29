import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const StartupProfilePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [connectMessage, setConnectMessage] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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

      setProfile(result.data?.data || null);
      setConnectionStatus(result.data?.data?.connection_status || null);
      setLoading(false);
    };

    loadProfile();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 text-gray-300">
        Loading profile...
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

  const isOwnProfile = !!(
    user?.id &&
    profile?.user_id &&
    user.id === profile.user_id
  );

  const handleSendConnectionRequest = async () => {
    if (!profile?.user_id) return;
    setActionLoading(true);
    const result = await apiService.createConnection(
      profile.user_id,
      connectMessage.trim(),
    );
    setActionLoading(false);

    if (!result.success) {
      setError(result.error || "Failed to send connection request");
      return;
    }

    setConnectionStatus("pending");
    setShowConnectModal(false);
    setConnectMessage("");
  };

  const handleMessage = () => {
    if (!profile?.user_id) return;

    const params = new URLSearchParams({
      userId: String(profile.user_id),
      name: profile.company_name || "Startup",
    });
    navigate(`/messages?${params.toString()}`);
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link
          to="/startups"
          className="inline-block text-sm text-blue-300 hover:text-blue-200"
        >
          ← Back to Startups
        </Link>

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {profile.company_name || "Startup"}
              </h1>
              <p className="text-gray-300 mt-1">
                {profile.tagline || "No tagline available"}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {[profile.industry, profile.founded_date]
                  .filter(Boolean)
                  .join(" • ") || "No industry or founded date information"}
              </p>
            </div>

            {!isOwnProfile && (
              <div className="flex items-center gap-2">
                {connectionStatus === "accepted" ? (
                  <>
                    <span className="inline-block px-3 py-1.5 rounded-full text-sm border border-emerald-400/40 bg-emerald-500/20 text-emerald-100">
                      Connected
                    </span>
                    <button
                      type="button"
                      onClick={handleMessage}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
                    >
                      Message
                    </button>
                  </>
                ) : connectionStatus === "pending" ? (
                  <span className="inline-block px-3 py-1.5 rounded-full text-sm border border-amber-400/40 bg-amber-500/20 text-amber-100">
                    Pending
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConnectModal(true)}
                    className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                  >
                    Connect
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-xl font-semibold text-white">About</h2>
          <p className="text-gray-200 mt-2 whitespace-pre-line">
            {profile.detailed_description || "No description provided."}
          </p>
        </div>

        {profile.key_team_members && (
          <div className="rounded-xl border border-white/15 bg-black/45 p-6">
            <h2 className="text-xl font-semibold text-white">Team</h2>
            <p className="text-gray-200 mt-2">Team Size: {profile.team_size || "N/A"}</p>
            <p className="text-gray-200 mt-2 whitespace-pre-line">
              {profile.key_team_members}
            </p>
            {profile.team_photo_url && (
              <img src={profile.team_photo_url} alt="Team" className="mt-4 rounded-lg max-h-64" />
            )}
          </div>
        )}

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-xl font-semibold text-white">Funding & Status</h2>
          <div className="mt-3 space-y-2 text-gray-200">
            <p>Current Stage: {profile.current_stage || "N/A"}</p>
            <p>Funding Stage: {profile.funding_stage || "N/A"}</p>
            <p>Revenue Status: {profile.revenue_status || "N/A"}</p>
            {profile.amount_seeking && (
              <p>Amount Seeking: ${parseFloat(profile.amount_seeking).toLocaleString()}</p>
            )}
            {profile.previous_funding && (
              <p>Previous Funding: ${parseFloat(profile.previous_funding).toLocaleString()}</p>
            )}
          </div>
        </div>

        {(profile.key_metrics || profile.major_achievements || profile.customer_testimonials) && (
          <div className="rounded-xl border border-white/15 bg-black/45 p-6">
            <h2 className="text-xl font-semibold text-white">Metrics & Achievements</h2>
            <div className="mt-3 space-y-4 text-gray-200">
              {profile.key_metrics && (
                <div>
                  <h3 className="font-semibold text-gray-100">Key Metrics</h3>
                  <p className="whitespace-pre-line">{profile.key_metrics}</p>
                </div>
              )}
              {profile.major_achievements && (
                <div>
                  <h3 className="font-semibold text-gray-100">Major Achievements</h3>
                  <p className="whitespace-pre-line">{profile.major_achievements}</p>
                </div>
              )}
              {profile.customer_testimonials && (
                <div>
                  <h3 className="font-semibold text-gray-100">Customer Testimonials</h3>
                  <p className="whitespace-pre-line">{profile.customer_testimonials}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {profile.use_of_funds && (
          <div className="rounded-xl border border-white/15 bg-black/45 p-6">
            <h2 className="text-xl font-semibold text-white">Use of Funds</h2>
            <p className="text-gray-200 mt-2 whitespace-pre-line">
              {profile.use_of_funds}
            </p>
          </div>
        )}

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-xl font-semibold text-white">Resources</h2>
          <div className="mt-3 space-y-2">
            {profile.pitch_deck_url && (
              <p>
                <a
                  href={profile.pitch_deck_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 hover:text-blue-200"
                >
                  📊 Pitch Deck
                </a>
              </p>
            )}
            {profile.business_plan_url && (
              <p>
                <a
                  href={profile.business_plan_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 hover:text-blue-200"
                >
                  📄 Business Plan
                </a>
              </p>
            )}
            {profile.product_demo_url && (
              <p>
                <a
                  href={profile.product_demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300 hover:text-blue-200"
                >
                  🎥 Product Demo
                </a>
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <div className="mt-3 space-y-2 text-gray-200">
            {profile.primary_contact_name && (
              <p>Contact: {profile.primary_contact_name}</p>
            )}
            {profile.contact_email && (
              <p>
                Email:{" "}
                <a href={`mailto:${profile.contact_email}`} className="text-blue-300">
                  {profile.contact_email}
                </a>
              </p>
            )}
            {profile.phone_number && (
              <p>
                Phone:{" "}
                <a href={`tel:${profile.phone_number}`} className="text-blue-300">
                  {profile.phone_number}
                </a>
              </p>
            )}
            {profile.social_media_links && (
              <div className="mt-2">
                <p className="text-gray-100">Social Media:</p>
                {Object.entries(profile.social_media_links).map(([key, value]) => (
                  value && (
                    <p key={key}>
                      <a
                        href={value}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-300 hover:text-blue-200 capitalize"
                      >
                        {key}
                      </a>
                    </p>
                  )
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/15 bg-[#161324] p-6">
            <h3 className="text-xl font-semibold text-white">
              Send Connection Request
            </h3>
            <p className="text-sm text-gray-300 mt-1">
              Add an optional intro message (max 300 chars).
            </p>
            <textarea
              value={connectMessage}
              onChange={(event) =>
                setConnectMessage(event.target.value.slice(0, 300))
              }
              rows={4}
              className="mt-4 w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              placeholder="Hi! I'd like to connect and learn more about your startup."
            />
            <div className="mt-2 text-xs text-gray-400">
              {connectMessage.length}/300
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 rounded-lg border border-white/20 text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendConnectionRequest}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50"
              >
                {actionLoading ? "Sending..." : "Send Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StartupProfilePage;
