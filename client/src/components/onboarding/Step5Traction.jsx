import React, { useState } from 'react';
import { LineChart, Trophy, Plus, X, Target } from 'lucide-react';

const Step5Traction = ({ formData, updateFormData, errors, setErrors }) => {
  const [newAchievement, setNewAchievement] = useState('');
  const [newMilestone, setNewMilestone] = useState({ title: '', date: '' });

  const addAchievement = () => {
    if (newAchievement.trim()) {
      updateFormData({
        achievements: [...formData.achievements, { id: Date.now(), text: newAchievement }],
      });
      setNewAchievement('');
    }
  };

  const removeAchievement = (id) => {
    updateFormData({
      achievements: formData.achievements.filter((a) => a.id !== id),
    });
  };

  const addMilestone = () => {
    if (newMilestone.title && newMilestone.date) {
      updateFormData({
        milestones: [...formData.milestones, { ...newMilestone, id: Date.now() }],
      });
      setNewMilestone({ title: '', date: '' });
    }
  };

  const removeMilestone = (id) => {
    updateFormData({
      milestones: formData.milestones.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Traction & Metrics</h2>
        <p className="text-gray-400">
          Showcase your progress and key achievements
        </p>
      </div>

      {/* Key Metrics */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Key Metrics
          <span className="text-gray-500 ml-2 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <LineChart className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
          <textarea
            placeholder="Share your key performance indicators (e.g., MRR: $10K, Users: 5,000, Growth Rate: 20% MoM)"
            value={formData.key_metrics}
            onChange={(e) => updateFormData({ key_metrics: e.target.value })}
            rows={4}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Include metrics like revenue, users, growth rate, etc.
        </p>
      </div>

      {/* Achievements */}
      <div className="border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Achievements</h3>
          <span className="text-gray-500 text-sm">(Optional)</span>
        </div>

        {/* Existing Achievements */}
        {formData.achievements.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.achievements.map((achievement) => (
              <div
                key={achievement.id}
                className="flex items-start justify-between bg-white/5 rounded-lg p-3"
              >
                <div className="flex items-start gap-2 flex-1">
                  <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2" />
                  <p className="text-white">{achievement.text}</p>
                </div>
                <button
                  onClick={() => removeAchievement(achievement.id)}
                  className="text-red-400 hover:text-red-300 transition-colors ml-2"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Achievement */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add an achievement (e.g., Won Best Startup Award 2024)"
            value={newAchievement}
            onChange={(e) => setNewAchievement(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addAchievement()}
            className="flex-1 px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={addAchievement}
            disabled={!newAchievement.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-600/20 border border-yellow-600 rounded-lg text-yellow-400 hover:bg-yellow-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Milestones */}
      <div className="border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold text-white">Milestones</h3>
          <span className="text-gray-500 text-sm">(Optional)</span>
        </div>

        {/* Existing Milestones */}
        {formData.milestones.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.milestones
              .sort((a, b) => new Date(b.date) - new Date(a.date))
              .map((milestone) => (
                <div
                  key={milestone.id}
                  className="flex items-center justify-between bg-white/5 rounded-lg p-3"
                >
                  <div className="flex-1">
                    <p className="text-white font-medium">{milestone.title}</p>
                    <p className="text-gray-400 text-sm">
                      {new Date(milestone.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => removeMilestone(milestone.id)}
                    className="text-red-400 hover:text-red-300 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
          </div>
        )}

        {/* Add Milestone */}
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Milestone title (e.g., Reached 10K users)"
            value={newMilestone.title}
            onChange={(e) => setNewMilestone({ ...newMilestone, title: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <div className="flex gap-2">
            <input
              type="month"
              value={newMilestone.date}
              onChange={(e) => setNewMilestone({ ...newMilestone, date: e.target.value })}
              max={new Date().toISOString().slice(0, 7)}
              className="flex-1 px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <button
              type="button"
              onClick={addMilestone}
              disabled={!newMilestone.title || !newMilestone.date}
              className="flex items-center gap-2 px-4 py-2 bg-green-600/20 border border-green-600 rounded-lg text-green-400 hover:bg-green-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Examples Section */}
      <div className="bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-600/30 rounded-lg p-4">
        <h4 className="text-white font-semibold mb-2">Examples</h4>
        <div className="text-sm text-gray-300 space-y-2">
          <div>
            <p className="font-medium text-blue-300">Key Metrics:</p>
            <p>MRR: $15K | Users: 2,500 | Churn: 3% | CAC: $50 | LTV: $800</p>
          </div>
          <div>
            <p className="font-medium text-purple-300">Achievement:</p>
            <p>Featured in TechCrunch, Selected for Y Combinator W24</p>
          </div>
          <div>
            <p className="font-medium text-green-300">Milestone:</p>
            <p>First paying customer (Jan 2024), Break-even achieved (Jun 2024)</p>
          </div>
        </div>
      </div>

      <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
        <p className="text-sm text-green-300">
          <strong>Tip:</strong> Quantifiable metrics and notable achievements help build credibility. 
          Even early-stage startups can showcase user feedback, partnerships, or competitions won.
        </p>
      </div>
    </div>
  );
};

export default Step5Traction;
