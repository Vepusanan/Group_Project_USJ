import React, { useState } from "react";
import { Users, Upload, X } from "lucide-react";

const Step3TeamInfo = ({ formData, updateFormData, errors }) => {
  const [previewUrl, setPreviewUrl] = useState(null);
  const [fileName, setFileName] = useState("");

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPG, PNG, GIF, or WebP)");
      return;
    }

    // Validate file size (25MB)
    if (file.size > 25 * 1024 * 1024) {
      alert("File size must be less than 25MB");
      return;
    }

    // Store the file object in form data
    updateFormData({ team_photo_url: file });
    setFileName(file.name);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    updateFormData({ team_photo_url: "" });
    setPreviewUrl(null);
    setFileName("");
  };

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
          Team Photo
        </label>
        <p className="text-xs text-gray-500 mb-3">
          Upload a team photo (optional). Supported formats: JPG, PNG, GIF, WebP. Max size: 25MB
        </p>

        {previewUrl ? (
          <div className="relative">
            <div className="w-full rounded-xl overflow-hidden bg-white/5 border border-gray-600 p-4">
              <img
                src={previewUrl}
                alt="Team photo preview"
                className="w-full max-h-64 object-cover rounded-lg"
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-sm text-gray-400 truncate">{fileName}</p>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition"
                  title="Remove photo"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="file"
              onChange={handlePhotoChange}
              accept="image/jpeg,image/png,image/gif,image/webp"
              className="hidden"
              id="team-photo-input"
            />
            <label
              htmlFor="team-photo-input"
              className="block w-full px-4 py-8 bg-white/5 border-2 border-dashed border-gray-600 rounded-xl text-center cursor-pointer hover:border-blue-500 hover:bg-white/10 transition"
            >
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-300">
                    Click to upload team photo
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    or drag and drop
                  </p>
                </div>
              </div>
            </label>
          </div>
        )}
        {errors.team_photo_url && (
          <p className="text-sm text-red-500 mt-2">{errors.team_photo_url}</p>
        )}
      </div>
    </div>
  );
};

export default Step3TeamInfo;
