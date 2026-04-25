import React from "react";
import { Users } from "lucide-react";

const textareaCls =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all resize-none";

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

const Step3TeamInfo = ({ formData, updateFormData, errors }) => (
  <div className="space-y-5">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-white">Team & Traction</h2>
      <p className="text-sm text-gray-400 mt-1">Show investors who's building this and what you've proven so far.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Team Size" required error={errors.team_size}>
        <div className="relative">
          <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="number"
            min="1"
            placeholder="e.g., 8"
            value={formData.team_size}
            onChange={(e) => updateFormData({ team_size: e.target.value })}
            className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all"
          />
        </div>
      </Field>
    </div>

    <Field label="Key Team Members">
      <textarea
        rows={3}
        placeholder="Describe leadership roles — e.g., CTO: 10 yrs ML experience at Google"
        value={formData.key_team_members}
        onChange={(e) => updateFormData({ key_team_members: e.target.value })}
        className={textareaCls}
      />
    </Field>

    <div className="border-t border-white/5 pt-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Traction & Evidence</p>

      <div className="space-y-4">
        <Field label="Key Metrics" hint="optional">
          <textarea
            rows={3}
            placeholder="e.g., $12k MRR, 2,400 active users, 68% retention"
            value={formData.key_metrics}
            onChange={(e) => updateFormData({ key_metrics: e.target.value })}
            className={textareaCls}
          />
        </Field>

        <Field label="Major Achievements" hint="optional">
          <textarea
            rows={3}
            placeholder="Awards, partnerships, notable press, product launches"
            value={formData.major_achievements}
            onChange={(e) => updateFormData({ major_achievements: e.target.value })}
            className={textareaCls}
          />
        </Field>

        <Field label="Customer Testimonials" hint="optional">
          <textarea
            rows={3}
            placeholder="Short customer quotes or testimonial summaries"
            value={formData.customer_testimonials}
            onChange={(e) => updateFormData({ customer_testimonials: e.target.value })}
            className={textareaCls}
          />
        </Field>
      </div>
    </div>
  </div>
);

export default Step3TeamInfo;
