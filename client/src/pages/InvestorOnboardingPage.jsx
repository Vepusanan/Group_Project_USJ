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
      const data = result.data?.data || result.data;
      const hasProfile = Boolean(data?.investor_profile_id || data?.id);

      if (result.success && hasProfile) {
        navigate("/startups", { replace: true });
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
