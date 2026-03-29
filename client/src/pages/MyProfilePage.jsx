import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import profileService from "../services/profileService";
import investorProfileService from "../services/investorProfileService";

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

const renderValue = (value) => {
  if (value == null || value === "") return "N/A";
  if (Array.isArray(value)) return value.join(", ") || "N/A";
  if (typeof value === "object") {
    const vals = Object.values(value).filter(Boolean);
    return vals.length ? vals.join(", ") : "N/A";
  }
  return String(value);
};

const InfoRow = ({ label, value }) => (
  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3 py-2 border-b border-white/10">
    <span className="text-sm text-gray-400 md:w-56">{label}</span>
    <span className="text-sm text-gray-100 break-words">
      {renderValue(value)}
    </span>
  </div>
);

const MyProfilePage = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const result =
        user?.userType === "investor"
          ? await investorProfileService.getMyProfile()
          : await profileService.getMyProfile();

      if (!result.success) {
        setError(result.error || "Failed to load profile");
        setProfile(null);
        setLoading(false);
        return;
      }

      const data = result.data?.data || result.data || null;
      setProfile(data);
      setLoading(false);
    };

    load();
  }, [user?.userType]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 text-gray-300">
        Loading profile...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 text-rose-100">
          {error}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen px-6 py-10">
        <div className="max-w-5xl mx-auto rounded-xl border border-white/15 bg-black/45 p-5 text-gray-200">
          Profile not created yet. Complete onboarding first.
        </div>
      </div>
    );
  }

  const isInvestor = user?.userType === "investor";
  const profileImage = isInvestor
    ? profile?.photo_url
    : profile?.team_photo_url;
  const investorSocial = parseJsonValue(profile.social_media, {});
  const startupSocial = parseJsonValue(
    profile.social_media_links || profile.social_media,
    {},
  );

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">My Profile</h1>
              <p className="text-gray-300 mt-1">
                Review your current profile information.
              </p>
            </div>
            <Link
              to="/profile/edit"
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium hover:opacity-90 transition-opacity"
            >
              Edit Profile
            </Link>
          </div>
        </div>

        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          {profileImage && (
            <div className="mb-5 pb-4 border-b border-white/10 flex items-center gap-4">
              <img
                src={profileImage}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border border-white/20"
              />
              <div className="text-sm text-gray-300">
                Current {isInvestor ? "photo" : "team photo"}
              </div>
            </div>
          )}

          {isInvestor ? (
            <>
              <InfoRow label="Name / Firm" value={profile.name_or_firm} />
              <InfoRow label="Investor Type" value={profile.investor_type} />
              <InfoRow
                label="Experience (Years)"
                value={profile.years_of_experience}
              />
              <InfoRow
                label="Industries of Interest"
                value={parseJsonValue(
                  profile.industries_of_interest,
                  profile.industries_of_interest,
                )}
              />
              <InfoRow
                label="Geographic Preference"
                value={parseJsonValue(
                  profile.geographic_preference,
                  profile.geographic_preference,
                )}
              />
              <InfoRow
                label="Stage Preference"
                value={parseJsonValue(
                  profile.stage_preference,
                  profile.stage_preference,
                )}
              />
              <InfoRow
                label="Min Check Size"
                value={profile.min_investment_size}
              />
              <InfoRow
                label="Max Check Size"
                value={profile.max_investment_size}
              />
              <InfoRow
                label="Investment Structure"
                value={parseJsonValue(
                  profile.investment_structure,
                  profile.investment_structure,
                )}
              />
              <InfoRow
                label="Investment Timeline"
                value={profile.investment_timeline}
              />
              <InfoRow
                label="Investment Thesis"
                value={profile.investment_thesis}
              />
              <InfoRow
                label="What You Look For"
                value={profile.what_you_look_for}
              />
              <InfoRow label="Value Add" value={profile.value_add} />
              <InfoRow
                label="Primary Contact Email"
                value={profile.primary_contact_email}
              />
              <InfoRow label="Phone Number" value={profile.phone_number} />
              <InfoRow
                label="Preferred Contact Method"
                value={profile.preferred_contact_method}
              />
              <InfoRow label="Social" value={investorSocial} />
            </>
          ) : (
            <>
              <InfoRow label="Company Name" value={profile.company_name} />
              <InfoRow label="Tagline" value={profile.tagline} />
              <InfoRow
                label="Detailed Description"
                value={profile.detailed_description}
              />
              <InfoRow label="Industry" value={profile.industry} />
              <InfoRow label="Founded Date" value={profile.founded_date} />
              <InfoRow label="Current Stage" value={profile.current_stage} />
              <InfoRow label="Funding Stage" value={profile.funding_stage} />
              <InfoRow label="Amount Seeking" value={profile.amount_seeking} />
              <InfoRow label="Revenue Status" value={profile.revenue_status} />
              <InfoRow label="Founder Names" value={profile.founder_names} />
              <InfoRow
                label="Primary Contact Name"
                value={profile.primary_contact_name}
              />
              <InfoRow label="Contact Email" value={profile.contact_email} />
              <InfoRow label="Phone Number" value={profile.phone_number} />
              <InfoRow label="Pitch Deck URL" value={profile.pitch_deck_url} />
              <InfoRow
                label="Business Plan URL"
                value={profile.business_plan_url}
              />
              <InfoRow
                label="Product Demo URL"
                value={profile.product_demo_url}
              />
              <InfoRow label="Social" value={startupSocial} />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProfilePage;
