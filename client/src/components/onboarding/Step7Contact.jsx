import React from 'react';
import { Mail, Phone, Linkedin, Twitter, Facebook, Instagram } from 'lucide-react';
import Input from '../common/Input';

const Step7Contact = ({ formData, updateFormData, errors, setErrors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Contact & Social Media</h2>
        <p className="text-gray-400">
          How can investors and partners reach you?
        </p>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Mail className="w-5 h-5 text-blue-400" />
          Contact Information
        </h3>

        {/* Contact Email */}
        <Input
          label="Business Email"
          type="email"
          placeholder="contact@yourcompany.com"
          value={formData.contact_email}
          onChange={(e) => updateFormData({ contact_email: e.target.value })}
          error={errors.contact_email}
          required
          icon={Mail}
        />

        {/* Contact Phone */}
        <Input
          label="Phone Number"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={formData.contact_phone}
          onChange={(e) => updateFormData({ contact_phone: e.target.value })}
          error={errors.contact_phone}
          icon={Phone}
        />
      </div>

      {/* Social Media Links */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Linkedin className="w-5 h-5 text-purple-400" />
          Social Media
          <span className="text-gray-500 text-sm font-normal">(Optional)</span>
        </h3>

        {/* LinkedIn */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            LinkedIn
          </label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              placeholder="https://linkedin.com/company/yourcompany"
              value={formData.linkedin}
              onChange={(e) => updateFormData({ linkedin: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
          {errors.linkedin && <p className="text-sm text-red-500 mt-1">{errors.linkedin}</p>}
        </div>

        {/* Twitter */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Twitter / X
          </label>
          <div className="relative">
            <Twitter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              placeholder="https://twitter.com/yourcompany"
              value={formData.twitter}
              onChange={(e) => updateFormData({ twitter: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
          {errors.twitter && <p className="text-sm text-red-500 mt-1">{errors.twitter}</p>}
        </div>

        {/* Facebook */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Facebook
          </label>
          <div className="relative">
            <Facebook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              placeholder="https://facebook.com/yourcompany"
              value={formData.facebook}
              onChange={(e) => updateFormData({ facebook: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
          {errors.facebook && <p className="text-sm text-red-500 mt-1">{errors.facebook}</p>}
        </div>

        {/* Instagram */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Instagram
          </label>
          <div className="relative">
            <Instagram className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="url"
              placeholder="https://instagram.com/yourcompany"
              value={formData.instagram}
              onChange={(e) => updateFormData({ instagram: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
          {errors.instagram && <p className="text-sm text-red-500 mt-1">{errors.instagram}</p>}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Why this matters?</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• Make it easy for investors to reach out to you</li>
          <li>• Build trust with verified social media presence</li>
          <li>• Showcase your brand's online engagement</li>
        </ul>
      </div>

      {/* Completion Message */}
      <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
        <p className="text-sm text-green-300">
          <strong>Almost done!</strong> Review your information and submit your profile. 
          You can always edit it later from your dashboard.
        </p>
      </div>
    </div>
  );
};

export default Step7Contact;
