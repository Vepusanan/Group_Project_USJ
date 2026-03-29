import React from "react";

const InvestorStep5Portfolio = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Portfolio Perspective
        </h2>
        <p className="text-gray-400">
          Provide additional context founders should know.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Deal Breakers
        </label>
        <textarea
          rows={5}
          placeholder="List red flags or patterns that prevent investment."
          value={formData.deal_breakers}
          onChange={(e) => updateFormData({ deal_breakers: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Network Resources
        </label>
        <textarea
          rows={5}
          placeholder="Describe partnerships or channels you can unlock."
          value={formData.network_resources}
          onChange={(e) =>
            updateFormData({ network_resources: e.target.value })
          }
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
      </div>
    </div>
  );
};

export default InvestorStep5Portfolio;
