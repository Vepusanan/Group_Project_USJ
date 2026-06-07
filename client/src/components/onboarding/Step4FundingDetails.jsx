import React from "react";
import { DollarSign, Link as LinkIcon, TrendingUp } from "lucide-react";

const FUNDING_STAGES = [
  { value: "PRE_SEED", label: "Pre-Seed" },
  { value: "SEED", label: "Seed" },
  { value: "SERIES_A", label: "Series A" },
  { value: "SERIES_B", label: "Series B" },
  { value: "SERIES_C", label: "Series C" },
  { value: "SERIES_D_PLUS", label: "Series D+" },
];

const REVENUE_STATUSES = [
  { value: "PRE_REVENUE", label: "Pre-Revenue" },
  { value: "REVENUE_GENERATING", label: "Revenue Generating" },
  { value: "PROFITABLE", label: "Profitable" },
];

const iconInputCls =
  "w-full pl-11 pr-4 py-3 bg-surface-alt border border-line rounded-xl text-content placeholder:text-content-muted focus:outline-none focus:border-primary focus:bg-surface-alt transition-all appearance-none";

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

const UrlField = ({ label, value, onChange, placeholder }) => (
  <Field label={label} hint="optional">
    <div className="relative">
      <LinkIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
      <input
        type="url"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={iconInputCls}
      />
    </div>
  </Field>
);

const Step4FundingDetails = ({ formData, updateFormData, errors }) => (
  <div className="space-y-5">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-content">Funding & Documents</h2>
      <p className="text-sm text-content-muted mt-1">Define your raise and share investor materials.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Funding Stage" required error={errors.funding_stage}>
        <div className="relative">
          <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px] pointer-events-none" />
          <select
            value={formData.funding_stage}
            onChange={(e) => updateFormData({ funding_stage: e.target.value })}
            className={iconInputCls}
          >
            <option value="" className="bg-surface">Select stage</option>
            {FUNDING_STAGES.map((s) => (
              <option key={s.value} value={s.value} className="bg-surface">{s.label}</option>
            ))}
          </select>
        </div>
      </Field>

      <Field label="Revenue Status" required error={errors.revenue_status}>
        <div className="relative">
          <TrendingUp className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px] pointer-events-none" />
          <select
            value={formData.revenue_status}
            onChange={(e) => updateFormData({ revenue_status: e.target.value })}
            className={iconInputCls}
          >
            <option value="" className="bg-surface">Select status</option>
            {REVENUE_STATUSES.map((s) => (
              <option key={s.value} value={s.value} className="bg-surface">{s.label}</option>
            ))}
          </select>
        </div>
      </Field>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Amount Seeking (USD)" required error={errors.amount_seeking}>
        <div className="relative">
          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
          <input
            type="number"
            min="1"
            placeholder="e.g., 500000"
            value={formData.amount_seeking}
            onChange={(e) => updateFormData({ amount_seeking: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>

      <Field label="Previous Funding (USD)" hint="optional">
        <div className="relative">
          <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
          <input
            type="number"
            min="0"
            placeholder="e.g., 0"
            value={formData.previous_funding}
            onChange={(e) => updateFormData({ previous_funding: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>
    </div>

    <Field label="Use of Funds" required error={errors.use_of_funds}>
      <textarea
        rows={4}
        placeholder="How will this round be allocated? e.g., 40% product, 35% hiring, 25% marketing"
        value={formData.use_of_funds}
        onChange={(e) => updateFormData({ use_of_funds: e.target.value })}
        className="w-full px-4 py-3 bg-surface-alt border border-line rounded-xl text-content placeholder:text-content-muted focus:outline-none focus:border-primary focus:bg-surface-alt transition-all resize-none"
      />
    </Field>

    <div className="border-t border-line pt-5">
      <p className="text-xs font-semibold text-content-muted uppercase tracking-widest mb-4">Investor Materials</p>
      <div className="space-y-4">
        <UrlField
          label="Pitch Deck URL"
          value={formData.pitch_deck_url}
          onChange={(e) => updateFormData({ pitch_deck_url: e.target.value })}
          placeholder="https://drive.google.com/..."
        />
        <UrlField
          label="Business Plan URL"
          value={formData.business_plan_url}
          onChange={(e) => updateFormData({ business_plan_url: e.target.value })}
          placeholder="https://..."
        />
        <UrlField
          label="Product Demo URL"
          value={formData.product_demo_url}
          onChange={(e) => updateFormData({ product_demo_url: e.target.value })}
          placeholder="https://loom.com/..."
        />
      </div>
    </div>
  </div>
);

export default Step4FundingDetails;
