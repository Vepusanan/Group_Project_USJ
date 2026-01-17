import React, { useRef } from 'react';
import { Upload, Building2, Globe } from 'lucide-react';
import Input from '../common/Input';

const Step1BasicInfo = ({ formData, updateFormData, errors, setErrors }) => {
  const fileInputRef = useRef(null);

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors({ ...errors, logo: 'Please select an image file' });
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, logo: 'File size must be less than 5MB' });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        updateFormData({
          logo: file,
          logo_preview: reader.result,
        });
        setErrors({ ...errors, logo: null });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    updateFormData({
      logo: null,
      logo_preview: null,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Basic Information</h2>
        <p className="text-gray-400">
          Let's start with the essentials about your startup
        </p>
      </div>

      {/* Company Name */}
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

      {/* Logo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Company Logo
          <span className="text-gray-500 ml-2 font-normal">(Optional)</span>
        </label>

        <div className="flex items-start gap-4">
          {/* Logo Preview */}
          {formData.logo_preview ? (
            <div className="relative group">
              <img
                src={formData.logo_preview}
                alt="Logo preview"
                className="w-24 h-24 rounded-lg object-cover border-2 border-gray-600"
              />
              <button
                onClick={handleRemoveLogo}
                className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center bg-white/5">
              <Building2 className="w-8 h-8 text-gray-500" />
            </div>
          )}

          {/* Upload Button */}
          <div className="flex-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              className="hidden"
              id="logo-upload"
            />
            <label
              htmlFor="logo-upload"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/5 border border-gray-600 rounded-lg text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Logo</span>
            </label>
            <p className="text-xs text-gray-500 mt-2">
              PNG, JPG or GIF (max. 5MB)
            </p>
            {errors.logo && (
              <p className="text-sm text-red-500 mt-1">{errors.logo}</p>
            )}
          </div>
        </div>
      </div>

      {/* Website */}
      <Input
        label="Website"
        type="url"
        placeholder="https://www.yourcompany.com"
        value={formData.website}
        onChange={(e) => updateFormData({ website: e.target.value })}
        error={errors.website}
        icon={Globe}
      />

      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
        <p className="text-sm text-blue-300">
          <strong>Tip:</strong> Make sure your company name matches your legal registration. 
          You can upload your logo now or add it later.
        </p>
      </div>
    </div>
  );
};

export default Step1BasicInfo;
