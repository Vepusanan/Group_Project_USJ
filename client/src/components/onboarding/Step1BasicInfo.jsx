import React from "react";
import { Building2 } from "lucide-react";
import Input from "../common/Input";

const Step1BasicInfo = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">
          Basic Information
        </h2>
        <p className="text-gray-400">Start with your company identity.</p>
      </div>

      <Input
        label="Company Name"
        type="text"
        placeholder="Enter your company name"
        value={formData.company_name}
        onChange={(e) => updateFormData({ company_name: e.target.value })}
        error={errors.company_name}
        required
        icon={Building2}
      />
    </div>
  );
};

export default Step1BasicInfo;
