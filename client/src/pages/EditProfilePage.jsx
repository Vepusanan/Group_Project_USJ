import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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

const toCsv = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed.join(", ") : value;
    } catch {
      return value;
    }
  }
  return "";
};

const csvToArray = (value) =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const appendIfPresent = (formData, key, value) => {
  if (value == null) return;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed !== "") formData.append(key, trimmed);
    return;
  }
  if (typeof value === "number") {
    if (!Number.isNaN(value)) formData.append(key, String(value));
    return;
  }
  if (typeof value === "boolean") {
    formData.append(key, String(value));
  }
};

const EditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isInvestor = user?.userType === "investor";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileId, setProfileId] = useState(null);

  const [startupForm, setStartupForm] = useState({
    company_name: "",
    tagline: "",
    detailed_description: "",
    industry: "",
    founded_date: "",
    current_stage: "",
    team_size: "",
    founder_names: "",
    key_team_members: "",
    team_photo_url: "",
    funding_stage: "",
    amount_seeking: "",
    previous_funding: "",
    use_of_funds: "",
    revenue_status: "",
    key_metrics: "",
    major_achievements: "",
    customer_testimonials: "",
    pitch_deck_url: "",
    business_plan_url: "",
    product_demo_url: "",
    primary_contact_name: "",
    contact_email: "",
    phone_number: "",
    social_linkedin: "",
    social_twitter: "",
    social_facebook: "",
    social_instagram: "",
  });

  const [investorForm, setInvestorForm] = useState({
    name_or_firm: "",
    investor_type: "",
    years_of_experience: "",
    professional_background: "",
    investment_thesis: "",
    industries_of_interest_csv: "",
    geographic_preference_csv: "",
    stage_preference_csv: "",
    min_investment_size: "",
    max_investment_size: "",
    investment_structure_csv: "",
    follow_on_investment: false,
    investment_timeline: "",
    number_of_investments: "",
    portfolio_companies: "",
    successful_exits: "",
    notable_achievements: "",
    what_you_look_for: "",
    deal_breakers: "",
    value_add: "",
    network_resources: "",
    primary_contact_email: "",
    phone_number: "",
    preferred_contact_method: "",
    social_linkedin: "",
    social_twitter: "",
    social_website: "",
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      const result = isInvestor
        ? await investorProfileService.getMyProfile()
        : await profileService.getMyProfile();

      if (!result.success) {
        setError(result.error || "Failed to load profile");
        setLoading(false);
        return;
      }

      const profile = result.data?.data || result.data;
      if (!profile) {
        setError("Profile not found. Complete onboarding first.");
        setLoading(false);
        return;
      }

      const resolvedProfileId =
        profile.investor_profile_id || profile.startup_profile_id || profile.id;

      if (!resolvedProfileId) {
        setError("Profile ID not found. Please re-run onboarding.");
        setLoading(false);
        return;
      }

      setProfileId(resolvedProfileId);

      if (isInvestor) {
        const socialMedia = parseJsonValue(profile.social_media, {});

        setInvestorForm({
          name_or_firm:
            profile.name_or_firm || profile.name || profile.firm_name || "",
          investor_type: profile.investor_type || "",
          years_of_experience: profile.years_of_experience || "",
          professional_background:
            profile.professional_background || profile.background || "",
          investment_thesis: profile.investment_thesis || "",
          industries_of_interest_csv: toCsv(
            profile.industries_of_interest || profile.industries,
          ),
          geographic_preference_csv: toCsv(
            profile.geographic_preference || profile.geography,
          ),
          stage_preference_csv: toCsv(
            profile.stage_preference || profile.investment_stage,
          ),
          min_investment_size:
            profile.min_investment_size || profile.investment_size_min || "",
          max_investment_size:
            profile.max_investment_size || profile.investment_size_max || "",
          investment_structure_csv: toCsv(profile.investment_structure),
          follow_on_investment: Boolean(profile.follow_on_investment),
          investment_timeline: profile.investment_timeline || "",
          number_of_investments:
            profile.number_of_investments || profile.total_investments || "",
          portfolio_companies: Array.isArray(profile.portfolio_companies)
            ? profile.portfolio_companies.join(", ")
            : profile.portfolio_companies || "",
          successful_exits:
            profile.successful_exits || profile.notable_exits || "",
          notable_achievements: profile.notable_achievements || "",
          what_you_look_for:
            profile.what_you_look_for || profile.investment_criteria || "",
          deal_breakers: profile.deal_breakers || profile.red_flags || "",
          value_add: profile.value_add || "",
          network_resources: Array.isArray(profile.network_resources)
            ? profile.network_resources.join(", ")
            : profile.network_resources || "",
          primary_contact_email:
            profile.primary_contact_email || profile.contact_email || "",
          phone_number: profile.phone_number || profile.contact_phone || "",
          preferred_contact_method: profile.preferred_contact_method || "",
          social_linkedin: socialMedia.linkedin || "",
          social_twitter: socialMedia.twitter || "",
          social_website: socialMedia.website || "",
        });
      } else {
        const socialMedia = parseJsonValue(
          profile.social_media_links || profile.social_media,
          {},
        );

        setStartupForm({
          company_name: profile.company_name || "",
          tagline: profile.tagline || "",
          detailed_description:
            profile.detailed_description || profile.description || "",
          industry: profile.industry || "",
          founded_date: profile.founded_date || "",
          current_stage: profile.current_stage || "",
          team_size: profile.team_size || "",
          founder_names: profile.founder_names || "",
          key_team_members: profile.key_team_members || "",
          team_photo_url: profile.team_photo_url || "",
          funding_stage: profile.funding_stage || profile.stage || "",
          amount_seeking: profile.amount_seeking || "",
          previous_funding: profile.previous_funding || "",
          use_of_funds: profile.use_of_funds || "",
          revenue_status: profile.revenue_status || "",
          key_metrics: profile.key_metrics || "",
          major_achievements: profile.major_achievements || "",
          customer_testimonials: profile.customer_testimonials || "",
          pitch_deck_url: profile.pitch_deck_url || "",
          business_plan_url: profile.business_plan_url || "",
          product_demo_url: profile.product_demo_url || "",
          primary_contact_name: profile.primary_contact_name || "",
          contact_email: profile.contact_email || "",
          phone_number: profile.phone_number || profile.contact_phone || "",
          social_linkedin: socialMedia.linkedin || "",
          social_twitter: socialMedia.twitter || "",
          social_facebook: socialMedia.facebook || "",
          social_instagram: socialMedia.instagram || "",
        });
      }

      setLoading(false);
    };

    load();
  }, [isInvestor]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!profileId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();

      if (isInvestor) {
        if (!investorForm.name_or_firm.trim()) {
          setSaving(false);
          setError("Name or firm is required");
          return;
        }

        appendIfPresent(formData, "name_or_firm", investorForm.name_or_firm);
        appendIfPresent(formData, "investor_type", investorForm.investor_type);
        appendIfPresent(
          formData,
          "years_of_experience",
          investorForm.years_of_experience,
        );
        appendIfPresent(
          formData,
          "professional_background",
          investorForm.professional_background,
        );
        appendIfPresent(
          formData,
          "investment_thesis",
          investorForm.investment_thesis,
        );
        appendIfPresent(
          formData,
          "min_investment_size",
          investorForm.min_investment_size,
        );
        appendIfPresent(
          formData,
          "max_investment_size",
          investorForm.max_investment_size,
        );
        appendIfPresent(
          formData,
          "investment_timeline",
          investorForm.investment_timeline,
        );
        appendIfPresent(
          formData,
          "number_of_investments",
          investorForm.number_of_investments,
        );
        appendIfPresent(
          formData,
          "portfolio_companies",
          investorForm.portfolio_companies,
        );
        appendIfPresent(
          formData,
          "successful_exits",
          investorForm.successful_exits,
        );
        appendIfPresent(
          formData,
          "notable_achievements",
          investorForm.notable_achievements,
        );
        appendIfPresent(
          formData,
          "what_you_look_for",
          investorForm.what_you_look_for,
        );
        appendIfPresent(formData, "deal_breakers", investorForm.deal_breakers);
        appendIfPresent(formData, "value_add", investorForm.value_add);
        appendIfPresent(
          formData,
          "network_resources",
          investorForm.network_resources,
        );
        appendIfPresent(
          formData,
          "primary_contact_email",
          investorForm.primary_contact_email,
        );
        appendIfPresent(formData, "phone_number", investorForm.phone_number);
        appendIfPresent(
          formData,
          "preferred_contact_method",
          investorForm.preferred_contact_method,
        );
        appendIfPresent(
          formData,
          "follow_on_investment",
          investorForm.follow_on_investment,
        );

        const industries = csvToArray(investorForm.industries_of_interest_csv);
        const geographies = csvToArray(investorForm.geographic_preference_csv);
        const stages = csvToArray(investorForm.stage_preference_csv);
        const structures = csvToArray(investorForm.investment_structure_csv);

        if (industries.length) {
          formData.append("industries_of_interest", JSON.stringify(industries));
        }
        if (geographies.length) {
          formData.append("geographic_preference", JSON.stringify(geographies));
        }
        if (stages.length) {
          formData.append("stage_preference", JSON.stringify(stages));
        }
        if (structures.length) {
          formData.append("investment_structure", JSON.stringify(structures));
        }

        const socialMedia = {
          linkedin: investorForm.social_linkedin.trim(),
          twitter: investorForm.social_twitter.trim(),
          website: investorForm.social_website.trim(),
        };
        if (Object.values(socialMedia).some(Boolean)) {
          formData.append("social_media", JSON.stringify(socialMedia));
        }

        const result = await investorProfileService.updateProfile(
          profileId,
          formData,
        );
        if (!result.success) {
          setSaving(false);
          setError(result.error || "Failed to update profile");
          return;
        }
      } else {
        if (!startupForm.company_name.trim()) {
          setSaving(false);
          setError("Company name is required");
          return;
        }

        appendIfPresent(formData, "company_name", startupForm.company_name);
        appendIfPresent(formData, "tagline", startupForm.tagline);
        appendIfPresent(
          formData,
          "detailed_description",
          startupForm.detailed_description,
        );
        appendIfPresent(formData, "industry", startupForm.industry);
        appendIfPresent(formData, "founded_date", startupForm.founded_date);
        appendIfPresent(formData, "current_stage", startupForm.current_stage);
        appendIfPresent(formData, "team_size", startupForm.team_size);
        appendIfPresent(formData, "founder_names", startupForm.founder_names);
        appendIfPresent(
          formData,
          "key_team_members",
          startupForm.key_team_members,
        );
        appendIfPresent(formData, "team_photo_url", startupForm.team_photo_url);
        appendIfPresent(formData, "funding_stage", startupForm.funding_stage);
        appendIfPresent(formData, "amount_seeking", startupForm.amount_seeking);
        appendIfPresent(
          formData,
          "previous_funding",
          startupForm.previous_funding,
        );
        appendIfPresent(formData, "use_of_funds", startupForm.use_of_funds);
        appendIfPresent(formData, "revenue_status", startupForm.revenue_status);
        appendIfPresent(formData, "key_metrics", startupForm.key_metrics);
        appendIfPresent(
          formData,
          "major_achievements",
          startupForm.major_achievements,
        );
        appendIfPresent(
          formData,
          "customer_testimonials",
          startupForm.customer_testimonials,
        );
        appendIfPresent(formData, "pitch_deck_url", startupForm.pitch_deck_url);
        appendIfPresent(
          formData,
          "business_plan_url",
          startupForm.business_plan_url,
        );
        appendIfPresent(
          formData,
          "product_demo_url",
          startupForm.product_demo_url,
        );
        appendIfPresent(
          formData,
          "primary_contact_name",
          startupForm.primary_contact_name,
        );
        appendIfPresent(formData, "contact_email", startupForm.contact_email);
        appendIfPresent(formData, "phone_number", startupForm.phone_number);

        const socialLinks = {
          linkedin: startupForm.social_linkedin.trim(),
          twitter: startupForm.social_twitter.trim(),
          facebook: startupForm.social_facebook.trim(),
          instagram: startupForm.social_instagram.trim(),
        };
        if (Object.values(socialLinks).some(Boolean)) {
          formData.append("social_media_links", JSON.stringify(socialLinks));
        }

        const result = await profileService.updateProfile(profileId, formData);
        if (!result.success) {
          setSaving(false);
          setError(result.error || "Failed to update profile");
          return;
        }
      }

      setSuccess("Profile updated successfully.");
      setSaving(false);
      setTimeout(() => navigate("/profile"), 700);
    } catch {
      setSaving(false);
      setError("An unexpected error occurred while saving profile.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 text-gray-300">
        Loading editable profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-5xl mx-auto space-y-4">
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
          <p className="text-gray-300 mt-1">
            Update your canonical {isInvestor ? "investor" : "startup"} profile
            fields.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-white/15 bg-black/45 p-6 space-y-5"
        >
          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-100">
              {success}
            </div>
          )}

          {isInvestor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={investorForm.name_or_firm}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    name_or_firm: e.target.value,
                  }))
                }
                placeholder="Name or firm"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
                required
              />
              <input
                value={investorForm.investor_type}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    investor_type: e.target.value,
                  }))
                }
                placeholder="Investor type"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={investorForm.years_of_experience}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    years_of_experience: e.target.value,
                  }))
                }
                placeholder="Years of experience"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.investment_timeline}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    investment_timeline: e.target.value,
                  }))
                }
                placeholder="Investment timeline"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={investorForm.min_investment_size}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    min_investment_size: e.target.value,
                  }))
                }
                placeholder="Min investment size"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={investorForm.max_investment_size}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    max_investment_size: e.target.value,
                  }))
                }
                placeholder="Max investment size"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={investorForm.number_of_investments}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    number_of_investments: e.target.value,
                  }))
                }
                placeholder="Number of investments"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={investorForm.successful_exits}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    successful_exits: e.target.value,
                  }))
                }
                placeholder="Successful exits"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.primary_contact_email}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    primary_contact_email: e.target.value,
                  }))
                }
                placeholder="Primary contact email"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.phone_number}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    phone_number: e.target.value,
                  }))
                }
                placeholder="Phone number"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.preferred_contact_method}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    preferred_contact_method: e.target.value,
                  }))
                }
                placeholder="Preferred contact method"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.industries_of_interest_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    industries_of_interest_csv: e.target.value,
                  }))
                }
                placeholder="Industries of interest (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.geographic_preference_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    geographic_preference_csv: e.target.value,
                  }))
                }
                placeholder="Geographic preference (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.stage_preference_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    stage_preference_csv: e.target.value,
                  }))
                }
                placeholder="Stage preference (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.investment_structure_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    investment_structure_csv: e.target.value,
                  }))
                }
                placeholder="Investment structures (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={investorForm.professional_background}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    professional_background: e.target.value,
                  }))
                }
                placeholder="Professional background"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={investorForm.investment_thesis}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    investment_thesis: e.target.value,
                  }))
                }
                placeholder="Investment thesis"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={investorForm.what_you_look_for}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    what_you_look_for: e.target.value,
                  }))
                }
                placeholder="What you look for"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={investorForm.value_add}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    value_add: e.target.value,
                  }))
                }
                placeholder="Value add"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={investorForm.portfolio_companies}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    portfolio_companies: e.target.value,
                  }))
                }
                placeholder="Portfolio companies"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={investorForm.notable_achievements}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    notable_achievements: e.target.value,
                  }))
                }
                placeholder="Notable achievements"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={investorForm.deal_breakers}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    deal_breakers: e.target.value,
                  }))
                }
                placeholder="Deal breakers"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={investorForm.network_resources}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    network_resources: e.target.value,
                  }))
                }
                placeholder="Network resources"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.social_linkedin}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    social_linkedin: e.target.value,
                  }))
                }
                placeholder="Social LinkedIn URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.social_twitter}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    social_twitter: e.target.value,
                  }))
                }
                placeholder="Social Twitter URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.social_website}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    social_website: e.target.value,
                  }))
                }
                placeholder="Social Website URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <label className="rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-gray-200 flex items-center justify-between">
                <span>Follow-on investment</span>
                <input
                  type="checkbox"
                  checked={investorForm.follow_on_investment}
                  onChange={(e) =>
                    setInvestorForm((prev) => ({
                      ...prev,
                      follow_on_investment: e.target.checked,
                    }))
                  }
                  className="h-4 w-4"
                />
              </label>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={startupForm.company_name}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    company_name: e.target.value,
                  }))
                }
                placeholder="Company name"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
                required
              />
              <input
                value={startupForm.tagline}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    tagline: e.target.value,
                  }))
                }
                placeholder="Tagline"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={startupForm.detailed_description}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    detailed_description: e.target.value,
                  }))
                }
                placeholder="Detailed description"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.industry}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    industry: e.target.value,
                  }))
                }
                placeholder="Industry"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="date"
                value={startupForm.founded_date}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    founded_date: e.target.value,
                  }))
                }
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.current_stage}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    current_stage: e.target.value,
                  }))
                }
                placeholder="Current stage"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.funding_stage}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    funding_stage: e.target.value,
                  }))
                }
                placeholder="Funding stage"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={startupForm.team_size}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    team_size: e.target.value,
                  }))
                }
                placeholder="Team size"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={startupForm.amount_seeking}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    amount_seeking: e.target.value,
                  }))
                }
                placeholder="Amount seeking"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={startupForm.previous_funding}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    previous_funding: e.target.value,
                  }))
                }
                placeholder="Previous funding"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.revenue_status}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    revenue_status: e.target.value,
                  }))
                }
                placeholder="Revenue status"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.primary_contact_name}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    primary_contact_name: e.target.value,
                  }))
                }
                placeholder="Primary contact name"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.contact_email}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    contact_email: e.target.value,
                  }))
                }
                placeholder="Contact email"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.phone_number}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    phone_number: e.target.value,
                  }))
                }
                placeholder="Phone number"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.founder_names}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    founder_names: e.target.value,
                  }))
                }
                placeholder="Founder names"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={startupForm.key_team_members}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    key_team_members: e.target.value,
                  }))
                }
                placeholder="Key team members"
                rows={2}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={startupForm.use_of_funds}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    use_of_funds: e.target.value,
                  }))
                }
                placeholder="Use of funds"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={startupForm.key_metrics}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    key_metrics: e.target.value,
                  }))
                }
                placeholder="Key metrics"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={startupForm.major_achievements}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    major_achievements: e.target.value,
                  }))
                }
                placeholder="Major achievements"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={startupForm.customer_testimonials}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    customer_testimonials: e.target.value,
                  }))
                }
                placeholder="Customer testimonials"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.pitch_deck_url}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    pitch_deck_url: e.target.value,
                  }))
                }
                placeholder="Pitch deck URL"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.business_plan_url}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    business_plan_url: e.target.value,
                  }))
                }
                placeholder="Business plan URL"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.product_demo_url}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    product_demo_url: e.target.value,
                  }))
                }
                placeholder="Product demo URL"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.team_photo_url}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    team_photo_url: e.target.value,
                  }))
                }
                placeholder="Team photo URL"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.social_linkedin}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    social_linkedin: e.target.value,
                  }))
                }
                placeholder="Social LinkedIn URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.social_twitter}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    social_twitter: e.target.value,
                  }))
                }
                placeholder="Social Twitter URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.social_facebook}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    social_facebook: e.target.value,
                  }))
                }
                placeholder="Social Facebook URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.social_instagram}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    social_instagram: e.target.value,
                  }))
                }
                placeholder="Social Instagram URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
