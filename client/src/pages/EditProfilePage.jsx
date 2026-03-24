import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2, Upload } from "lucide-react";
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

const normalizeDocuments = (value) => {
  const parsed = parseJsonValue(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((doc, index) => {
      if (typeof doc === "string") {
        return { name: `Document ${index + 1}`, url: doc };
      }
      if (doc && typeof doc === "object") {
        return {
          name: doc.name || `Document ${index + 1}`,
          url: doc.url || "",
        };
      }
      return null;
    })
    .filter(Boolean);
};

const EditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isInvestor = user?.userType === "investor";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docAction, setDocAction] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileId, setProfileId] = useState(null);

  const [startupForm, setStartupForm] = useState({
    company_name: "",
    tagline: "",
    description: "",
    industry: "",
    stage: "",
    website: "",
    linkedin: "",
    city: "",
    country: "",
    contact_email: "",
    contact_phone: "",
    founders_csv: "",
    team_csv: "",
    funding_amount: "",
    previous_funding: "",
    use_of_funds: "",
    traction_metrics: "",
    achievements_csv: "",
    milestones_csv: "",
    social_twitter: "",
    social_facebook: "",
    social_instagram: "",
  });

  const [investorForm, setInvestorForm] = useState({
    name: "",
    firm_name: "",
    investor_type: "",
    investment_thesis: "",
    website: "",
    linkedin: "",
    city: "",
    country: "",
    contact_email: "",
    contact_phone: "",
    investment_size_min: "",
    investment_size_max: "",
    industries_csv: "",
    investment_stage_csv: "",
    years_of_experience: "",
    background: "",
    geography_csv: "",
    investment_structure_csv: "",
    portfolio_companies_csv: "",
    notable_exits_csv: "",
    network_resources_csv: "",
    social_twitter: "",
    social_facebook: "",
    social_instagram: "",
    follow_on_investment: true,
    is_actively_investing: true,
  });

  const [imageFile, setImageFile] = useState(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);

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
      if (!profile?.id) {
        setError("Profile not found. Complete onboarding first.");
        setLoading(false);
        return;
      }

      setProfileId(profile.id);

      if (isInvestor) {
        const socialMedia = parseJsonValue(profile.social_media, {});
        setInvestorForm({
          name: profile.name || "",
          firm_name: profile.firm_name || "",
          investor_type: profile.investor_type || "",
          investment_thesis: profile.investment_thesis || "",
          website: profile.website || "",
          linkedin: profile.linkedin || "",
          city: profile.city || "",
          country: profile.country || "",
          contact_email: profile.contact_email || "",
          contact_phone: profile.contact_phone || "",
          investment_size_min: profile.investment_size_min || "",
          investment_size_max: profile.investment_size_max || "",
          industries_csv: toCsv(profile.industries),
          investment_stage_csv: toCsv(profile.investment_stage),
          years_of_experience:
            profile.years_of_experience || profile.experience_years || "",
          background: profile.background || "",
          geography_csv: toCsv(profile.geography),
          investment_structure_csv: toCsv(profile.investment_structure),
          portfolio_companies_csv: toCsv(profile.portfolio_companies),
          notable_exits_csv: toCsv(profile.notable_exits),
          network_resources_csv: toCsv(profile.network_resources),
          social_twitter: socialMedia.twitter || "",
          social_facebook: socialMedia.facebook || "",
          social_instagram: socialMedia.instagram || "",
          follow_on_investment:
            profile.follow_on_investment === undefined
              ? true
              : !!profile.follow_on_investment,
          is_actively_investing:
            profile.is_actively_investing === undefined
              ? true
              : !!profile.is_actively_investing,
        });
        setCurrentImageUrl(profile.photo_url || "");
      } else {
        const funding = parseJsonValue(profile.funding, {});
        const traction = parseJsonValue(profile.traction, {});
        const socialMedia = parseJsonValue(profile.social_media, {});
        setStartupForm({
          company_name: profile.company_name || "",
          tagline: profile.tagline || "",
          description: profile.description || "",
          industry: profile.industry || "",
          stage: profile.stage || profile.funding_stage || "",
          website: profile.website || "",
          linkedin: profile.linkedin || "",
          city: profile.city || profile.location_city || "",
          country: profile.country || profile.location_country || "",
          contact_email: profile.contact_email || "",
          contact_phone: profile.contact_phone || "",
          founders_csv: toCsv(profile.founders),
          team_csv: toCsv(profile.team),
          funding_amount: funding.amount_seeking || "",
          previous_funding: funding.previous_funding || "",
          use_of_funds: funding.use_of_funds || "",
          traction_metrics: traction.metrics || "",
          achievements_csv: toCsv(traction.achievements),
          milestones_csv: toCsv(traction.milestones),
          social_twitter: socialMedia.twitter || "",
          social_facebook: socialMedia.facebook || "",
          social_instagram: socialMedia.instagram || "",
        });
        setDocuments(normalizeDocuments(profile.documents));
        setCurrentImageUrl(profile.logo_url || "");
      }

      setLoading(false);
    };

    load();
  }, [isInvestor]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreviewUrl("");
      return;
    }

    const preview = URL.createObjectURL(imageFile);
    setImagePreviewUrl(preview);
    return () => URL.revokeObjectURL(preview);
  }, [imageFile]);

  const shownImage = useMemo(
    () => imagePreviewUrl || currentImageUrl,
    [imagePreviewUrl, currentImageUrl],
  );

  const uploadNewDocuments = async () => {
    if (!profileId || !newDocuments.length || isInvestor) return;

    setDocAction("upload");
    setError("");
    setSuccess("");

    const formData = new FormData();
    newDocuments.forEach((file) => {
      formData.append("documents", file);
    });

    const result = await profileService.uploadDocuments(profileId, formData);
    setDocAction("");

    if (!result.success) {
      setError(result.error || "Failed to upload documents");
      return;
    }

    const updatedDocuments = normalizeDocuments(result.data?.data?.documents);
    setDocuments(updatedDocuments);
    setNewDocuments([]);
    setSuccess("Documents uploaded successfully.");
  };

  const deleteDocument = async (documentIndex) => {
    if (!profileId || isInvestor) return;

    setDocAction(`delete-${documentIndex}`);
    setError("");
    setSuccess("");

    const result = await profileService.deleteDocument(
      profileId,
      documentIndex,
    );
    setDocAction("");

    if (!result.success) {
      setError(result.error || "Failed to delete document");
      return;
    }

    const updatedDocuments = normalizeDocuments(result.data?.data?.documents);
    setDocuments(updatedDocuments);
    setSuccess("Document removed successfully.");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!profileId) return;

    setSaving(true);
    setError("");
    setSuccess("");

    const formData = new FormData();

    if (isInvestor) {
      if (!investorForm.name.trim()) {
        setSaving(false);
        setError("Name is required");
        return;
      }

      formData.append("name", investorForm.name.trim());
      formData.append("firm_name", investorForm.firm_name.trim());
      formData.append("investor_type", investorForm.investor_type.trim());
      formData.append(
        "investment_thesis",
        investorForm.investment_thesis.trim(),
      );
      formData.append("website", investorForm.website.trim());
      formData.append("linkedin", investorForm.linkedin.trim());
      formData.append("city", investorForm.city.trim());
      formData.append("country", investorForm.country.trim());
      formData.append("contact_email", investorForm.contact_email.trim());
      formData.append("contact_phone", investorForm.contact_phone.trim());
      formData.append("years_of_experience", investorForm.years_of_experience);
      formData.append("background", investorForm.background.trim());
      formData.append(
        "follow_on_investment",
        investorForm.follow_on_investment,
      );
      formData.append(
        "is_actively_investing",
        investorForm.is_actively_investing,
      );

      if (investorForm.investment_size_min !== "") {
        formData.append(
          "investment_size_min",
          investorForm.investment_size_min,
        );
      }
      if (investorForm.investment_size_max !== "") {
        formData.append(
          "investment_size_max",
          investorForm.investment_size_max,
        );
      }

      const industries = csvToArray(investorForm.industries_csv);
      const stages = csvToArray(investorForm.investment_stage_csv);
      const geography = csvToArray(investorForm.geography_csv);
      const structures = csvToArray(investorForm.investment_structure_csv);
      const portfolio = csvToArray(investorForm.portfolio_companies_csv);
      const exits = csvToArray(investorForm.notable_exits_csv);
      const network = csvToArray(investorForm.network_resources_csv);

      if (industries.length) {
        formData.append("industries", JSON.stringify(industries));
      }
      if (stages.length) {
        formData.append("investment_stage", JSON.stringify(stages));
      }
      if (geography.length) {
        formData.append("geography", JSON.stringify(geography));
      }
      if (structures.length) {
        formData.append("investment_structure", JSON.stringify(structures));
      }
      if (portfolio.length) {
        formData.append("portfolio_companies", JSON.stringify(portfolio));
      }
      if (exits.length) {
        formData.append("notable_exits", JSON.stringify(exits));
      }
      if (network.length) {
        formData.append("network_resources", JSON.stringify(network));
      }

      const socialMedia = {
        twitter: investorForm.social_twitter.trim(),
        facebook: investorForm.social_facebook.trim(),
        instagram: investorForm.social_instagram.trim(),
      };
      if (Object.values(socialMedia).some(Boolean)) {
        formData.append("social_media", JSON.stringify(socialMedia));
      }

      if (imageFile) {
        formData.append("photo", imageFile);
      }

      const result = await investorProfileService.updateProfile(
        profileId,
        formData,
      );
      setSaving(false);

      if (!result.success) {
        setError(result.error || "Failed to update profile");
        return;
      }
    } else {
      if (!startupForm.company_name.trim()) {
        setSaving(false);
        setError("Company name is required");
        return;
      }

      formData.append("company_name", startupForm.company_name.trim());
      formData.append("tagline", startupForm.tagline.trim());
      formData.append("description", startupForm.description.trim());
      formData.append("industry", startupForm.industry.trim());
      formData.append("stage", startupForm.stage.trim());
      formData.append("website", startupForm.website.trim());
      formData.append("linkedin", startupForm.linkedin.trim());
      formData.append("city", startupForm.city.trim());
      formData.append("country", startupForm.country.trim());
      formData.append("contact_email", startupForm.contact_email.trim());
      formData.append("contact_phone", startupForm.contact_phone.trim());

      const founders = csvToArray(startupForm.founders_csv);
      const team = csvToArray(startupForm.team_csv);
      const achievements = csvToArray(startupForm.achievements_csv);
      const milestones = csvToArray(startupForm.milestones_csv);

      if (founders.length) {
        formData.append("founders", JSON.stringify(founders));
      }
      if (team.length) {
        formData.append("team", JSON.stringify(team));
      }

      const funding = {
        stage: startupForm.stage.trim(),
        amount_seeking: startupForm.funding_amount.trim(),
        previous_funding: startupForm.previous_funding.trim(),
        use_of_funds: startupForm.use_of_funds.trim(),
      };
      if (Object.values(funding).some(Boolean)) {
        formData.append("funding", JSON.stringify(funding));
      }

      const traction = {
        metrics: startupForm.traction_metrics.trim(),
        achievements,
        milestones,
      };
      if (
        traction.metrics ||
        traction.achievements.length ||
        traction.milestones.length
      ) {
        formData.append("traction", JSON.stringify(traction));
      }

      const socialMedia = {
        twitter: startupForm.social_twitter.trim(),
        facebook: startupForm.social_facebook.trim(),
        instagram: startupForm.social_instagram.trim(),
      };
      if (Object.values(socialMedia).some(Boolean)) {
        formData.append("social_media", JSON.stringify(socialMedia));
      }

      if (imageFile) {
        formData.append("logo", imageFile);
      }

      const result = await profileService.updateProfile(profileId, formData);
      setSaving(false);

      if (!result.success) {
        setError(result.error || "Failed to update profile");
        return;
      }
    }

    setSuccess("Profile updated successfully.");
    setImageFile(null);
    setTimeout(() => navigate("/profile"), 700);
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
            Update your profile details and your{" "}
            {isInvestor ? "photo" : "company logo"}.
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

          <div className="rounded-xl border border-white/10 bg-black/20 p-4 flex flex-col md:flex-row md:items-center gap-4">
            <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20 bg-white/5 flex items-center justify-center">
              {shownImage ? (
                <img
                  src={shownImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-400">No Image</span>
              )}
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-200 block mb-2">
                {isInvestor ? "Update profile photo" : "Update company logo"}
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) =>
                  setImageFile(event.target.files?.[0] || null)
                }
                className="w-full text-sm text-gray-200 file:mr-3 file:rounded-md file:border-0 file:bg-purple-600/70 file:px-3 file:py-2 file:text-white"
              />
            </div>
          </div>

          {isInvestor ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                value={investorForm.name}
                onChange={(e) =>
                  setInvestorForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Name"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
                required
              />
              <input
                value={investorForm.firm_name}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    firm_name: e.target.value,
                  }))
                }
                placeholder="Firm name"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
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
                value={investorForm.website}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                placeholder="Website"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.linkedin}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    linkedin: e.target.value,
                  }))
                }
                placeholder="LinkedIn"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.city}
                onChange={(e) =>
                  setInvestorForm((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="City"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.country}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    country: e.target.value,
                  }))
                }
                placeholder="Country"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="email"
                value={investorForm.contact_email}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    contact_email: e.target.value,
                  }))
                }
                placeholder="Contact email"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.contact_phone}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    contact_phone: e.target.value,
                  }))
                }
                placeholder="Contact phone"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={investorForm.investment_size_min}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    investment_size_min: e.target.value,
                  }))
                }
                placeholder="Min investment size"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="number"
                min="0"
                value={investorForm.investment_size_max}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    investment_size_max: e.target.value,
                  }))
                }
                placeholder="Max investment size"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.industries_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    industries_csv: e.target.value,
                  }))
                }
                placeholder="Industries (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.investment_stage_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    investment_stage_csv: e.target.value,
                  }))
                }
                placeholder="Investment stages (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.geography_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    geography_csv: e.target.value,
                  }))
                }
                placeholder="Geography focus (comma-separated)"
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
              <input
                value={investorForm.portfolio_companies_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    portfolio_companies_csv: e.target.value,
                  }))
                }
                placeholder="Portfolio companies (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.notable_exits_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    notable_exits_csv: e.target.value,
                  }))
                }
                placeholder="Notable exits (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.network_resources_csv}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    network_resources_csv: e.target.value,
                  }))
                }
                placeholder="Network resources (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={investorForm.background}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    background: e.target.value,
                  }))
                }
                placeholder="Background"
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
                rows={4}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.social_twitter}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    social_twitter: e.target.value,
                  }))
                }
                placeholder="Twitter URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.social_facebook}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    social_facebook: e.target.value,
                  }))
                }
                placeholder="Facebook URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={investorForm.social_instagram}
                onChange={(e) =>
                  setInvestorForm((prev) => ({
                    ...prev,
                    social_instagram: e.target.value,
                  }))
                }
                placeholder="Instagram URL"
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
              <label className="rounded-lg bg-black/30 border border-white/15 px-3 py-2 text-gray-200 flex items-center justify-between">
                <span>Actively investing</span>
                <input
                  type="checkbox"
                  checked={investorForm.is_actively_investing}
                  onChange={(e) =>
                    setInvestorForm((prev) => ({
                      ...prev,
                      is_actively_investing: e.target.checked,
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
                value={startupForm.stage}
                onChange={(e) =>
                  setStartupForm((prev) => ({ ...prev, stage: e.target.value }))
                }
                placeholder="Funding stage"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.website}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    website: e.target.value,
                  }))
                }
                placeholder="Website"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.linkedin}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    linkedin: e.target.value,
                  }))
                }
                placeholder="LinkedIn"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.city}
                onChange={(e) =>
                  setStartupForm((prev) => ({ ...prev, city: e.target.value }))
                }
                placeholder="City"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.country}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    country: e.target.value,
                  }))
                }
                placeholder="Country"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                type="email"
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
                value={startupForm.contact_phone}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    contact_phone: e.target.value,
                  }))
                }
                placeholder="Contact phone"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.founders_csv}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    founders_csv: e.target.value,
                  }))
                }
                placeholder="Founders (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.team_csv}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    team_csv: e.target.value,
                  }))
                }
                placeholder="Team members (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.funding_amount}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    funding_amount: e.target.value,
                  }))
                }
                placeholder="Funding amount seeking"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
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
                value={startupForm.traction_metrics}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    traction_metrics: e.target.value,
                  }))
                }
                placeholder="Traction metrics"
                rows={3}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.achievements_csv}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    achievements_csv: e.target.value,
                  }))
                }
                placeholder="Achievements (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.milestones_csv}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    milestones_csv: e.target.value,
                  }))
                }
                placeholder="Milestones (comma-separated)"
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <input
                value={startupForm.social_twitter}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    social_twitter: e.target.value,
                  }))
                }
                placeholder="Twitter URL"
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
                placeholder="Facebook URL"
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
                placeholder="Instagram URL"
                className="rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
              <textarea
                value={startupForm.description}
                onChange={(e) =>
                  setStartupForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                placeholder="Company description"
                rows={4}
                className="md:col-span-2 rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white"
              />
            </div>
          )}

          {!isInvestor && (
            <div className="rounded-xl border border-white/10 bg-black/20 p-4 space-y-3">
              <h3 className="text-white font-medium">Documents</h3>

              <div className="space-y-2">
                {documents.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No documents uploaded.
                  </p>
                ) : (
                  documents.map((doc, index) => (
                    <div
                      key={`${doc.url || doc.name}-${index}`}
                      className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 rounded-lg border border-white/10 px-3 py-2"
                    >
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-blue-300 hover:text-blue-200 break-all"
                      >
                        {doc.name || `Document ${index + 1}`}
                      </a>
                      <button
                        type="button"
                        onClick={() => deleteDocument(index)}
                        disabled={
                          docAction === `delete-${index}` || !!docAction
                        }
                        className="text-rose-200 hover:text-rose-100 text-sm inline-flex items-center gap-2"
                      >
                        {docAction === `delete-${index}` ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                        Remove
                      </button>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-lg border border-white/10 p-3 space-y-3">
                <input
                  type="file"
                  multiple
                  onChange={(event) =>
                    setNewDocuments(Array.from(event.target.files || []))
                  }
                  className="w-full text-sm text-gray-200 file:mr-3 file:rounded-md file:border-0 file:bg-purple-600/70 file:px-3 file:py-2 file:text-white"
                />
                {newDocuments.length > 0 && (
                  <p className="text-xs text-gray-300">
                    {newDocuments.length} file(s) selected
                  </p>
                )}
                <button
                  type="button"
                  onClick={uploadNewDocuments}
                  disabled={!newDocuments.length || !!docAction}
                  className="px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white hover:bg-white/15 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {docAction === "upload" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  Upload Selected Documents
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="px-4 py-2 rounded-lg border border-white/20 text-gray-100 hover:bg-white/10"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
