import React from "react";
import { Mail, Phone, UserRound, Linkedin, Twitter, Facebook, Instagram } from "lucide-react";
import Input from "../common/Input";

const Step7Contact = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Contact & Social Media</h2>
        <p className="text-gray-400">How should investors contact you?</p>
      </div>

      <Input
        label="Primary Contact Name"
        type="text"
        placeholder="Full name"
        value={formData.primary_contact_name}
        onChange={(e) => updateFormData({ primary_contact_name: e.target.value })}
        error={errors.primary_contact_name}
        required
        icon={UserRound}
      />

      <Input
        label="Contact Email"
        type="email"
        placeholder="contact@company.com"
        value={formData.contact_email}
        onChange={(e) => updateFormData({ contact_email: e.target.value })}
        error={errors.contact_email}
        required
        icon={Mail}
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="+1 555 000 0000"
        value={formData.phone_number}
        onChange={(e) => updateFormData({ phone_number: e.target.value })}
        error={errors.phone_number}
        icon={Phone}
      />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Social Media Links</h3>

        <Input
          label="LinkedIn"
          type="url"
          placeholder="https://linkedin.com/company/..."
          value={formData.social_media_links.linkedin || ""}
          onChange={(e) =>
            updateFormData({
              social_media_links: {
                ...formData.social_media_links,
                linkedin: e.target.value,
              },
            })
          }
          icon={Linkedin}
        />

        <Input
          label="Twitter / X"
          type="url"
          placeholder="https://x.com/..."
          value={formData.social_media_links.twitter || ""}
          onChange={(e) =>
            updateFormData({
              social_media_links: {
                ...formData.social_media_links,
                twitter: e.target.value,
              },
            })
          }
          icon={Twitter}
        />

        <Input
          label="Facebook"
          type="url"
          placeholder="https://facebook.com/..."
          value={formData.social_media_links.facebook || ""}
          onChange={(e) =>
            updateFormData({
              social_media_links: {
                ...formData.social_media_links,
                facebook: e.target.value,
              },
            })
          }
          icon={Facebook}
        />

        <Input
          label="Instagram"
          type="url"
          placeholder="https://instagram.com/..."
          value={formData.social_media_links.instagram || ""}
          onChange={(e) =>
            updateFormData({
              social_media_links: {
                ...formData.social_media_links,
                instagram: e.target.value,
              },
            })
          }
          icon={Instagram}
        />
      </div>
    </div>
  );
};

export default Step7Contact;
