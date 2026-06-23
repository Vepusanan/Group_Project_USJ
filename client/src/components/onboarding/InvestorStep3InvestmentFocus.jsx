import React from "react";
import { DollarSign } from "lucide-react";

const STRUCTURES = [
  { value: "EQUITY", label: "Equity" },
  { value: "SAFE", label: "SAFE" },
  { value: "CONVERTIBLE_NOTE", label: "Convertible Note" },
  { value: "DEBT", label: "Debt" },
  { value: "GRANT", label: "Grant" },
  { value: "OTHER", label: "Other" },
];

const TIMELINES = [
  { value: "IMMEDIATE", label: "Immediate" },
  { value: "1_3_MONTHS", label: "1–3 months" },
  { value: "3_6_MONTHS", label: "3–6 months" },
  { value: "6_PLUS_MONTHS", label: "6+ months" },
];

const toggle = (arr, val) =>
  arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];

const iconInputCls =
  "w-full pl-11 pr-4 py-3 bg-surface-alt border border-line rounded-xl text-content placeholder:text-content-muted focus:outline-none focus:border-primary-light focus:bg-surface-alt transition-all appearance-none";

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-content-secondary mb-1.5">
      {label}
      {required && <span className="text-error ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-error mt-1.5">{error}</p>}
  </div>
);

const pillBaseClass = "text-sm !border !border-solid transition-all";
const pillInactiveClass =
  "bg-surface-container-lowest !border-outline-variant/70 text-on-surface-variant hover:!border-primary/40";
const pillActiveClass = "bg-primary/15 !border-primary/50 text-primary font-medium";
const timelineActiveClass = "bg-primary-light !border-primary/50 text-primary font-medium";

const InvestorStep3InvestmentFocus = ({ formData, updateFormData, errors }) => (
  <div className="space-y-5">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-content">Investment Details</h2>
      <p className="text-sm text-content-muted mt-1">Set your check size, structure preferences, and timeline.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Min Investment (USD)" required error={errors.min_investment_size}>
        <div className="relative">
          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
          <input
            type="number"
            min="0"
            placeholder="e.g., 25000"
            value={formData.min_investment_size}
            onChange={(e) => updateFormData({ min_investment_size: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>

      <Field label="Max Investment (USD)" required error={errors.max_investment_size}>
        <div className="relative">
          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
          <input
            type="number"
            min="0"
            placeholder="e.g., 500000"
            value={formData.max_investment_size}
            onChange={(e) => updateFormData({ max_investment_size: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>
    </div>

    <Field label="Investment Structure" required error={errors.investment_structure}>
      <div className="flex flex-wrap gap-2">
        {STRUCTURES.map((s) => {
          const selected = formData.investment_structure.includes(s.value);
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => updateFormData({ investment_structure: toggle(formData.investment_structure, s.value) })}
              className={`px-3.5 py-1.5 rounded-full ${pillBaseClass} ${
                selected ? pillActiveClass : pillInactiveClass
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </Field>

    <Field label="Investment Timeline" required error={errors.investment_timeline}>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {TIMELINES.map((t) => {
          const selected = formData.investment_timeline === t.value;
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => updateFormData({ investment_timeline: t.value })}
              className={`py-2.5 px-3 rounded-xl ${pillBaseClass} text-center ${
                selected ? timelineActiveClass : pillInactiveClass
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>
    </Field>

    <div
      onClick={() => updateFormData({ follow_on_investment: !formData.follow_on_investment })}
      className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
        formData.follow_on_investment
          ? "bg-primary-light border-primary-light"
          : "bg-surface-alt border-line hover:border-line"
      }`}
    >
      <div className={`w-5 h-5 rounded flex items-center justify-center border transition-all ${
        formData.follow_on_investment ? "bg-primary-light border-primary-light" : "border-line bg-surface-alt"
      }`}>
        {formData.follow_on_investment && (
          <svg className="w-3 h-3 text-content" fill="none" viewBox="0 0 12 12">
            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-content">Open to follow-on investments</p>
        <p className="text-xs text-content-muted mt-0.5">You're willing to invest in subsequent rounds for portfolio companies</p>
      </div>
    </div>
  </div>
);

export default InvestorStep3InvestmentFocus;
