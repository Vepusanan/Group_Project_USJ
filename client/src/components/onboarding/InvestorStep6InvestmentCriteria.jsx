import React, { useState } from "react";
import { AlertCircle, Heart, X, Plus } from "lucide-react";

const InvestorStep6InvestmentCriteria = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const [newNetworkResourceForm, setNewNetworkResourceForm] = useState({
    type: "",
    description: "",
  });

  const addNetworkResource = () => {
    if (!newNetworkResourceForm.type.trim() || !newNetworkResourceForm.description.trim()) {
      alert("Please fill in both type and description");
      return;
    }

    const updatedResources = [
      ...formData.network_resources,
      {
        type: newNetworkResourceForm.type,
        description: newNetworkResourceForm.description,
      },
    ];

    updateFormData({ network_resources: updatedResources });
    setNewNetworkResourceForm({ type: "", description: "" });
  };

  const removeNetworkResource = (index) => {
    const updatedResources = formData.network_resources.filter(
      (_, i) => i !== index
    );
    updateFormData({ network_resources: updatedResources });
  };
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Investment Criteria
        </h2>
        <p className="text-gray-400">
          Tell startups what you look for and what matters to you
        </p>
      </div>

      {/* What You Look For */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          What Do You Look For in Startups?
        </label>
        <textarea
          value={formData.investment_criteria}
          onChange={(e) => {
            updateFormData({ investment_criteria: e.target.value });
          }}
          placeholder="Describe your ideal startup characteristics. E.g., strong founding team, large market opportunity, innovative technology, business model scalability, etc."
          maxLength={500}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 resize-none h-24"
        />
        <span className="text-xs text-gray-500 mt-2 block">
          {formData.investment_criteria.length}/500 characters
        </span>
      </div>

      {/* Deal Breakers / Red Flags */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-4 h-4" />
            Red Flags - What Would Prevent You From Investing?
          </div>
        </label>
        <textarea
          value={formData.red_flags}
          onChange={(e) =>
            updateFormData({ red_flags: e.target.value })
          }
          placeholder="Describe situations or characteristics that would be deal-breakers. E.g., unproven management, unclear business model, saturated market, etc."
          maxLength={500}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 resize-none h-24"
        />
        <span className="text-xs text-gray-500 mt-2 block">
          {formData.red_flags.length}/500 characters
        </span>
      </div>

      {/* Ideal Founder Profile */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Your Ideal Founder Profile
        </label>
        <textarea
          value={formData.ideal_founder_profile}
          onChange={(e) =>
            updateFormData({ ideal_founder_profile: e.target.value })
          }
          placeholder="Describe the type of founder you prefer to work with. E.g., technical background, serial entrepreneurs, industry experts, domain knowledge, etc."
          maxLength={400}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 resize-none h-20"
        />
        <span className="text-xs text-gray-500 mt-2 block">
          {formData.ideal_founder_profile.length}/400 characters
        </span>
      </div>

      {/* Value Add */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          <div className="flex items-center gap-2 mb-2">
            <Heart className="w-4 h-4" />
            What Value Do You Bring Beyond Capital?
          </div>
        </label>
        <textarea
          value={formData.value_add}
          onChange={(e) =>
            updateFormData({ value_add: e.target.value })
          }
          placeholder="Describe the support and resources you provide. E.g., mentorship, industry connections, technical expertise, operational support, board participation, etc."
          maxLength={500}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 resize-none h-24"
        />
        <span className="text-xs text-gray-500 mt-2 block">
          {formData.value_add.length}/500 characters
        </span>
      </div>

      {/* Network & Resources */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Network & Resources You Can Offer
        </label>

        {/* Display Existing Resources */}
        {formData.network_resources.length > 0 && (
          <div className="mb-4 space-y-2">
            {formData.network_resources.map((resource, index) => (
              <div
                key={index}
                className="bg-gray-800 border border-purple-500/30 rounded-lg p-3 flex items-start justify-between"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium text-purple-300">
                    {resource.type}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {resource.description}
                  </p>
                </div>
                <button
                  onClick={() => removeNetworkResource(index)}
                  className="ml-2 p-1 hover:bg-red-600/20 rounded text-red-400 hover:text-red-300"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add New Resource Form */}
        <div className="space-y-3 bg-gray-900/50 border border-gray-700 rounded-lg p-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Resource Type
            </label>
            <input
              type="text"
              value={newNetworkResourceForm.type}
              onChange={(e) =>
                setNewNetworkResourceForm({
                  ...newNetworkResourceForm,
                  type: e.target.value,
                })
              }
              placeholder="E.g., Industry Connections, Customer Introductions, Technical Expertise"
              maxLength={100}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={newNetworkResourceForm.description}
              onChange={(e) =>
                setNewNetworkResourceForm({
                  ...newNetworkResourceForm,
                  description: e.target.value,
                })
              }
              placeholder="Describe this resource or network connection..."
              maxLength={200}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 resize-none h-16 text-sm"
            />
            <span className="text-xs text-gray-500 mt-1 block">
              {newNetworkResourceForm.description.length}/200 characters
            </span>
          </div>
          <button
            onClick={addNetworkResource}
            type="button"
            className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded font-medium text-sm flex items-center justify-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Network Resource
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-indigo-600/10 to-purple-600/10 border border-indigo-600/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-indigo-300 mb-2">
          📋 Founder Perspective:
        </h3>
        <p className="text-sm text-gray-400">
          Founders are looking for investors who align with their vision and can
          provide more than just capital. Being clear about your value-add helps
          startups decide if you're the right investor partner for their growth
          journey.
        </p>
      </div>
    </div>
  );
};

export default InvestorStep6InvestmentCriteria;
