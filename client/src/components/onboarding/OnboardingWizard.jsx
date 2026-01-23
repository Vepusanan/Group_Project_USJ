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
  { number: 5, title: "Traction & Metrics", component: Step5Traction },
  { number: 6, title: "Documents", component: Step6Documents },
  { number: 7, title: "Contact & Social", component: Step7Contact },
];

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    company_name: "",
    logo: null,
    logo_preview: null,
    website: "",

    // Step 2: Business Description
    tagline: "",
    description: "",
    industry: "",
    founded_date: "",
    stage: "",

    // Step 3: Team
    team_size: "",
    founders: [],
    team: [],

    // Step 4: Funding
    funding_stage: "",
    funding_amount: "",
    previous_funding: "",
    use_of_funds: "",

    // Step 5: Traction
    key_metrics: "",
    achievements: [],
    milestones: [],

    // Step 6: Documents
    pitch_deck: null,
    business_plan: null,
    demo_link: "",
    documents: [],

    // Step 7: Contact
    contact_email: "",
    contact_phone: "",
    linkedin: "",
    twitter: "",
    facebook: "",
    instagram: "",
  });

  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  const updateFormData = (data) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 1:
        if (!formData.company_name.trim()) {
          newErrors.company_name = "Company name is required";
        }
        break;
      case 2:
        if (!formData.tagline.trim()) newErrors.tagline = "Tagline is required";
        if (!formData.description.trim())
          newErrors.description = "Description is required";
        if (!formData.industry) newErrors.industry = "Industry is required";
        if (!formData.founded_date)
          newErrors.founded_date = "Founded date is required";
        if (!formData.stage) newErrors.stage = "Stage is required";
        break;
      case 3:
        if (!formData.team_size) newErrors.team_size = "Team size is required";
        break;
      case 4:
        if (!formData.funding_stage)
          newErrors.funding_stage = "Funding stage is required";
        if (!formData.funding_amount)
          newErrors.funding_amount = "Funding amount is required";
        if (!formData.use_of_funds.trim())
          newErrors.use_of_funds = "Use of funds is required";
        break;
      case 7:
        if (!formData.contact_email.trim()) {
          newErrors.contact_email = "Business email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) {
          newErrors.contact_email = "Invalid email format";
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    if (currentStep === STEPS.length) {
      // Submit the profile
      await handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSkip = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setSubmitError(null);

    try {
      // Prepare FormData for file upload
      const submitData = new FormData();

      // Add basic info
      submitData.append("company_name", formData.company_name);
      if (formData.website) submitData.append("website", formData.website);
      if (formData.logo) submitData.append("logo", formData.logo);

      // Add business description
      submitData.append("tagline", formData.tagline);
      submitData.append("description", formData.description);
      submitData.append("industry", formData.industry);
      submitData.append("founded_date", formData.founded_date);
      submitData.append("stage", formData.stage);

      // Add team info
      submitData.append("team_size", formData.team_size);
      if (formData.founders.length > 0) {
        submitData.append("founders", JSON.stringify(formData.founders));
      }
      if (formData.team.length > 0) {
        submitData.append("team", JSON.stringify(formData.team));
      }

      // Add funding details
      const funding = {
        stage: formData.funding_stage,
        amount_seeking: formData.funding_amount,
        previous_funding: formData.previous_funding || "0",
        use_of_funds: formData.use_of_funds,
      };
      submitData.append("funding", JSON.stringify(funding));

      // Add traction
      if (
        formData.key_metrics ||
        formData.achievements.length > 0 ||
        formData.milestones.length > 0
      ) {
        const traction = {
          metrics: formData.key_metrics,
          achievements: formData.achievements.map((a) => a.text),
          milestones: formData.milestones,
        };
        submitData.append("traction", JSON.stringify(traction));
      }

      // Add documents
      if (formData.pitch_deck) {
        submitData.append("documents", formData.pitch_deck);
      }
      if (formData.business_plan) {
        submitData.append("documents", formData.business_plan);
      }
      if (formData.demo_link) {
        submitData.append("demo_link", formData.demo_link);
      }

      // Add social media
      const socialMedia = {};
      if (formData.linkedin) socialMedia.linkedin = formData.linkedin;
      if (formData.twitter) socialMedia.twitter = formData.twitter;
      if (formData.facebook) socialMedia.facebook = formData.facebook;
      if (formData.instagram) socialMedia.instagram = formData.instagram;
      if (Object.keys(socialMedia).length > 0) {
        submitData.append("social_media", JSON.stringify(socialMedia));
      }

      // Add contact info
      submitData.append("contact_email", formData.contact_email);
      if (formData.contact_phone) {
        submitData.append("contact_phone", formData.contact_phone);
      }

      // Submit to API
      const result = await profileService.createProfile(submitData);

      if (result.success) {
        // Redirect to dashboard or profile page
        navigate("/dashboard", {
          state: { message: "Profile created successfully!" },
        });
      } else {
        setSubmitError(result.error || "Failed to create profile");
      }
    } catch (error) {
      console.error("Submit error:", error);
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Complete Your Startup Profile
          </h1>
          <p className="text-gray-400">
            Step {currentStep} of {STEPS.length}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => (
              <React.Fragment key={step.number}>
                {/* Step Circle */}
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

                {/* Connector Line */}
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

        {/* Step Content */}
        <div className="bg-white/4 backdrop-blur-lg rounded-2xl p-6 md:p-8 border border-gray-700/50">
          {/* Error Message */}
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

          {/* Navigation Buttons */}
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
                  className="px-6 py-2.5 rounded-lg font-medium text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Skip
                </button>
              )}

              <button
                onClick={handleNext}
                disabled={isSaving}
                className="px-8 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : currentStep === STEPS.length ? (
                  "Submit Profile"
                ) : (
                  "Next"
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Save Progress Notice */}
        <div className="text-center mt-6">
          <p className="text-gray-500 text-sm">
            Your progress is saved automatically. You can complete this later.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingWizard;
