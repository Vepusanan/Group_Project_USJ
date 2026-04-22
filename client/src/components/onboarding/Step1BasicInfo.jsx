import React from "react";
import { Building2, Globe, Linkedin, MapPin, User } from "lucide-react";
import Input from "../common/Input";

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

const Step1BasicInfo = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Basic Information</h2>
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

      <Input
        label="Founder Name(s)"
        type="text"
        placeholder="e.g., Jane Doe, John Smith"
        value={formData.founder_names}
        onChange={(e) => updateFormData({ founder_names: e.target.value })}
        error={errors.founder_names}
        required
        icon={User}
      />

      {/* Location */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Country <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={formData.location_country || ""}
              onChange={(e) => updateFormData({ location_country: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
            >
              <option value="" className="bg-gray-900">Select country</option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c} className="bg-gray-900">{c}</option>
              ))}
            </select>
          </div>
          {errors.location_country && (
            <p className="text-sm text-red-500 mt-1">{errors.location_country}</p>
          )}
        </div>

        <Input
          label="City"
          type="text"
          placeholder="e.g., San Francisco"
          value={formData.location_city || ""}
          onChange={(e) => updateFormData({ location_city: e.target.value })}
          error={errors.location_city}
          required
          icon={MapPin}
        />
      </div>

      <Input
        label="Company Logo URL"
        type="url"
        placeholder="https://example.com/logo.png (JPG/PNG, max 2MB)"
        value={formData.logo_url || ""}
        onChange={(e) => updateFormData({ logo_url: e.target.value })}
        error={errors.logo_url}
        icon={Building2}
      />

      <Input
        label="Website URL"
        type="url"
        placeholder="https://yourcompany.com"
        value={formData.website_url || ""}
        onChange={(e) => updateFormData({ website_url: e.target.value })}
        error={errors.website_url}
        icon={Globe}
      />

      <Input
        label="LinkedIn Profile"
        type="url"
        placeholder="https://linkedin.com/company/your-company"
        value={formData.linkedin_url || ""}
        onChange={(e) => updateFormData({ linkedin_url: e.target.value })}
        error={errors.linkedin_url}
        icon={Linkedin}
      />
    </div>
  );
};

export default Step1BasicInfo;
