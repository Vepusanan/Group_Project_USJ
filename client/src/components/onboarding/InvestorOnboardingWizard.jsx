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
  {
    number: 2,
    title: "Investor Classification",
    component: InvestorStep2Classification,
  },
  { number: 3, title: "Investment Focus", component: InvestorStep3InvestmentFocus },
  { number: 4, title: "Investment Details", component: InvestorStep4InvestmentDetails },
  { number: 5, title: "Portfolio & Track Record", component: InvestorStep5Portfolio },
  { number: 6, title: "Investment Criteria", component: InvestorStep6InvestmentCriteria },
  { number: 7, title: "Contact Information", component: InvestorStep7Contact },
];

const InvestorOnboardingWizard = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    name: "",
    firm_name: "",
    photo_url: null,
    photo_preview: null,
    location: "",
    city: "",
    country: "",
    website: "",
    linkedin: "",

    // Step 2: Classification
    investor_type: "",
    years_of_experience: "",
    background: "",

    // Step 3: Investment Focus
    investment_thesis: "",
    industries: [],
    geography: [],
    investment_stage: [],

    // Step 4: Investment Details
    investment_size_min: "",
    investment_size_max: "",
    investment_structure: [],
    follow_on_investment: false,
    investment_timeline: "",

    // Step 5: Portfolio & Track Record
    portfolio_companies: [], // Array of {name, industry, stage, year}
    notable_exits: [], // Array of {company, exit_type, year, value}
    total_investments: "",
    notable_achievements: "",

    // Step 6: Investment Criteria
    investment_criteria: "",
    red_flags: "",
    ideal_founder_profile: "",
    value_add: "",
    network_resources: [],

    // Step 7: Contact
    contact_email: "",
    contact_phone: "",
    preferred_contact_method: "email",
    social_media: {},
    is_actively_investing: true,
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
        if (!formData.name.trim()) {
          newErrors.name = "Full name is required";
        }
        if (!formData.country) {
          newErrors.country = "Country is required";
        }
        break;
      case 2:
        if (!formData.investor_type) {
          newErrors.investor_type = "Investor type is required";
        }
        if (!formData.years_of_experience) {
          newErrors.years_of_experience = "Years of experience is required";
        }
        break;
      case 3:
        if (!formData.investment_thesis.trim()) {
          newErrors.investment_thesis = "Investment thesis is required";
        }
        if (formData.industries.length === 0) {
          newErrors.industries = "Please select at least one industry";
        }
        break;
      case 4:
        if (!formData.investment_size_min) {
          newErrors.investment_size_min = "Minimum investment size is required";
        }
        if (!formData.investment_size_max) {
          newErrors.investment_size_max = "Maximum investment size is required";
        }
        if (formData.investment_structure.length === 0) {
          newErrors.investment_structure =
            "Please select at least one investment structure";
        }
        break;
      case 5:
        if (!formData.total_investments) {
          newErrors.total_investments = "Total investments count is required";
        }
        break;
      case 7:
        if (!formData.contact_email.trim()) {
          newErrors.contact_email = "Contact email is required";
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
      submitData.append("name", formData.name);
      submitData.append("firm_name", formData.firm_name || "");
      if (formData.photo_url && typeof formData.photo_url === "object") {
        submitData.append("photo", formData.photo_url);
      }
      if (formData.location) submitData.append("location", formData.location);
      if (formData.city) submitData.append("city", formData.city);
      if (formData.country) submitData.append("country", formData.country);
      if (formData.website) submitData.append("website", formData.website);
      if (formData.linkedin) submitData.append("linkedin", formData.linkedin);

      // Add classification
      submitData.append("investor_type", formData.investor_type);
      submitData.append(
        "years_of_experience",
        formData.years_of_experience
      );
      if (formData.background)
        submitData.append("background", formData.background);

      // Add investment focus
      if (formData.investment_thesis)
        submitData.append("investment_thesis", formData.investment_thesis);
      if (formData.industries.length > 0)
        submitData.append("industries", JSON.stringify(formData.industries));
      if (formData.geography.length > 0)
        submitData.append("geography", JSON.stringify(formData.geography));
      if (formData.investment_stage.length > 0)
        submitData.append(
          "investment_stage",
          JSON.stringify(formData.investment_stage)
        );

      // Add investment details
      submitData.append("investment_size_min", formData.investment_size_min);
      submitData.append("investment_size_max", formData.investment_size_max);
      if (formData.investment_structure.length > 0)
        submitData.append(
          "investment_structure",
          JSON.stringify(formData.investment_structure)
        );
      submitData.append("follow_on_investment", formData.follow_on_investment);
      if (formData.investment_timeline)
        submitData.append("investment_timeline", formData.investment_timeline);

      // Add portfolio
      if (formData.portfolio_companies.length > 0)
        submitData.append(
          "portfolio_companies",
          JSON.stringify(formData.portfolio_companies)
        );
      if (formData.notable_exits.length > 0)
        submitData.append("notable_exits", JSON.stringify(formData.notable_exits));
      if (formData.total_investments)
        submitData.append("total_investments", formData.total_investments);
      if (formData.notable_achievements)
        submitData.append("notable_achievements", formData.notable_achievements);

      // Add investment criteria
      if (formData.investment_criteria)
        submitData.append("investment_criteria", formData.investment_criteria);
      if (formData.red_flags) submitData.append("red_flags", formData.red_flags);
      if (formData.ideal_founder_profile)
        submitData.append("ideal_founder_profile", formData.ideal_founder_profile);
      if (formData.value_add) submitData.append("value_add", formData.value_add);
      if (formData.network_resources.length > 0)
        submitData.append("network_resources", JSON.stringify(formData.network_resources));

      // Add contact info
      submitData.append("contact_email", formData.contact_email);
      if (formData.contact_phone)
        submitData.append("contact_phone", formData.contact_phone);
      submitData.append(
        "preferred_contact_method",
        formData.preferred_contact_method
      );
      submitData.append("is_actively_investing", formData.is_actively_investing);

      // Add social media
      if (Object.keys(formData.social_media).length > 0) {
        submitData.append("social_media", JSON.stringify(formData.social_media));
      }

      // Submit to API
      const result = await investorProfileService.createProfile(submitData);

      if (result.success) {
        // Redirect to dashboard
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
            Complete Your Investor Profile
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

export default InvestorOnboardingWizard;
