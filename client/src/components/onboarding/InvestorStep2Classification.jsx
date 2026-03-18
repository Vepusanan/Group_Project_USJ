import React from "react";
import { Award, Zap, Users } from "lucide-react";

const InvestorStep2Classification = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const investorTypes = [
    { value: "angel", label: "Angel Investor", icon: Zap },
    { value: "venture_capital", label: "Venture Capital", icon: Award },
    { value: "family_office", label: "Family Office", icon: Users },
    { value: "corporate", label: "Corporate Venture", icon: Award },
    { value: "private_equity", label: "Private Equity", icon: Award },
    { value: "other", label: "Other", icon: Zap },
  ];

  const experienceOptions = [
    { value: 0, label: "Less than 1 year" },
    { value: 1, label: "1-3 years" },
    { value: 3, label: "3-5 years" },
    { value: 5, label: "5-10 years" },
    { value: 10, label: "More than 10 years" },
  ];

  const backgroundOptions = [
    "Entrepreneurship",
    "Finance/Banking",
    "Technology",
    "Operations",
    "Strategy",
    "Sales & Marketing",
    "Human Resources",
    "Other",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Investor Classification
        </h2>
        <p className="text-gray-400">
          Tell us about your investor profile and experience
        </p>
      </div>

      {/* Investor Type */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Investor Type *
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {investorTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => {
                updateFormData({ investor_type: type.value });
                setErrors({ ...errors, investor_type: null });
              }}
              className={`p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                formData.investor_type === type.value
                  ? "border-purple-600 bg-purple-600/10 text-purple-400"
                  : "border-gray-700 bg-gray-800/40 text-gray-300 hover:border-gray-600"
              }`}
            >
              <type.icon className="w-5 h-5" />
              <span className="font-medium">{type.label}</span>
            </button>
          ))}
        </div>
        {errors.investor_type && (
          <p className="text-red-400 text-sm mt-2">{errors.investor_type}</p>
        )}
      </div>

      {/* Years of Experience */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Years of Experience *
        </label>
        <select
          value={formData.years_of_experience}
          onChange={(e) => {
            updateFormData({ years_of_experience: e.target.value });
            setErrors({ ...errors, years_of_experience: null });
          }}
          className={`w-full px-4 py-3 bg-gray-800 border rounded-lg text-white focus:outline-none focus:border-purple-600 ${
            errors.years_of_experience
              ? "border-red-600"
              : "border-gray-700"
          }`}
        >
          <option value="">Select your experience level</option>
          {experienceOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {errors.years_of_experience && (
          <p className="text-red-400 text-sm mt-2">
            {errors.years_of_experience}
          </p>
        )}
      </div>

      {/* Professional Background */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Professional Background
        </label>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {backgroundOptions.map((option) => (
            <label
              key={option}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={formData.background === option}
                onChange={(e) => {
                  if (e.target.checked) {
                    updateFormData({ background: option });
                  } else {
                    updateFormData({ background: "" });
                  }
                }}
                className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-600"
              />
              <span className="text-gray-300">{option}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-purple-300 mb-2">
          💡 Why we ask this:
        </h3>
        <p className="text-sm text-gray-400">
          Your investor classification and background help startups understand
          your investment experience and expertise areas. This information makes
          your profile more discoverable to founders seeking investors with your
          specific background.
        </p>
      </div>
    </div>
  );
};

export default InvestorStep2Classification;
