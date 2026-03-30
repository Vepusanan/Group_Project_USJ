import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2BusinessDescription from "./Step2BusinessDescription";
import Step3TeamInfo from "./Step3TeamInfo";
import Step4FundingDetails from "./Step4FundingDetails";
import Step5Traction from "./Step5Traction";
import Step6Documents from "./Step6Documents";
import Step7Contact from "./Step7Contact";
import profileService from "../../services/profileService";

const STEPS = [
  { number: 1, title: "Basic Information", component: Step1BasicInfo },
  {
    number: 2,
    title: "Business Description",
    component: Step2BusinessDescription,
  },
  { number: 3, title: "Team Information", component: Step3TeamInfo },
  { number: 4, title: "Funding Details", component: Step4FundingDetails },
  { number: 5, title: "Traction", component: Step5Traction },
  { number: 6, title: "Documents", component: Step6Documents },
  { number: 7, title: "Contact", component: Step7Contact },
];

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    company_name: "",
    startup_logo_url: "",
    tagline: "",
    detailed_description: "",
    industry: "",
    founded_date: "",
    current_stage: "",
    team_size: "",
    founder_names: [],
    key_team_members: "",
    team_photo_url: "",
    funding_stage: "",
    amount_seeking: "",
    previous_funding: "0",
    use_of_funds: "",
    revenue_status: "",
    key_metrics: [],
    major_achievements: [],
    customer_testimonials: "",
    pitch_deck_url: "",
    business_plan_url: "",
    product_demo_url: "",
    primary_contact_name: "",
    contact_email: "",
    phone_number: "",
    social_media_links: {},
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
      if (!formData.company_name.trim()) {
        newErrors.company_name = "Company name is required";
      }
      const founderNames = Array.isArray(formData.founder_names)
        ? formData.founder_names.filter((name) => name.trim())
        : [];
      if (founderNames.length === 0) {
        newErrors.founder_names = "At least one founder name is required";
      }
    }

    if (step === 2) {
      if (!formData.tagline.trim()) newErrors.tagline = "Tagline is required";
      if (!formData.detailed_description.trim()) {
        newErrors.detailed_description = "Detailed description is required";
      }
      if (!formData.industry) newErrors.industry = "Industry is required";
      if (!formData.founded_date)
        newErrors.founded_date = "Founded date is required";
      if (!formData.current_stage)
        newErrors.current_stage = "Current stage is required";
    }

    if (step === 3) {
      if (!formData.team_size) newErrors.team_size = "Team size is required";
    }

    if (step === 4) {
      if (!formData.funding_stage)
        newErrors.funding_stage = "Funding stage is required";
      if (!formData.amount_seeking)
        newErrors.amount_seeking = "Amount seeking is required";
      if (!formData.use_of_funds.trim())
        newErrors.use_of_funds = "Use of funds is required";
      if (!formData.revenue_status)
        newErrors.revenue_status = "Revenue status is required";
    }

    if (step === 7) {
      if (!formData.primary_contact_name.trim()) {
        newErrors.primary_contact_name = "Primary contact name is required";
      }
      if (!formData.contact_email.trim()) {
        newErrors.contact_email = "Contact email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
        newErrors.contact_email = "Invalid email format";
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

        // Handle File objects (e.g., startup_logo_url, team_photo_url, pitch_deck_url, business_plan_url)
        if (value instanceof File) {
          if (key === "startup_logo_url") {
            submitData.append("startup_logo", value);
          } else if (key === "team_photo_url") {
            submitData.append("team_photo", value);
          } else if (key === "pitch_deck_url") {
            submitData.append("pitch_deck_url", value);
          } else if (key === "business_plan_url") {
            submitData.append("business_plan_url", value);
          }
          continue;
        }

        if (typeof value === "object") {
          const hasData = Array.isArray(value)
            ? value.length > 0
            : Object.keys(value).length > 0;
          if (hasData) {
            submitData.append(key, JSON.stringify(value));
          }
          continue;
        }

        if (String(value).trim() !== "") {
          submitData.append(key, value);
        }
      }

      const result = await profileService.createProfile(submitData);

      if (result.success) {
        navigate("/investors", {
          state: { message: "Profile created successfully!" },
        });
      } else {
        setSubmitError(result.error || "Failed to create profile");
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Complete Your Startup Profile
          </h1>
          <p className="text-gray-400">
            Step {currentStep} of {STEPS.length}
          </p>
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
                      <span className="text-white text-sm font-semibold">
                        {step.number}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs mt-2 hidden md:block ${
                      step.number === currentStep
                        ? "text-purple-400 font-semibold"
                        : "text-gray-500"
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
                {isSaving
                  ? "Submitting..."
                  : currentStep === STEPS.length
                    ? "Submit Profile"
                    : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
