import React from "react";

const INDUSTRIES = [
  "FinTech","HealthTech","SaaS","EdTech","AI/ML","ClimateTech",
  "Cybersecurity","E-Commerce","Logistics","AgriTech","PropTech","Other",
];

const GEOGRAPHIES = [
  "Global","North America","Europe","APAC","MENA","LATAM","Africa","South Asia",
];

// Stage preference values must match the startup funding_stage vocabulary so
// the InvestorsPage stage filter and the startup ↔ investor matching work.
const STAGES = [
  { value: "PRE_SEED", label: "Pre-seed" },
  { value: "SEED", label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "SERIES_D_PLUS", label: "Series D+" },
];

const toggle = (arr, val) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

const PillGroup = ({ items, selected, onToggle, activeColor }) => (
  <div className="flex flex-wrap gap-2">
    {items.map((item) => {
      const val = typeof item === "object" ? item.value : item;
      const label = typeof item === "object" ? item.label : item;
      const isSelected = selected.includes(val);
      return (
        <button
          key={val}
          type="button"
          onClick={() => onToggle(val)}
          className={`px-3.5 py-1.5 rounded-full text-sm border transition-all ${
            isSelected
              ? `${activeColor} font-medium`
              : "bg-white/3 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
          }`}
        >
          {label}
        </button>
      );
    })}
  </div>
);

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
  </div>
);

const InvestorStep2Classification = ({ formData, updateFormData, errors }) => (
  <div className="space-y-6">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-white">Investment Focus</h2>
      <p className="text-sm text-gray-400 mt-1">Define your thesis and the markets you target.</p>
    </div>

    <Field label="Investment Thesis" required error={errors.investment_thesis}>
      <textarea
        rows={4}
        placeholder="Describe your core investment thesis and the opportunities you're most excited about."
        value={formData.investment_thesis}
        onChange={(e) => updateFormData({ investment_thesis: e.target.value })}
        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all resize-none"
      />
    </Field>

    <Field label="Industries of Interest" required error={errors.industries_of_interest}>
      <PillGroup
        items={INDUSTRIES}
        selected={formData.industries_of_interest}
        onToggle={(val) => updateFormData({ industries_of_interest: toggle(formData.industries_of_interest, val) })}
        activeColor="bg-violet-600/25 border-violet-500/50 text-violet-300"
      />
    </Field>

    <Field label="Geographic Preference" required error={errors.geographic_preference}>
      <PillGroup
        items={GEOGRAPHIES}
        selected={formData.geographic_preference}
        onToggle={(val) => updateFormData({ geographic_preference: toggle(formData.geographic_preference, val) })}
        activeColor="bg-blue-600/25 border-blue-500/50 text-blue-300"
      />
    </Field>

    <Field label="Stage Preference" required error={errors.stage_preference}>
      <PillGroup
        items={STAGES}
        selected={formData.stage_preference}
        onToggle={(val) => updateFormData({ stage_preference: toggle(formData.stage_preference, val) })}
        activeColor="bg-emerald-600/25 border-emerald-500/50 text-emerald-300"
      />
    </Field>
  </div>
);

export default InvestorStep2Classification;
