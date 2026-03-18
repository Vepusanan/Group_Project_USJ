import React from "react";
import { X } from "lucide-react";

const InvestorStep3InvestmentFocus = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const industries = [
    "SaaS",
    "E-commerce",
    "FinTech",
    "HealthTech",
    "EdTech",
    "AI/ML",
    "Blockchain",
    "IoT",
    "CleanTech",
    "BioTech",
    "Real Estate",
    "Food & Beverage",
    "Travel & Hospitality",
    "Media & Entertainment",
    "Manufacturing",
    "Logistics",
    "Other",
  ];

  const geographies = [
    "North America",
    "South America",
    "Europe",
    "Africa",
    "Middle East",
    "India",
    "Southeast Asia",
    "East Asia",
    "Oceania",
    "Global",
  ];

  const investmentStages = [
    "Pre-Seed",
    "Seed",
    "Series A",
    "Series B",
    "Series C+",
    "Late Stage",
    "Growth Stage",
    "Acquisition Ready",
  ];

  const toggleOption = (array, value) => {
    if (array.includes(value)) {
      return array.filter((item) => item !== value);
    } else {
      return [...array, value];
    }
  };

  const handleIndustryChange = (industry) => {
    updateFormData({
      industries: toggleOption(formData.industries, industry),
    });
    setErrors({ ...errors, industries: null });
  };

  const handleGeographyChange = (geo) => {
    updateFormData({
      geography: toggleOption(formData.geography, geo),
    });
  };

  const handleStageChange = (stage) => {
    updateFormData({
      investment_stage: toggleOption(formData.investment_stage, stage),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Investment Focus
        </h2>
        <p className="text-gray-400">
          Tell us about your investment thesis and focus areas
        </p>
      </div>

      {/* Investment Thesis */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Investment Thesis *
        </label>
        <textarea
          value={formData.investment_thesis}
          onChange={(e) => {
            updateFormData({ investment_thesis: e.target.value });
            setErrors({ ...errors, investment_thesis: null });
          }}
          placeholder="Describe your investment philosophy and what you look for in startups..."
          maxLength={500}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 resize-none h-24 ${
            errors.investment_thesis ? "border-red-600" : "border-gray-700"
          }`}
        />
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-gray-500">
            {formData.investment_thesis.length}/500 characters
          </span>
          {errors.investment_thesis && (
            <p className="text-red-400 text-sm">{errors.investment_thesis}</p>
          )}
        </div>
      </div>

      {/* Industries */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Industries of Interest *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {industries.map((industry) => (
            <button
              key={industry}
              type="button"
              onClick={() => handleIndustryChange(industry)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                formData.industries.includes(industry)
                  ? "border-purple-600 bg-purple-600/20 text-purple-300"
                  : "border-gray-600 bg-gray-800/40 text-gray-400 hover:border-gray-500"
              }`}
            >
              {industry}
            </button>
          ))}
        </div>
        {errors.industries && (
          <p className="text-red-400 text-sm mt-2">{errors.industries}</p>
        )}
      </div>

      {/* Geographic Focus */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Geographic Focus
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {geographies.map((geo) => (
            <button
              key={geo}
              type="button"
              onClick={() => handleGeographyChange(geo)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                formData.geography.includes(geo)
                  ? "border-blue-600 bg-blue-600/20 text-blue-300"
                  : "border-gray-600 bg-gray-800/40 text-gray-400 hover:border-gray-500"
              }`}
            >
              {geo}
            </button>
          ))}
        </div>
      </div>

      {/* Investment Stages */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Investment Stages
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {investmentStages.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => handleStageChange(stage)}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all text-left ${
                formData.investment_stage.includes(stage)
                  ? "border-green-600 bg-green-600/20 text-green-300"
                  : "border-gray-600 bg-gray-800/40 text-gray-400 hover:border-gray-500"
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Selected Summary */}
      {(formData.industries.length > 0 ||
        formData.geography.length > 0 ||
        formData.investment_stage.length > 0) && (
        <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/30 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-white mb-3">
            Your Focus Areas
          </h3>
          <div className="space-y-2 text-sm">
            {formData.industries.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.industries.map((ind) => (
                  <span
                    key={ind}
                    className="px-3 py-1 bg-purple-600/30 text-purple-200 rounded-full text-xs"
                  >
                    {ind}
                  </span>
                ))}
              </div>
            )}
            {formData.geography.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.geography.map((geo) => (
                  <span
                    key={geo}
                    className="px-3 py-1 bg-blue-600/30 text-blue-200 rounded-full text-xs"
                  >
                    {geo}
                  </span>
                ))}
              </div>
            )}
            {formData.investment_stage.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.investment_stage.map((stage) => (
                  <span
                    key={stage}
                    className="px-3 py-1 bg-green-600/30 text-green-200 rounded-full text-xs"
                  >
                    {stage}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InvestorStep3InvestmentFocus;
