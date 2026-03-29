import React from "react";

const STRUCTURES = [
  "EQUITY",
  "SAFE",
  "CONVERTIBLE_NOTE",
  "DEBT",
  "GRANT",
  "OTHER",
];
const TIMELINES = ["IMMEDIATE", "1_3_MONTHS", "3_6_MONTHS", "6_PLUS_MONTHS"];

const toggleArrayItem = (items, value) => {
  if (items.includes(value)) return items.filter((item) => item !== value);
  return [...items, value];
};

const InvestorStep3InvestmentFocus = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Investment Focus</h2>
        <p className="text-gray-400">
          Set your check size and deal structure preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Min Investment Size (USD)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.min_investment_size}
            onChange={(e) =>
              updateFormData({ min_investment_size: e.target.value })
            }
            className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          />
          {errors.min_investment_size && (
            <p className="text-sm text-red-500 mt-1">
              {errors.min_investment_size}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Max Investment Size (USD)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.max_investment_size}
            onChange={(e) =>
              updateFormData({ max_investment_size: e.target.value })
            }
            className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          />
          {errors.max_investment_size && (
            <p className="text-sm text-red-500 mt-1">
              {errors.max_investment_size}
            </p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Investment Structure<span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {STRUCTURES.map((structure) => {
            const selected = formData.investment_structure.includes(structure);
            return (
              <button
                key={structure}
                type="button"
                onClick={() =>
                  updateFormData({
                    investment_structure: toggleArrayItem(
                      formData.investment_structure,
                      structure,
                    ),
                  })
                }
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  selected
                    ? "bg-indigo-600/30 border-indigo-500 text-indigo-200"
                    : "bg-white/5 border-gray-600 text-gray-300 hover:border-gray-500"
                }`}
              >
                {structure}
              </button>
            );
          })}
        </div>
        {errors.investment_structure && (
          <p className="text-sm text-red-500 mt-1">
            {errors.investment_structure}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <input
          id="follow-on"
          type="checkbox"
          checked={Boolean(formData.follow_on_investment)}
          onChange={(e) =>
            updateFormData({ follow_on_investment: e.target.checked })
          }
          className="h-4 w-4 rounded border-gray-500 bg-white/5"
        />
        <label htmlFor="follow-on" className="text-sm text-gray-300">
          Open to follow-on investments
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Investment Timeline
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          value={formData.investment_timeline}
          onChange={(e) =>
            updateFormData({ investment_timeline: e.target.value })
          }
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
        >
          <option value="" className="bg-gray-900">
            Select timeline
          </option>
          {TIMELINES.map((timeline) => (
            <option key={timeline} value={timeline} className="bg-gray-900">
              {timeline}
            </option>
          ))}
        </select>
        {errors.investment_timeline && (
          <p className="text-sm text-red-500 mt-1">
            {errors.investment_timeline}
          </p>
        )}
      </div>
    </div>
  );
};

export default InvestorStep3InvestmentFocus;
