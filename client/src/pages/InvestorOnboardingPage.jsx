import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import InvestorOnboardingWizard from "../components/onboarding/InvestorOnboardingWizard";
import investorProfileService from "../services/investorProfileService";

const InvestorOnboardingPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkExistingProfile = async () => {
      const result = await investorProfileService.getMyProfile();
      if (result.success && result.data?.data?.id) {
        navigate("/dashboard", { replace: true });
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

  return <InvestorOnboardingWizard />;
};

export default InvestorOnboardingPage;
