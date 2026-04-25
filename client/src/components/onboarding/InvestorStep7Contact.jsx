import React from "react";
import { Linkedin, Mail, Phone, Twitter } from "lucide-react";

const CONTACT_METHODS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "EITHER", label: "Either" },
];

const iconInputCls =
  "w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-violet-500/60 focus:bg-white/8 transition-all appearance-none";

const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-1.5">
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
      {hint && <span className="text-gray-500 font-normal ml-2 text-xs">{hint}</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
  </div>
);

const InvestorStep7Contact = ({ formData, updateFormData, errors }) => (
  <div className="space-y-5">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-white">Contact Details</h2>
      <p className="text-sm text-gray-400 mt-1">How should founders reach you?</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Contact Email" required error={errors.primary_contact_email}>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="email"
            placeholder="investor@firm.com"
            value={formData.primary_contact_email}
            onChange={(e) => updateFormData({ primary_contact_email: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>

      <Field label="Phone Number" hint="optional">
        <div className="relative">
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="tel"
            placeholder="+1 555 000 0000"
            value={formData.phone_number}
            onChange={(e) => updateFormData({ phone_number: e.target.value })}
            className={iconInputCls}
          />
        </div>
      </Field>
    </div>

    <Field label="Preferred Contact Method" required error={errors.preferred_contact_method}>
      <div className="grid grid-cols-3 gap-2">
        {CONTACT_METHODS.map((m) => {
          const selected = formData.preferred_contact_method === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => updateFormData({ preferred_contact_method: m.value })}
              className={`py-2.5 rounded-xl text-sm border transition-all text-center ${
                selected
                  ? "bg-violet-600/25 border-violet-500/50 text-violet-300 font-medium"
                  : "bg-white/3 border-white/10 text-gray-400 hover:border-white/20 hover:text-gray-300"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </Field>

    <div className="border-t border-white/5 pt-5">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Social Media</p>
      <div className="space-y-3">
        <div className="relative">
          <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="url"
            placeholder="https://linkedin.com/in/..."
            value={formData.social_media?.linkedin || ""}
            onChange={(e) => updateFormData({ social_media: { ...formData.social_media, linkedin: e.target.value } })}
            aria-label="LinkedIn"
            className={iconInputCls}
          />
        </div>
        <div className="relative">
          <Twitter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 w-[18px] h-[18px]" />
          <input
            type="url"
            placeholder="https://x.com/..."
            value={formData.social_media?.twitter || ""}
            onChange={(e) => updateFormData({ social_media: { ...formData.social_media, twitter: e.target.value } })}
            aria-label="Twitter / X"
            className={iconInputCls}
          />
        </div>
      </div>
    </div>
  </div>
);

export default InvestorStep7Contact;
