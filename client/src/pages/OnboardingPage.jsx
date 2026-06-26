import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import { useAuth } from "../hooks/useAuth";
import { AUTH_STATUS } from "../utils/authStateMachine.js";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { authStatus, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && authStatus === AUTH_STATUS.AUTHENTICATED_READY) {
      navigate("/dashboard", { replace: true });
    }
  }, [authStatus, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen px-6 py-10 text-content-secondary">
        Checking profile status...
      </div>
    );
  }

  return <OnboardingWizard />;
};

export default OnboardingPage;
