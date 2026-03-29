import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const parseJsonValue = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

const stringifyValue = (value) => {
  if (!value) return "N/A";
  if (Array.isArray(value)) return value.join(", ") || "N/A";
  if (typeof value === "object") {
    const vals = Object.values(value).filter(Boolean);
    return vals.length ? vals.join(", ") : "N/A";
  }
  return value;
};

const InvestorProfilePage = () => {
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

  const industries = parseJsonValue(
    profile.industries_of_interest,
    profile.industries_of_interest,
  );
  const stages = parseJsonValue(
    profile.stage_preference,
    profile.stage_preference,
  );
  const geographies = parseJsonValue(
    profile.geographic_preference,
    profile.geographic_preference,
  );
  const structures = parseJsonValue(
    profile.investment_structure,
    profile.investment_structure,
  );
  const social = parseJsonValue(profile.social_media, {});

  const isOwnProfile = Boolean(
    user?.id && profile?.user_id && user.id === profile.user_id,
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
      name: profile.name_or_firm || "Investor",
    });
    navigate(`/messages?${params.toString()}`);
  };

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link
          to="/investors"
          className="inline-block text-sm text-blue-300 hover:text-blue-200"
        >
          &lt;- Back to Investors
        </Link>

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {profile.name_or_firm || "Investor"}
              </h1>
              <p className="text-gray-300 mt-1">
                {profile.investor_type || "Investor profile"}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {stringifyValue(geographies)}
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
          <h2 className="text-xl font-semibold text-white">Investment Focus</h2>
          <div className="mt-3 space-y-2 text-gray-200">
            <p>Industries: {stringifyValue(industries)}</p>
            <p>Stages: {stringifyValue(stages)}</p>
            <p>
              Check Size: {profile.min_investment_size || "N/A"} -{" "}
              {profile.max_investment_size || "N/A"}
            </p>
            <p>Structures: {stringifyValue(structures)}</p>
            {profile.investment_thesis && (
              <p>Thesis: {profile.investment_thesis}</p>
            )}
            {profile.what_you_look_for && (
              <p>What You Look For: {profile.what_you_look_for}</p>
            )}
            {profile.value_add && <p>Value Add: {profile.value_add}</p>}
          </div>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <div className="mt-3 space-y-2 text-gray-200">
            {profile.primary_contact_email && (
              <p>Email: {profile.primary_contact_email}</p>
            )}
            {profile.phone_number && <p>Phone: {profile.phone_number}</p>}
            {profile.preferred_contact_method && (
              <p>Preferred Contact: {profile.preferred_contact_method}</p>
            )}
            {social.linkedin && (
              <p>
                LinkedIn:{" "}
                <a
                  href={social.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300"
                >
                  {social.linkedin}
                </a>
              </p>
            )}
            {social.twitter && (
              <p>
                Twitter:{" "}
                <a
                  href={social.twitter}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300"
                >
                  {social.twitter}
                </a>
              </p>
            )}
            {social.website && (
              <p>
                Website:{" "}
                <a
                  href={social.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300"
                >
                  {social.website}
                </a>
              </p>
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
              placeholder="Hi! I'd like to connect and discuss opportunities."
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

export default InvestorProfilePage;
