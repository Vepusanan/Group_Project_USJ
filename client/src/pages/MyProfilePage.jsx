import React, { useEffect, useState } from "react";
import profileService from "../services/profileService";
import { Link } from "react-router-dom";
import {
  cardIdentityClass,
  pageContainerClass,
  pageContentClass,
  profileIdentityTitleClass,
  profileIdentitySubtitleClass,
  profileIdentitySubtitleMutedClass,
} from "../styles/theme";
import {
  Building2, Calendar, DollarSign, Edit3, ExternalLink,
  Facebook, Globe, Instagram, Linkedin, Mail, MapPin,
  Phone, Twitter, User, Users, Video,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useProfileData } from "../hooks/useProfileCache";
import MilestoneManageSection from "../components/milestones/MilestoneManageSection";
import TeamMembersDisplay from "../components/profile/TeamMembersDisplay";

const parseJson = (value, fallback = null) => {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try { return JSON.parse(value); } catch { return fallback; }
};

const SECTION_LABELS = {
  required: "Required details",
  important: "Key highlights",
  optional: "Optional extras",
};

// incompleteSections from the API are objects ({ section, missingFields,
// completionRate }); render a readable label instead of [object Object].
const formatIncompleteSection = (entry) => {
  if (!entry) return "";
  if (typeof entry === "string") return entry;
  const key = entry.section || entry.name || "";
  const label = SECTION_LABELS[key] || key.replace(/_/g, " ");
  return entry.completionRate != null
    ? `${label} (${entry.completionRate}%)`
    : label;
};

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d)) return value;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
};

const formatCurrency = (value) => {
  if (!value && value !== 0) return null;
  const n = Number(value);
  if (isNaN(n)) return String(value);
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n}`;
};

const Section = ({ title, children }) => (
  <div className="rounded-xl border border-line bg-surface-alt p-6 space-y-4">
    <h2 className="text-xs font-semibold text-content-muted uppercase tracking-widest">{title}</h2>
    {children}
  </div>
);

const Field = ({ label, value, wide }) => {
  if (!value && value !== 0) return null;
  return (
    <div className={wide ? "col-span-full" : ""}>
      <p className="text-xs text-content-muted mb-1">{label}</p>
      <p className="text-sm text-content-secondary leading-relaxed whitespace-pre-line break-words">{value}</p>
    </div>
  );
};

const TagList = ({ label, items }) => {
  if (!items?.length) return null;
  return (
    <div className="col-span-full">
      <p className="text-xs text-content-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={i} className="px-2.5 py-1 rounded-full bg-surface-alt border border-line text-xs text-content-secondary">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
};

const SocialLinks = ({ links, platform }) => {
  const PLATFORMS = {
    linkedin: { icon: Linkedin, label: "LinkedIn", color: "hover:border-primary-light hover:text-primary" },
    twitter:  { icon: Twitter,  label: "Twitter / X", color: "hover:border-sky-400/50 hover:text-sky-400" },
    facebook: { icon: Facebook, label: "Facebook", color: "hover:border-primary hover:text-primary" },
    instagram:{ icon: Instagram,label: "Instagram", color: "hover:border-primary hover:text-primary" },
    website:  { icon: Globe,    label: "Website", color: "hover:border-primary-light hover:text-primary" },
  };

  const entries = Object.entries(links || {}).filter(([, v]) => v);
  if (!entries.length) return null;

  return (
    <div className="col-span-full">
      <p className="text-xs text-content-muted mb-2">Social / Links</p>
      <div className="flex flex-wrap gap-2">
        {entries.map(([key, url]) => {
          const cfg = PLATFORMS[key] || { icon: Globe, label: key, color: "hover:border-line-strong" };
          const Icon = cfg.icon;
          const href = url.startsWith("http") ? url : `https://${url}`;
          return (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-line bg-surface-alt text-xs text-content-secondary transition-all ${cfg.color}`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
              <ExternalLink className="w-3 h-3 opacity-50" />
            </a>
          );
        })}
      </div>
    </div>
  );
};

const MyProfilePage = () => {
  const { user } = useAuth();
  const { profile, isReady, error, invalidate } = useProfileData();
  const [completion, setCompletion] = useState(null);

  useEffect(() => {
    if (user?.userType !== "startup" || !profile) return;
    profileService.getProfileCompletion().then((result) => {
      if (result.success) {
        setCompletion(result.data?.data || result.data);
      }
    });
  }, [user?.userType, profile]);

  if (!isReady && !error) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className={pageContainerClass}>
      <div className={`${pageContentClass} rounded-xl border border-error/30 bg-error/10 p-5 text-error flex items-center justify-between gap-4`}>
        <span>{error}</span>
        <button
          onClick={() => invalidate()}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-error/10 border border-error/40 text-error text-sm hover:bg-error/20 transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  if (!profile) return (
    <div className={pageContainerClass}>
      <div className={`${pageContentClass} rounded-xl border border-line bg-surface shadow-sm p-6 text-content-secondary`}>
        Profile not created yet.{" "}
        <Link to={user?.userType === "investor" ? "/investor-onboarding" : "/onboarding"} className="text-primary underline">
          Complete onboarding
        </Link>
      </div>
    </div>
  );

  const isInvestor = user?.userType === "investor";

  if (isInvestor) {
    const social = parseJson(profile.social_media, {});
    const industries = parseJson(profile.industries_of_interest, []);
    const geoPrefs = parseJson(profile.geographic_preference, []);
    const stagePrefs = parseJson(profile.stage_preference, []);
    const structures = parseJson(profile.investment_structure, []);

    return (
      <div className={pageContainerClass}>
        <div className={`${pageContentClass} space-y-4`}>
          {/* Header card */}
          <div className="rounded-xl border border-line bg-surface shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border border-line bg-surface-alt overflow-hidden flex items-center justify-center shrink-0 shadow-card">
                {profile.photo_url
                  ? <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
                  : <User className="w-12 h-12 text-content-muted" />}
              </div>
              <div className={`flex-1 min-w-0 ${cardIdentityClass}`}>
                <h1 className="text-3xl font-bold text-content leading-none truncate">{profile.name_or_firm || "—"}</h1>
                <p className={profileIdentitySubtitleClass}>
                  {profile.investor_type?.replace(/_/g, " ")}
                  {profile.years_of_experience ? ` · ${profile.years_of_experience} yrs experience` : ""}
                </p>
              </div>
              <Link to="/profile/edit" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-sm text-content-inverse font-medium hover:opacity-90 transition-opacity shrink-0 self-start sm:self-center">
                <Edit3 className="w-4 h-4" /> Edit Profile
              </Link>
            </div>
          </div>

          <Section title="Investment Focus">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Investment Thesis" value={profile.investment_thesis} wide />
              <TagList label="Industries of Interest" items={Array.isArray(industries) ? industries : []} />
              <TagList label="Geographic Preference" items={Array.isArray(geoPrefs) ? geoPrefs : []} />
              <TagList label="Stage Preference" items={Array.isArray(stagePrefs) ? stagePrefs : []} />
              <TagList label="Investment Structure" items={Array.isArray(structures) ? structures : []} />
              <Field label="Min Check Size" value={formatCurrency(profile.min_investment_size)} />
              <Field label="Max Check Size" value={formatCurrency(profile.max_investment_size)} />
              <Field label="Investment Timeline" value={profile.investment_timeline} />
              <Field label="Follow-On Investment" value={profile.follow_on_investment ? "Yes" : "No"} />
            </div>
          </Section>

          <Section title="Background & Criteria">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Professional Background" value={profile.professional_background} wide />
              <Field label="What I Look For" value={profile.what_you_look_for} wide />
              <Field label="Value Add" value={profile.value_add} wide />
              <Field label="Deal Breakers" value={profile.deal_breakers} wide />
              <Field label="Network & Resources" value={profile.network_resources} wide />
            </div>
          </Section>

          <Section title="Portfolio">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Number of Investments" value={profile.number_of_investments} />
              <Field label="Successful Exits" value={profile.successful_exits} />
              <Field label="Portfolio Companies" value={profile.portfolio_companies} wide />
              <Field label="Notable Achievements" value={profile.notable_achievements} wide />
            </div>
          </Section>

          <Section title="Contact">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Email" value={profile.primary_contact_email} />
              <Field label="Phone" value={profile.phone_number} />
              <Field label="Preferred Contact Method" value={profile.preferred_contact_method} />
              <SocialLinks links={social} />
            </div>
          </Section>
        </div>
      </div>
    );
  }

  // Startup profile
  const social = parseJson(profile.social_media_links || profile.social_media, {});
  const founders = parseJson(profile.founder_names, null);
  const founderDisplay = Array.isArray(founders)
    ? founders.join(" · ")
    : typeof founders === "string"
    ? founders
    : profile.founder_names;

  return (
    <div className={pageContainerClass}>
      <div className={`${pageContentClass} space-y-4`}>
        {/* Header card */}
        <div className="rounded-xl border border-line bg-surface shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-6">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl border border-line bg-surface-alt overflow-hidden flex items-center justify-center shrink-0 shadow-card">
              {profile.logo_url
                ? <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
                : <Building2 className="w-12 h-12 text-content-muted" />}
            </div>
            <div className={cardIdentityClass}>
              <h1 className="text-3xl font-bold text-content leading-none truncate">{profile.company_name || "—"}</h1>
              {profile.tagline && <p className={profileIdentitySubtitleMutedClass}>{profile.tagline}</p>}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {profile.industry && (
                  <span className="px-2.5 py-1 rounded-full bg-primary/15 border border-primary-light text-xs text-primary">{profile.industry}</span>
                )}
                {profile.current_stage && (
                  <span className="px-2.5 py-1 rounded-full bg-primary/15 border border-primary-light text-xs text-primary">{profile.current_stage.replace(/_/g, " ")}</span>
                )}
              </div>
            </div>
            <Link to="/profile/edit" className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-sm text-content-inverse font-medium hover:opacity-90 transition-opacity shrink-0 self-start sm:self-center">
              <Edit3 className="w-4 h-4" /> Edit Profile
            </Link>
          </div>
        </div>

        {completion && (
          <div className="rounded-xl border border-line bg-surface-alt p-5 flex flex-wrap items-center gap-6">
            <div>
              <p className="text-xs text-content-muted uppercase tracking-wide">Profile completeness</p>
              <p className="text-2xl font-bold text-content mt-1">{completion.completionPercentage}%</p>
            </div>
            <div className="flex-1 min-w-[200px]">
              <div className="h-2 rounded-full bg-surface overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${completion.completionPercentage}%` }}
                />
              </div>
            </div>
            {completion.incompleteSections?.length > 0 && (
              <p className="text-xs text-content-muted w-full">
                Consider completing:{" "}
                {completion.incompleteSections
                  .map(formatIncompleteSection)
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
        )}

        <Section title="Company Overview">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Detailed Description" value={profile.detailed_description} wide />
            <Field label="Founder(s)" value={founderDisplay} wide />
            <Field label="Founded" value={formatDate(profile.founded_date)} />
            <Field label="Team Size" value={profile.team_size ? `${profile.team_size} people` : null} />
            <Field label="Industry" value={profile.industry} />
            <Field label="Current Stage" value={profile.current_stage?.replace(/_/g, " ")} />
          </div>
        </Section>

        <Section title="Team & Traction">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {profile.key_team_members ? (
              <div className="col-span-full">
                <p className="text-xs text-content-muted mb-1">Key Team Members</p>
                <TeamMembersDisplay value={profile.key_team_members} />
              </div>
            ) : null}
            <Field label="Key Metrics" value={profile.key_metrics} wide />
            <Field label="Major Achievements" value={profile.major_achievements} wide />
            <Field label="Customer Testimonials" value={profile.customer_testimonials} wide />
          </div>
        </Section>

        <Section title="Funding">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Funding Stage" value={profile.funding_stage?.replace(/_/g, " ")} />
            <Field label="Revenue Status" value={profile.revenue_status?.replace(/_/g, " ")} />
            <Field label="Amount Seeking" value={formatCurrency(profile.amount_seeking)} />
            <Field label="Previous Funding" value={profile.previous_funding ? formatCurrency(profile.previous_funding) : "None"} />
            <Field label="Use of Funds" value={profile.use_of_funds} wide />
          </div>
        </Section>

        {!isInvestor && (
          <Section title="Funding Round Tracker">
            <p className="text-sm text-content-secondary mb-3">
              Publish your target raise and commitment progress to build investor momentum.
            </p>
            <Link
              to="/funding-round"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-warning/30 bg-warning/10 text-sm text-warning hover:bg-warning/15 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Manage Funding Round
            </Link>
          </Section>
        )}

        {!isInvestor && profile.startup_profile_id && (
          <MilestoneManageSection startupProfileId={profile.startup_profile_id} />
        )}

        {!isInvestor && (
          <Section title="Private Data Room">
            <p className="text-sm text-content-secondary mb-3">
              Upload confidential documents and grant access to connected investors for due diligence.
            </p>
            <Link
              to="/data-room"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-primary-light bg-primary-light/10 text-sm text-primary hover:bg-primary-light/20 transition-all"
            >
              <ExternalLink className="w-4 h-4" /> Manage Data Room
            </Link>
          </Section>
        )}

        {(profile.pitch_deck_url || profile.business_plan_url || profile.product_demo_url || profile.founder_video_url) && (
          <Section title="Investor Materials">
            <div className="flex flex-wrap gap-3">
              {profile.pitch_deck_url && (
                <Link
                  to={`/startups/${profile.startup_profile_id}/pitch-deck`}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-surface-alt text-sm text-content-secondary hover:bg-surface-alt hover:border-line transition-all"
                >
                  <ExternalLink className="w-4 h-4" /> View Pitch Deck
                </Link>
              )}
              {profile.business_plan_url && (
                <a href={profile.business_plan_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-surface-alt text-sm text-content-secondary hover:bg-surface-alt hover:border-line transition-all">
                  <ExternalLink className="w-4 h-4" /> Business Plan
                </a>
              )}
              {profile.product_demo_url && (
                <a href={profile.product_demo_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-line bg-surface-alt text-sm text-content-secondary hover:bg-surface-alt hover:border-line transition-all">
                  <ExternalLink className="w-4 h-4" /> Product Demo
                </a>
              )}
            </div>
            {profile.founder_video_url && (
              <div className="mt-4 rounded-xl border border-line bg-surface p-3 max-w-xl">
                <p className="text-sm font-medium text-content mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  Founder Video Introduction
                </p>
                <video
                  src={profile.founder_video_url}
                  controls
                  playsInline
                  poster={profile.founder_video_thumbnail_url || undefined}
                  className="w-full rounded-lg border border-line max-h-80 bg-black"
                />
              </div>
            )}
          </Section>
        )}

        <Section title="Contact">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Contact Name" value={profile.primary_contact_name} />
            <Field label="Contact Email" value={profile.contact_email} />
            <Field label="Phone" value={profile.phone_number} />
            <SocialLinks links={social} />
          </div>
        </Section>
      </div>
    </div>
  );
};

export default MyProfilePage;
