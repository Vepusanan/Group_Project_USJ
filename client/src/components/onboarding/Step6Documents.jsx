import React from "react";
import { Link as LinkIcon } from "lucide-react";

const UrlField = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      {label}
    </label>
    <div className="relative">
      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="url"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
      />
    </div>
  </div>
);

const Step6Documents = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Documents & Demo URLs
        </h2>
        <p className="text-gray-400">
          Provide links to investor materials and product demo.
        </p>
      </div>

      <UrlField
        label="Pitch Deck URL"
        value={formData.pitch_deck_url}
        onChange={(e) => updateFormData({ pitch_deck_url: e.target.value })}
        placeholder="https://..."
      />

      <UrlField
        label="Business Plan URL"
        value={formData.business_plan_url}
        onChange={(e) => updateFormData({ business_plan_url: e.target.value })}
        placeholder="https://..."
      />

      <UrlField
        label="Product Demo URL"
        value={formData.product_demo_url}
        onChange={(e) => updateFormData({ product_demo_url: e.target.value })}
        placeholder="https://..."
      />
    </div>
  );
};

export default Step6Documents;
