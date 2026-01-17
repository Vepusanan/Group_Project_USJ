import React from 'react';
import { Sparkles, FileText, Briefcase, Calendar, TrendingUp } from 'lucide-react';
import Input from '../common/Input';

const INDUSTRIES = [
  'Fintech', 'Healthcare', 'E-commerce', 'SaaS', 'EdTech', 
  'AgriTech', 'AI/ML', 'Blockchain', 'IoT', 'Cybersecurity',
  'CleanTech', 'FoodTech', 'PropTech', 'Logistics', 'Other'
];

const STAGES = [
  'Idea',
  'MVP',
  'Early Traction',
  'Growth',
  'Scaling',
  'Mature'
];

const Step2BusinessDescription = ({ formData, updateFormData, errors, setErrors }) => {
  const maxTaglineLength = 100;
  const maxDescriptionLength = 500;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Business Description</h2>
        <p className="text-gray-400">
          Tell us about your business and what makes it special
        </p>
      </div>

      {/* Tagline */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Tagline
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Sparkles className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="A catchy one-liner about your startup"
            value={formData.tagline}
            onChange={(e) => {
              if (e.target.value.length <= maxTaglineLength) {
                updateFormData({ tagline: e.target.value });
              }
            }}
            maxLength={maxTaglineLength}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>
        <div className="flex justify-between mt-1">
          {errors.tagline && <p className="text-sm text-red-500">{errors.tagline}</p>}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.tagline.length}/{maxTaglineLength}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Business Description
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          placeholder="Describe what your startup does, the problem you solve, and your unique value proposition..."
          value={formData.description}
          onChange={(e) => {
            if (e.target.value.length <= maxDescriptionLength) {
              updateFormData({ description: e.target.value });
            }
          }}
          maxLength={maxDescriptionLength}
          rows={6}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
        />
        <div className="flex justify-between mt-1">
          {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          <p className="text-xs text-gray-500 ml-auto">
            {formData.description.length}/{maxDescriptionLength}
          </p>
        </div>
      </div>

      {/* Industry */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Industry
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="relative">
          <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
          <select
            value={formData.industry}
            onChange={(e) => updateFormData({ industry: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
          >
            <option value="" className="bg-gray-900">Select your industry</option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry} className="bg-gray-900">
                {industry}
              </option>
            ))}
          </select>
        </div>
        {errors.industry && <p className="text-sm text-red-500 mt-1">{errors.industry}</p>}
      </div>

      {/* Founded Date & Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Founded Date */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Founded Date
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <input
              type="date"
              value={formData.founded_date}
              onChange={(e) => updateFormData({ founded_date: e.target.value })}
              max={new Date().toISOString().split('T')[0]}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>
          {errors.founded_date && <p className="text-sm text-red-500 mt-1">{errors.founded_date}</p>}
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Stage
            <span className="text-red-500 ml-1">*</span>
          </label>
          <div className="relative">
            <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none z-10" />
            <select
              value={formData.stage}
              onChange={(e) => updateFormData({ stage: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-900">Select stage</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage} className="bg-gray-900">
                  {stage}
                </option>
              ))}
            </select>
          </div>
          {errors.stage && <p className="text-sm text-red-500 mt-1">{errors.stage}</p>}
        </div>
      </div>

      <div className="bg-purple-600/10 border border-purple-600/30 rounded-lg p-4">
        <p className="text-sm text-purple-300">
          <strong>Tip:</strong> Your tagline should be memorable and clearly communicate your value proposition. 
          Keep your description concise but informative.
        </p>
      </div>
    </div>
  );
};

export default Step2BusinessDescription;
