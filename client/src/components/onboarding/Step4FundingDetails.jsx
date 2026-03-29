import React from "react";

const FUNDING_STAGES = [
  "PRE_SEED",
  "SEED",
  "SERIES_A",
  "SERIES_B",
  "SERIES_C",
  "SERIES_D_PLUS",
];

const REVENUE_STATUSES = ["PRE_REVENUE", "REVENUE_GENERATING", "PROFITABLE"];

const Step4FundingDetails = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Funding Details</h2>
        <p className="text-gray-400">Provide funding and revenue profile details.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Funding Stage
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          value={formData.funding_stage}
          onChange={(e) => updateFormData({ funding_stage: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
        >
          <option value="" className="bg-gray-900">Select funding stage</option>
          {FUNDING_STAGES.map((stage) => (
            <option key={stage} value={stage} className="bg-gray-900">{stage}</option>
          ))}
        </select>
        {errors.funding_stage && <p className="text-sm text-red-500 mt-1">{errors.funding_stage}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount Seeking (USD)
            <span className="text-red-500 ml-1">*</span>
          </label>
          <input
            type="number"
            min="1"
            step="0.01"
            value={formData.amount_seeking}
            onChange={(e) => updateFormData({ amount_seeking: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          />
          {errors.amount_seeking && <p className="text-sm text-red-500 mt-1">{errors.amount_seeking}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Previous Funding (USD)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.previous_funding}
            onChange={(e) => updateFormData({ previous_funding: e.target.value })}
            className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Revenue Status
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          value={formData.revenue_status}
          onChange={(e) => updateFormData({ revenue_status: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
        >
          <option value="" className="bg-gray-900">Select revenue status</option>
          {REVENUE_STATUSES.map((status) => (
            <option key={status} value={status} className="bg-gray-900">{status}</option>
          ))}
        </select>
        {errors.revenue_status && <p className="text-sm text-red-500 mt-1">{errors.revenue_status}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Use of Funds
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          value={formData.use_of_funds}
          onChange={(e) => updateFormData({ use_of_funds: e.target.value })}
          placeholder="Explain how this round will be allocated"
          rows={5}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
        {errors.use_of_funds && <p className="text-sm text-red-500 mt-1">{errors.use_of_funds}</p>}
      </div>
    </div>
  );
};

export default Step4FundingDetails;
