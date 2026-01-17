import React, { useRef, useState } from 'react';
import { Upload, FileText, File, Link as LinkIcon, X, CheckCircle } from 'lucide-react';

const Step6Documents = ({ formData, updateFormData, errors, setErrors }) => {
  const pitchDeckRef = useRef(null);
  const businessPlanRef = useRef(null);
  const [uploadProgress, setUploadProgress] = useState({});

  const handleFileUpload = (file, type) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = {
      pitch_deck: ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
      business_plan: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    };

    if (!allowedTypes[type].includes(file.type)) {
      setErrors({ ...errors, [type]: 'Invalid file type' });
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setErrors({ ...errors, [type]: 'File size must be less than 10MB' });
      return;
    }

    // Simulate upload progress
    setUploadProgress({ ...uploadProgress, [type]: 0 });
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = Math.min((prev[type] || 0) + 20, 100);
        if (newProgress === 100) {
          clearInterval(interval);
          updateFormData({ [type]: file });
        }
        return { ...prev, [type]: newProgress };
      });
    }, 200);

    setErrors({ ...errors, [type]: null });
  };

  const removeFile = (type) => {
    updateFormData({ [type]: null });
    setUploadProgress({ ...uploadProgress, [type]: 0 });
    if (type === 'pitch_deck' && pitchDeckRef.current) {
      pitchDeckRef.current.value = '';
    }
    if (type === 'business_plan' && businessPlanRef.current) {
      businessPlanRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Documents & Demo</h2>
        <p className="text-gray-400">
          Upload your pitch deck, business plan, and share your demo
        </p>
      </div>

      {/* Pitch Deck */}
      <div className="border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <FileText className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold text-white">Pitch Deck</h3>
          <span className="text-gray-500 text-sm">(Optional)</span>
        </div>

        {formData.pitch_deck ? (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {uploadProgress.pitch_deck === 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <FileText className="w-5 h-5 text-purple-400" />
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">{formData.pitch_deck.name}</p>
                  <p className="text-gray-400 text-sm">
                    {formatFileSize(formData.pitch_deck.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile('pitch_deck')}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadProgress.pitch_deck < 100 && (
              <div className="mt-3">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.pitch_deck}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Uploading... {uploadProgress.pitch_deck}%
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <input
              ref={pitchDeckRef}
              type="file"
              accept=".pdf,.ppt,.pptx"
              onChange={(e) => handleFileUpload(e.target.files[0], 'pitch_deck')}
              className="hidden"
              id="pitch-deck-upload"
            />
            <label
              htmlFor="pitch-deck-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-purple-500 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-white font-medium mb-1">Upload Pitch Deck</p>
              <p className="text-xs text-gray-500">PDF, PPT or PPTX (max. 10MB)</p>
            </label>
          </div>
        )}
        {errors.pitch_deck && <p className="text-sm text-red-500 mt-2">{errors.pitch_deck}</p>}
      </div>

      {/* Business Plan */}
      <div className="border border-gray-700 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <File className="w-5 h-5 text-blue-400" />
          <h3 className="text-lg font-semibold text-white">Business Plan</h3>
          <span className="text-gray-500 text-sm">(Optional)</span>
        </div>

        {formData.business_plan ? (
          <div className="bg-white/5 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {uploadProgress.business_plan === 100 ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <File className="w-5 h-5 text-blue-400" />
                )}
                <div className="flex-1">
                  <p className="text-white font-medium">{formData.business_plan.name}</p>
                  <p className="text-gray-400 text-sm">
                    {formatFileSize(formData.business_plan.size)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeFile('business_plan')}
                className="text-red-400 hover:text-red-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {uploadProgress.business_plan < 100 && (
              <div className="mt-3">
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress.business_plan}%` }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Uploading... {uploadProgress.business_plan}%
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <input
              ref={businessPlanRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={(e) => handleFileUpload(e.target.files[0], 'business_plan')}
              className="hidden"
              id="business-plan-upload"
            />
            <label
              htmlFor="business-plan-upload"
              className="flex flex-col items-center justify-center border-2 border-dashed border-gray-600 rounded-lg p-6 hover:border-blue-500 transition-colors cursor-pointer"
            >
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-white font-medium mb-1">Upload Business Plan</p>
              <p className="text-xs text-gray-500">PDF, DOC or DOCX (max. 10MB)</p>
            </label>
          </div>
        )}
        {errors.business_plan && <p className="text-sm text-red-500 mt-2">{errors.business_plan}</p>}
      </div>

      {/* Demo Link */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Demo / Product Link
          <span className="text-gray-500 ml-2 font-normal">(Optional)</span>
        </label>
        <div className="relative">
          <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="url"
            placeholder="https://demo.yourcompany.com"
            value={formData.demo_link}
            onChange={(e) => updateFormData({ demo_link: e.target.value })}
            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Share a link to your product demo, prototype, or live application
        </p>
        {errors.demo_link && <p className="text-sm text-red-500 mt-1">{errors.demo_link}</p>}
      </div>

      <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
        <p className="text-sm text-yellow-300">
          <strong>Tip:</strong> A well-prepared pitch deck significantly increases your chances of attracting investors. 
          If you don't have one ready, you can skip this step and add it later.
        </p>
      </div>
    </div>
  );
};

export default Step6Documents;
