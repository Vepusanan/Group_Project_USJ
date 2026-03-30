import React, { useState } from "react";
import { Link as LinkIcon, Upload, X, FileText } from "lucide-react";

const UrlField = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="block text-sm font-medium text-gray-300 mb-2">
      {label}
    </label>
    <div className="relative">
      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="url"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-3 bg-white/5 border border-gray-600 rounded-xl text-white"
      />
    </div>
  </div>
);

const DocumentUploadField = ({ label, documentKey, fileName, onFileChange, onRemove, errors }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <p className="text-xs text-gray-500 mb-3">
        Supported formats: PDF, DOC, DOCX. Max size: 50MB
      </p>

      {fileName ? (
        <div className="w-full rounded-xl overflow-hidden bg-white/5 border border-gray-600 p-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-blue-400 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-300 truncate">{fileName}</p>
              <p className="text-xs text-gray-500">Document uploaded</p>
            </div>
            <button
              type="button"
              onClick={() => onRemove(documentKey)}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 rounded-lg text-red-400 transition flex-shrink-0"
              title="Remove document"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="relative">
          <input
            type="file"
            onChange={(e) => onFileChange(documentKey, e.target.files?.[0])}
            accept=".pdf,.doc,.docx,.txt"
            className="hidden"
            id={`document-input-${documentKey}`}
          />
          <label
            htmlFor={`document-input-${documentKey}`}
            className="block w-full px-4 py-8 bg-white/5 border-2 border-dashed border-gray-600 rounded-xl text-center cursor-pointer hover:border-blue-500 hover:bg-white/10 transition"
          >
            <div className="flex flex-col items-center gap-2">
              <Upload className="w-8 h-8 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Click to upload {label.toLowerCase()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  PDF, DOC, or DOCX
                </p>
              </div>
            </div>
          </label>
        </div>
      )}
      {errors && <p className="text-sm text-red-500 mt-2">{errors}</p>}
    </div>
  );
};

const Step6Documents = ({ formData, updateFormData, errors }) => {
  const [fileNames, setFileNames] = useState({
    pitch_deck_url: "",
    business_plan_url: "",
  });

  const handleDocumentChange = (documentKey, file) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload a valid document file (PDF, DOC, DOCX, or TXT)");
      return;
    }

    // Validate file size (50MB)
    if (file.size > 50 * 1024 * 1024) {
      alert("File size must be less than 50MB");
      return;
    }

    // Store the file object in form data
    updateFormData({ [documentKey]: file });
    setFileNames((prev) => ({ ...prev, [documentKey]: file.name }));
  };

  const handleRemoveDocument = (documentKey) => {
    updateFormData({ [documentKey]: "" });
    setFileNames((prev) => ({ ...prev, [documentKey]: "" }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Documents & Demo
        </h2>
        <p className="text-gray-400">
          Upload investor materials and provide product demo link.
        </p>
      </div>

      <DocumentUploadField
        label="Pitch Deck"
        documentKey="pitch_deck_url"
        fileName={fileNames.pitch_deck_url}
        onFileChange={handleDocumentChange}
        onRemove={handleRemoveDocument}
        errors={errors?.pitch_deck_url}
      />

      <DocumentUploadField
        label="Business Plan"
        documentKey="business_plan_url"
        fileName={fileNames.business_plan_url}
        onFileChange={handleDocumentChange}
        onRemove={handleRemoveDocument}
        errors={errors?.business_plan_url}
      />

      <UrlField
        label="Product Demo URL"
        value={formData.product_demo_url}
        onChange={(e) => updateFormData({ product_demo_url: e.target.value })}
        placeholder="https://..."
      />
    </div>
  );
};

export default Step6Documents;
