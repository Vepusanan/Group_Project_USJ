import React from "react";
import { Linkedin, Mail, Phone, Twitter } from "lucide-react";

const CONTACT_METHODS = [
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "EITHER", label: "Either" },
];

const iconInputCls =
  "w-full pl-11 pr-4 py-3 bg-surface-alt border border-line rounded-xl text-content placeholder:text-content-muted focus:outline-none focus:border-primary-light focus:bg-surface-alt transition-all appearance-none";

const Field = ({ label, required, error, hint, children }) => (
  <div>
    <label className="block text-sm font-medium text-content-secondary mb-1.5">
      {label}
      {required && <span className="text-error ml-1">*</span>}
      {hint && <span className="text-content-muted font-normal ml-2 text-xs">{hint}</span>}
    </label>
    {children}
    {error && <p className="text-xs text-error mt-1.5">{error}</p>}
  </div>
);

const InvestorStep7Contact = ({ formData, updateFormData, errors }) => (
  <div className="space-y-5">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-content">Contact Details</h2>
      <p className="text-sm text-content-muted mt-1">How should founders reach you?</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Contact Email" required error={errors.primary_contact_email}>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
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
          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
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
                  ? "bg-primary-light border-primary-light text-primary font-medium"
                  : "bg-surface-alt border-line text-content-muted hover:border-line hover:text-content-secondary"
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>
    </Field>

    <div className="border-t border-line pt-5">
      <p className="text-xs font-semibold text-content-muted uppercase tracking-widest mb-4">Social Media</p>
      <div className="space-y-3">
        <div className="relative">
          <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
          <input
            type="text"
            inputMode="url"
            placeholder="https://linkedin.com/in/..."
            value={formData.social_media?.linkedin || ""}
            onChange={(e) => updateFormData({ social_media: { ...formData.social_media, linkedin: e.target.value } })}
            aria-label="LinkedIn"
            className={iconInputCls}
          />
        </div>
        <div className="relative">
          <Twitter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
          <input
            type="text"
            inputMode="url"
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
