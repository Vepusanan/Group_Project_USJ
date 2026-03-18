import React from "react";
import { Mail, Phone, Briefcase, Twitter, Linkedin } from "lucide-react";
import Input from "../common/Input";

const InvestorStep7Contact = ({
  formData,
  updateFormData,
  errors,
  setErrors,
}) => {
  const contactMethods = ["Email", "Phone", "LinkedIn", "Meeting Request"];

  const handleSocialMediaChange = (platform, value) => {
    updateFormData({
      social_media: {
        ...formData.social_media,
        [platform]: value,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Contact Information
        </h2>
        <p className="text-gray-400">
          How should startups reach out to you?
        </p>
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Business Email *
        </label>
        <Input
          type="email"
          placeholder="your.email@company.com"
          icon={Mail}
          value={formData.contact_email}
          onChange={(e) => {
            updateFormData({ contact_email: e.target.value });
            setErrors({ ...errors, contact_email: null });
          }}
          className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600 ${
            errors.contact_email ? "border-red-600" : "border-gray-700"
          }`}
        />
        {errors.contact_email && (
          <p className="text-red-400 text-sm mt-1">{errors.contact_email}</p>
        )}
      </div>

      {/* Phone */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-2">
          Phone Number
        </label>
        <Input
          type="tel"
          placeholder="+1 (555) 000-0000"
          icon={Phone}
          value={formData.contact_phone}
          onChange={(e) => updateFormData({ contact_phone: e.target.value })}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
        />
      </div>

      {/* Preferred Contact Method */}
      <div>
        <label className="block text-sm font-medium text-gray-200 mb-3">
          Preferred Contact Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {contactMethods.map((method) => (
            <label
              key={method}
              className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                formData.preferred_contact_method === method
                  ? "border-purple-600 bg-purple-600/10"
                  : "border-gray-700 bg-gray-800/40 hover:border-gray-600"
              }`}
            >
              <input
                type="radio"
                name="contact_method"
                value={method}
                checked={formData.preferred_contact_method === method}
                onChange={(e) =>
                  updateFormData({ preferred_contact_method: e.target.value })
                }
                className="w-4 h-4 border-gray-600 text-purple-600 focus:ring-purple-600"
              />
              <span className="text-gray-300 font-medium">{method}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Social Media */}
      <div className="border-t border-gray-700 pt-6">
        <h3 className="text-sm font-semibold text-gray-200 mb-4">
          Social Media Profiles (Optional)
        </h3>

        {/* LinkedIn */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-200 mb-2">
            <div className="flex items-center gap-2">
              <Linkedin className="w-4 h-4" />
              LinkedIn Profile URL
            </div>
          </label>
          <Input
            type="url"
            placeholder="https://linkedin.com/in/yourprofile"
            value={formData.social_media.linkedin || ""}
            onChange={(e) => handleSocialMediaChange("linkedin", e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
          />
        </div>

        {/* Twitter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-200 mb-2">
            <div className="flex items-center gap-2">
              <Twitter className="w-4 h-4" />
              Twitter/X Profile URL
            </div>
          </label>
          <Input
            type="url"
            placeholder="https://twitter.com/yourhandle"
            value={formData.social_media.twitter || ""}
            onChange={(e) => handleSocialMediaChange("twitter", e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
          />
        </div>

        {/* Other Social */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-200 mb-2">
            Other Website/URL
          </label>
          <Input
            type="url"
            placeholder="Your website or other profile"
            value={formData.social_media.website || ""}
            onChange={(e) => handleSocialMediaChange("website", e.target.value)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-600"
          />
        </div>
      </div>

      {/* Currently Investing */}
      <div className="border-t border-gray-700 pt-6">
        <label className="flex items-center gap-3 p-4 rounded-lg bg-gray-800/40 border border-gray-700 hover:border-gray-600 cursor-pointer transition-colors">
          <input
            type="checkbox"
            checked={formData.is_actively_investing}
            onChange={(e) =>
              updateFormData({ is_actively_investing: e.target.checked })
            }
            className="w-5 h-5 rounded border-gray-600 text-green-600 focus:ring-green-600"
          />
          <div>
            <span className="block text-sm font-medium text-white">
              I'm currently actively investing
            </span>
            <span className="block text-xs text-gray-400 mt-1">
              Startups will see you're open to investment opportunities
            </span>
          </div>
        </label>
      </div>

      {/* Privacy Notice */}
      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-300 mb-2">
          🔒 Privacy & Security:
        </h3>
        <p className="text-sm text-gray-400">
          Your contact information will only be visible to verified startups who
          you're connected with or who meet your investment criteria. We never
          share your information with third parties.
        </p>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 border border-purple-600/30 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-white mb-3">
          ✅ Ready to Get Started?
        </h3>
        <p className="text-sm text-gray-400 mb-3">
          You're almost done! Once you submit your profile, startups will be
          able to:
        </p>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>✓ View your investor profile and track record</li>
          <li>✓ Connect with you if they match your investment criteria</li>
          <li>✓ Send you their pitches through our platform</li>
          <li>✓ Get track record insights about your investments</li>
        </ul>
      </div>
    </div>
  );
};

export default InvestorStep7Contact;
