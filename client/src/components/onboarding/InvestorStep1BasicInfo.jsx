import React from "react";
import { Building2, BadgeCheck, CalendarClock, Globe, Image, Linkedin, MapPin } from "lucide-react";
import Input from "../common/Input";

const INVESTOR_TYPES = [
  "ANGEL",
  "VC",
  "CORPORATE",
  "FAMILY_OFFICE",
  "ACCELERATOR",
  "OTHER",
];

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
          Investor Type <span className="text-red-500 ml-1">*</span>
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
        {errors.investor_type && (
          <p className="text-sm text-red-500 mt-1">{errors.investor_type}</p>
        )}
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
          placeholder="e.g., New York"
          value={formData.location_city || ""}
          onChange={(e) => updateFormData({ location_city: e.target.value })}
          error={errors.location_city}
          required
          icon={MapPin}
        />
      </div>

      <Input
        label="Profile Photo / Logo URL"
        type="url"
        placeholder="https://example.com/photo.jpg (JPG/PNG, max 2MB)"
        value={formData.profile_photo_url || ""}
        onChange={(e) => updateFormData({ profile_photo_url: e.target.value })}
        error={errors.profile_photo_url}
        icon={Image}
      />

      <Input
        label="Website"
        type="url"
        placeholder="https://yourfirm.com"
        value={formData.website_url || ""}
        onChange={(e) => updateFormData({ website_url: e.target.value })}
        error={errors.website_url}
        icon={Globe}
      />

      <Input
        label="LinkedIn Profile"
        type="url"
        placeholder="https://linkedin.com/in/yourprofile"
        value={formData.linkedin_url || ""}
        onChange={(e) => updateFormData({ linkedin_url: e.target.value })}
        error={errors.linkedin_url}
        required
        icon={Linkedin}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Professional Background <span className="text-red-500 ml-1">*</span>
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
