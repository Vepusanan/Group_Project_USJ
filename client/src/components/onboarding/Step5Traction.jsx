import React from "react";
import { Plus, Trash2 } from "lucide-react";

const Step5Traction = ({ formData, updateFormData, errors }) => {
  const handleAddMetric = () => {
    updateFormData({
      key_metrics: [...(Array.isArray(formData.key_metrics) ? formData.key_metrics : []), ""],
    });
  };

  const handleRemoveMetric = (index) => {
    const updatedMetrics = (Array.isArray(formData.key_metrics) ? formData.key_metrics : []).filter(
      (_, i) => i !== index
    );
    updateFormData({ key_metrics: updatedMetrics });
  };

  const handleMetricChange = (index, value) => {
    const updatedMetrics = Array.isArray(formData.key_metrics) ? [...formData.key_metrics] : [];
    updatedMetrics[index] = value;
    updateFormData({ key_metrics: updatedMetrics });
  };

  const handleAddAchievement = () => {
    updateFormData({
      major_achievements: [...(Array.isArray(formData.major_achievements) ? formData.major_achievements : []), ""],
    });
  };

  const handleRemoveAchievement = (index) => {
    const updatedAchievements = (Array.isArray(formData.major_achievements) ? formData.major_achievements : []).filter(
      (_, i) => i !== index
    );
    updateFormData({ major_achievements: updatedAchievements });
  };

  const handleAchievementChange = (index, value) => {
    const updatedAchievements = Array.isArray(formData.major_achievements) ? [...formData.major_achievements] : [];
    updatedAchievements[index] = value;
    updateFormData({ major_achievements: updatedAchievements });
  };

  const keyMetrics = Array.isArray(formData.key_metrics) ? formData.key_metrics : [];
  const majorAchievements = Array.isArray(formData.major_achievements) ? formData.major_achievements : [];

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
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-medium text-gray-300">
            Key Metrics
          </label>
        </div>
        <p className="text-xs text-gray-500 mb-4">Add each metric one by one (e.g., MRR, active users, retention rate)</p>

        <div className="space-y-3">
          {keyMetrics.map((metric, index) => (
            <div key={index} className="flex gap-2 items-end">
              <input
                type="text"
                value={metric}
                onChange={(e) => handleMetricChange(index, e.target.value)}
                placeholder={`Metric ${index + 1}`}
                className="flex-1 px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleRemoveMetric(index)}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-400 transition"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {errors?.key_metrics && (
          <p className="text-sm text-red-500 mt-2">{errors.key_metrics}</p>
        )}

        <button
          type="button"
          onClick={handleAddMetric}
          className="mt-4 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition"
        >
          <Plus size={18} />
          Add Metric
        </button>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <label className="block text-sm font-medium text-gray-300">
            Major Achievements
          </label>
        </div>
        <p className="text-xs text-gray-500 mb-4">Add each achievement one by one (awards, partnerships, launches)</p>

        <div className="space-y-3">
          {majorAchievements.map((achievement, index) => (
            <div key={index} className="flex gap-2 items-end">
              <textarea
                value={achievement}
                onChange={(e) => handleAchievementChange(index, e.target.value)}
                placeholder={`Achievement ${index + 1}`}
                rows={2}
                className="flex-1 px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 resize-none"
              />
              <button
                type="button"
                onClick={() => handleRemoveAchievement(index)}
                className="p-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-xl text-red-400 transition flex-shrink-0"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>

        {errors?.major_achievements && (
          <p className="text-sm text-red-500 mt-2">{errors.major_achievements}</p>
        )}

        <button
          type="button"
          onClick={handleAddAchievement}
          className="mt-4 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition"
        >
          <Plus size={18} />
          Add Achievement
        </button>
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
