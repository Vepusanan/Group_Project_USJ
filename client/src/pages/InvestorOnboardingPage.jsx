import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import InvestorOnboardingWizard from "../components/onboarding/InvestorOnboardingWizard";
import { useProfileExistence } from "../hooks/useProfileCache";

const InvestorOnboardingPage = () => {
  const navigate = useNavigate();
  const { isReady, hasProfile } = useProfileExistence();

  useEffect(() => {
    if (isReady && hasProfile) {
      navigate("/startups", { replace: true });
    }
  }, [isReady, hasProfile, navigate]);

  if (!isReady) {
    return (
      <div className="min-h-screen px-6 py-10 text-gray-300">
        Checking profile status...
      </div>
    );
  }

  return <InvestorOnboardingWizard />;
};

export default InvestorOnboardingPage;
