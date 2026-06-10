import {
  createVerificationRequest,
  getLatestVerificationRequest,
  getUserVerification,
  setUserLinkedIn,
} from "../repositories/VerificationRepository.js";
import { isAdminUser } from "../middleware/admin.js";
import { uploadVerificationDocument } from "../utils/supabaseStorage.js";
import { checkLinkedInAccessibility, normalizeLinkedInUrl } from "../utils/linkedinVerification.js";
import { tryAwardIdentityVerification } from "../services/identityVerificationService.js";

const MS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;

export const getMyVerificationStatus = async (req, res, next) => {
  try {
    const user = await getUserVerification(req.user.id);
    const latestRequest = await getLatestVerificationRequest(req.user.id);

    const needsAnnualReview =
      user?.verification_tier === "BUSINESS_VERIFIED" &&
      user?.business_verified_at &&
      Date.now() - new Date(user.business_verified_at).getTime() > MS_PER_YEAR;

    res.json({
      success: true,
      data: {
        verification_tier: user?.verification_tier || "UNVERIFIED",
        email_verified: Boolean(user?.email_verified),
        linkedin_profile_url: user?.linkedin_profile_url || null,
        business_verified_at: user?.business_verified_at || null,
        needs_annual_review: Boolean(needsAnnualReview),
        latest_request: latestRequest
          ? {
              id: latestRequest.id,
              requested_tier: latestRequest.requested_tier,
              status: latestRequest.status,
              rejection_reason: latestRequest.rejection_reason,
              created_at: latestRequest.created_at,
              reviewed_at: latestRequest.reviewed_at,
            }
          : null,
        is_admin: isAdminUser(req.user),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitIdentityVerification = async (req, res, next) => {
  try {
    const user = await getUserVerification(req.user.id);
    if (!user?.email_verified) {
      return res.status(400).json({
        success: false,
        error: "Verify your email before requesting Identity Verified status",
      });
    }

    const linkedinUrl = normalizeLinkedInUrl(req.body.linkedin_profile_url);
    if (!linkedinUrl) {
      return res.status(400).json({
        success: false,
        error: "A valid LinkedIn profile URL is required",
      });
    }

    const accessibility = await checkLinkedInAccessibility(linkedinUrl);
    if (!accessibility.ok) {
      return res.status(400).json({
        success: false,
        error: accessibility.reason,
      });
    }

    if (user.verification_tier === "BUSINESS_VERIFIED") {
      return res.json({
        success: true,
        data: { verification_tier: user.verification_tier },
        message: "You already have Business Verified status",
      });
    }

    await setUserLinkedIn(req.user.id, linkedinUrl);

    const award = await tryAwardIdentityVerification(req.user.id, {
      requireAccessibility: false,
    });

    if (!award.awarded) {
      return res.status(400).json({
        success: false,
        error: "Unable to award Identity Verified status",
      });
    }

    res.json({
      success: true,
      data: {
        verification_tier: "IDENTITY_VERIFIED",
        linkedin_profile_url: linkedinUrl,
      },
      message: accessibility.soft
        ? "Identity Verified badge awarded. LinkedIn accessibility could not be fully confirmed automatically."
        : "Identity Verified badge awarded",
    });
  } catch (error) {
    next(error);
  }
};

export const submitBusinessVerification = async (req, res, next) => {
  try {
    const user = await getUserVerification(req.user.id);
    if (!user?.email_verified) {
      return res.status(400).json({
        success: false,
        error: "Verify your email before submitting business verification",
      });
    }

    const linkedinUrl = normalizeLinkedInUrl(req.body.linkedin_profile_url);
    if (!linkedinUrl) {
      return res.status(400).json({
        success: false,
        error: "A valid LinkedIn profile URL is required",
      });
    }

    const docHint =
      req.user.user_type === "investor"
        ? "fund registration, investment track record, or professional investor credential"
        : "certificate of incorporation or equivalent business registration (issued within the last 3 years)";

    const latest = await getLatestVerificationRequest(req.user.id);
    if (
      latest?.status === "pending" &&
      latest.requested_tier === "BUSINESS_VERIFIED"
    ) {
      return res.status(409).json({
        success: false,
        error: "A business verification request is already pending review",
      });
    }

    let documentUrl = null;
    let documentName = null;

    if (req.file) {
      const uploaded = await uploadVerificationDocument(req.file, req.user.id);
      documentUrl = uploaded.url;
      documentName = uploaded.name;
    }

    if (!documentUrl) {
      return res.status(400).json({
        success: false,
        error: "Supporting documentation is required for Business Verified status",
      });
    }

    await setUserLinkedIn(req.user.id, linkedinUrl);

    const request = await createVerificationRequest({
      userId: req.user.id,
      requestedTier: "BUSINESS_VERIFIED",
      linkedinProfileUrl: linkedinUrl,
      documentUrl,
      documentName,
    });

    res.status(201).json({
      success: true,
      data: {
        request: {
          id: request.id,
          status: request.status,
          requested_tier: request.requested_tier,
          created_at: request.created_at,
        },
      },
      message: `Business verification submitted for administrator review. Expected document: ${docHint}. Reviews are typically completed within 48 hours.`,
    });
  } catch (error) {
    next(error);
  }
};
