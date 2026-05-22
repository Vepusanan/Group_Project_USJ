import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronRight, Loader2 } from "lucide-react";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2BusinessDescription from "./Step2BusinessDescription";
import Step3TeamInfo from "./Step3TeamInfo";
import Step4FundingDetails from "./Step4FundingDetails";
import Step7Contact from "./Step7Contact";
import profileService from "../../services/profileService";
import { useAuth } from "../../hooks/useAuth";
import { useProfileExistence } from "../../hooks/useProfileCache";

const STEPS = [
  { number: 1, title: "Identity",  short: "Who you are",    component: Step1BasicInfo },
  { number: 2, title: "Business",  short: "What you do",    component: Step2BusinessDescription },
  { number: 3, title: "Team",      short: "Your team",      component: Step3TeamInfo },
  { number: 4, title: "Funding",   short: "The raise",      component: Step4FundingDetails },
  { number: 5, title: "Contact",   short: "Reach you",      component: Step7Contact },
];

const OnboardingWizard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { markComplete } = useProfileExistence();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    company_name: "",
    founder_names: [""],
    logo_file: null,
    logo_preview: null,
    location_country: "",
    location_city: "",
    website_url: "",
    linkedin_url: "",
    tagline: "",
    detailed_description: "",
    industry: "",
    founded_date: "",
    current_stage: "",
    team_size: "",
    key_team_members: "",
    key_metrics: "",
    major_achievements: "",
    customer_testimonials: "",
    funding_stage: "",
    amount_seeking: "",
    previous_funding: "0",
    use_of_funds: "",
    revenue_status: "",
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

  const updateFormData = (data) => setFormData((prev) => ({ ...prev, ...data }));

  const validateStep = (step) => {
    const e = {};

    if (step === 1) {
      if (!formData.company_name.trim()) e.company_name = "Company name is required";
      const founders = Array.isArray(formData.founder_names) ? formData.founder_names : [formData.founder_names];
      if (!founders.some((n) => n.trim())) e.founder_names = "At least one founder name is required";
      if (!formData.location_country) e.location_country = "Country is required";
      if (!(formData.location_city || "").trim()) e.location_city = "City is required";
    }

    if (step === 2) {
      if (!formData.tagline.trim()) e.tagline = "Tagline is required";
      if (!formData.detailed_description.trim()) e.detailed_description = "Description is required";
      if (!formData.industry) e.industry = "Industry is required";
      if (!formData.founded_date) e.founded_date = "Founded date is required";
      if (!formData.current_stage) e.current_stage = "Current stage is required";
    }

    if (step === 3) {
      if (!formData.team_size) e.team_size = "Team size is required";
    }

    if (step === 4) {
      if (!formData.funding_stage) e.funding_stage = "Funding stage is required";
      if (!formData.amount_seeking) e.amount_seeking = "Amount seeking is required";
      if (!formData.revenue_status) e.revenue_status = "Revenue status is required";
      if (!formData.use_of_funds.trim()) e.use_of_funds = "Use of funds is required";
    }

    if (step === 5) {
      if (!formData.primary_contact_name.trim()) e.primary_contact_name = "Contact name is required";
      if (!formData.contact_email.trim()) e.contact_email = "Contact email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email)) e.contact_email = "Invalid email format";
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

      // Attach logo file if selected
      if (formData.logo_file) {
        fd.append("logo", formData.logo_file);
      }

      for (const [key, value] of Object.entries(formData)) {
        if (key === "logo_file" || key === "logo_preview") continue;
        if (value === undefined || value === null) continue;
        if (key === "founder_names") {
          const filtered = (Array.isArray(value) ? value : [value]).map((n) => n.trim()).filter(Boolean);
          if (filtered.length) fd.append("founder_names", JSON.stringify(filtered));
          continue;
        }
        if (typeof value === "object") {
          const has = Array.isArray(value) ? value.length > 0 : Object.keys(value).length > 0;
          if (has) fd.append(key, JSON.stringify(value));
          continue;
        }
        if (String(value).trim() !== "") fd.append(key, value);
      }
      const result = await profileService.createProfile(fd);
      if (result.success) {
        // Mark profile as created so OnboardingGuard skips the API check on
        // the next navigation.
        markComplete(user?.id);
        navigate("/investors", { state: { message: "Profile created successfully!" } });
      } else {
        setSubmitError(result.error || "Failed to create profile");
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium mb-4">
            Startup Profile Setup
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
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/30"
                    : step.number === currentStep
                    ? "bg-white/10 text-white border border-white/20"
                    : "bg-white/3 text-gray-600 border border-white/5 cursor-default"
                }`}
              >
                {step.number < currentStep ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    step.number === currentStep ? "bg-emerald-500 text-white" : "bg-gray-700 text-gray-500"
                  }`}>{step.number}</span>
                )}
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {idx < STEPS.length - 1 && (
                <div className={`flex-1 h-px transition-all ${step.number < currentStep ? "bg-emerald-500/40" : "bg-white/5"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-white/5 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
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
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-emerald-900/30 disabled:opacity-50"
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

export default OnboardingWizard;
