import React from "react";
import { Building2, BadgeCheck, CalendarClock } from "lucide-react";
import Input from "../common/Input";

const INVESTOR_TYPES = [
  "ANGEL",
  "VC",
  "CORPORATE",
  "FAMILY_OFFICE",
  "ACCELERATOR",
  "OTHER",
];

const InvestorStep1BasicInfo = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Basic Information</h2>
        <p className="text-gray-400">Tell startups who you are as an investor.</p>
      </div>

      <Input
        label="Name or Firm"
        type="text"
        placeholder="e.g., Acme Ventures"
        value={formData.name_or_firm}
        onChange={(e) => updateFormData({ name_or_firm: e.target.value })}
        error={errors.name_or_firm}
        required
        icon={Building2}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Investor Type
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <select
            value={formData.investor_type}
            onChange={(e) => updateFormData({ investor_type: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          >
            <option value="" className="bg-gray-900">Select investor type</option>
            {INVESTOR_TYPES.map((type) => (
              <option key={type} value={type} className="bg-gray-900">{type}</option>
            ))}
          </select>
        </div>
        {errors.investor_type && <p className="text-sm text-red-500 mt-1">{errors.investor_type}</p>}
      </div>

      <Input
        label="Years of Experience"
        type="number"
        min="0"
        placeholder="e.g., 7"
        value={formData.years_of_experience}
        onChange={(e) => updateFormData({ years_of_experience: e.target.value })}
        error={errors.years_of_experience}
        required
        icon={CalendarClock}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Professional Background
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          rows={5}
          placeholder="Share your investing/operator background and focus."
          value={formData.professional_background}
          onChange={(e) => updateFormData({ professional_background: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
        {errors.professional_background && (
          <p className="text-sm text-red-500 mt-1">{errors.professional_background}</p>
        )}
      </div>
    </div>
  );
};

export default InvestorStep1BasicInfo;
