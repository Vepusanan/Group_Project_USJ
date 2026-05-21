import React from "react";
import { BadgeCheck, Building2, CalendarClock, Globe, Linkedin, MapPin } from "lucide-react";

const MAX_BIO_WORDS = 500;

const countWords = (text) =>
  (text || "").trim().split(/\s+/).filter(Boolean).length;

const truncateToWords = (text, limit) => {
  const words = (text || "").split(/\s+/);
  if (words.length <= limit) return text;
  return words.slice(0, limit).join(" ");
};

const INVESTOR_TYPES = [
  { value: "ANGEL", label: "Angel Investor" },
  { value: "VC", label: "Venture Capital" },
  { value: "CORPORATE", label: "Corporate Investor" },
  { value: "FAMILY_OFFICE", label: "Family Office" },
  { value: "ACCELERATOR", label: "Accelerator / Incubator" },
  { value: "OTHER", label: "Other" },
];

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

const iconInputCls =
  "w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all appearance-none";

const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
      {hint && <span className="text-gray-500 font-normal ml-2 text-xs">{hint}</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
  </div>
);

const InvestorStep1BasicInfo = ({ formData, updateFormData, errors }) => (
  <div className="space-y-5">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-white">Your Identity</h2>
      <p className="text-sm text-gray-400 mt-1">Tell startups who you are as an investor.</p>
    </div>

    <Field label="Name or Firm" required error={errors.name_or_firm}>
      <div className="relative">
        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
        <input
          type="text"
          placeholder="e.g., Acme Ventures or Jane Doe"
          value={formData.name_or_firm}
          onChange={(e) => updateFormData({ name_or_firm: e.target.value })}
          className={iconInputCls}
        />
      </div>
    </Field>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Investor Type" required error={errors.investor_type}>
        <div className="relative">
          <BadgeCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px] pointer-events-none" />
          <select
            value={formData.investor_type}
            onChange={(e) => updateFormData({ investor_type: e.target.value })}
            className={iconInputCls}
          >
            <option value="" className="bg-gray-900">Select type</option>
            {INVESTOR_TYPES.map((t) => (
              <option key={t.value} value={t.value} className="bg-gray-900">{t.label}</option>
            ))}
          </select>
        </div>
      </Field>

      <Field label="Years of Experience" required error={errors.years_of_experience}>
        <div className="relative">
          <CalendarClock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="number"
            min="0"
            placeholder="e.g., 7"
            value={formData.years_of_experience}
            onChange={(e) => updateFormData({ years_of_experience: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Country" required error={errors.location_country}>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px] pointer-events-none" />
          <select
            value={formData.location_country || ""}
            onChange={(e) => updateFormData({ location_country: e.target.value })}
            className={iconInputCls}
          >
            <option value="" className="bg-gray-900">Select country</option>
            {COUNTRIES.map((c) => (
              <option key={c} value={c} className="bg-gray-900">{c}</option>
            ))}
          </select>
        </div>
      </Field>

      <Field label="City" required error={errors.location_city}>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="text"
            placeholder="e.g., New York"
            value={formData.location_city || ""}
            onChange={(e) => updateFormData({ location_city: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Website" hint="optional">
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="url"
            placeholder="https://yourfirm.com"
            value={formData.website_url || ""}
            onChange={(e) => updateFormData({ website_url: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>

      <Field label="LinkedIn Profile" required error={errors.linkedin_url}>
        <div className="relative">
          <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="url"
            placeholder="https://linkedin.com/in/..."
            value={formData.linkedin_url || ""}
            onChange={(e) => updateFormData({ linkedin_url: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>
    </div>

    <Field label="Professional Background" required error={errors.professional_background}>
      <textarea
        rows={4}
        placeholder="Share your investing or operator background, areas of focus, and what drives your investment approach."
        value={formData.professional_background}
        onChange={(e) => {
          const next = e.target.value;
          if (countWords(next) > MAX_BIO_WORDS) {
            updateFormData({
              professional_background: truncateToWords(next, MAX_BIO_WORDS),
            });
            return;
          }
          updateFormData({ professional_background: next });
        }}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all resize-none"
      />
      <div className="mt-1.5 flex justify-end">
        <span
          className={`text-xs ${
            countWords(formData.professional_background) >= MAX_BIO_WORDS
              ? "text-red-400"
              : "text-gray-500"
          }`}
        >
          {countWords(formData.professional_background)} / {MAX_BIO_WORDS} words
        </span>
      </div>
    </Field>
  </div>
);

export default InvestorStep1BasicInfo;
