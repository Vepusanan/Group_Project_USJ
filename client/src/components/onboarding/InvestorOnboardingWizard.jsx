import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import InvestorStep1BasicInfo from "./InvestorStep1BasicInfo";
import InvestorStep2Classification from "./InvestorStep2Classification";
import InvestorStep3InvestmentFocus from "./InvestorStep3InvestmentFocus";
import InvestorStep4InvestmentDetails from "./InvestorStep4InvestmentDetails";
import InvestorStep5Portfolio from "./InvestorStep5Portfolio";
import InvestorStep6InvestmentCriteria from "./InvestorStep6InvestmentCriteria";
import InvestorStep7Contact from "./InvestorStep7Contact";
import investorProfileService from "../../services/investorProfileService";

const STEPS = [
  { number: 1, title: "Basic Information", component: InvestorStep1BasicInfo },
  { number: 2, title: "Classification", component: InvestorStep2Classification },
  { number: 3, title: "Investment Focus", component: InvestorStep3InvestmentFocus },
  { number: 4, title: "Investment Details", component: InvestorStep4InvestmentDetails },
  { number: 5, title: "Portfolio", component: InvestorStep5Portfolio },
  { number: 6, title: "Criteria & Value Add", component: InvestorStep6InvestmentCriteria },
  { number: 7, title: "Contact", component: InvestorStep7Contact },
];

const InvestorOnboardingWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name_or_firm: "",
    investor_type: "",
    years_of_experience: "",
    professional_background: "",
    investment_thesis: "",
    industries_of_interest: [],
    geographic_preference: [],
    stage_preference: [],
    min_investment_size: "",
    max_investment_size: "",
    investment_structure: [],
    follow_on_investment: false,
    investment_timeline: "",
    number_of_investments: "",
    portfolio_companies: "",
    successful_exits: "",
    notable_achievements: "",
    what_you_look_for: "",
    deal_breakers: "",
    value_add: "",
    network_resources: "",
    primary_contact_email: "",
    phone_number: "",
    social_media: {},
    preferred_contact_method: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.name_or_firm.trim()) {
        newErrors.name_or_firm = "Name or firm is required";
      }
      if (!formData.investor_type) {
        newErrors.investor_type = "Investor type is required";
      }
      if (!formData.years_of_experience) {
        newErrors.years_of_experience = "Years of experience is required";
      }
      if (!formData.professional_background.trim()) {
        newErrors.professional_background = "Professional background is required";
      }
    }

    if (step === 2) {
      if (!formData.investment_thesis.trim()) {
        newErrors.investment_thesis = "Investment thesis is required";
      }
      if (!formData.industries_of_interest.length) {
        newErrors.industries_of_interest = "Select at least one industry";
      }
      if (!formData.geographic_preference.length) {
        newErrors.geographic_preference = "Select at least one geography";
      }
      if (!formData.stage_preference.length) {
        newErrors.stage_preference = "Select at least one stage";
      }
    }

    if (step === 3) {
      if (!formData.min_investment_size) {
        newErrors.min_investment_size = "Minimum investment size is required";
      }
      if (!formData.max_investment_size) {
        newErrors.max_investment_size = "Maximum investment size is required";
      }
      if (!formData.investment_structure.length) {
        newErrors.investment_structure = "Select at least one structure";
      }
      if (!formData.investment_timeline) {
        newErrors.investment_timeline = "Investment timeline is required";
      }

      const min = Number(formData.min_investment_size);
      const max = Number(formData.max_investment_size);
      if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
        newErrors.max_investment_size = "Maximum must be greater than minimum";
      }
    }

    if (step === 6) {
      if (!formData.what_you_look_for.trim()) {
        newErrors.what_you_look_for = "This field is required";
      }
      if (!formData.value_add.trim()) {
        newErrors.value_add = "This field is required";
      }
    }

    if (step === 7) {
      if (!formData.primary_contact_email.trim()) {
        newErrors.primary_contact_email = "Primary contact email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)) {
        newErrors.primary_contact_email = "Invalid email format";
      }

      if (!formData.preferred_contact_method) {
        newErrors.preferred_contact_method = "Preferred contact method is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;

    if (currentStep === STEPS.length) {
      await handleSubmit();
      return;
    }

    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentStep <= 1) return;
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSkip = () => {
    if (currentStep >= STEPS.length) return;
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setSubmitError(null);

    try {
      const submitData = new FormData();

      for (const [key, value] of Object.entries(formData)) {
        if (value === undefined || value === null) continue;

        if (typeof value === "object") {
          const hasData = Array.isArray(value)
            ? value.length > 0
            : Object.keys(value).length > 0;
          if (hasData) {
            submitData.append(key, JSON.stringify(value));
          }
          continue;
        }

        if (typeof value === "boolean") {
          submitData.append(key, String(value));
          continue;
        }

        if (String(value).trim() !== "") {
          submitData.append(key, value);
        }
      }

      const result = await investorProfileService.createProfile(submitData);

      if (result.success) {
        navigate("/startups", {
          state: { message: "Investor profile created successfully!" },
        });
      } else {
        setSubmitError(result.error || "Failed to create investor profile");
      }
    } catch (error) {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Complete Your Investor Profile</h1>
          <p className="text-gray-400">Step {currentStep} of {STEPS.length}</p>
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      step.number < currentStep
                        ? "bg-gradient-to-r from-blue-600 to-purple-600"
                        : step.number === currentStep
                          ? "bg-gradient-to-r from-purple-600 to-pink-600 ring-4 ring-purple-600/20"
                          : "bg-gray-700"
                    }`}
                  >
                    {step.number < currentStep ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white text-sm font-semibold">{step.number}</span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 hidden md:block ${
                      step.number === currentStep ? "text-purple-400 font-semibold" : "text-gray-500"
                    }`}
                  >
                    {step.title}
                  </span>
                </div>

                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 transition-all duration-300 ${
                      step.number < currentStep
                        ? "bg-gradient-to-r from-blue-600 to-purple-600"
                        : "bg-gray-700"
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="bg-white/4 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-gray-700/50">
          {submitError && (
            <div className="mb-6 bg-red-600/10 border border-red-600/30 rounded-lg p-4">
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}

          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            setErrors={setErrors}
          />

          <div className="flex justify-between mt-8 pt-6 border-t border-gray-700">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isSaving}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                currentStep === 1 || isSaving
                  ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gray-700 text-white hover:bg-gray-600"
              }`}
            >
              Back
            </button>

            <div className="flex gap-3">
              {currentStep < STEPS.length && (
                <button
                  onClick={handleSkip}
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                >
                  Skip
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={isSaving}
                className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium disabled:opacity-50"
              >
                {isSaving ? "Submitting..." : currentStep === STEPS.length ? "Submit Profile" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorOnboardingWizard;
