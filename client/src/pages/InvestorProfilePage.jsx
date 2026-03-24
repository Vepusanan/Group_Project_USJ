import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { useAuth } from "../hooks/useAuth";

const stringifyValue = (value) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (typeof value === "object" && value !== null) {
    return Object.values(value).join(", ");
  }
  return value;
};

const InvestorProfilePage = () => {
  const { id } = useParams();
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

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-4">
        <Link
          to="/investors"
          className="inline-block text-sm text-blue-300 hover:text-blue-200"
        >
          ← Back to Investors
        </Link>

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">
                {profile.name || profile.firm_name || "Investor"}
              </h1>
              <p className="text-gray-300 mt-1">
                {profile.investor_type || "Investor profile"}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                {profile.location ||
                  [profile.city, profile.country].filter(Boolean).join(", ") ||
                  "No location information"}
              </p>
            </div>

            {!isOwnProfile && (
              <div>
                {connectionStatus === "accepted" ? (
                  <span className="inline-block px-3 py-1.5 rounded-full text-sm border border-emerald-400/40 bg-emerald-500/20 text-emerald-100">
                    Connected
                  </span>
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
            <p>Industries: {stringifyValue(profile.industries) || "N/A"}</p>
            <p>Stages: {stringifyValue(profile.investment_stage) || "N/A"}</p>
            <p>
              Check Size:{" "}
              {profile.min_investment_size ||
                profile.investment_size_min ||
                "N/A"}{" "}
              -{" "}
              {profile.max_investment_size ||
                profile.investment_size_max ||
                "N/A"}
            </p>
            {profile.investment_thesis && (
              <p>Thesis: {profile.investment_thesis}</p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h2 className="text-xl font-semibold text-white">Contact</h2>
          <div className="mt-3 space-y-2 text-gray-200">
            {profile.website && (
              <p>
                Website:{" "}
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300"
                >
                  {profile.website}
                </a>
              </p>
            )}
            {profile.linkedin && (
              <p>
                LinkedIn:{" "}
                <a
                  href={profile.linkedin}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-300"
                >
                  {profile.linkedin}
                </a>
              </p>
            )}
            {profile.contact_email && <p>Email: {profile.contact_email}</p>}
            {profile.contact_phone && <p>Phone: {profile.contact_phone}</p>}
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
