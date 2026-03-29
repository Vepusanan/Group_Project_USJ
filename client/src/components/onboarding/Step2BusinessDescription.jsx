import React from "react";
import { Sparkles, Briefcase, Calendar, TrendingUp } from "lucide-react";

const INDUSTRIES = [
  "FinTech",
  "HealthTech",
  "E-Commerce",
  "SaaS",
  "EdTech",
  "AgriTech",
  "AI/ML",
  "Blockchain",
  "IoT",
  "Cybersecurity",
  "CleanTech",
  "FoodTech",
  "PropTech",
  "Logistics",
  "Other",
];

const STAGES = ["IDEA", "MVP", "EARLY_REVENUE", "GROWTH", "SCALING"];

const Step2BusinessDescription = ({ formData, updateFormData, errors }) => {
  const maxTaglineLength = 150;
  const maxDescriptionLength = 2000;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Business Description
        </h2>
        <p className="text-gray-400">
          Describe your startup and current stage.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tagline
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="A concise one-liner"
            value={formData.tagline}
            onChange={(e) => {
              if (e.target.value.length <= maxTaglineLength) {
                updateFormData({ tagline: e.target.value });
              }
            }}
            maxLength={maxTaglineLength}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          />
        </div>
        <div className="flex justify-between mt-1">
          {errors.tagline && (
            <p className="text-sm text-red-500">{errors.tagline}</p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.tagline.length}/{maxTaglineLength}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Detailed Description
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          placeholder="Describe problem, solution, product, and traction summary..."
          value={formData.detailed_description}
          onChange={(e) => {
            if (e.target.value.length <= maxDescriptionLength) {
              updateFormData({ detailed_description: e.target.value });
            }
          }}
          maxLength={maxDescriptionLength}
          rows={6}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
        <div className="flex justify-between mt-1">
          {errors.detailed_description && (
            <p className="text-sm text-red-500">
              {errors.detailed_description}
            </p>
          )}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.detailed_description.length}/{maxDescriptionLength}
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Industry
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={formData.industry}
            onChange={(e) => updateFormData({ industry: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          >
            <option value="" className="bg-gray-900">
              Select your industry
            </option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry} className="bg-gray-900">
                {industry}
              </option>
            ))}
          </select>
        </div>
        {errors.industry && (
          <p className="text-sm text-red-500 mt-1">{errors.industry}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Founded Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="date"
              value={formData.founded_date}
              onChange={(e) => updateFormData({ founded_date: e.target.value })}
              max={new Date().toISOString().split("T")[0]}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
            />
          </div>
          {errors.founded_date && (
            <p className="text-sm text-red-500 mt-1">{errors.founded_date}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Stage
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={formData.current_stage}
              onChange={(e) =>
                updateFormData({ current_stage: e.target.value })
              }
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
            >
              <option value="" className="bg-gray-900">
                Select stage
              </option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage} className="bg-gray-900">
                  {stage}
                </option>
              ))}
            </select>
          </div>
          {errors.current_stage && (
            <p className="text-sm text-red-500 mt-1">{errors.current_stage}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Step2BusinessDescription;
