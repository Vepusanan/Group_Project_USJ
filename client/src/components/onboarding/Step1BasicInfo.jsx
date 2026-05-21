import React, { useState } from "react";
import { Building2, Globe, Linkedin, MapPin, Plus, Trash2, Upload, User } from "lucide-react";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

const COUNTRIES = [
  "Afghanistan","Albania","Algeria","Argentina","Australia","Austria","Bangladesh",
  "Belgium","Brazil","Canada","Chile","China","Colombia","Czech Republic","Denmark",
  "Egypt","Ethiopia","Finland","France","Germany","Ghana","Greece","Hungary","India",
  "Indonesia","Iran","Iraq","Ireland","Israel","Italy","Japan","Jordan","Kenya",
  "Malaysia","Mexico","Morocco","Netherlands","New Zealand","Nigeria","Norway",
  "Pakistan","Peru","Philippines","Poland","Portugal","Romania","Russia","Saudi Arabia",
  "Singapore","South Africa","South Korea","Spain","Sri Lanka","Sweden","Switzerland",
  "Tanzania","Thailand","Turkey","Uganda","Ukraine","United Arab Emirates",
  "United Kingdom","United States","Vietnam","Zimbabwe",
];

const inputCls =
  "w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all";
const iconInputCls =
  "w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/60 focus:bg-white/8 transition-all";

const Field = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
  </div>
);

const Step1BasicInfo = ({ formData, updateFormData, errors }) => {
  const [logoError, setLogoError] = useState(null);

  const founders = Array.isArray(formData.founder_names)
    ? formData.founder_names
    : formData.founder_names
    ? [formData.founder_names]
    : [""];

  const updateFounder = (index, value) => {
    const updated = [...founders];
    updated[index] = value;
    updateFormData({ founder_names: updated });
  };

  const addFounder = () => {
    if (founders.length >= 6) return;
    updateFormData({ founder_names: [...founders, ""] });
  };

  const removeFounder = (index) => {
    if (founders.length <= 1) return;
    const updated = founders.filter((_, i) => i !== index);
    updateFormData({ founder_names: updated });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_LOGO_BYTES) {
      setLogoError("File size exceeds 2MB limit.");
      e.target.value = "";
      updateFormData({ logo_file: null, logo_preview: null });
      return;
    }
    setLogoError(null);
    updateFormData({ logo_file: file, logo_preview: URL.createObjectURL(file) });
  };

  return (
    <div className="space-y-5">
      <div className="pb-2">
        <h2 className="text-xl font-semibold text-white">Company Identity</h2>
        <p className="text-sm text-gray-400 mt-1">Start with the essentials — your company and founders.</p>
      </div>

      {/* Logo upload */}
      <Field label="Company Logo" error={errors.logo_file || logoError}>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden bg-white/5 shrink-0">
            {formData.logo_preview ? (
              <img src={formData.logo_preview} alt="Logo preview" className="w-full h-full object-cover" />
            ) : (
              <Upload className="w-6 h-6 text-gray-500" />
            )}
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 transition-all">
              <Upload className="w-4 h-4" />
              {formData.logo_preview ? "Change Logo" : "Upload Logo"}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-1.5">PNG, JPG or SVG — max 2 MB</p>
          </div>
        </div>
      </Field>

      <Field label="Company Name" required error={errors.company_name}>
        <div className="relative">
          <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="text"
            placeholder="e.g., Acme Technologies"
            value={formData.company_name}
            onChange={(e) => updateFormData({ company_name: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>

      {/* Founders — one input per person */}
      <Field label="Founders" required error={errors.founder_names}>
        <div className="space-y-2">
          {founders.map((name, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="relative flex-1">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
                <input
                  type="text"
                  placeholder={`Founder ${idx + 1} full name`}
                  value={name}
                  onChange={(e) => updateFounder(idx, e.target.value)}
                  className={iconInputCls}
                />
              </div>
              {founders.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFounder(idx)}
                  className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-400/10 transition-all"
                  aria-label="Remove founder"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {founders.length < 6 && (
            <button
              type="button"
              onClick={addFounder}
              className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors mt-1"
            >
              <Plus className="w-4 h-4" />
              Add another founder
            </button>
          )}
        </div>
      </Field>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Country" required error={errors.location_country}>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px] pointer-events-none" />
            <select
              value={formData.location_country || ""}
              onChange={(e) => updateFormData({ location_country: e.target.value })}
              className={`${iconInputCls} appearance-none`}
            >
              <option value="" className="bg-gray-900">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-gray-900">{c}</option>
              ))}
            </select>
          </div>
        </Field>

        <Field label="City" required error={errors.location_city}>
          <div className="relative">
            <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
            <input
              type="text"
              placeholder="e.g., San Francisco"
              value={formData.location_city || ""}
              onChange={(e) => updateFormData({ location_city: e.target.value })}
              className={iconInputCls}
            />
          </div>
        </Field>
      </div>

      <Field label="Website URL" error={errors.website_url}>
        <div className="relative">
          <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="url"
            placeholder="https://yourcompany.com"
            value={formData.website_url || ""}
            onChange={(e) => updateFormData({ website_url: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>

      <Field label="LinkedIn Profile" error={errors.linkedin_url}>
        <div className="relative">
          <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="url"
            placeholder="https://linkedin.com/company/your-company"
            value={formData.linkedin_url || ""}
            onChange={(e) => updateFormData({ linkedin_url: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>
    </div>
  );
};

export default Step1BasicInfo;
