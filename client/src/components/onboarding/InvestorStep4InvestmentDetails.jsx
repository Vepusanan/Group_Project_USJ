import React from "react";

const InvestorStep4InvestmentDetails = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Investment Details
        </h2>
        <p className="text-gray-400">
          Share portfolio volume and notable outcomes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of Investments
          </label>
          <input
            type="number"
            min="0"
            value={formData.number_of_investments}
            onChange={(e) =>
              updateFormData({ number_of_investments: e.target.value })
            }
            className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Successful Exits
          </label>
          <input
            type="number"
            min="0"
            value={formData.successful_exits}
            onChange={(e) =>
              updateFormData({ successful_exits: e.target.value })
            }
            className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Portfolio Companies
        </label>
        <textarea
          rows={5}
          placeholder="List representative portfolio companies."
          value={formData.portfolio_companies}
          onChange={(e) =>
            updateFormData({ portfolio_companies: e.target.value })
          }
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Notable Achievements
        </label>
        <textarea
          rows={5}
          placeholder="Share awards, recognitions, or career highlights."
          value={formData.notable_achievements}
          onChange={(e) =>
            updateFormData({ notable_achievements: e.target.value })
          }
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
      </div>
    </div>
  );
};

export default InvestorStep4InvestmentDetails;
