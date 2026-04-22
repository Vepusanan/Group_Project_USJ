import React, { useEffect, useState, useCallback } from "react";
import {
  AlertCircle, CheckCircle2, Loader2, Monitor, Smartphone,
  LogOut, Shield, User, Bell, Eye, Settings2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiService } from "../services/apiService";
import { profileService } from "../services/profileService";
import { investorProfileService } from "../services/investorProfileService";
import { useAuth } from "../hooks/useAuth";

// ─── constants ───────────────────────────────────────────────────────────────

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh",
  "Belgium","Brazil","Canada","Chile","China","Colombia","Czech Republic","Denmark",
  "Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","Hungary","India",
  "Indonesia","Iran","Iraq","Ireland","Israel","Italy","Japan","Jordan","Kenya",
  "Malaysia","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway",
  "Pakistan","Peru","Philippines","Poland","Portugal","Romania","Russia","Saudi Arabia",
  "Singapore","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland",
  "Tanzania","Thailand","Turkey","Uganda","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Vietnam","Zimbabwe",
];

const INVESTOR_TYPES = ["ANGEL","VC","CORPORATE","FAMILY_OFFICE","ACCELERATOR","OTHER"];

const INDUSTRIES = [
  "FinTech","HealthTech","EdTech","AgriTech","CleanTech","AI/ML","SaaS","E-commerce",
  "Logistics","LegalTech","PropTech","InsurTech","FoodTech","TravelTech","Gaming",
  "Cybersecurity","Blockchain","IoT","BioTech","SpaceTech","Other",
];

const FUNDING_STAGES = [
  { value: "PRE_SEED", label: "Pre-seed" },
  { value: "SEED", label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "SERIES_D_PLUS", label: "Series D+" },
];

const REVENUE_STATUSES = [
  { value: "PRE_REVENUE", label: "Pre-revenue" },
  { value: "REVENUE_GENERATING", label: "Revenue-generating" },
  { value: "PROFITABLE", label: "Profitable" },
];

const CURRENT_STAGES = [
  { value: "IDEA", label: "Idea" },
  { value: "MVP", label: "MVP" },
  { value: "EARLY_TRACTION", label: "Early Traction" },
  { value: "GROWTH", label: "Growth" },
  { value: "SCALE", label: "Scale" },
];

const INVESTMENT_STAGES = [
  { value: "PRE_SEED", label: "Pre-seed" },
  { value: "SEED", label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "SERIES_D_PLUS", label: "Series D+" },
];

const INVESTMENT_STRUCTURES = ["EQUITY","CONVERTIBLE_NOTE","SAFE","DEBT","GRANTS","OTHER"];
const INVESTMENT_TIMELINES = ["SHORT_TERM","MEDIUM_TERM","LONG_TERM"];

const NAV_ITEMS = [
  { key: "profile",       label: "Profile Settings",    icon: User },
  { key: "account",       label: "Account Settings",    icon: Settings2 },
  { key: "privacy",       label: "Privacy Settings",    icon: Eye },
  { key: "notifications", label: "Notification Settings", icon: Bell },
  { key: "security",      label: "Password & Security", icon: Shield },
];

// ─── small helpers ────────────────────────────────────────────────────────────

const Toggle = ({ label, description, checked, onChange }) => (
  <div className="flex items-center justify-between py-3 border-b border-white/10">
    <div>
      <p className="text-sm text-gray-200">{label}</p>
      {description && <p className="text-xs text-gray-500 mt-0.5">{description}</p>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer ml-4 flex-shrink-0">
      <input
        type="checkbox"
        checked={!!checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only peer"
      />
      <div className="w-9 h-5 bg-gray-700 rounded-full peer peer-checked:bg-purple-600 peer-focus:ring-2 peer-focus:ring-purple-500/40 transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-4" />
    </label>
  </div>
);

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

const inputCls = "w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500 text-sm";
const selectCls = "w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white text-sm";
const textareaCls = "w-full rounded-lg bg-black/40 border border-white/20 px-3 py-2 text-white placeholder:text-gray-500 text-sm resize-none";

const PasswordStrength = ({ password }) => {
  const checks = [
    { label: "At least 8 characters", ok: password.length >= 8 },
    { label: "Uppercase letter",       ok: /[A-Z]/.test(password) },
    { label: "Lowercase letter",       ok: /[a-z]/.test(password) },
    { label: "Number",                 ok: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  const passed = checks.filter((c) => c.ok).length;
  const barColor = passed <= 1 ? "bg-red-500" : passed <= 2 ? "bg-amber-500" : passed <= 3 ? "bg-yellow-400" : "bg-emerald-500";
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i < passed ? barColor : "bg-white/10"}`} />
        ))}
      </div>
      <ul className="space-y-0.5">
        {checks.map(({ label, ok }) => (
          <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-400" : "text-gray-500"}`}>
            <span>{ok ? "✓" : "○"}</span>{label}
          </li>
        ))}
      </ul>
    </div>
  );
};

const Feedback = ({ feedback }) => {
  if (!feedback) return null;
  const ok = feedback.type === "success";
  return (
    <div className={`mb-4 rounded-lg border px-4 py-3 flex items-start gap-2 text-sm ${ok ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-100" : "border-rose-500/40 bg-rose-500/10 text-rose-100"}`}>
      {ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
      <span>{feedback.message}</span>
    </div>
  );
};

const SectionHeader = ({ title, description }) => (
  <div className="mb-5">
    <h2 className="text-xl font-semibold text-white">{title}</h2>
    {description && <p className="text-sm text-gray-400 mt-0.5">{description}</p>}
  </div>
);

const SaveBtn = ({ loading, label = "Save Changes", loadingLabel = "Saving..." }) => (
  <button
    type="submit"
    disabled={loading}
    className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2"
  >
    {loading && <Loader2 className="w-4 h-4 animate-spin" />}
    {loading ? loadingLabel : label}
  </button>
);

// ─── multi-select checkbox group ─────────────────────────────────────────────

const CheckGroup = ({ options, values, onChange, label }) => {
  const selected = Array.isArray(values) ? values : [];
  const toggle = (v) => onChange(selected.includes(v) ? selected.filter((x) => x !== v) : [...selected, v]);
  return (
    <Field label={label}>
      <div className="flex flex-wrap gap-2 mt-1">
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          const active = selected.includes(val);
          return (
            <button
              key={val}
              type="button"
              onClick={() => toggle(val)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${active ? "bg-purple-600/40 border-purple-400/60 text-white" : "bg-white/5 border-white/15 text-gray-300 hover:border-white/30"}`}
            >
              {lbl}
            </button>
          );
        })}
      </div>
    </Field>
  );
};

// ─── main page ───────────────────────────────────────────────────────────────

const SettingsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = user?.role || user?.user_type || "startup";
  const isInvestor = role === "investor";

  const [activeTab, setActiveTab] = useState("profile");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState({});

  // ── profile state ──────────────────────────────────────────────────────────
  const [profileId, setProfileId] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(null);

  // startup profile fields
  const [startupProfile, setStartupProfile] = useState({
    company_name: "", founder_names: "", location_country: "", location_city: "",
    logo_url: "", website_url: "", linkedin_url: "", tagline: "",
    detailed_description: "", industry: "", founded_date: "", current_stage: "",
    team_size: "", key_team_members: "", funding_stage: "", amount_seeking: "",
    previous_funding: "", use_of_funds: "", revenue_status: "",
    key_metrics: "", major_achievements: "", primary_contact_name: "",
    contact_email: "", phone_number: "",
  });

  // investor profile fields
  const [investorProfile, setInvestorProfile] = useState({
    name_or_firm: "", investor_type: "", years_of_experience: "",
    location_country: "", location_city: "", profile_photo_url: "",
    website_url: "", linkedin_url: "", professional_background: "",
    investment_thesis: "", industries_of_interest: [], geographic_preference: [],
    stage_preference: [], min_investment_size: "", max_investment_size: "",
    investment_structure: [], investment_timeline: "", number_of_investments: "",
    portfolio_companies: "", notable_achievements: "", what_you_look_for: "",
    deal_breakers: "", value_add: "", primary_contact_email: "",
    phone_number: "", preferred_contact_method: "",
  });

  // ── privacy / notifications state ──────────────────────────────────────────
  const [privacy, setPrivacy] = useState({
    profile_visibility: "public",
    connection_request_setting: true,
    show_connections_list: true,
    show_activity_status: true,
  });

  const [notifications, setNotifications] = useState({
    email_connection_requests: true,
    email_messages: true,
    email_profile_views: false,
    email_weekly_digest: true,
    notification_frequency: "instant",
    inapp_connection_requests: true,
    inapp_messages: true,
    inapp_profile_views: true,
    inapp_system_updates: true,
  });

  // ── account form state ─────────────────────────────────────────────────────
  const [accountForm, setAccountForm] = useState({ newEmail: "", deletePassword: "" });

  // ── security form state ────────────────────────────────────────────────────
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "", newPassword: "", confirmPassword: "",
  });
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // ── helpers ────────────────────────────────────────────────────────────────
  const setFb = (tab, type, message) => setFeedback((p) => ({ ...p, [tab]: { type, message } }));
  const clearFb = (tab) => setFeedback((p) => ({ ...p, [tab]: null }));

  const parseList = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; }
  };

  // ── initial data load ──────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setSettingsLoading(true);

    const requests = [
      apiService.getPrivacySettings(),
      apiService.getNotificationSettings(),
      isInvestor ? investorProfileService.getMyProfile() : profileService.getMyProfile(),
      isInvestor ? null : profileService.getProfileCompletion(),
    ];

    const [privRes, notifRes, profileRes, completionRes] = await Promise.all(
      requests.map((p) => p || Promise.resolve({ success: true, data: null }))
    );

    if (privRes.success) setPrivacy((p) => ({ ...p, ...(privRes.data?.data || {}) }));
    if (notifRes.success) setNotifications((p) => ({ ...p, ...(notifRes.data?.data || {}) }));

    if (profileRes.success && profileRes.data) {
      const raw = profileRes.data?.data || profileRes.data;
      if (isInvestor) {
        setProfileId(raw.investor_profile_id || raw.id);
        setInvestorProfile((p) => ({
          ...p,
          ...raw,
          industries_of_interest: parseList(raw.industries_of_interest),
          geographic_preference: parseList(raw.geographic_preference),
          stage_preference: parseList(raw.stage_preference),
          investment_structure: parseList(raw.investment_structure),
        }));
      } else {
        setProfileId(raw.startup_profile_id || raw.id);
        setStartupProfile((p) => ({ ...p, ...raw }));
        if (completionRes?.success) {
          setProfileCompletion(completionRes.data?.data?.completionPercentage ?? null);
        }
      }
    }

    setSettingsLoading(false);
  }, [isInvestor]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => {
    if (activeTab === "security") loadSessions();
  }, [activeTab]);

  const loadSessions = async () => {
    setSessionsLoading(true);
    const res = await apiService.getSessions();
    setSessionsLoading(false);
    if (res.success) setSessions(res.data?.sessions || res.data || []);
  };

  // ── save handlers ──────────────────────────────────────────────────────────

  const saveProfile = async (e) => {
    e.preventDefault();
    clearFb("profile");
    setBusy("profile");

    const fd = new FormData();
    const source = isInvestor ? investorProfile : startupProfile;

    for (const [key, value] of Object.entries(source)) {
      if (value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        if (value.length > 0) fd.append(key, JSON.stringify(value));
      } else if (String(value).trim() !== "") {
        fd.append(key, value);
      }
    }

    let result;
    if (profileId) {
      result = isInvestor
        ? await investorProfileService.updateProfile(profileId, fd)
        : await profileService.updateProfile(profileId, fd);
    } else {
      setFb("profile", "error", "No existing profile found. Please complete onboarding first.");
      setBusy("");
      return;
    }

    setBusy("");
    if (!result.success) { setFb("profile", "error", result.error || "Failed to save profile"); return; }
    setFb("profile", "success", "Profile updated successfully.");
  };

  const savePrivacy = async () => {
    clearFb("privacy");
    setBusy("privacy");
    const r = await apiService.updatePrivacySettings(privacy);
    setBusy("");
    if (!r.success) { setFb("privacy", "error", r.error || "Failed to save"); return; }
    setFb("privacy", "success", "Privacy settings saved.");
  };

  const saveNotifications = async () => {
    clearFb("notifications");
    setBusy("notifications");
    const r = await apiService.updateNotificationSettings(notifications);
    setBusy("");
    if (!r.success) { setFb("notifications", "error", r.error || "Failed to save"); return; }
    setFb("notifications", "success", "Notification settings saved.");
  };

  const changeEmail = async (e) => {
    e.preventDefault();
    if (!accountForm.newEmail.trim()) { setFb("account", "error", "New email is required"); return; }
    clearFb("account");
    setBusy("account.email");
    const r = await apiService.changeEmail(accountForm.newEmail);
    setBusy("");
    if (!r.success) { setFb("account", "error", r.error || "Failed to change email"); return; }
    setFb("account", "success", "Verification email sent to your new address.");
    setAccountForm((p) => ({ ...p, newEmail: "" }));
  };

  const deleteAccount = async (e) => {
    e.preventDefault();
    if (!accountForm.deletePassword) { setFb("account", "error", "Password is required"); return; }
    clearFb("account");
    setBusy("account.delete");
    const r = await apiService.deleteAccount(accountForm.deletePassword);
    setBusy("");
    if (!r.success) { setFb("account", "error", r.error || "Failed to delete account"); return; }
    setFb("account", "success", "Account deletion scheduled. You have 30 days to cancel.");
    setAccountForm((p) => ({ ...p, deletePassword: "" }));
  };

  const changePassword = async (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = securityForm;
    if (!currentPassword || !newPassword) { setFb("security", "error", "All fields are required"); return; }
    if (newPassword.length < 8) { setFb("security", "error", "Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { setFb("security", "error", "Passwords do not match"); return; }
    clearFb("security");
    setBusy("security.pw");
    const r = await apiService.changePassword({ currentPassword, newPassword });
    setBusy("");
    if (!r.success) { setFb("security", "error", r.error || "Failed to change password"); return; }
    setFb("security", "success", "Password changed. All other sessions will be signed out.");
    setSecurityForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
  };

  const logoutAll = async () => {
    clearFb("security");
    setBusy("security.logoutAll");
    const r = await apiService.logoutAllDevices();
    setBusy("");
    if (!r.success) { setFb("security", "error", r.error || "Failed"); return; }
    await logout();
    navigate("/login");
  };

  const downloadData = () => {
    const data = isInvestor ? investorProfile : startupProfile;
    const blob = new Blob([JSON.stringify({ user, profile: data }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "my-data.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── format helpers ─────────────────────────────────────────────────────────
  const fmtDate = (ds) => ds ? new Date(ds).toLocaleDateString([], { dateStyle: "medium" }) : "—";
  const fmtSession = (ds) => ds ? new Date(ds).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Unknown";

  // ─────────────────────────────────────────────────────────────────────────
  // Tab content renderers
  // ─────────────────────────────────────────────────────────────────────────

  const renderProfile = () => {
    if (isInvestor) {
      const ip = investorProfile;
      const upd = (patch) => setInvestorProfile((p) => ({ ...p, ...patch }));
      return (
        <form onSubmit={saveProfile} className="space-y-5">
          <SectionHeader title="Profile Settings" description="Edit information from your onboarding. Changes take effect immediately." />
          <Feedback feedback={feedback.profile} />

          {/* Basic */}
          <div className="rounded-lg border border-white/10 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Basic Information</h3>
            <Field label="Name or Firm" required>
              <input className={inputCls} value={ip.name_or_firm} onChange={(e) => upd({ name_or_firm: e.target.value })} placeholder="e.g., Acme Ventures" />
            </Field>
            <Field label="Investor Type">
              <select className={selectCls} value={ip.investor_type} onChange={(e) => upd({ investor_type: e.target.value })}>
                <option value="">Select type</option>
                {INVESTOR_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
            <Field label="Years of Experience">
              <input className={inputCls} type="number" min="0" value={ip.years_of_experience} onChange={(e) => upd({ years_of_experience: e.target.value })} />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Country">
                <select className={selectCls} value={ip.location_country} onChange={(e) => upd({ location_country: e.target.value })}>
                  <option value="">Select country</option>
                  {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="City">
                <input className={inputCls} value={ip.location_city} onChange={(e) => upd({ location_city: e.target.value })} placeholder="e.g., New York" />
              </Field>
            </div>
            <Field label="Profile Photo / Logo URL">
              <input className={inputCls} type="url" value={ip.profile_photo_url} onChange={(e) => upd({ profile_photo_url: e.target.value })} placeholder="https://..." />
            </Field>
            <Field label="Website">
              <input className={inputCls} type="url" value={ip.website_url} onChange={(e) => upd({ website_url: e.target.value })} placeholder="https://yourfirm.com" />
            </Field>
            <Field label="LinkedIn">
              <input className={inputCls} type="url" value={ip.linkedin_url} onChange={(e) => upd({ linkedin_url: e.target.value })} placeholder="https://linkedin.com/in/..." />
            </Field>
            <Field label="Professional Background">
              <textarea className={textareaCls} rows={4} value={ip.professional_background} onChange={(e) => upd({ professional_background: e.target.value })} />
            </Field>
          </div>

          {/* Investment Focus */}
          <div className="rounded-lg border border-white/10 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Investment Focus</h3>
            <Field label="Investment Thesis">
              <textarea className={textareaCls} rows={4} value={ip.investment_thesis} onChange={(e) => upd({ investment_thesis: e.target.value })} />
            </Field>
            <CheckGroup label="Industries of Interest" options={INDUSTRIES} values={ip.industries_of_interest} onChange={(v) => upd({ industries_of_interest: v })} />
            <CheckGroup label="Stage Preference" options={INVESTMENT_STAGES} values={ip.stage_preference} onChange={(v) => upd({ stage_preference: v })} />
          </div>

          {/* Investment Details */}
          <div className="rounded-lg border border-white/10 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Investment Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Min Investment ($)">
                <input className={inputCls} type="number" min="0" value={ip.min_investment_size} onChange={(e) => upd({ min_investment_size: e.target.value })} />
              </Field>
              <Field label="Max Investment ($)">
                <input className={inputCls} type="number" min="0" value={ip.max_investment_size} onChange={(e) => upd({ max_investment_size: e.target.value })} />
              </Field>
            </div>
            <CheckGroup label="Investment Structure" options={INVESTMENT_STRUCTURES} values={ip.investment_structure} onChange={(v) => upd({ investment_structure: v })} />
            <Field label="Investment Timeline">
              <select className={selectCls} value={ip.investment_timeline} onChange={(e) => upd({ investment_timeline: e.target.value })}>
                <option value="">Select</option>
                {INVESTMENT_TIMELINES.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
              </select>
            </Field>
          </div>

          {/* Portfolio */}
          <div className="rounded-lg border border-white/10 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Portfolio</h3>
            <Field label="Number of Investments">
              <input className={inputCls} type="number" min="0" value={ip.number_of_investments} onChange={(e) => upd({ number_of_investments: e.target.value })} />
            </Field>
            <Field label="Portfolio Companies">
              <textarea className={textareaCls} rows={3} value={ip.portfolio_companies} onChange={(e) => upd({ portfolio_companies: e.target.value })} />
            </Field>
            <Field label="Notable Achievements">
              <textarea className={textareaCls} rows={3} value={ip.notable_achievements} onChange={(e) => upd({ notable_achievements: e.target.value })} />
            </Field>
          </div>

          {/* Criteria */}
          <div className="rounded-lg border border-white/10 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Criteria & Value Add</h3>
            <Field label="What You Look For">
              <textarea className={textareaCls} rows={3} value={ip.what_you_look_for} onChange={(e) => upd({ what_you_look_for: e.target.value })} />
            </Field>
            <Field label="Deal Breakers">
              <textarea className={textareaCls} rows={3} value={ip.deal_breakers} onChange={(e) => upd({ deal_breakers: e.target.value })} />
            </Field>
            <Field label="Value Add">
              <textarea className={textareaCls} rows={3} value={ip.value_add} onChange={(e) => upd({ value_add: e.target.value })} />
            </Field>
          </div>

          {/* Contact */}
          <div className="rounded-lg border border-white/10 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Contact</h3>
            <Field label="Primary Contact Email">
              <input className={inputCls} type="email" value={ip.primary_contact_email} onChange={(e) => upd({ primary_contact_email: e.target.value })} />
            </Field>
            <Field label="Phone Number">
              <input className={inputCls} type="tel" value={ip.phone_number} onChange={(e) => upd({ phone_number: e.target.value })} />
            </Field>
            <Field label="Preferred Contact Method">
              <select className={selectCls} value={ip.preferred_contact_method} onChange={(e) => upd({ preferred_contact_method: e.target.value })}>
                <option value="">Select</option>
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </Field>
          </div>

          <SaveBtn loading={busy === "profile"} />
        </form>
      );
    }

    // startup
    const sp = startupProfile;
    const upd = (patch) => setStartupProfile((p) => ({ ...p, ...patch }));
    return (
      <form onSubmit={saveProfile} className="space-y-5">
        <SectionHeader title="Profile Settings" description="Edit information from your onboarding. Changes take effect immediately." />
        <Feedback feedback={feedback.profile} />

        {/* Basic */}
        <div className="rounded-lg border border-white/10 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Basic Information</h3>
          <Field label="Company Name" required>
            <input className={inputCls} value={sp.company_name} onChange={(e) => upd({ company_name: e.target.value })} />
          </Field>
          <Field label="Founder Name(s)" required>
            <input className={inputCls} value={sp.founder_names} onChange={(e) => upd({ founder_names: e.target.value })} />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Country">
              <select className={selectCls} value={sp.location_country} onChange={(e) => upd({ location_country: e.target.value })}>
                <option value="">Select country</option>
                {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="City">
              <input className={inputCls} value={sp.location_city} onChange={(e) => upd({ location_city: e.target.value })} placeholder="e.g., San Francisco" />
            </Field>
          </div>
          <Field label="Company Logo URL">
            <input className={inputCls} type="url" value={sp.logo_url} onChange={(e) => upd({ logo_url: e.target.value })} placeholder="https://..." />
          </Field>
          <Field label="Website URL">
            <input className={inputCls} type="url" value={sp.website_url} onChange={(e) => upd({ website_url: e.target.value })} placeholder="https://yourcompany.com" />
          </Field>
          <Field label="LinkedIn">
            <input className={inputCls} type="url" value={sp.linkedin_url} onChange={(e) => upd({ linkedin_url: e.target.value })} placeholder="https://linkedin.com/company/..." />
          </Field>
        </div>

        {/* Business */}
        <div className="rounded-lg border border-white/10 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Business Description</h3>
          <Field label="Tagline">
            <input className={inputCls} value={sp.tagline} onChange={(e) => upd({ tagline: e.target.value })} />
          </Field>
          <Field label="Detailed Description">
            <textarea className={textareaCls} rows={5} value={sp.detailed_description} onChange={(e) => upd({ detailed_description: e.target.value })} />
          </Field>
          <Field label="Industry">
            <select className={selectCls} value={sp.industry} onChange={(e) => upd({ industry: e.target.value })}>
              <option value="">Select industry</option>
              {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Founded Date">
              <input className={inputCls} type="date" value={sp.founded_date ? sp.founded_date.slice(0,10) : ""} onChange={(e) => upd({ founded_date: e.target.value })} />
            </Field>
            <Field label="Current Stage">
              <select className={selectCls} value={sp.current_stage} onChange={(e) => upd({ current_stage: e.target.value })}>
                <option value="">Select stage</option>
                {CURRENT_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>
        </div>

        {/* Team */}
        <div className="rounded-lg border border-white/10 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Team Information</h3>
          <Field label="Team Size">
            <input className={inputCls} type="number" min="1" value={sp.team_size} onChange={(e) => upd({ team_size: e.target.value })} />
          </Field>
          <Field label="Key Team Members">
            <textarea className={textareaCls} rows={3} value={sp.key_team_members} onChange={(e) => upd({ key_team_members: e.target.value })} />
          </Field>
        </div>

        {/* Funding */}
        <div className="rounded-lg border border-white/10 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Funding Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Funding Stage">
              <select className={selectCls} value={sp.funding_stage} onChange={(e) => upd({ funding_stage: e.target.value })}>
                <option value="">Select stage</option>
                {FUNDING_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
            <Field label="Revenue Status">
              <select className={selectCls} value={sp.revenue_status} onChange={(e) => upd({ revenue_status: e.target.value })}>
                <option value="">Select status</option>
                {REVENUE_STATUSES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Amount Seeking ($)">
            <input className={inputCls} type="number" min="0" value={sp.amount_seeking} onChange={(e) => upd({ amount_seeking: e.target.value })} />
          </Field>
          <Field label="Previous Funding ($)">
            <input className={inputCls} type="number" min="0" value={sp.previous_funding} onChange={(e) => upd({ previous_funding: e.target.value })} />
          </Field>
          <Field label="Use of Funds">
            <textarea className={textareaCls} rows={3} value={sp.use_of_funds} onChange={(e) => upd({ use_of_funds: e.target.value })} />
          </Field>
        </div>

        {/* Traction */}
        <div className="rounded-lg border border-white/10 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Traction & Achievements</h3>
          <Field label="Key Metrics">
            <textarea className={textareaCls} rows={3} value={sp.key_metrics} onChange={(e) => upd({ key_metrics: e.target.value })} />
          </Field>
          <Field label="Major Achievements">
            <textarea className={textareaCls} rows={3} value={sp.major_achievements} onChange={(e) => upd({ major_achievements: e.target.value })} />
          </Field>
        </div>

        {/* Contact */}
        <div className="rounded-lg border border-white/10 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Contact</h3>
          <Field label="Primary Contact Name">
            <input className={inputCls} value={sp.primary_contact_name} onChange={(e) => upd({ primary_contact_name: e.target.value })} />
          </Field>
          <Field label="Contact Email">
            <input className={inputCls} type="email" value={sp.contact_email} onChange={(e) => upd({ contact_email: e.target.value })} />
          </Field>
          <Field label="Phone Number">
            <input className={inputCls} type="tel" value={sp.phone_number} onChange={(e) => upd({ phone_number: e.target.value })} />
          </Field>
        </div>

        <SaveBtn loading={busy === "profile"} />
      </form>
    );
  };

  const renderAccount = () => (
    <div className="space-y-5">
      <SectionHeader title="Account Settings" />
      <Feedback feedback={feedback.account} />

      {/* Account status info */}
      <div className="rounded-lg border border-white/10 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Account Status</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-xs text-gray-500">Email</p>
            <p className="text-sm text-white mt-0.5">{user?.email || "—"}</p>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-xs text-gray-500">User Type</p>
            <p className="text-sm text-white mt-0.5 capitalize">{role}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">To change type, create a new account</p>
          </div>
          <div className="rounded-lg bg-white/5 px-3 py-2">
            <p className="text-xs text-gray-500">Member Since</p>
            <p className="text-sm text-white mt-0.5">{fmtDate(user?.created_at)}</p>
          </div>
          {profileCompletion !== null && (
            <div className="rounded-lg bg-white/5 px-3 py-2">
              <p className="text-xs text-gray-500">Profile Completion</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full transition-all" style={{ width: `${profileCompletion}%` }} />
                </div>
                <span className="text-xs text-white">{profileCompletion}%</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Change email */}
      <form onSubmit={changeEmail} className="rounded-lg border border-white/10 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Change Email</h3>
        <p className="text-xs text-gray-500">A verification email will be sent to the new address. Your old email will be notified.</p>
        <input
          className={inputCls}
          type="email"
          value={accountForm.newEmail}
          onChange={(e) => setAccountForm((p) => ({ ...p, newEmail: e.target.value }))}
          placeholder="New email address"
          required
        />
        <button type="submit" disabled={!!busy} className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2">
          {busy === "account.email" && <Loader2 className="w-4 h-4 animate-spin" />}
          Request Email Change
        </button>
      </form>

      {/* Delete */}
      <form onSubmit={deleteAccount} className="rounded-lg border border-rose-500/40 bg-rose-500/5 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-rose-300 uppercase tracking-wide">Delete Account</h3>
        <p className="text-xs text-rose-200/70">Your account will be deactivated immediately. After 30 days all data is permanently deleted.</p>
        <input
          className={`${inputCls} border-rose-400/30`}
          type="password"
          value={accountForm.deletePassword}
          onChange={(e) => setAccountForm((p) => ({ ...p, deletePassword: e.target.value }))}
          placeholder="Confirm your password"
          required
        />
        <button type="submit" disabled={!!busy} className="px-4 py-2 rounded-lg bg-rose-600 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2">
          {busy === "account.delete" && <Loader2 className="w-4 h-4 animate-spin" />}
          Delete My Account
        </button>
      </form>
    </div>
  );

  const renderPrivacy = () => (
    <div className="space-y-4">
      <SectionHeader title="Privacy Settings" description="Control who can see your profile and contact information." />
      <Feedback feedback={feedback.privacy} />

      <div className="rounded-lg border border-white/10 p-4 space-y-1">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-3">Profile Visibility</h3>
        <Field label="Who can view your full profile">
          <select className={selectCls} value={privacy.profile_visibility} onChange={(e) => setPrivacy((p) => ({ ...p, profile_visibility: e.target.value }))}>
            <option value="public">Public — anyone can view</option>
            <option value="connections_only">Connections only</option>
          </select>
        </Field>
        <p className="text-xs text-gray-500 mt-1">Basic information is always visible in search results.</p>
      </div>

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">Connection Settings</h3>
        <Toggle label="Allow connection requests" description="Allow other users to send you connection requests" checked={privacy.connection_request_setting} onChange={(v) => setPrivacy((p) => ({ ...p, connection_request_setting: v }))} />
        <Toggle label="Show my connections list" description="Display your connections list on your profile" checked={privacy.show_connections_list} onChange={(v) => setPrivacy((p) => ({ ...p, show_connections_list: v }))} />
        <Toggle label="Show activity status" description="Let others see when you were last active" checked={privacy.show_activity_status} onChange={(v) => setPrivacy((p) => ({ ...p, show_activity_status: v }))} />
      </div>

      <button type="button" onClick={savePrivacy} disabled={!!busy} className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
        {busy === "privacy" && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy === "privacy" ? "Saving…" : "Save Privacy Settings"}
      </button>
    </div>
  );

  const renderNotifications = () => (
    <div className="space-y-4">
      <SectionHeader title="Notification Settings" description="Choose how and when you receive notifications." />
      <Feedback feedback={feedback.notifications} />

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">Email Notifications</h3>
        <Toggle label="New connection requests" checked={notifications.email_connection_requests} onChange={(v) => setNotifications((p) => ({ ...p, email_connection_requests: v }))} />
        <Toggle label="New messages" checked={notifications.email_messages} onChange={(v) => setNotifications((p) => ({ ...p, email_messages: v }))} />
        <Toggle label="Profile views" checked={notifications.email_profile_views} onChange={(v) => setNotifications((p) => ({ ...p, email_profile_views: v }))} />
        <Toggle label="Weekly activity summary" checked={notifications.email_weekly_digest} onChange={(v) => setNotifications((p) => ({ ...p, email_weekly_digest: v }))} />
        <div className="pt-3">
          <Field label="Email frequency">
            <select className={selectCls} value={notifications.notification_frequency} onChange={(e) => setNotifications((p) => ({ ...p, notification_frequency: e.target.value }))}>
              <option value="instant">Instant (as they happen)</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </Field>
        </div>
      </div>

      <div className="rounded-lg border border-white/10 p-4">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide mb-2">In-App Notifications</h3>
        <Toggle label="Connection requests" checked={notifications.inapp_connection_requests} onChange={(v) => setNotifications((p) => ({ ...p, inapp_connection_requests: v }))} />
        <Toggle label="Messages" checked={notifications.inapp_messages} onChange={(v) => setNotifications((p) => ({ ...p, inapp_messages: v }))} />
        <Toggle label="Profile views" checked={notifications.inapp_profile_views} onChange={(v) => setNotifications((p) => ({ ...p, inapp_profile_views: v }))} />
        <Toggle label="System announcements" checked={notifications.inapp_system_updates} onChange={(v) => setNotifications((p) => ({ ...p, inapp_system_updates: v }))} />
      </div>

      <button type="button" onClick={saveNotifications} disabled={!!busy} className="px-5 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
        {busy === "notifications" && <Loader2 className="w-4 h-4 animate-spin" />}
        {busy === "notifications" ? "Saving…" : "Save Notification Settings"}
      </button>
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-5">
      <SectionHeader title="Password & Security" description="Manage your password, sessions, and account security." />
      <Feedback feedback={feedback.security} />

      {/* Change password */}
      <form onSubmit={changePassword} className="rounded-lg border border-white/10 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Change Password</h3>
        <input
          className={inputCls}
          type="password"
          value={securityForm.currentPassword}
          onChange={(e) => setSecurityForm((p) => ({ ...p, currentPassword: e.target.value }))}
          placeholder="Current password"
          required
        />
        <div>
          <input
            className={inputCls}
            type="password"
            value={securityForm.newPassword}
            onChange={(e) => setSecurityForm((p) => ({ ...p, newPassword: e.target.value }))}
            placeholder="New password"
            required
          />
          <PasswordStrength password={securityForm.newPassword} />
        </div>
        <input
          className={inputCls}
          type="password"
          value={securityForm.confirmPassword}
          onChange={(e) => setSecurityForm((p) => ({ ...p, confirmPassword: e.target.value }))}
          placeholder="Confirm new password"
          required
        />
        <p className="text-xs text-gray-500">All active sessions will be terminated after the password change.</p>
        <div className="flex items-center gap-3 flex-wrap">
          <button type="submit" disabled={!!busy} className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white disabled:opacity-50 inline-flex items-center gap-2">
            {busy === "security.pw" && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
          <Link to="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
            I forgot my current password →
          </Link>
        </div>
      </form>

      {/* 2FA info */}
      <div className="rounded-lg border border-white/10 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Two-Factor Authentication</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">Active</span>
          <span className="text-sm text-gray-300">Email-based verification</span>
        </div>
        <p className="text-xs text-gray-500">SMS and authenticator app options coming in a future release.</p>
      </div>

      {/* Active sessions */}
      <div className="rounded-lg border border-white/10 p-4 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Active Sessions</h3>
          <button
            type="button"
            onClick={logoutAll}
            disabled={!!busy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-rose-500/40 text-rose-300 hover:bg-rose-500/10 disabled:opacity-50 transition-colors"
          >
            {busy === "security.logoutAll" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
            Logout from all devices
          </button>
        </div>
        {sessionsLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading sessions…</div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-gray-500">No session data available.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((s, idx) => {
              const mobile = /mobile|android|iphone|ipad/i.test(s.user_agent || "");
              return (
                <li key={s.id || idx} className="flex items-start gap-3 py-2 border-b border-white/10 last:border-0">
                  <div className="mt-0.5 text-gray-400 flex-shrink-0">
                    {mobile ? <Smartphone className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{s.user_agent ? s.user_agent.slice(0, 70) + (s.user_agent.length > 70 ? "…" : "") : "Unknown device"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Last active: {fmtSession(s.last_used_at || s.created_at)}
                      {s.ip_address ? ` · ${s.ip_address}` : ""}
                    </p>
                  </div>
                  {idx === 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex-shrink-0">Current</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Login history placeholder */}
      <div className="rounded-lg border border-white/10 p-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Login History</h3>
        <p className="text-xs text-gray-500">Recent login activity is shown in your active sessions above. Each entry represents a device that authenticated with your account.</p>
        <p className="text-xs text-gray-500">If you see a session you don't recognise, log out from all devices immediately and change your password.</p>
      </div>

      {/* Data & Privacy */}
      <div className="rounded-lg border border-white/10 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wide">Data & Privacy</h3>
        <p className="text-xs text-gray-500">Download a copy of all the data associated with your account.</p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={downloadData}
            className="px-4 py-2 rounded-lg border border-white/20 text-sm text-white hover:bg-white/5 transition-colors"
          >
            Download my data
          </button>
        </div>
        <div className="flex gap-4 mt-1">
          <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Data usage policy</a>
          <a href="#" className="text-xs text-purple-400 hover:text-purple-300">Privacy policy</a>
        </div>
      </div>
    </div>
  );

  const tabContent = {
    profile: renderProfile,
    account: renderAccount,
    privacy: renderPrivacy,
    notifications: renderNotifications,
    security: renderSecurity,
  };

  if (settingsLoading) {
    return (
      <div className="min-h-screen px-6 py-10 flex items-center justify-center text-gray-300">
        <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading settings…
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white">Settings</h1>
          <p className="text-gray-400 mt-1">Manage your profile, privacy, and account security.</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Left sidebar nav ── */}
          <nav className="lg:w-56 flex-shrink-0">
            <ul className="space-y-1">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => { setActiveTab(key); clearFb(key); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition-colors ${
                      activeTab === key
                        ? "bg-purple-500/20 border border-purple-400/30 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          {/* ── Main content ── */}
          <main className="flex-1 min-w-0 rounded-xl border border-white/15 bg-black/45 p-6">
            {tabContent[activeTab]?.()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
