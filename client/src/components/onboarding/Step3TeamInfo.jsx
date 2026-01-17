import React, { useState } from 'react';
import { Users, Plus, X, Upload, UserPlus } from 'lucide-react';
import Input from '../common/Input';

const TEAM_SIZES = ['1-5', '6-10', '11-20', '21-50', '51-100', '100+'];

const Step3TeamInfo = ({ formData, updateFormData, errors, setErrors }) => {
  const [newFounder, setNewFounder] = useState({ name: '', title: '', linkedin: '' });
  const [newMember, setNewMember] = useState({ name: '', role: '', photo: null });

  const addFounder = () => {
    if (newFounder.name && newFounder.title) {
      updateFormData({
        founders: [...formData.founders, { ...newFounder, id: Date.now() }],
      });
      setNewFounder({ name: '', title: '', linkedin: '' });
    }
  };

  const removeFounder = (id) => {
    updateFormData({
      founders: formData.founders.filter((f) => f.id !== id),
    });
  };

  const addTeamMember = () => {
    if (newMember.name && newMember.role) {
      updateFormData({
        team: [...formData.team, { ...newMember, id: Date.now() }],
      });
      setNewMember({ name: '', role: '', photo: null });
    }
  };

  const removeTeamMember = (id) => {
    updateFormData({
      team: formData.team.filter((m) => m.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Team Information</h2>
        <p className="text-gray-400">
          Tell us about your team and key people
        </p>
      </div>

      {/* Team Size */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Team Size
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {TEAM_SIZES.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => updateFormData({ team_size: size })}
              className={`px-4 py-2.5 rounded-lg font-medium transition-all ${
                formData.team_size === size
                  ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white'
                  : 'bg-white/5 border border-gray-600 text-gray-300 hover:border-purple-500'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {errors.team_size && <p className="text-sm text-red-500 mt-1">{errors.team_size}</p>}
      </div>

      {/* Founders Section */}
      <div className="border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Founders</h3>
          <span className="text-gray-500 text-sm">(Optional)</span>
        </div>

        {/* Existing Founders */}
        {formData.founders.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.founders.map((founder) => (
              <div
                key={founder.id}
                className="flex items-center justify-between bg-white/5 rounded-lg p-3"
              >
                <div>
                  <p className="text-white font-medium">{founder.name}</p>
                  <p className="text-gray-400 text-sm">{founder.title}</p>
                  {founder.linkedin && (
                    <a
                      href={founder.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 text-xs hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  )}
                </div>
                <button
                  onClick={() => removeFounder(founder.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Founder Form */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Founder Name"
              value={newFounder.name}
              onChange={(e) => setNewFounder({ ...newFounder, name: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Title (e.g., CEO, CTO)"
              value={newFounder.title}
              onChange={(e) => setNewFounder({ ...newFounder, title: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <input
            type="url"
            placeholder="LinkedIn Profile (Optional)"
            value={newFounder.linkedin}
            onChange={(e) => setNewFounder({ ...newFounder, linkedin: e.target.value })}
            className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={addFounder}
            disabled={!newFounder.name || !newFounder.title}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600/20 border border-purple-600 rounded-lg text-purple-400 hover:bg-purple-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Founder
          </button>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Key Team Members</h3>
          <span className="text-gray-500 text-sm">(Optional)</span>
        </div>

        {/* Existing Team Members */}
        {formData.team.length > 0 && (
          <div className="space-y-2 mb-4">
            {formData.team.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between bg-white/5 rounded-lg p-3"
              >
                <div>
                  <p className="text-white font-medium">{member.name}</p>
                  <p className="text-gray-400 text-sm">{member.role}</p>
                </div>
                <button
                  onClick={() => removeTeamMember(member.id)}
                  className="text-red-400 hover:text-red-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add Team Member Form */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Member Name"
              value={newMember.name}
              onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
            <input
              type="text"
              placeholder="Role"
              value={newMember.role}
              onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
              className="px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            type="button"
            onClick={addTeamMember}
            disabled={!newMember.name || !newMember.role}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 border border-blue-600 rounded-lg text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            Add Team Member
          </button>
        </div>
      </div>

      <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-4">
        <p className="text-sm text-green-300">
          <strong>Tip:</strong> Highlight your founding team and key members. 
          Strong teams attract investors. You can always add more members later.
        </p>
      </div>
    </div>
  );
};

export default Step3TeamInfo;
