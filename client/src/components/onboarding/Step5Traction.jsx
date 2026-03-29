import React from "react";

const Step5Traction = ({ formData, updateFormData }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Traction & Evidence
        </h2>
        <p className="text-gray-400">
          Share concrete outcomes and social proof.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Key Metrics
        </label>
        <textarea
          value={formData.key_metrics}
          onChange={(e) => updateFormData({ key_metrics: e.target.value })}
          rows={4}
          placeholder="e.g., MRR, active users, conversion, retention"
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Major Achievements
        </label>
        <textarea
          value={formData.major_achievements}
          onChange={(e) =>
            updateFormData({ major_achievements: e.target.value })
          }
          rows={4}
          placeholder="Awards, partnerships, notable launches"
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Customer Testimonials
        </label>
        <textarea
          value={formData.customer_testimonials}
          onChange={(e) =>
            updateFormData({ customer_testimonials: e.target.value })
          }
          rows={4}
          placeholder="Short customer quotes or testimonial summaries"
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
      </div>
    </div>
  );
};

export default Step5Traction;
