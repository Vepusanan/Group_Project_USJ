import React from "react";

const INDUSTRIES = [
  "FinTech",
  "HealthTech",
  "SaaS",
  "EdTech",
  "AI/ML",
  "ClimateTech",
  "Cybersecurity",
  "E-Commerce",
  "Logistics",
  "Other",
];

const GEOGRAPHIES = ["Global", "North America", "Europe", "APAC", "MENA", "LATAM", "Africa"];

const STAGES = ["IDEA", "MVP", "EARLY_REVENUE", "GROWTH", "SCALING"];

const toggleArrayItem = (items, value) => {
  if (items.includes(value)) return items.filter((item) => item !== value);
  return [...items, value];
};

const InvestorStep2Classification = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Classification</h2>
        <p className="text-gray-400">Define your thesis and market focus.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Investment Thesis
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="Describe your thesis and target opportunities."
          value={formData.investment_thesis}
          onChange={(e) => updateFormData({ investment_thesis: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
        {errors.investment_thesis && <p className="text-sm text-red-500 mt-1">{errors.investment_thesis}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Industries of Interest<span className="text-red-500 ml-1">*</span></label>
        <div className="flex flex-wrap gap-2">
          {INDUSTRIES.map((industry) => {
            const selected = formData.industries_of_interest.includes(industry);
            return (
              <button
                key={industry}
                type="button"
                onClick={() =>
                  updateFormData({
                    industries_of_interest: toggleArrayItem(formData.industries_of_interest, industry),
                  })
                }
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selected
                    ? "bg-purple-600/30 border-purple-500 text-purple-200"
                    : "bg-white/5 border-gray-600 text-gray-300 hover:border-gray-500"
                }`}
              >
                {industry}
              </button>
            );
          })}
        </div>
        {errors.industries_of_interest && <p className="text-sm text-red-500 mt-1">{errors.industries_of_interest}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Geographic Preference<span className="text-red-500 ml-1">*</span></label>
        <div className="flex flex-wrap gap-2">
          {GEOGRAPHIES.map((geo) => {
            const selected = formData.geographic_preference.includes(geo);
            return (
              <button
                key={geo}
                type="button"
                onClick={() =>
                  updateFormData({
                    geographic_preference: toggleArrayItem(formData.geographic_preference, geo),
                  })
                }
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selected
                    ? "bg-blue-600/30 border-blue-500 text-blue-200"
                    : "bg-white/5 border-gray-600 text-gray-300 hover:border-gray-500"
                }`}
              >
                {geo}
              </button>
            );
          })}
        </div>
        {errors.geographic_preference && <p className="text-sm text-red-500 mt-1">{errors.geographic_preference}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Stage Preference<span className="text-red-500 ml-1">*</span></label>
        <div className="flex flex-wrap gap-2">
          {STAGES.map((stage) => {
            const selected = formData.stage_preference.includes(stage);
            return (
              <button
                key={stage}
                type="button"
                onClick={() =>
                  updateFormData({
                    stage_preference: toggleArrayItem(formData.stage_preference, stage),
                  })
                }
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selected
                    ? "bg-emerald-600/30 border-emerald-500 text-emerald-200"
                    : "bg-white/5 border-gray-600 text-gray-300 hover:border-gray-500"
                }`}
              >
                {stage}
              </button>
            );
          })}
        </div>
        {errors.stage_preference && <p className="text-sm text-red-500 mt-1">{errors.stage_preference}</p>}
      </div>
    </div>
  );
};

export default InvestorStep2Classification;
