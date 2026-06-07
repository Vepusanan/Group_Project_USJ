import React from "react";
import { Facebook, Instagram, Linkedin, Mail, Phone, Twitter, UserRound } from "lucide-react";

const inputCls =
  "w-full px-4 py-3 bg-surface-alt border border-line rounded-xl text-content placeholder:text-content-muted focus:outline-none focus:border-primary focus:bg-surface-alt transition-all";
const iconInputCls =
  "w-full pl-11 pr-4 py-3 bg-surface-alt border border-line rounded-xl text-content placeholder:text-content-muted focus:outline-none focus:border-primary focus:bg-surface-alt transition-all";

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

const SocialField = ({ label, icon: Icon, value, onChange, placeholder }) => (
  <div className="relative">
    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
    <input
      type="url"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      aria-label={label}
      className={iconInputCls}
    />
  </div>
);

const Step7Contact = ({ formData, updateFormData, errors }) => (
  <div className="space-y-5">
    <div className="pb-2">
      <h2 className="text-xl font-semibold text-content">Contact Details</h2>
      <p className="text-sm text-content-muted mt-1">Let investors know how and who to reach.</p>
    </div>

    <Field label="Primary Contact Name" required error={errors.primary_contact_name}>
      <div className="relative">
        <UserRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
        <input
          type="text"
          placeholder="Full name of main point of contact"
          value={formData.primary_contact_name}
          onChange={(e) => updateFormData({ primary_contact_name: e.target.value })}
          className={iconInputCls}
        />
      </div>
    </Field>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Field label="Contact Email" required error={errors.contact_email}>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-content-muted w-[18px] h-[18px]" />
          <input
            type="email"
            placeholder="contact@company.com"
            value={formData.contact_email}
            onChange={(e) => updateFormData({ contact_email: e.target.value })}
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

    <div className="border-t border-line pt-5">
      <p className="text-xs font-semibold text-content-muted uppercase tracking-widest mb-4">Social Media</p>
      <div className="space-y-3">
        <SocialField
          label="LinkedIn"
          icon={Linkedin}
          placeholder="https://linkedin.com/company/..."
          value={formData.social_media_links?.linkedin || ""}
          onChange={(e) => updateFormData({ social_media_links: { ...formData.social_media_links, linkedin: e.target.value } })}
        />
        <SocialField
          label="Twitter / X"
          icon={Twitter}
          placeholder="https://x.com/..."
          value={formData.social_media_links?.twitter || ""}
          onChange={(e) => updateFormData({ social_media_links: { ...formData.social_media_links, twitter: e.target.value } })}
        />
        <SocialField
          label="Facebook"
          icon={Facebook}
          placeholder="https://facebook.com/..."
          value={formData.social_media_links?.facebook || ""}
          onChange={(e) => updateFormData({ social_media_links: { ...formData.social_media_links, facebook: e.target.value } })}
        />
        <SocialField
          label="Instagram"
          icon={Instagram}
          placeholder="https://instagram.com/..."
          value={formData.social_media_links?.instagram || ""}
          onChange={(e) => updateFormData({ social_media_links: { ...formData.social_media_links, instagram: e.target.value } })}
        />
      </div>
    </div>
  </div>
);

export default Step7Contact;
