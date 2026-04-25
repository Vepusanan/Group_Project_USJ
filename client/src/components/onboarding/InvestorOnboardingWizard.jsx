import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import InvestorStep1BasicInfo from "./InvestorStep1BasicInfo";
import InvestorStep2Classification from "./InvestorStep2Classification";
import InvestorStep3InvestmentFocus from "./InvestorStep3InvestmentFocus";
import InvestorStep4InvestmentDetails from "./InvestorStep4InvestmentDetails";
import InvestorStep7Contact from "./InvestorStep7Contact";
import investorProfileService from "../../services/investorProfileService";
import { useAuth } from "../../hooks/useAuth";
import { onboardingCheckCache } from "../../App";

const STEPS = [
  { number: 1, title: "Identity",   short: "Who you are",     component: InvestorStep1BasicInfo },
  { number: 2, title: "Focus",      short: "Your thesis",     component: InvestorStep2Classification },
  { number: 3, title: "Details",    short: "Check size",      component: InvestorStep3InvestmentFocus },
  { number: 4, title: "Portfolio",  short: "Track record",    component: InvestorStep4InvestmentDetails },
  { number: 5, title: "Contact",    short: "Reach you",       component: InvestorStep7Contact },
];

const InvestorOnboardingWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name_or_firm: "",
    investor_type: "",
    years_of_experience: "",
    location_country: "",
    location_city: "",
    website_url: "",
    linkedin_url: "",
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

  const updateFormData = (data) => setFormData((prev) => ({ ...prev, ...data }));

  const validateStep = (step) => {
    const e = {};

    if (step === 1) {
      if (!formData.name_or_firm.trim()) e.name_or_firm = "Name or firm is required";
      if (!formData.investor_type) e.investor_type = "Investor type is required";
      if (!formData.years_of_experience) e.years_of_experience = "Years of experience is required";
      if (!formData.location_country) e.location_country = "Country is required";
      if (!(formData.location_city || "").trim()) e.location_city = "City is required";
      if (!(formData.linkedin_url || "").trim()) e.linkedin_url = "LinkedIn profile is required";
      if (!formData.professional_background.trim()) e.professional_background = "Professional background is required";
    }

    if (step === 2) {
      if (!formData.investment_thesis.trim()) e.investment_thesis = "Investment thesis is required";
      if (!formData.industries_of_interest.length) e.industries_of_interest = "Select at least one industry";
      if (!formData.geographic_preference.length) e.geographic_preference = "Select at least one geography";
      if (!formData.stage_preference.length) e.stage_preference = "Select at least one stage";
    }

    if (step === 3) {
      if (!formData.min_investment_size) e.min_investment_size = "Minimum investment size is required";
      if (!formData.max_investment_size) e.max_investment_size = "Maximum investment size is required";
      if (!formData.investment_structure.length) e.investment_structure = "Select at least one structure";
      if (!formData.investment_timeline) e.investment_timeline = "Investment timeline is required";
      const min = Number(formData.min_investment_size);
      const max = Number(formData.max_investment_size);
      if (!Number.isNaN(min) && !Number.isNaN(max) && min > max) {
        e.max_investment_size = "Maximum must be greater than minimum";
      }
    }

    if (step === 4) {
      if (!formData.what_you_look_for.trim()) e.what_you_look_for = "This field is required";
      if (!formData.value_add.trim()) e.value_add = "This field is required";
    }

    if (step === 5) {
      if (!formData.primary_contact_email.trim()) e.primary_contact_email = "Contact email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.primary_contact_email)) e.primary_contact_email = "Invalid email format";
      if (!formData.preferred_contact_method) e.preferred_contact_method = "Preferred contact method is required";
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = async () => {
    if (!validateStep(currentStep)) return;
    if (currentStep === STEPS.length) { await handleSubmit(); return; }
    setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (currentStep <= 1) return;
    setCurrentStep((s) => s - 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSkip = () => {
    if (currentStep >= STEPS.length) return;
    setCurrentStep((s) => s + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    setSubmitError(null);
    try {
      const fd = new FormData();
      for (const [key, value] of Object.entries(formData)) {
        if (value === undefined || value === null) continue;
        if (typeof value === "object") {
          const has = Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0;
          if (has) fd.append(key, JSON.stringify(value));
          continue;
        }
        if (typeof value === "boolean") { fd.append(key, String(value)); continue; }
        if (String(value).trim() !== "") fd.append(key, value);
      }
      const result = await investorProfileService.createProfile(fd);
      if (result.success) {
        // Mark profile as created so OnboardingGuard skips the API check
        if (user?.id) onboardingCheckCache.set(user.id, null);
        navigate("/startups", { state: { message: "Investor profile created successfully!" } });
      } else {
        setSubmitError(result.error || "Failed to create investor profile");
      }
    } catch {
      setSubmitError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const CurrentStepComponent = STEPS[currentStep - 1].component;
  const progress = Math.round((currentStep / STEPS.length) * 100);

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-medium mb-4">
            Investor Profile Setup
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Complete Your Profile
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            Step {currentStep} of {STEPS.length} — {STEPS[currentStep - 1].short}
          </p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1.5 mb-8">
          {STEPS.map((step, idx) => (
            <React.Fragment key={step.number}>
              <button
                onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                disabled={step.number >= currentStep}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  step.number < currentStep
                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30 cursor-pointer hover:bg-violet-500/30"
                    : step.number === currentStep
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-white/3 text-gray-600 border border-white/5 cursor-default"
                }`}
              >
                {step.number < currentStep ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.number === currentStep ? "bg-violet-500 text-white" : "bg-gray-700 text-gray-500"
                  }`}>{step.number}</span>
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px transition-all ${step.number < currentStep ? "bg-violet-500/40" : "bg-white/5"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-violet-500 to-purple-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Form card */}
        <div className="bg-white/[0.03] backdrop-blur-xl rounded-2xl border border-white/10 p-6 md:p-8">
          {submitError && (
            <div className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" />
              <p className="text-red-400 text-sm">{submitError}</p>
            </div>
          )}

          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
            setErrors={setErrors}
          />

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/5">
            <button
              onClick={handleBack}
              disabled={currentStep === 1 || isSaving}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentStep === 1 || isSaving
                  ? "text-gray-600 cursor-not-allowed"
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              Back
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={handleNext}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-violet-900/30 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting…
                  </>
                ) : currentStep === STEPS.length ? (
                  "Submit Profile"
                ) : (
                  <>
                    Continue
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          You can edit your profile any time from Settings.
        </p>
      </div>
    </div>
  );
};

export default InvestorOnboardingWizard;
