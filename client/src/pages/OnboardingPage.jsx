import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import { useProfileExistence } from "../hooks/useProfileCache";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { isReady, hasProfile } = useProfileExistence();

  useEffect(() => {
    if (isReady && hasProfile) {
      navigate("/investors", { replace: true });
    }
  }, [isReady, hasProfile, navigate]);

  if (!isReady) {
    return (
      <div className="min-h-screen px-6 py-10 text-gray-300">
        Checking profile status...
      </div>
    );
  }

  return <OnboardingWizard />;
};

export default OnboardingPage;
