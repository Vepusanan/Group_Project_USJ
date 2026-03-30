import React from "react";
import { Building2, Plus, Trash2 } from "lucide-react";
import Input from "../common/Input";

const Step1BasicInfo = ({ formData, updateFormData, errors }) => {
  const handleAddFounder = () => {
    updateFormData({
      founder_names: [...(Array.isArray(formData.founder_names) ? formData.founder_names : []), ""],
    });
  };

  const handleRemoveFounder = (index) => {
    const updatedFounders = (Array.isArray(formData.founder_names) ? formData.founder_names : []).filter(
      (_, i) => i !== index
    );
    updateFormData({ founder_names: updatedFounders });
  };

  const handleFounderChange = (index, value) => {
    const updatedFounders = Array.isArray(formData.founder_names) ? [...formData.founder_names] : [];
    updatedFounders[index] = value;
    updateFormData({ founder_names: updatedFounders });
  };

  const founderNames = Array.isArray(formData.founder_names) ? formData.founder_names : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Basic Information
        </h2>
        <p className="text-gray-400">Start with your company identity.</p>
      </div>

      <Input
        label="Company Name"
        type="text"
        placeholder="Enter your company name"
        value={formData.company_name}
        onChange={(e) => updateFormData({ company_name: e.target.value })}
        error={errors.company_name}
        required
        icon={Building2}
      />

      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-medium text-gray-300">
            Founder Names
            <span className="text-red-500 ml-1">*</span>
          </label>
        </div>
        <p className="text-xs text-gray-500 mb-4">Add each founder one by one</p>

        <div className="space-y-3">
          {founderNames.map((founder, index) => (
            <div key={index} className="flex gap-2 items-end">
              <input
                type="text"
                value={founder}
                onChange={(e) => handleFounderChange(index, e.target.value)}
                placeholder={`Founder ${index + 1} name`}
                className="flex-1 px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleRemoveFounder(index)}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-400 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {errors.founder_names && (
          <p className="text-sm text-red-500 mt-2">{errors.founder_names}</p>
        )}

        <button
          type="button"
          onClick={handleAddFounder}
          className="mt-4 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition"
        >
          <Plus size={18} />
          Add Founder
        </button>
      </div>
    </div>
  );
};

export default Step1BasicInfo;
