import React from "react";

const INDUSTRIES = [
  "FinTech","HealthTech","SaaS","EdTech","AI/ML","ClimateTech",
  "Cybersecurity","E-Commerce","Logistics","AgriTech","PropTech","Other",
];

const GEOGRAPHIES = [
  "Global","North America","Europe","APAC","MENA","LATAM","Africa","South Asia",
];

// Stage preference values must match InvestorsPage filter options.
const STAGES = [
  { value: "IDEA", label: "Idea Stage" },
  { value: "MVP", label: "MVP" },
  { value: "EARLY_REVENUE", label: "Early Revenue" },
  { value: "GROWTH", label: "Growth" },
  { value: "SCALING", label: "Scaling" },
  { value: "PRE_SEED", label: "Pre-seed (Funding)" },
  { value: "SEED", label: "Seed (Funding)" },
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
          className={`px-3.5 py-1.5 rounded-full text-sm !border !border-solid transition-all ${
            isSelected
              ? `${activeColor} font-medium`
              : "bg-surface-container-lowest !border-outline-variant/70 text-on-surface-variant hover:!border-primary/40"
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
    <label className="block text-sm font-medium text-content-secondary mb-2">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-error mt-1.5">{error}</p>}
  </div>
);

const InvestorStep2Classification = ({ formData, updateFormData, errors }) => (
  <div className="space-y-6">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-content">Investment Focus</h2>
      <p className="text-sm text-content-muted mt-1">Define your thesis and the markets you target.</p>
    </div>

    <Field label="Investment Thesis" required error={errors.investment_thesis}>
      <textarea
        rows={4}
        placeholder="Describe your core investment thesis and the opportunities you're most excited about."
        value={formData.investment_thesis}
        onChange={(e) => updateFormData({ investment_thesis: e.target.value })}
        className="w-full px-4 py-3 bg-surface-alt border border-line rounded-xl text-content placeholder:text-content-muted focus:outline-none focus:border-primary-light focus:bg-surface-alt transition-all resize-none"
      />
    </Field>

    <Field label="Industries of Interest" required error={errors.industries_of_interest}>
      <PillGroup
        items={INDUSTRIES}
        selected={formData.industries_of_interest}
        onToggle={(val) => updateFormData({ industries_of_interest: toggle(formData.industries_of_interest, val) })}
        activeColor="bg-primary-light !border-primary/50 text-primary"
      />
    </Field>

    <Field label="Geographic Preference" required error={errors.geographic_preference}>
      <PillGroup
        items={GEOGRAPHIES}
        selected={formData.geographic_preference}
        onToggle={(val) => updateFormData({ geographic_preference: toggle(formData.geographic_preference, val) })}
        activeColor="bg-primary/15 !border-primary/50 text-primary"
      />
    </Field>

    <Field label="Stage Preference" required error={errors.stage_preference}>
      <PillGroup
        items={STAGES}
        selected={formData.stage_preference}
        onToggle={(val) => updateFormData({ stage_preference: toggle(formData.stage_preference, val) })}
        activeColor="bg-primary/15 !border-primary/50 text-primary"
      />
    </Field>
  </div>
);

export default InvestorStep2Classification;
