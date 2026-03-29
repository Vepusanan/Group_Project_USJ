import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import OnboardingWizard from "../components/onboarding/OnboardingWizard";
import profileService from "../services/profileService";

const OnboardingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkExistingProfile = async () => {
      const result = await profileService.getMyProfile();
      const data = result.data?.data || result.data;
      const hasProfile = Boolean(data?.startup_profile_id || data?.id);

      if (result.success && hasProfile) {
        navigate("/investors", { replace: true });
        return;
      }
      setLoading(false);
    };

    checkExistingProfile();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen px-6 py-10 text-gray-300">
        Checking profile status...
      </div>
    );
  }

  return <OnboardingWizard />;
};

export default OnboardingPage;
