import pool from "../config/database.js";
import {
  createVerificationRequest,
  getUserVerification,
  setUserLinkedIn,
  setUserVerificationTier,
} from "../repositories/VerificationRepository.js";
import { getStartupProfileByUserId } from "../repositories/StartupProfileRepository.js";
import { getInvestorProfileByUserId } from "../repositories/InvestorProfileRepository.js";
import {
  checkLinkedInAccessibility,
  extractLinkedInFromSocial,
  normalizeLinkedInUrl,
} from "../utils/linkedinVerification.js";

const parseSocial = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export async function resolveLinkedInForUser(userId) {
  const user = await getUserVerification(userId);
  if (!user) return null;

  const direct = normalizeLinkedInUrl(user.linkedin_profile_url);
  if (direct) return direct;

  const [startupProfile, investorProfile] = await Promise.all([
    getStartupProfileByUserId(userId),
    getInvestorProfileByUserId(userId),
  ]);

  const fromStartup = extractLinkedInFromSocial(
    parseSocial(startupProfile?.social_media_links),
  );
  if (fromStartup) return fromStartup;

  const fromInvestor = extractLinkedInFromSocial(
    parseSocial(investorProfile?.social_media),
  );
  if (fromInvestor) return fromInvestor;

  return null;
}

export async function tryAwardIdentityVerification(
  userId,
  { requireAccessibility = false } = {},
) {
  const user = await getUserVerification(userId);
  if (!user?.email_verified) {
    return { awarded: false, reason: "email_not_verified" };
  }

  if (user.verification_tier === "BUSINESS_VERIFIED") {
    return { awarded: false, reason: "already_business_verified" };
  }

  if (user.verification_tier === "IDENTITY_VERIFIED") {
    return { awarded: false, reason: "already_identity_verified" };
  }

  const linkedinUrl = await resolveLinkedInForUser(userId);
  if (!linkedinUrl) {
    return { awarded: false, reason: "linkedin_missing" };
  }

  if (requireAccessibility) {
    const accessibility = await checkLinkedInAccessibility(linkedinUrl);
    if (!accessibility.ok) {
      return { awarded: false, reason: accessibility.reason };
    }
  }

  await setUserLinkedIn(userId, linkedinUrl);
  await setUserVerificationTier(userId, "IDENTITY_VERIFIED");

  const request = await createVerificationRequest({
    userId,
    requestedTier: "IDENTITY_VERIFIED",
    linkedinProfileUrl: linkedinUrl,
  });

  await pool.query(
    `
      UPDATE public.verification_requests
      SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `,
    [request.id],
  );

  return {
    awarded: true,
    verification_tier: "IDENTITY_VERIFIED",
    linkedin_profile_url: linkedinUrl,
  };
}
