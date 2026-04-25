import React from "react";

const textareaCls =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all resize-none";

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

const InvestorStep4InvestmentDetails = ({ formData, updateFormData, errors }) => (
  <div className="space-y-5">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-white">Portfolio & Criteria</h2>
      <p className="text-sm text-gray-400 mt-1">Share your track record and what you look for in investments.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Number of Investments" hint="optional">
        <input
          type="number"
          min="0"
          placeholder="e.g., 24"
          value={formData.number_of_investments}
          onChange={(e) => updateFormData({ number_of_investments: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
        />
      </Field>

      <Field label="Successful Exits" hint="optional">
        <input
          type="number"
          min="0"
          placeholder="e.g., 5"
          value={formData.successful_exits}
          onChange={(e) => updateFormData({ successful_exits: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all"
        />
      </Field>
    </div>

    <Field label="Portfolio Companies" hint="optional">
      <textarea
        rows={3}
        placeholder="List representative portfolio companies, e.g., Stripe, Airbnb, Notion"
        value={formData.portfolio_companies}
        onChange={(e) => updateFormData({ portfolio_companies: e.target.value })}
        className={textareaCls}
      />
    </Field>

    <Field label="Notable Achievements" hint="optional">
      <textarea
        rows={3}
        placeholder="Awards, recognitions, or career highlights"
        value={formData.notable_achievements}
        onChange={(e) => updateFormData({ notable_achievements: e.target.value })}
        className={textareaCls}
      />
    </Field>

    <div className="border-t border-white/5 pt-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Investment Criteria</p>

      <div className="space-y-4">
        <Field label="What You Look For" required error={errors.what_you_look_for}>
          <textarea
            rows={3}
            placeholder="Key qualities, traction signals, and founder traits you prioritize"
            value={formData.what_you_look_for}
            onChange={(e) => updateFormData({ what_you_look_for: e.target.value })}
            className={textareaCls}
          />
        </Field>

        <Field label="Value Add" required error={errors.value_add}>
          <textarea
            rows={3}
            placeholder="How do you support portfolio companies beyond capital?"
            value={formData.value_add}
            onChange={(e) => updateFormData({ value_add: e.target.value })}
            className={textareaCls}
          />
        </Field>

        <Field label="Deal Breakers" hint="optional">
          <textarea
            rows={3}
            placeholder="Red flags or patterns that prevent investment"
            value={formData.deal_breakers}
            onChange={(e) => updateFormData({ deal_breakers: e.target.value })}
            className={textareaCls}
          />
        </Field>

        <Field label="Network & Resources" hint="optional">
          <textarea
            rows={3}
            placeholder="Partnerships, distribution channels, or expertise you can unlock for founders"
            value={formData.network_resources}
            onChange={(e) => updateFormData({ network_resources: e.target.value })}
            className={textareaCls}
          />
        </Field>
      </div>
    </div>
  </div>
);

export default InvestorStep4InvestmentDetails;
