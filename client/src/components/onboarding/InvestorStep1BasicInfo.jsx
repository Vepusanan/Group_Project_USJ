import React, { useRef } from "react";
import { Upload, Building2, Globe, MapPin, Briefcase } from "lucide-react";
import Input from "../common/Input";

const InvestorStep1BasicInfo = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const fileInputRef = useRef(null);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors({ ...errors, photo_url: "Please select an image file" });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, photo_url: "File size must be less than 5MB" });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData({
          photo_url: file,
          photo_preview: reader.result,
        });
        setErrors({ ...errors, photo_url: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    updateFormData({
      photo_url: null,
      photo_preview: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Basic Information
        </h2>
        <p className="text-gray-400">
          Let's start with the essentials about you and your investment firm
        </p>
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Profile Photo
        </label>
        <div className="flex items-center gap-6">
          {/* Photo Preview */}
          <div className="flex-shrink-0">
            {formData.photo_preview ? (
              <div className="relative w-24 h-24">
                <img
                  src={formData.photo_preview}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-1 -mr-2 -mt-2 hover:bg-red-700"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 bg-gray-800 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-600">
                <Briefcase className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>

          {/* Upload Area */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-purple-600/50 rounded-lg hover:border-purple-600 transition-colors text-purple-400 hover:text-purple-300"
            >
              <Upload className="w-5 h-5 mx-auto mb-2" />
              <span className="text-sm">Click to upload photo</span>
            </button>
            {errors.photo_url && (
              <p className="text-red-400 text-sm mt-2">{errors.photo_url}</p>
            )}
          </div>
        </div>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Full Name *
          </label>
          <Input
            type="text"
            placeholder="Your full name"
            value={formData.name}
            onChange={(e) => updateFormData({ name: e.target.value })}
            error={errors.name}
            className={`w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 ${
              errors.name ? "border-red-600" : ""
            }`}
          />
          {errors.name && (
            <p className="text-red-400 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Firm/Company Name
          </label>
          <Input
            type="text"
            placeholder="Your firm or company name"
            value={formData.firm_name}
            onChange={(e) => updateFormData({ firm_name: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>

      {/* Location Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            City
          </label>
          <Input
            type="text"
            placeholder="Your city"
            icon={MapPin}
            value={formData.city}
            onChange={(e) => updateFormData({ city: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Country *
          </label>
          <select
            value={formData.country}
            onChange={(e) => updateFormData({ country: e.target.value })}
            className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 ${
              errors.country ? "border-red-600" : "border-gray-700"
            }`}
          >
            <option value="">Select a country</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="India">India</option>
            <option value="Germany">Germany</option>
            <option value="France">France</option>
            <option value="Singapore">Singapore</option>
            <option value="Japan">Japan</option>
            <option value="Australia">Australia</option>
            <option value="Other">Other</option>
          </select>
          {errors.country && (
            <p className="text-red-400 text-sm mt-1">{errors.country}</p>
          )}
        </div>
      </div>

      {/* Website & LinkedIn */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Website
          </label>
          <Input
            type="url"
            placeholder="https://yourwebsite.com"
            icon={Globe}
            value={formData.website}
            onChange={(e) => updateFormData({ website: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-200 mb-2">
            LinkedIn Profile
          </label>
          <Input
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            value={formData.linkedin}
            onChange={(e) => updateFormData({ linkedin: e.target.value })}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>
    </div>
  );
};

export default InvestorStep1BasicInfo;
