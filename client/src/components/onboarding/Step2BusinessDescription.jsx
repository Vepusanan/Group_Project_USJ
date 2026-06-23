import React from "react";
import { Briefcase, Calendar, Sparkles, TrendingUp } from "lucide-react";
import {
  onboardingIconInputClass,
  onboardingTextareaClass,
} from "./onboardingStyles";

const INDUSTRIES = [
  "FinTech","HealthTech","E-Commerce","SaaS","EdTech","AgriTech","AI/ML",
  "Blockchain","IoT","Cybersecurity","CleanTech","FoodTech","PropTech","Logistics","Other",
];

const STAGES = [
  { value: "IDEA", label: "Idea" },
  { value: "MVP", label: "MVP" },
  { value: "EARLY_REVENUE", label: "Early Revenue" },
  { value: "GROWTH", label: "Growth" },
  { value: "SCALING", label: "Scaling" },
];

const iconInputCls = onboardingIconInputClass;
const textareaCls = onboardingTextareaClass;

const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-content-secondary mb-1.5">
      {label}
      {required && <span className="text-error ml-1">*</span>}
      {hint && <span className="text-content-muted font-normal ml-2 text-xs">{hint}</span>}
    </label>
    {children}
    {error && <p className="text-xs text-error mt-1.5">{error}</p>}
  </div>
);

const Step2BusinessDescription = ({ formData, updateFormData, errors }) => {
  const maxTagline = 150;
  const maxDesc = 2000;

  return (
    <div className="space-y-5">
      <div className="pb-2">
        <h2 className="text-xl font-semibold text-content">Business Overview</h2>
        <p className="text-sm text-content-muted mt-1">Tell investors what you do and where you stand.</p>
      </div>

      <Field label="Tagline" required error={errors.tagline} hint={`${formData.tagline.length}/${maxTagline}`}>
        <div className="relative">
          <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
          <input
            type="text"
            placeholder="A punchy one-liner that captures your value"
            value={formData.tagline}
            maxLength={maxTagline}
            onChange={(e) => updateFormData({ tagline: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>

      <Field label="Detailed Description" required error={errors.detailed_description} hint={`${formData.detailed_description.length}/${maxDesc}`}>
        <textarea
          placeholder="Describe the problem, your solution, the product, and early traction..."
          value={formData.detailed_description}
          maxLength={maxDesc}
          rows={5}
          onChange={(e) => updateFormData({ detailed_description: e.target.value })}
          className={textareaCls}
        />
      </Field>

      <Field label="Industry" required error={errors.industry}>
        <div className="relative">
          <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px] pointer-events-none" />
          <select
            value={formData.industry}
            onChange={(e) => updateFormData({ industry: e.target.value })}
            className={iconInputCls}
          >
            <option value="" className="bg-surface">Select your industry</option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i} className="bg-surface">{i}</option>
            ))}
          </select>
        </div>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Founded Date" required error={errors.founded_date}>
          <div className="relative">
            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px] pointer-events-none" />
            <input
              type="date"
              value={formData.founded_date}
              max={new Date().toISOString().split("T")[0]}
              onChange={(e) => updateFormData({ founded_date: e.target.value })}
              className={iconInputCls}
            />
          </div>
        </Field>

        <Field label="Current Stage" required error={errors.current_stage}>
          <div className="relative">
            <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px] pointer-events-none" />
            <select
              value={formData.current_stage}
              onChange={(e) => updateFormData({ current_stage: e.target.value })}
              className={iconInputCls}
            >
              <option value="" className="bg-surface">Select stage</option>
              {STAGES.map((s) => (
                <option key={s.value} value={s.value} className="bg-surface">{s.label}</option>
              ))}
            </select>
          </div>
        </Field>
      </div>
    </div>
  );
};

export default Step2BusinessDescription;
