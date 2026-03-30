import React from "react";
import { Users } from "lucide-react";

const Step3TeamInfo = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Team Information</h2>
        <p className="text-gray-400">
          Share your core team details.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Team Size
          <span className="text-red-500 ml-1">*</span>
        </label>
        <input
          type="number"
          min="1"
          value={formData.team_size}
          onChange={(e) => updateFormData({ team_size: e.target.value })}
          placeholder="e.g., 12"
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
        />
        {errors.team_size && (
          <p className="text-sm text-red-500 mt-1">{errors.team_size}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Key Team Members
        </label>
        <textarea
          value={formData.key_team_members}
          onChange={(e) => updateFormData({ key_team_members: e.target.value })}
          placeholder="Describe leadership and key team roles"
          rows={4}
          className="w-full px-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Team Photo URL
        </label>
        <div className="relative">
          <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="url"
            value={formData.team_photo_url}
            onChange={(e) => updateFormData({ team_photo_url: e.target.value })}
            placeholder="https://example.com/team-photo.jpg"
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
          />
        </div>
      </div>
    </div>
  );
};

export default Step3TeamInfo;
