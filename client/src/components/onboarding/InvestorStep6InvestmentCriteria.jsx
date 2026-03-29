import React from "react";

const InvestorStep6InvestmentCriteria = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Criteria & Value Add</h2>
        <p className="text-gray-400">Tell founders what you look for and how you help.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          What You Look For
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="Key qualities, traction, and team signals you prioritize."
          value={formData.what_you_look_for}
          onChange={(e) => updateFormData({ what_you_look_for: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
        {errors.what_you_look_for && <p className="text-sm text-red-500 mt-1">{errors.what_you_look_for}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Value Add
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="How do you support portfolio companies after investing?"
          value={formData.value_add}
          onChange={(e) => updateFormData({ value_add: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
        {errors.value_add && <p className="text-sm text-red-500 mt-1">{errors.value_add}</p>}
      </div>
    </div>
  );
};

export default InvestorStep6InvestmentCriteria;
