import React, { useState } from "react";
import { Building2, Plus, Trash2, Upload, X } from "lucide-react";
import Input from "../common/Input";

const Step1BasicInfo = ({ formData, updateFormData, errors }) => {
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFileName, setLogoFileName] = useState("");

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

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert("File size must be less than 25MB");
      return;
    }

    // Store the file object in form data
    updateFormData({ startup_logo_url: file });
    setLogoFileName(file.name);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    updateFormData({ startup_logo_url: "" });
    setLogoPreview(null);
    setLogoFileName("");
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

      {logoPreview ? (
        <div className="flex items-center gap-4">
          <div className="w-32 h-32 flex-shrink-0 rounded-full overflow-hidden border border-gray-600">
            <img
              src={logoPreview}
              alt="Logo preview"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col justify-center gap-2">
            <p className="text-sm font-medium text-white">Logo uploaded</p>
            <p className="text-xs text-gray-400">{logoFileName}</p>
            <button
              type="button"
              onClick={handleRemoveLogo}
              className="px-4 py-1.5 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-full text-red-400 text-xs font-medium transition w-fit"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-6">
          <input
            type="file"
            onChange={handleLogoChange}
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            id="logo-input"
          />
          <label htmlFor="logo-input" className="w-32 h-32 flex-shrink-0 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center border-2 border-gray-600 cursor-pointer hover:border-blue-500 transition">
            <Upload className="w-10 h-10 text-gray-400" />
          </label>

          <div className="flex flex-col gap-2">
            <h3 className="text-base font-semibold text-white">
              Company Logo
            </h3>
            <p className="text-xs text-gray-400">
              Select a file to upload.
            </p>
            <p className="text-xs text-gray-500">
              .JPEG, .PNG, .GIF, .WebP max 25M
            </p>
            <label
              htmlFor="logo-input"
              className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-gray-500 rounded-full text-gray-300 text-xs font-medium cursor-pointer transition w-fit"
            >
              Upload a file
            </label>

            {errors.startup_logo_url && (
              <p className="text-xs text-red-500">{errors.startup_logo_url}</p>
            )}
          </div>
        </div>
      )}

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
