import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, User } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useProfileData } from "../hooks/useProfileCache";
import profileService from "../services/profileService";
import investorProfileService from "../services/investorProfileService";

/* ─── helpers ──────────────────────────────────────────────────────────────── */
const parseJson = (value, fallback) => {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const toCsv = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) return value.join(", ");
  try { const p = JSON.parse(value); return Array.isArray(p) ? p.join(", ") : value; } catch { return value; }
};

const csvToArray = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

const appendIfPresent = (fd, key, value) => {
  if (value == null) return;
  if (typeof value === "string" && value.trim() === "") return;
  if (typeof value === "number" && isNaN(value)) return;
  fd.append(key, typeof value === "boolean" ? String(value) : value);
};

/* ─── shared section wrapper ────────────────────────────────────────────────── */
const Section = ({ title, children }) => (
  <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
    <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest pb-1 border-b border-white/5">{title}</h2>
    {children}
  </div>
);

/* ─── shared field wrapper ─────────────────────────────────────────────────── */
const Field = ({ label, required, hint, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-400 mb-1.5">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
      {hint && <span className="text-gray-600 ml-2 font-normal">{hint}</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2.5 rounded-lg bg-black/40 border border-white/15 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-purple-500/60 transition-all";
const textareaCls = `${inputCls} resize-none`;

/* ─── image uploader ────────────────────────────────────────────────────────── */
const ImageUploader = ({ currentUrl, preview, onFile, label }) => {
  const ref = useRef();
  return (
    <div className="flex items-center gap-4">
      <div className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 bg-white/5 overflow-hidden flex items-center justify-center shrink-0">
        {preview || currentUrl
          ? <img src={preview || currentUrl} alt="preview" className="w-full h-full object-cover" />
          : <User className="w-8 h-8 text-gray-600" />}
      </div>
      <div>
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-all"
        >
          <Upload className="w-4 h-4" />
          {preview || currentUrl ? "Change Image" : `Upload ${label}`}
        </button>
        <p className="text-xs text-gray-600 mt-1">PNG, JPG — max 2 MB</p>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] || null)} />
      </div>
    </div>
  );
};

/* ─── constants ─────────────────────────────────────────────────────────────── */
const INDUSTRIES = ["FinTech","HealthTech","E-Commerce","SaaS","EdTech","AgriTech","AI/ML","Blockchain","IoT","Cybersecurity","CleanTech","FoodTech","PropTech","Logistics","Other"];
const STAGES = [{ value:"IDEA",label:"Idea"},{ value:"MVP",label:"MVP"},{ value:"EARLY_REVENUE",label:"Early Revenue"},{ value:"GROWTH",label:"Growth"},{ value:"SCALING",label:"Scaling"}];
const FUNDING_STAGES = [{ value:"PRE_SEED",label:"Pre-Seed"},{ value:"SEED",label:"Seed"},{ value:"SERIES_A",label:"Series A"},{ value:"SERIES_B",label:"Series B"},{ value:"SERIES_C",label:"Series C"},{ value:"SERIES_D_PLUS",label:"Series D+"}];
const REVENUE_STATUSES = [{ value:"PRE_REVENUE",label:"Pre-Revenue"},{ value:"REVENUE_GENERATING",label:"Revenue Generating"},{ value:"PROFITABLE",label:"Profitable"}];
const INVESTOR_TYPES = [{ value:"ANGEL",label:"Angel"},{ value:"VC_FIRM",label:"VC Firm"},{ value:"CORPORATE_VC",label:"Corporate VC"},{ value:"FAMILY_OFFICE",label:"Family Office"},{ value:"ACCELERATOR",label:"Accelerator"},{ value:"INCUBATOR",label:"Incubator"},{ value:"PRIVATE_EQUITY",label:"Private Equity"}];
const CONTACT_METHODS = ["Email","Phone","LinkedIn","WhatsApp","Other"];

/* ═══════════════════════════════════════════════════════════════════════════ */
const EditProfilePage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isInvestor = user?.userType === "investor";

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [profileId, setProfileId] = useState(null);

  /* ── startup form ── */
  const [sf, setSf] = useState({
    company_name: "", tagline: "", detailed_description: "",
    industry: "", founded_date: "", current_stage: "", team_size: "",
    founder_names: "", key_team_members: "", funding_stage: "",
    amount_seeking: "", previous_funding: "", use_of_funds: "",
    revenue_status: "", key_metrics: "", major_achievements: "",
    customer_testimonials: "", pitch_deck_url: "", business_plan_url: "",
    product_demo_url: "", primary_contact_name: "", contact_email: "",
    phone_number: "", location_country: "", location_city: "",
    website_url: "", social_linkedin: "", social_twitter: "",
    social_facebook: "", social_instagram: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState(null);

  /* ── investor form ── */
  const [inv, setInv] = useState({
    name_or_firm: "", investor_type: "", years_of_experience: "",
    professional_background: "", investment_thesis: "",
    industries_of_interest_csv: "", geographic_preference_csv: "",
    stage_preference_csv: "", min_investment_size: "", max_investment_size: "",
    investment_structure_csv: "", follow_on_investment: false,
    investment_timeline: "", number_of_investments: "", portfolio_companies: "",
    successful_exits: "", notable_achievements: "", what_you_look_for: "",
    deal_breakers: "", value_add: "", network_resources: "",
    primary_contact_email: "", phone_number: "", preferred_contact_method: "",
    social_linkedin: "", social_twitter: "", social_website: "",
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [currentPhotoUrl, setCurrentPhotoUrl] = useState(null);

  const {
    profile: cachedProfile,
    isReady,
    error: profileError,
    invalidate: invalidateProfileData,
  } = useProfileData();

  useEffect(() => {
    if (!isReady) return;
    if (profileError) {
      setError(profileError);
      setLoading(false);
      return;
    }
    const p = cachedProfile;
    if (!p) {
      setError("Profile not found.");
      setLoading(false);
      return;
    }

    const id = p.investor_profile_id || p.startup_profile_id || p.id;
    if (!id) {
      setError("Profile ID not found.");
      setLoading(false);
      return;
    }
    setProfileId(id);
    // The remainder of this effect populates the local form state from `p`.
    // It runs once per (isReady, isInvestor) transition; the cache itself is
    // stable so this is not a re-render loop.

      if (isInvestor) {
        const social = parseJson(p.social_media, {});
        setCurrentPhotoUrl(p.photo_url || null);
        setInv({
          name_or_firm: p.name_or_firm || p.name || p.firm_name || "",
          investor_type: p.investor_type || "",
          years_of_experience: p.years_of_experience || "",
          professional_background: p.professional_background || "",
          investment_thesis: p.investment_thesis || "",
          industries_of_interest_csv: toCsv(p.industries_of_interest || p.industries),
          geographic_preference_csv: toCsv(p.geographic_preference || p.geography),
          stage_preference_csv: toCsv(p.stage_preference || p.investment_stage),
          min_investment_size: p.min_investment_size || "",
          max_investment_size: p.max_investment_size || "",
          investment_structure_csv: toCsv(p.investment_structure),
          follow_on_investment: Boolean(p.follow_on_investment),
          investment_timeline: p.investment_timeline || "",
          number_of_investments: p.number_of_investments || "",
          portfolio_companies: Array.isArray(p.portfolio_companies) ? p.portfolio_companies.join(", ") : p.portfolio_companies || "",
          successful_exits: p.successful_exits || "",
          notable_achievements: p.notable_achievements || "",
          what_you_look_for: p.what_you_look_for || "",
          deal_breakers: p.deal_breakers || "",
          value_add: p.value_add || "",
          network_resources: Array.isArray(p.network_resources) ? p.network_resources.join(", ") : p.network_resources || "",
          primary_contact_email: p.primary_contact_email || p.contact_email || "",
          phone_number: p.phone_number || "",
          preferred_contact_method: p.preferred_contact_method || "",
          social_linkedin: social.linkedin || "",
          social_twitter: social.twitter || "",
          social_website: social.website || "",
        });
      } else {
        const social = parseJson(p.social_media_links || p.social_media, {});
        const founders = parseJson(p.founder_names, null);
        const founderStr = Array.isArray(founders) ? founders.join(", ") : founders || p.founder_names || "";
        setCurrentLogoUrl(p.logo_url || null);
        setSf({
          company_name: p.company_name || "",
          tagline: p.tagline || "",
          detailed_description: p.detailed_description || p.description || "",
          industry: p.industry || "",
          founded_date: p.founded_date ? p.founded_date.split("T")[0] : "",
          current_stage: p.current_stage || "",
          team_size: p.team_size || "",
          founder_names: founderStr,
          key_team_members: p.key_team_members || "",
          funding_stage: p.funding_stage || p.stage || "",
          amount_seeking: p.amount_seeking || "",
          previous_funding: p.previous_funding || "",
          use_of_funds: p.use_of_funds || "",
          revenue_status: p.revenue_status || "",
          key_metrics: p.key_metrics || "",
          major_achievements: p.major_achievements || "",
          customer_testimonials: p.customer_testimonials || "",
          pitch_deck_url: p.pitch_deck_url || "",
          business_plan_url: p.business_plan_url || "",
          product_demo_url: p.product_demo_url || "",
          primary_contact_name: p.primary_contact_name || "",
          contact_email: p.contact_email || "",
          phone_number: p.phone_number || "",
          location_country: p.location_country || "",
          location_city: p.location_city || "",
          website_url: p.website_url || "",
          social_linkedin: social.linkedin || "",
          social_twitter: social.twitter || "",
          social_facebook: social.facebook || "",
          social_instagram: social.instagram || "",
        });
      }
      setLoading(false);
  }, [isReady, isInvestor, cachedProfile, profileError]);

  const handleLogoChange = (file) => {
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handlePhotoChange = (file) => {
    setPhotoFile(file);
    setPhotoPreview(file ? URL.createObjectURL(file) : null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!profileId) return;
    setSaving(true); setError(""); setSuccess("");

    try {
      const fd = new FormData();

      if (isInvestor) {
        if (!inv.name_or_firm.trim()) { setError("Name or firm is required"); setSaving(false); return; }
        if (photoFile) fd.append("photo", photoFile);
        appendIfPresent(fd, "name_or_firm", inv.name_or_firm);
        appendIfPresent(fd, "investor_type", inv.investor_type);
        appendIfPresent(fd, "years_of_experience", inv.years_of_experience);
        appendIfPresent(fd, "professional_background", inv.professional_background);
        appendIfPresent(fd, "investment_thesis", inv.investment_thesis);
        appendIfPresent(fd, "min_investment_size", inv.min_investment_size);
        appendIfPresent(fd, "max_investment_size", inv.max_investment_size);
        appendIfPresent(fd, "investment_timeline", inv.investment_timeline);
        appendIfPresent(fd, "number_of_investments", inv.number_of_investments);
        appendIfPresent(fd, "portfolio_companies", inv.portfolio_companies);
        appendIfPresent(fd, "successful_exits", inv.successful_exits);
        appendIfPresent(fd, "notable_achievements", inv.notable_achievements);
        appendIfPresent(fd, "what_you_look_for", inv.what_you_look_for);
        appendIfPresent(fd, "deal_breakers", inv.deal_breakers);
        appendIfPresent(fd, "value_add", inv.value_add);
        appendIfPresent(fd, "network_resources", inv.network_resources);
        appendIfPresent(fd, "primary_contact_email", inv.primary_contact_email);
        appendIfPresent(fd, "phone_number", inv.phone_number);
        appendIfPresent(fd, "preferred_contact_method", inv.preferred_contact_method);
        appendIfPresent(fd, "follow_on_investment", inv.follow_on_investment);

        const industries = csvToArray(inv.industries_of_interest_csv);
        const geos = csvToArray(inv.geographic_preference_csv);
        const stagePrefs = csvToArray(inv.stage_preference_csv);
        const structures = csvToArray(inv.investment_structure_csv);
        if (industries.length) fd.append("industries_of_interest", JSON.stringify(industries));
        if (geos.length) fd.append("geographic_preference", JSON.stringify(geos));
        if (stagePrefs.length) fd.append("stage_preference", JSON.stringify(stagePrefs));
        if (structures.length) fd.append("investment_structure", JSON.stringify(structures));

        const social = { linkedin: inv.social_linkedin.trim(), twitter: inv.social_twitter.trim(), website: inv.social_website.trim() };
        if (Object.values(social).some(Boolean)) fd.append("social_media", JSON.stringify(social));

        const result = await investorProfileService.updateProfile(profileId, fd);
        if (!result.success) { setError(result.error || "Failed to update"); setSaving(false); return; }
        invalidateProfileData();
      } else {
        if (!sf.company_name.trim()) { setError("Company name is required"); setSaving(false); return; }
        if (logoFile) fd.append("logo", logoFile);
        appendIfPresent(fd, "company_name", sf.company_name);
        appendIfPresent(fd, "tagline", sf.tagline);
        appendIfPresent(fd, "detailed_description", sf.detailed_description);
        appendIfPresent(fd, "industry", sf.industry);
        appendIfPresent(fd, "founded_date", sf.founded_date);
        appendIfPresent(fd, "current_stage", sf.current_stage);
        appendIfPresent(fd, "team_size", sf.team_size);
        appendIfPresent(fd, "funding_stage", sf.funding_stage);
        appendIfPresent(fd, "amount_seeking", sf.amount_seeking);
        appendIfPresent(fd, "previous_funding", sf.previous_funding);
        appendIfPresent(fd, "use_of_funds", sf.use_of_funds);
        appendIfPresent(fd, "revenue_status", sf.revenue_status);
        appendIfPresent(fd, "key_metrics", sf.key_metrics);
        appendIfPresent(fd, "major_achievements", sf.major_achievements);
        appendIfPresent(fd, "customer_testimonials", sf.customer_testimonials);
        appendIfPresent(fd, "pitch_deck_url", sf.pitch_deck_url);
        appendIfPresent(fd, "business_plan_url", sf.business_plan_url);
        appendIfPresent(fd, "product_demo_url", sf.product_demo_url);
        appendIfPresent(fd, "primary_contact_name", sf.primary_contact_name);
        appendIfPresent(fd, "contact_email", sf.contact_email);
        appendIfPresent(fd, "phone_number", sf.phone_number);
        appendIfPresent(fd, "location_country", sf.location_country);
        appendIfPresent(fd, "location_city", sf.location_city);
        appendIfPresent(fd, "website_url", sf.website_url);
        appendIfPresent(fd, "key_team_members", sf.key_team_members);

        const founders = csvToArray(sf.founder_names);
        if (founders.length) fd.append("founder_names", JSON.stringify(founders));

        const social = { linkedin: sf.social_linkedin.trim(), twitter: sf.social_twitter.trim(), facebook: sf.social_facebook.trim(), instagram: sf.social_instagram.trim() };
        if (Object.values(social).some(Boolean)) fd.append("social_media_links", JSON.stringify(social));

        const result = await profileService.updateProfile(profileId, fd);
        if (!result.success) { setError(result.error || "Failed to update"); setSaving(false); return; }
        invalidateProfileData();
      }

      setSuccess("Profile updated successfully.");
      setSaving(false);
      setTimeout(() => navigate("/profile"), 700);
    } catch {
      setError("An unexpected error occurred.");
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin" />
    </div>
  );

  const sf2 = (key) => (e) => setSf((p) => ({ ...p, [key]: e.target.value }));
  const inv2 = (key) => (e) => setInv((p) => ({ ...p, [key]: e.target.value }));

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="rounded-xl border border-white/15 bg-black/45 p-6">
          <h1 className="text-2xl font-bold text-white">Edit Profile</h1>
          <p className="text-gray-400 text-sm mt-1">Update your {isInvestor ? "investor" : "startup"} profile information.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-rose-100 text-sm">{error}</div>}
          {success && <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-emerald-100 text-sm">{success}</div>}

          {isInvestor ? (
            <>
              <Section title="Profile Photo">
                <ImageUploader
                  currentUrl={currentPhotoUrl}
                  preview={photoPreview}
                  onFile={handlePhotoChange}
                  label="Photo"
                />
              </Section>

              <Section title="Identity">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Name / Firm" required>
                    <input value={inv.name_or_firm} onChange={inv2("name_or_firm")} placeholder="e.g., Sequoia Capital" className={inputCls} required />
                  </Field>
                  <Field label="Investor Type">
                    <select value={inv.investor_type} onChange={inv2("investor_type")} className={inputCls}>
                      <option value="" className="bg-gray-900">Select type</option>
                      {INVESTOR_TYPES.map((t) => <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Years of Experience">
                    <input type="number" min="0" value={inv.years_of_experience} onChange={inv2("years_of_experience")} placeholder="e.g., 8" className={inputCls} />
                  </Field>
                  <Field label="Investment Timeline">
                    <input value={inv.investment_timeline} onChange={inv2("investment_timeline")} placeholder="e.g., 3–5 years" className={inputCls} />
                  </Field>
                </div>
                <Field label="Professional Background">
                  <textarea rows={3} value={inv.professional_background} onChange={inv2("professional_background")} placeholder="Your career and investment history..." className={textareaCls} />
                </Field>
              </Section>

              <Section title="Investment Focus">
                <Field label="Investment Thesis">
                  <textarea rows={3} value={inv.investment_thesis} onChange={inv2("investment_thesis")} placeholder="What thesis guides your investments..." className={textareaCls} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Industries of Interest" hint="comma-separated">
                    <input value={inv.industries_of_interest_csv} onChange={inv2("industries_of_interest_csv")} placeholder="FinTech, HealthTech, SaaS" className={inputCls} />
                  </Field>
                  <Field label="Geographic Preference" hint="comma-separated">
                    <input value={inv.geographic_preference_csv} onChange={inv2("geographic_preference_csv")} placeholder="USA, Europe, Southeast Asia" className={inputCls} />
                  </Field>
                  <Field label="Stage Preference" hint="comma-separated">
                    <input value={inv.stage_preference_csv} onChange={inv2("stage_preference_csv")} placeholder="Seed, Series A" className={inputCls} />
                  </Field>
                  <Field label="Investment Structure" hint="comma-separated">
                    <input value={inv.investment_structure_csv} onChange={inv2("investment_structure_csv")} placeholder="Equity, Convertible Note" className={inputCls} />
                  </Field>
                  <Field label="Min Check Size (USD)">
                    <input type="number" min="0" value={inv.min_investment_size} onChange={inv2("min_investment_size")} placeholder="e.g., 50000" className={inputCls} />
                  </Field>
                  <Field label="Max Check Size (USD)">
                    <input type="number" min="0" value={inv.max_investment_size} onChange={inv2("max_investment_size")} placeholder="e.g., 500000" className={inputCls} />
                  </Field>
                </div>
                <Field label="Follow-On Investment">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={inv.follow_on_investment}
                      onChange={(e) => setInv((p) => ({ ...p, follow_on_investment: e.target.checked }))}
                      className="w-4 h-4 accent-purple-500"
                    />
                    <span className="text-sm text-gray-300">I make follow-on investments</span>
                  </label>
                </Field>
              </Section>

              <Section title="Criteria & Value">
                <Field label="What I Look For">
                  <textarea rows={3} value={inv.what_you_look_for} onChange={inv2("what_you_look_for")} placeholder="Traits and signals you seek in deals..." className={textareaCls} />
                </Field>
                <Field label="Value Add">
                  <textarea rows={3} value={inv.value_add} onChange={inv2("value_add")} placeholder="How you help portfolio companies beyond capital..." className={textareaCls} />
                </Field>
                <Field label="Deal Breakers">
                  <textarea rows={2} value={inv.deal_breakers} onChange={inv2("deal_breakers")} placeholder="Things that disqualify a deal for you..." className={textareaCls} />
                </Field>
                <Field label="Network & Resources">
                  <textarea rows={2} value={inv.network_resources} onChange={inv2("network_resources")} placeholder="Networks, advisors or resources you bring..." className={textareaCls} />
                </Field>
              </Section>

              <Section title="Portfolio">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Number of Investments">
                    <input type="number" min="0" value={inv.number_of_investments} onChange={inv2("number_of_investments")} placeholder="e.g., 12" className={inputCls} />
                  </Field>
                  <Field label="Successful Exits">
                    <input value={inv.successful_exits} onChange={inv2("successful_exits")} placeholder="e.g., 3 exits including Acme Corp" className={inputCls} />
                  </Field>
                  <Field label="Portfolio Companies">
                    <textarea rows={2} value={inv.portfolio_companies} onChange={inv2("portfolio_companies")} placeholder="List your portfolio companies..." className={textareaCls} />
                  </Field>
                  <Field label="Notable Achievements">
                    <textarea rows={2} value={inv.notable_achievements} onChange={inv2("notable_achievements")} placeholder="Awards, press, milestones..." className={textareaCls} />
                  </Field>
                </div>
              </Section>

              <Section title="Contact">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Contact Email">
                    <input type="email" value={inv.primary_contact_email} onChange={inv2("primary_contact_email")} placeholder="you@firm.com" className={inputCls} />
                  </Field>
                  <Field label="Phone Number">
                    <input type="tel" value={inv.phone_number} onChange={inv2("phone_number")} placeholder="+1 555 000 0000" className={inputCls} />
                  </Field>
                  <Field label="Preferred Contact Method">
                    <select value={inv.preferred_contact_method} onChange={inv2("preferred_contact_method")} className={inputCls}>
                      <option value="" className="bg-gray-900">Select method</option>
                      {CONTACT_METHODS.map((m) => <option key={m} value={m} className="bg-gray-900">{m}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="LinkedIn URL">
                    <input type="url" value={inv.social_linkedin} onChange={inv2("social_linkedin")} placeholder="https://linkedin.com/in/..." className={inputCls} />
                  </Field>
                  <Field label="Twitter / X URL">
                    <input type="url" value={inv.social_twitter} onChange={inv2("social_twitter")} placeholder="https://x.com/..." className={inputCls} />
                  </Field>
                  <Field label="Website URL">
                    <input type="url" value={inv.social_website} onChange={inv2("social_website")} placeholder="https://yourfirm.com" className={inputCls} />
                  </Field>
                </div>
              </Section>
            </>
          ) : (
            <>
              <Section title="Company Logo">
                <ImageUploader
                  currentUrl={currentLogoUrl}
                  preview={logoPreview}
                  onFile={handleLogoChange}
                  label="Logo"
                />
              </Section>

              <Section title="Company Identity">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Company Name" required>
                    <input value={sf.company_name} onChange={sf2("company_name")} placeholder="e.g., Acme Technologies" className={inputCls} required />
                  </Field>
                  <Field label="Tagline">
                    <input value={sf.tagline} onChange={sf2("tagline")} placeholder="A punchy one-liner..." className={inputCls} />
                  </Field>
                </div>
                <Field label="Detailed Description">
                  <textarea rows={4} value={sf.detailed_description} onChange={sf2("detailed_description")} placeholder="Describe the problem, solution, and traction..." className={textareaCls} />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Industry">
                    <select value={sf.industry} onChange={sf2("industry")} className={inputCls}>
                      <option value="" className="bg-gray-900">Select industry</option>
                      {INDUSTRIES.map((i) => <option key={i} value={i} className="bg-gray-900">{i}</option>)}
                    </select>
                  </Field>
                  <Field label="Founded Date">
                    <input type="date" value={sf.founded_date} max={new Date().toISOString().split("T")[0]} onChange={sf2("founded_date")} className={inputCls} />
                  </Field>
                  <Field label="Current Stage">
                    <select value={sf.current_stage} onChange={sf2("current_stage")} className={inputCls}>
                      <option value="" className="bg-gray-900">Select stage</option>
                      {STAGES.map((s) => <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Team Size">
                    <input type="number" min="1" value={sf.team_size} onChange={sf2("team_size")} placeholder="e.g., 8" className={inputCls} />
                  </Field>
                </div>
                <Field label="Founder Names" hint="comma-separated">
                  <input value={sf.founder_names} onChange={sf2("founder_names")} placeholder="Jane Doe, John Smith" className={inputCls} />
                </Field>
                <Field label="Key Team Members">
                  <textarea rows={3} value={sf.key_team_members} onChange={sf2("key_team_members")} placeholder="CTO: 10 yrs ML at Google..." className={textareaCls} />
                </Field>
              </Section>

              <Section title="Traction">
                <Field label="Key Metrics">
                  <textarea rows={3} value={sf.key_metrics} onChange={sf2("key_metrics")} placeholder="$12k MRR, 2,400 active users..." className={textareaCls} />
                </Field>
                <Field label="Major Achievements">
                  <textarea rows={3} value={sf.major_achievements} onChange={sf2("major_achievements")} placeholder="Awards, partnerships, notable press..." className={textareaCls} />
                </Field>
                <Field label="Customer Testimonials">
                  <textarea rows={3} value={sf.customer_testimonials} onChange={sf2("customer_testimonials")} placeholder="Short quotes or summaries..." className={textareaCls} />
                </Field>
              </Section>

              <Section title="Funding">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Funding Stage">
                    <select value={sf.funding_stage} onChange={sf2("funding_stage")} className={inputCls}>
                      <option value="" className="bg-gray-900">Select stage</option>
                      {FUNDING_STAGES.map((s) => <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Revenue Status">
                    <select value={sf.revenue_status} onChange={sf2("revenue_status")} className={inputCls}>
                      <option value="" className="bg-gray-900">Select status</option>
                      {REVENUE_STATUSES.map((s) => <option key={s.value} value={s.value} className="bg-gray-900">{s.label}</option>)}
                    </select>
                  </Field>
                  <Field label="Amount Seeking (USD)">
                    <input type="number" min="0" value={sf.amount_seeking} onChange={sf2("amount_seeking")} placeholder="e.g., 500000" className={inputCls} />
                  </Field>
                  <Field label="Previous Funding (USD)">
                    <input type="number" min="0" value={sf.previous_funding} onChange={sf2("previous_funding")} placeholder="e.g., 0" className={inputCls} />
                  </Field>
                </div>
                <Field label="Use of Funds">
                  <textarea rows={3} value={sf.use_of_funds} onChange={sf2("use_of_funds")} placeholder="40% product, 35% hiring, 25% marketing..." className={textareaCls} />
                </Field>
              </Section>

              <Section title="Investor Materials">
                <div className="grid grid-cols-1 gap-4">
                  <Field label="Pitch Deck URL">
                    <input type="url" value={sf.pitch_deck_url} onChange={sf2("pitch_deck_url")} placeholder="https://drive.google.com/..." className={inputCls} />
                  </Field>
                  <Field label="Business Plan URL">
                    <input type="url" value={sf.business_plan_url} onChange={sf2("business_plan_url")} placeholder="https://..." className={inputCls} />
                  </Field>
                  <Field label="Product Demo URL">
                    <input type="url" value={sf.product_demo_url} onChange={sf2("product_demo_url")} placeholder="https://loom.com/..." className={inputCls} />
                  </Field>
                </div>
              </Section>

              <Section title="Contact">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Primary Contact Name">
                    <input value={sf.primary_contact_name} onChange={sf2("primary_contact_name")} placeholder="Full name" className={inputCls} />
                  </Field>
                  <Field label="Contact Email">
                    <input type="email" value={sf.contact_email} onChange={sf2("contact_email")} placeholder="contact@company.com" className={inputCls} />
                  </Field>
                  <Field label="Phone Number">
                    <input type="tel" value={sf.phone_number} onChange={sf2("phone_number")} placeholder="+1 555 000 0000" className={inputCls} />
                  </Field>
                  <Field label="Country">
                    <input value={sf.location_country} onChange={sf2("location_country")} placeholder="e.g., United States" className={inputCls} />
                  </Field>
                  <Field label="City">
                    <input value={sf.location_city} onChange={sf2("location_city")} placeholder="e.g., San Francisco" className={inputCls} />
                  </Field>
                  <Field label="Website URL">
                    <input type="url" value={sf.website_url} onChange={sf2("website_url")} placeholder="https://yourcompany.com" className={inputCls} />
                  </Field>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="LinkedIn URL">
                    <input type="url" value={sf.social_linkedin} onChange={sf2("social_linkedin")} placeholder="https://linkedin.com/company/..." className={inputCls} />
                  </Field>
                  <Field label="Twitter / X URL">
                    <input type="url" value={sf.social_twitter} onChange={sf2("social_twitter")} placeholder="https://x.com/..." className={inputCls} />
                  </Field>
                  <Field label="Facebook URL">
                    <input type="url" value={sf.social_facebook} onChange={sf2("social_facebook")} placeholder="https://facebook.com/..." className={inputCls} />
                  </Field>
                  <Field label="Instagram URL">
                    <input type="url" value={sf.social_instagram} onChange={sf2("social_instagram")} placeholder="https://instagram.com/..." className={inputCls} />
                  </Field>
                </div>
              </Section>
            </>
          )}

          <div className="flex justify-end gap-3 pb-4">
            <button
              type="button"
              onClick={() => navigate("/profile")}
              className="px-5 py-2.5 rounded-lg border border-white/15 text-gray-300 text-sm hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfilePage;
