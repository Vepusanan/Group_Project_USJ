import React from 'react';
import { DollarSign, TrendingUp, PiggyBank, Target } from 'lucide-react';

const FUNDING_STAGES = [
  'Bootstrapped',
  'Pre-seed',
  'Seed',
  'Series A',
  'Series B',
  'Series C+',
];

const Step4FundingDetails = ({ formData, updateFormData, errors, setErrors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Funding Details</h2>
        <p className="text-gray-400">
          Share your funding status and financial goals
        </p>
      </div>

      {/* Funding Stage */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Funding Stage
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {FUNDING_STAGES.map((stage) => (
            <button
              key={stage}
              type="button"
              onClick={() => updateFormData({ funding_stage: stage })}
              className={`px-4 py-3 rounded-lg font-medium transition-all ${
                formData.funding_stage === stage
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-white/5 border border-gray-600 text-gray-300 hover:border-purple-500'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
        {errors.funding_stage && <p className="text-sm text-red-500 mt-1">{errors.funding_stage}</p>}
      </div>

      {/* Funding Amount Seeking */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Funding Amount Seeking
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="number"
            placeholder="Enter amount in USD"
            value={formData.funding_amount}
            onChange={(e) => updateFormData({ funding_amount: e.target.value })}
            min="0"
            step="1000"
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>
        {errors.funding_amount && <p className="text-sm text-red-500 mt-1">{errors.funding_amount}</p>}
      </div>

      {/* Previous Funding */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Previous Funding Raised
          <span className="text-gray-500 ml-2 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <PiggyBank className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="number"
            placeholder="Total amount raised so far"
            value={formData.previous_funding}
            onChange={(e) => updateFormData({ previous_funding: e.target.value })}
            min="0"
            step="1000"
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Leave blank if no previous funding
        </p>
      </div>

      {/* Use of Funds */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Use of Funds
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Target className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <textarea
            placeholder="Explain how you plan to use the funding (e.g., product development, marketing, hiring, operations...)"
            value={formData.use_of_funds}
            onChange={(e) => updateFormData({ use_of_funds: e.target.value })}
            rows={5}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
          />
        </div>
        {errors.use_of_funds && <p className="text-sm text-red-500 mt-1">{errors.use_of_funds}</p>}
      </div>

      {/* Funding Breakdown Example */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border border-purple-600/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
          <TrendingUp className="w-4 h-4" />
          Example Breakdown
        </h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Product Development: 40%</li>
          <li>• Marketing & Sales: 30%</li>
          <li>• Team Expansion: 20%</li>
          <li>• Operations: 10%</li>
        </ul>
      </div>

      <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
        <p className="text-sm text-yellow-300">
          <strong>Tip:</strong> Be specific about your funding needs. Investors want to see a clear plan 
          for how their investment will help you grow and achieve milestones.
        </p>
      </div>
    </div>
  );
};

export default Step4FundingDetails;
