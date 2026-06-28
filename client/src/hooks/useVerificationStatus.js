import { useEffect, useState } from "react";
import engagementService from "../services/engagementService";

/**
 * Fetches the current user's verification status from /verification/me once.
 * Returns { status, loading }. Shared by the profile header badge and the
 * profile verification card so they don't each fetch separately.
 */
export const useVerificationStatus = () => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await engagementService.getVerificationStatus();
      if (!active) return;
      if (result.success) setStatus(result.data);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  return { status, loading };
};

export default useVerificationStatus;
