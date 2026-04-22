import React from "react";
import { Building2, Globe, Linkedin, MapPin, User } from "lucide-react";

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

const Step1BasicInfo = ({ formData, updateFormData, errors }) => (
  <div className="space-y-5">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-white">Company Identity</h2>
      <p className="text-sm text-gray-400 mt-1">Start with the essentials — your company and founders.</p>
    </div>

    <Field label="Company Name" required error={errors.company_name}>
      <div className="relative">
        <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-4.5 h-4.5 w-[18px] h-[18px]" />
        <input
          type="text"
          placeholder="e.g., Acme Technologies"
          value={formData.company_name}
          onChange={(e) => updateFormData({ company_name: e.target.value })}
          className={iconInputCls}
        />
      </div>
    </Field>

    <Field label="Founder Name(s)" required error={errors.founder_names}>
      <div className="relative">
        <User className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
        <input
          type="text"
          placeholder="e.g., Jane Doe, John Smith"
          value={formData.founder_names}
          onChange={(e) => updateFormData({ founder_names: e.target.value })}
          className={iconInputCls}
        />
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

export default Step1BasicInfo;
