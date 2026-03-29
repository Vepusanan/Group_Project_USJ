import React from "react";
import { Mail, Phone, Link as LinkIcon, Linkedin, Twitter } from "lucide-react";
import Input from "../common/Input";

const CONTACT_METHODS = ["EMAIL", "PHONE", "EITHER"];

const InvestorStep7Contact = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Contact</h2>
        <p className="text-gray-400">How founders should reach you.</p>
      </div>

      <Input
        label="Primary Contact Email"
        type="email"
        placeholder="investor@firm.com"
        value={formData.primary_contact_email}
        onChange={(e) => updateFormData({ primary_contact_email: e.target.value })}
        error={errors.primary_contact_email}
        required
        icon={Mail}
      />

      <Input
        label="Phone Number"
        type="tel"
        placeholder="+1 555 000 0000"
        value={formData.phone_number}
        onChange={(e) => updateFormData({ phone_number: e.target.value })}
        icon={Phone}
      />

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Preferred Contact Method
          <span className="text-red-500 ml-1">*</span>
        </label>
        <select
          value={formData.preferred_contact_method}
          onChange={(e) => updateFormData({ preferred_contact_method: e.target.value })}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
        >
          <option value="" className="bg-gray-900">Select contact method</option>
          {CONTACT_METHODS.map((method) => (
            <option key={method} value={method} className="bg-gray-900">{method}</option>
          ))}
        </select>
        {errors.preferred_contact_method && (
          <p className="text-sm text-red-500 mt-1">{errors.preferred_contact_method}</p>
        )}
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Social Media</h3>

        <Input
          label="LinkedIn"
          type="url"
          placeholder="https://linkedin.com/in/..."
          value={formData.social_media.linkedin || ""}
          onChange={(e) =>
            updateFormData({
              social_media: {
                ...formData.social_media,
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
          value={formData.social_media.twitter || ""}
          onChange={(e) =>
            updateFormData({
              social_media: {
                ...formData.social_media,
                twitter: e.target.value,
              },
            })
          }
          icon={Twitter}
        />

        <Input
          label="Website"
          type="url"
          placeholder="https://yourfirm.com"
          value={formData.social_media.website || ""}
          onChange={(e) =>
            updateFormData({
              social_media: {
                ...formData.social_media,
                website: e.target.value,
              },
            })
          }
          icon={LinkIcon}
        />
      </div>
    </div>
  );
};

export default InvestorStep7Contact;
