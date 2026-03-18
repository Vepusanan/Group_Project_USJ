import React from "react";
import { DollarSign, Zap } from "lucide-react";

const InvestorStep4InvestmentDetails = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const investmentStructures = [
    "Equity",
    "Convertible Note",
    "SAFE",
    "Debt",
    "Revenue Share",
    "Hybrid",
    "Other",
  ];

  const timelines = [
    "Immediate (0-3 months)",
    "Short-term (3-6 months)",
    "Medium-term (6-12 months)",
    "Long-term (1-2 years)",
    "Flexible",
  ];

  const investmentSizes = [
    { value: "10k", label: "$10K - $50K" },
    { value: "50k", label: "$50K - $100K" },
    { value: "100k", label: "$100K - $500K" },
    { value: "500k", label: "$500K - $1M" },
    { value: "1m", label: "$1M - $5M" },
    { value: "5m", label: "$5M - $10M" },
    { value: "10m", label: "$10M+" },
  ];

  const toggleStructure = (structure) => {
    if (formData.investment_structure.includes(structure)) {
      updateFormData({
        investment_structure: formData.investment_structure.filter(
          (s) => s !== structure
        ),
      });
    } else {
      updateFormData({
        investment_structure: [...formData.investment_structure, structure],
      });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Investment Details
        </h2>
        <p className="text-gray-400">
          Information about your investment size, structure, and approach
        </p>
      </div>

      {/* Investment Size Range */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Investment Size Range
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Minimum Investment *
            </label>
            <select
              value={formData.investment_size_min}
              onChange={(e) => {
                updateFormData({ investment_size_min: e.target.value });
                setErrors({ ...errors, investment_size_min: null });
              }}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:outline-none focus:border-purple-600 ${
                errors.investment_size_min
                  ? "border-red-600"
                  : "border-gray-700"
              }`}
            >
              <option value="">Select minimum</option>
              {investmentSizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
            {errors.investment_size_min && (
              <p className="text-red-400 text-sm mt-1">
                {errors.investment_size_min}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Maximum Investment *
            </label>
            <select
              value={formData.investment_size_max}
              onChange={(e) => {
                updateFormData({ investment_size_max: e.target.value });
                setErrors({ ...errors, investment_size_max: null });
              }}
              className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:outline-none focus:border-purple-600 ${
                errors.investment_size_max
                  ? "border-red-600"
                  : "border-gray-700"
              }`}
            >
              <option value="">Select maximum</option>
              {investmentSizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
            {errors.investment_size_max && (
              <p className="text-red-400 text-sm mt-1">
                {errors.investment_size_max}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Investment Structures */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Preferred Investment Structures *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {investmentStructures.map((structure) => (
            <button
              key={structure}
              type="button"
              onClick={() => {
                toggleStructure(structure);
                setErrors({ ...errors, investment_structure: null });
              }}
              className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                formData.investment_structure.includes(structure)
                  ? "border-indigo-600 bg-indigo-600/20 text-indigo-300"
                  : "border-gray-600 bg-gray-800/40 text-gray-400 hover:border-gray-500"
              }`}
            >
              {structure}
            </button>
          ))}
        </div>
        {errors.investment_structure && (
          <p className="text-red-400 text-sm mt-2">
            {errors.investment_structure}
          </p>
        )}
      </div>

      {/* Follow-on Investment */}
      <div>
        <label className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/40 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={formData.follow_on_investment}
            onChange={(e) =>
              updateFormData({ follow_on_investment: e.target.checked })
            }
            className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-purple-600"
          />
          <div>
            <span className="block text-sm font-medium text-white">
              I'm open to follow-on investments
            </span>
            <span className="block text-xs text-gray-400 mt-1">
              Check if you invest in subsequent funding rounds
            </span>
          </div>
        </label>
      </div>

      {/* Investment Timeline */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Investment Timeline
        </label>
        <div className="space-y-2">
          {timelines.map((timeline) => (
            <label
              key={timeline}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="timeline"
                value={timeline}
                checked={formData.investment_timeline === timeline}
                onChange={(e) =>
                  updateFormData({ investment_timeline: e.target.value })
                }
                className="w-4 h-4 border-gray-600 text-purple-600 focus:ring-purple-600"
              />
              <span className="text-gray-300">{timeline}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">
          ℹ️ Investment Structure Tips:
        </h3>
        <p className="text-sm text-gray-400">
          Different structures appeal to founders at different stages.
          Specifying your preferences helps startups identify if you're a good
          fit for their funding needs.
        </p>
      </div>
    </div>
  );
};

export default InvestorStep4InvestmentDetails;
