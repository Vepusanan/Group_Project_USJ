import fs from "fs";
import {
  createStartupProfile,
  getStartupProfileById,
  updateStartupProfile,
  getStartupProfileByUserId,
} from "../repositories/StartupProfileRepository.js";
import {
  createInvestorProfile,
  getInvestorProfileById,
  updateInvestorProfile,
  getInvestorProfileByUserId,
} from "../repositories/InvestorProfileRepository.js";
import { StartupProfile } from "../models/StartupProfiles.js";
import { InvestorProfile } from "../models/InvestorProfile.js";
import { getPrivacySettingsByUserId } from "../repositories/PrivacySettingsRepository.js";
import {
  getConnectionBetweenUsers,
  isUsersConnected,
} from "../repositories/ConnectionRepository.js";
import {
  ensureInvestorMatchScores,
  invalidateInvestorMatchScores,
  invalidateStartupMatchScores,
} from "../services/compatibilityMatchService.js";
import { getMatchScoresForInvestor } from "../repositories/CompatibilityMatchScoreRepository.js";
import { getProfileIntent } from "../repositories/InvestorProfileIntentRepository.js";
import { getIntentMapForInvestor } from "../repositories/InvestorIntentRepository.js";
import { calculateCompatibilityScore } from "../utils/compatibilityScore.js";
import { buildMatchExplanationAsync } from "../utils/matchExplanation.js";
import { recordStartupProfileView } from "../repositories/StartupProfileViewRepository.js";
import { notifyProfileView } from "../utils/notificationDelivery.js";
import { getUserVerification } from "../repositories/VerificationRepository.js";
import { getCredibilitySignals } from "../services/credibilityService.js";
import { tryAwardIdentityVerification } from "../services/identityVerificationService.js";
import { touchUserActivity } from "../repositories/UserActivityRepository.js";
import { resolveFundingRoundVisibility } from "./fundingRoundController.js";
import { serializeFundingRoundForViewer } from "../repositories/FundingRoundRepository.js";
import {
  uploadStartupLogo,
  uploadInvestorPhoto,
  uploadMultipleDocuments,
  uploadDocument,
  uploadFounderVideo,
  uploadFounderVideoThumbnail,
} from "../utils/supabaseStorage.js";

const cleanupFiles = (files) => {
  for (const file of files) {
    try { fs.unlinkSync(file.path); } catch {}
  }
};

async function processStartupUploads(req) {
  const uploads = {};
  const files = req.files || {};

  if (files.logo?.length) {
    const logoFile = files.logo[0];
    try {
      uploads.logo_url = await uploadStartupLogo(logoFile.path, "tmp");
    } catch (err) {
      cleanupFiles([logoFile]);
      throw new Error(`Logo upload failed: ${err.message}`);
    }
  }

  if (files.pitch_deck?.length) {
    const deckFile = files.pitch_deck[0];
    if (deckFile.mimetype !== "application/pdf") {
      cleanupFiles([deckFile]);
      throw new Error("Pitch deck must be a PDF file");
    }
    try {
      const startupId = req.body?.startup_profile_id || req.params?.id || "tmp";
      const doc = await uploadDocument(
        deckFile.path,
        deckFile.originalname,
        startupId,
      );
      uploads.pitch_deck_url = doc.url;
    } catch (err) {
      cleanupFiles([deckFile]);
      throw new Error(`Pitch deck upload failed: ${err.message}`);
    }
  }

  if (files.business_plan?.length) {
    const planFile = files.business_plan[0];
    try {
      const startupId = req.body?.startup_profile_id || req.params?.id || "tmp";
      const doc = await uploadDocument(
        planFile.path,
        planFile.originalname,
        startupId,
      );
      uploads.business_plan_url = doc.url;
    } catch (err) {
      cleanupFiles([planFile]);
      throw new Error(`Business plan upload failed: ${err.message}`);
    }
  }

  if (files.documents?.length) {
    try {
      const startupId = req.body?.startup_profile_id || req.params?.id || "tmp";
      const docs = await uploadMultipleDocuments(files.documents, startupId);
      if (docs[0]) uploads.pitch_deck_url = uploads.pitch_deck_url || docs[0].url;
      if (docs[1]) uploads.business_plan_url = uploads.business_plan_url || docs[1].url;
    } catch (err) {
      cleanupFiles(files.documents || []);
      throw new Error(`Document upload failed: ${err.message}`);
    }
  }

  if (files.founder_video?.length) {
    const videoFile = files.founder_video[0];
    if (videoFile.mimetype !== "video/mp4") {
      cleanupFiles([videoFile]);
      throw new Error("Founder video must be an MP4 file");
    }
    try {
      const startupId = req.body?.startup_profile_id || req.params?.id || "tmp";
      uploads.founder_video_url = await uploadFounderVideo(
        videoFile.path,
        startupId,
      );
    } catch (err) {
      cleanupFiles([videoFile]);
      throw new Error(`Founder video upload failed: ${err.message}`);
    }
  }

  if (files.founder_video_thumbnail?.length) {
    const thumbFile = files.founder_video_thumbnail[0];
    try {
      const startupId = req.body?.startup_profile_id || req.params?.id || "tmp";
      uploads.founder_video_thumbnail_url = await uploadFounderVideoThumbnail(
        thumbFile.path,
        startupId,
      );
    } catch (err) {
      cleanupFiles([thumbFile]);
      throw new Error(`Video thumbnail upload failed: ${err.message}`);
    }
  }

  return uploads;
}

async function processInvestorUploads(req) {
  const uploads = {};
  const files = req.files || {};

  if (files.photo?.length) {
    const photoFile = files.photo[0];
    try {
      uploads.photo_url = await uploadInvestorPhoto(photoFile.path, "tmp");
    } catch (err) {
      cleanupFiles([photoFile]);
      throw new Error(`Photo upload failed: ${err.message}`);
    }
  }

  return uploads;
}

const parseJsonValue = (value) => {
  if (!value || typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return value;
  }
};

const parseBodyJsonFields = (body, fields) => {
  for (const field of fields) {
    if (!Object.prototype.hasOwnProperty.call(body, field)) continue;
    if (typeof body[field] !== "string") continue;

    try {
      body[field] = JSON.parse(body[field]);
    } catch (error) {
      return `Invalid JSON format for ${field}`;
    }
  }

  return null;
};

const parseBodyNumericField = (body, field, parser = Number.parseFloat) => {
  if (!Object.prototype.hasOwnProperty.call(body, field)) return;
  if (body[field] === null || body[field] === undefined || body[field] === "") {
    body[field] = null;
    return;
  }

  const parsed = parser(body[field]);
  if (!Number.isNaN(parsed)) {
    body[field] = parsed;
  }
};

const parseBodyBooleanField = (body, field) => {
  if (!Object.prototype.hasOwnProperty.call(body, field)) return;
  if (typeof body[field] === "boolean") return;

  if (typeof body[field] === "string") {
    if (body[field].toLowerCase() === "true") {
      body[field] = true;
    } else if (body[field].toLowerCase() === "false") {
      body[field] = false;
    }
  }
};

const normalizeLegacyStartupPayload = (body) => {
  if (!body.detailed_description && body.description) {
    body.detailed_description = body.description;
  }

  if (!body.phone_number && body.contact_phone) {
    body.phone_number = body.contact_phone;
  }

  if (!body.social_media_links && body.social_media) {
    body.social_media_links = body.social_media;
  }

  if (!body.current_stage && body.stage) {
    body.current_stage = body.stage;
  }

  if (!body.funding_stage && body.funding_status) {
    body.funding_stage = body.funding_status;
  }

  if (!body.founder_names && body.founders) {
    if (Array.isArray(body.founders)) {
      body.founder_names = body.founders
        .map((item) => (typeof item === "string" ? item : item?.name || ""))
        .filter(Boolean)
        .join(", ");
    } else if (typeof body.founders === "string") {
      body.founder_names = body.founders;
    }
  }

  if (body.team && typeof body.team === "object") {
    if (!body.key_team_members) {
      body.key_team_members = JSON.stringify(body.team);
    }
  }

  if (body.funding && typeof body.funding === "object") {
    if (!body.funding_stage && body.funding.stage) {
      body.funding_stage = body.funding.stage;
    }
    if (!body.amount_seeking && body.funding.amount_seeking) {
      body.amount_seeking = body.funding.amount_seeking;
    }
    if (
      body.previous_funding == null &&
      body.funding.previous_funding != null
    ) {
      body.previous_funding = body.funding.previous_funding;
    }
    if (!body.use_of_funds && body.funding.use_of_funds) {
      body.use_of_funds = body.funding.use_of_funds;
    }
  }

  if (body.traction && typeof body.traction === "object") {
    if (!body.key_metrics && body.traction.metrics) {
      body.key_metrics = body.traction.metrics;
    }
    if (!body.major_achievements && Array.isArray(body.traction.achievements)) {
      body.major_achievements = body.traction.achievements.join("\n");
    }
  }

  if (!body.product_demo_url && body.demo_link) {
    body.product_demo_url = body.demo_link;
  }
};

const canViewProfile = async (profileUserId, requestingUserId) => {
  if (requestingUserId && profileUserId === requestingUserId) {
    return { canView: true, isOwner: true, isConnected: false };
  }

  const connected = requestingUserId
    ? await isUsersConnected(profileUserId, requestingUserId)
    : false;

  const privacySettings = await getPrivacySettingsByUserId(profileUserId);
  if (!privacySettings) {
    return { canView: true, isOwner: false, isConnected: connected };
  }

  const { profile_visibility } = privacySettings;

  if (profile_visibility === "public") {
    return { canView: true, isOwner: false, isConnected: connected };
  }

  if (profile_visibility === "connections_only" && !requestingUserId) {
    return { canView: false, isOwner: false, isConnected: false };
  }

  if (profile_visibility === "connections_only") {
    return { canView: connected, isOwner: false, isConnected: connected };
  }

  return { canView: true, isOwner: false, isConnected: connected };
};

export const createProfile = async (req, res, next) => {
  try {
    if (!req.user || req.user.user_type !== "startup") {
      return res
        .status(403)
        .json({ error: "Only startup users can create startup profiles" });
    }

    const jsonError = parseBodyJsonFields(req.body, [
      "social_media_links",
      "social_media",
      "founders",
      "team",
      "funding",
      "traction",
    ]);
    if (jsonError) {
      return res.status(400).json({ error: jsonError });
    }

    normalizeLegacyStartupPayload(req.body);

    parseBodyNumericField(req.body, "team_size", Number.parseInt);
    parseBodyNumericField(req.body, "amount_seeking");
    parseBodyNumericField(req.body, "previous_funding");

    const fileUploads = await processStartupUploads(req);
    Object.assign(req.body, fileUploads);

    const profileData = { user_id: req.user.id, ...req.body };
    const startupProfile = new StartupProfile(profileData);
    const validation = startupProfile.validate();

    if (!validation.isValid) {
      return res.status(400).json({
        error: "Validation failed",
        details: validation.errors,
      });
    }

    const profile = await createStartupProfile(req.user.id, req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    if (!req.user) return res.status(401).json({ error: "Not authorized" });

    const jsonError = parseBodyJsonFields(req.body, [
      "social_media_links",
      "social_media",
      "founders",
      "team",
      "funding",
      "traction",
    ]);
    if (jsonError) {
      return res.status(400).json({ error: jsonError });
    }

    normalizeLegacyStartupPayload(req.body);

    parseBodyNumericField(req.body, "team_size", Number.parseInt);
    parseBodyNumericField(req.body, "amount_seeking");
    parseBodyNumericField(req.body, "previous_funding");

    const existingProfile = await getStartupProfileById(profileId);
    if (!existingProfile || existingProfile.user_id !== req.user.id) {
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    }

    const fileUploads = await processStartupUploads(req);
    Object.assign(req.body, fileUploads);

    const updated = await updateStartupProfile(
      profileId,
      req.user.id,
      req.body,
    );
    if (!updated) {
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    }

    invalidateStartupMatchScores(profileId).catch((invalidateError) => {
      console.error(
        "Failed to invalidate match scores after profile update:",
        invalidateError.message,
      );
    });

    tryAwardIdentityVerification(req.user.id).catch(() => undefined);

    res.json({ success: true, data: updated });
  } catch (err) {
    if (err.message?.includes("upload failed") || err.message?.includes("Pitch deck")) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    const profile = await getStartupProfileById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const requestingUserId = req.user ? req.user.id : null;
    const { canView, isOwner } = await canViewProfile(
      profile.user_id,
      requestingUserId,
    );

    if (!canView) {
      return res.status(403).json({
        error: "This profile is private",
        message:
          "This user has restricted their profile visibility to connections only",
      });
    }

    let connectionStatus = null;
    let connectionId = null;
    let connectionRequesterId = null;
    let connectionDeclinedAt = null;
    if (requestingUserId && !isOwner) {
      const connection = await getConnectionBetweenUsers(
        profile.user_id,
        requestingUserId,
      );
      connectionStatus = connection?.normalized_status || null;
      connectionId = connection?.id || null;
      connectionRequesterId = connection?.requester_id || null;
      connectionDeclinedAt = connection?.declined_at || null;
    }

    const ownerVerification = await getUserVerification(profile.user_id);
    const verificationTier =
      ownerVerification?.verification_tier || "UNVERIFIED";

    const canViewPrivateDocs =
      isOwner ||
      (requestingUserId &&
        req.user?.user_type === "investor" &&
        connectionStatus === "accepted");

    const { round: fundingRound, canViewFinancials } =
      await resolveFundingRoundVisibility({
        profile,
        requestingUserId,
        requestingUserType: req.user?.user_type,
      });

    const fundingRoundPayload = serializeFundingRoundForViewer(fundingRound, {
      canViewFinancials,
    });

    const publicFields = {
      startup_profile_id: profile.startup_profile_id,
      user_id: profile.user_id,
      company_name: profile.company_name,
      founder_names: profile.founder_names,
      tagline: profile.tagline,
      detailed_description: profile.detailed_description,
      industry: profile.industry,
      founded_date: profile.founded_date,
      current_stage: profile.current_stage,
      team_size: profile.team_size,
      key_team_members: profile.key_team_members,
      logo_url: profile.logo_url,
      team_photo_url: profile.team_photo_url,
      funding_stage: profile.funding_stage,
      amount_seeking: profile.amount_seeking,
      previous_funding: profile.previous_funding,
      use_of_funds: profile.use_of_funds,
      revenue_status: profile.revenue_status,
      key_metrics: profile.key_metrics,
      major_achievements: profile.major_achievements,
      customer_testimonials: profile.customer_testimonials,
      has_pitch_deck: Boolean(profile.pitch_deck_url),
      can_view_pitch_deck:
        Boolean(profile.pitch_deck_url) &&
        (canViewPrivateDocs ||
          (req.user?.user_type === "investor" && !isOwner)),
      has_founder_video: Boolean(profile.founder_video_url),
      can_view_founder_video:
        canViewPrivateDocs && Boolean(profile.founder_video_url),
      founder_video_url: canViewPrivateDocs ? profile.founder_video_url : null,
      founder_video_thumbnail_url: profile.founder_video_thumbnail_url || null,
      has_business_plan: Boolean(profile.business_plan_url),
      business_plan_url: canViewPrivateDocs ? profile.business_plan_url : null,
      product_demo_url: profile.product_demo_url,
      primary_contact_name: profile.primary_contact_name,
      contact_email: profile.contact_email,
      contact_phone: profile.phone_number,
      phone_number: profile.phone_number,
      social_media_links: parseJsonValue(profile.social_media_links),
      social_media: parseJsonValue(profile.social_media_links),
      description: profile.detailed_description,
      location_country: profile.location_country,
      location_city: profile.location_city,
      website_url: profile.website_url,
      connection_status: connectionStatus,
      connection_id: connectionId,
      connection_requester_id: connectionRequesterId,
      connection_declined_at: connectionDeclinedAt,
      funding_round: fundingRoundPayload,
      verification_tier: verificationTier,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    try {
      publicFields.credibility_signals = await getCredibilitySignals(
        profile.user_id,
        "startup",
      );
    } catch (credErr) {
      console.error("Failed to load credibility signals:", credErr.message);
    }

    if (
      requestingUserId &&
      !isOwner &&
      req.user?.user_type === "investor"
    ) {
      try {
        await recordStartupProfileView(
          profile.startup_profile_id,
          requestingUserId,
        );
        await touchUserActivity(requestingUserId);
        await notifyProfileView(
          profile.user_id,
          req.user.full_name || "An investor",
        );
      } catch (viewErr) {
        console.error("Failed to record profile view:", viewErr.message);
      }
    }

    if (
      requestingUserId &&
      !isOwner &&
      req.user?.user_type === "investor"
    ) {
      try {
        await ensureInvestorMatchScores(req.user.id);
        const scoreMap = await getMatchScoresForInvestor(req.user.id, [
          profile.startup_profile_id,
        ]);
        const investorProfile = await getInvestorProfileByUserId(req.user.id);
        const entry = scoreMap.get(String(profile.startup_profile_id));
        if (entry) {
          publicFields.match_score = entry.match_score;
        } else if (investorProfile) {
          const computed = calculateCompatibilityScore(profile, investorProfile);
          publicFields.match_score = computed.match_score;
        }
      } catch (matchErr) {
        console.error("Failed to attach match compatibility:", matchErr.message);
      }

      try {
        if (connectionId) {
          const intentMap = await getIntentMapForInvestor(req.user.id);
          const intent = intentMap.get(String(connectionId));
          publicFields.intent_level = intent?.intent_level || null;
        } else {
          const profileIntent = await getProfileIntent(
            req.user.id,
            profile.startup_profile_id,
          );
          publicFields.profile_intent_level = profileIntent?.intent_level || null;
        }
      } catch (intentErr) {
        console.error("Failed to attach profile intent:", intentErr.message);
      }
    }

    if (isOwner) {
      const full = { ...profile };
      full.social_media_links = parseJsonValue(full.social_media_links);
      full.funding_round = fundingRoundPayload;
      full.verification_tier = verificationTier;
      return res.json({ success: true, data: full });
    }

    res.json({ success: true, data: publicFields });
  } catch (err) {
    next(err);
  }
};

export const getMyStartupProfile = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authorized" });
    const profile = await getStartupProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const full = { ...profile };
    full.social_media_links = parseJsonValue(full.social_media_links);
    full.social_media = full.social_media_links;
    full.description = full.detailed_description;
    full.contact_phone = full.phone_number;
    res.json({ success: true, data: full });
  } catch (err) {
    next(err);
  }
};

export const createInvestorProfileController = async (req, res, next) => {
  try {
    if (!req.user || req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ error: "Only investor users can create investor profiles" });
    }

    const jsonError = parseBodyJsonFields(req.body, [
      "industries_of_interest",
      "geographic_preference",
      "stage_preference",
      "investment_structure",
      "social_media",
      "industries",
      "geography",
      "investment_stage",
    ]);
    if (jsonError) {
      return res.status(400).json({ error: jsonError });
    }

    parseBodyBooleanField(req.body, "follow_on_investment");
    parseBodyNumericField(req.body, "years_of_experience", Number.parseInt);
    parseBodyNumericField(req.body, "number_of_investments", Number.parseInt);
    parseBodyNumericField(req.body, "total_investments", Number.parseInt);
    parseBodyNumericField(req.body, "min_investment_size");
    parseBodyNumericField(req.body, "max_investment_size");
    parseBodyNumericField(req.body, "investment_size_min");
    parseBodyNumericField(req.body, "investment_size_max");

    const canonicalName =
      req.body.name_or_firm || req.body.name || req.body.firm_name;
    if (!canonicalName) {
      return res.status(400).json({ error: "name_or_firm is required" });
    }

    req.body.name_or_firm = canonicalName;

    const fileUploads = await processInvestorUploads(req);
    Object.assign(req.body, fileUploads);

    const profile = await createInvestorProfile(req.user.id, req.body);
    res.status(201).json({ success: true, data: profile });
  } catch (err) {
    next(err);
  }
};

export const updateInvestorProfileController = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    if (!req.user) return res.status(401).json({ error: "Not authorized" });

    const jsonError = parseBodyJsonFields(req.body, [
      "industries_of_interest",
      "geographic_preference",
      "stage_preference",
      "investment_structure",
      "social_media",
      "industries",
      "geography",
      "investment_stage",
    ]);
    if (jsonError) {
      return res.status(400).json({ error: jsonError });
    }

    parseBodyBooleanField(req.body, "follow_on_investment");
    parseBodyNumericField(req.body, "years_of_experience", Number.parseInt);
    parseBodyNumericField(req.body, "number_of_investments", Number.parseInt);
    parseBodyNumericField(req.body, "total_investments", Number.parseInt);
    parseBodyNumericField(req.body, "min_investment_size");
    parseBodyNumericField(req.body, "max_investment_size");
    parseBodyNumericField(req.body, "investment_size_min");
    parseBodyNumericField(req.body, "investment_size_max");

    const existingProfile = await getInvestorProfileById(profileId);
    if (!existingProfile || existingProfile.user_id !== req.user.id) {
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    }

    const fileUploads = await processInvestorUploads(req);
    Object.assign(req.body, fileUploads);

    const updated = await updateInvestorProfile(
      profileId,
      req.user.id,
      req.body,
    );
    if (!updated) {
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    }

    await invalidateInvestorMatchScores(req.user.id);
    tryAwardIdentityVerification(req.user.id).catch(() => undefined);

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const getInvestorProfileController = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    const profile = await getInvestorProfileById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const requestingUserId = req.user ? req.user.id : null;
    const { canView, isOwner, isConnected } = await canViewProfile(
      profile.user_id,
      requestingUserId,
    );

    if (!canView) {
      return res.status(403).json({
        error: "This profile is private",
        message:
          "This user has restricted their profile visibility to connections only",
      });
    }

    let connectionStatus = null;
    let connectionId = null;
    let connectionRequesterId = null;
    let connectionDeclinedAt = null;
    if (requestingUserId && !isOwner) {
      const connection = await getConnectionBetweenUsers(
        profile.user_id,
        requestingUserId,
      );
      connectionStatus = connection?.normalized_status || null;
      connectionId = connection?.id ? String(connection.id) : null;
      connectionRequesterId = connection?.requester_id ? String(connection.requester_id) : null;
      connectionDeclinedAt = connection?.declined_at || null;
    }

    const ownerVerification = await getUserVerification(profile.user_id);
    const verificationTier =
      ownerVerification?.verification_tier || "UNVERIFIED";

    const publicFields = {
      investor_profile_id: profile.investor_profile_id,
      user_id: profile.user_id,
      name_or_firm: profile.name_or_firm,
      photo_url: profile.photo_url,
      investor_type: profile.investor_type,
      years_of_experience: profile.years_of_experience,
      professional_background: profile.professional_background,
      investment_thesis: profile.investment_thesis,
      industries_of_interest: parseJsonValue(profile.industries_of_interest),
      geographic_preference: parseJsonValue(profile.geographic_preference),
      stage_preference: parseJsonValue(profile.stage_preference),
      min_investment_size: profile.min_investment_size,
      max_investment_size: profile.max_investment_size,
      investment_structure: parseJsonValue(profile.investment_structure),
      follow_on_investment: profile.follow_on_investment,
      investment_timeline: profile.investment_timeline,
      number_of_investments: profile.number_of_investments,
      portfolio_companies: profile.portfolio_companies,
      successful_exits: profile.successful_exits,
      notable_achievements: profile.notable_achievements,
      what_you_look_for: profile.what_you_look_for,
      deal_breakers: profile.deal_breakers,
      value_add: profile.value_add,
      network_resources: profile.network_resources,
      connection_status: connectionStatus,
      connection_id: connectionId,
      connection_requester_id: connectionRequesterId,
      connection_declined_at: connectionDeclinedAt,
      verification_tier: verificationTier,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };

    try {
      publicFields.credibility_signals = await getCredibilitySignals(
        profile.user_id,
        "investor",
      );
    } catch (credErr) {
      console.error("Failed to load investor credibility signals:", credErr.message);
    }

    if (isOwner) {
      const full = { ...profile };
      for (const key of [
        "industries_of_interest",
        "geographic_preference",
        "stage_preference",
        "investment_structure",
        "social_media",
      ]) {
        full[key] = parseJsonValue(full[key]);
      }
      full.verification_tier = verificationTier;
      return res.json({ success: true, data: full });
    }

    if (isConnected) {
      return res.json({
        success: true,
        data: {
          ...publicFields,
          primary_contact_email: profile.primary_contact_email,
          phone_number: profile.phone_number,
          social_media: parseJsonValue(profile.social_media),
          preferred_contact_method: profile.preferred_contact_method,
        },
      });
    }

    return res.json({ success: true, data: publicFields });
  } catch (err) {
    next(err);
  }
};

export const getMyInvestorProfile = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authorized" });
    const profile = await getInvestorProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    const full = { ...profile };
    for (const key of [
      "industries_of_interest",
      "geographic_preference",
      "stage_preference",
      "investment_structure",
      "social_media",
    ]) {
      full[key] = parseJsonValue(full[key]);
    }

    res.json({ success: true, data: full });
  } catch (err) {
    next(err);
  }
};

export const getProfileCompletion = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const userType = req.user.user_type;

    if (userType === "startup") {
      const profile = await getStartupProfileByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({
          error: "Profile not found",
          message: "Please create a profile first",
        });
      }

      const startupProfile = new StartupProfile(profile);
      startupProfile.parseJsonFields();
      const completionData = startupProfile.calculateCompletion();

      return res.json({
        success: true,
        data: {
          userType,
          completionPercentage: completionData.completionPercentage,
          isComplete: completionData.isComplete,
          incompleteSections: completionData.incompleteSections,
        },
      });
    }

    if (userType === "investor") {
      const profile = await getInvestorProfileByUserId(req.user.id);
      if (!profile) {
        return res.status(404).json({
          error: "Profile not found",
          message: "Please create a profile first",
        });
      }

      const investorProfile = new InvestorProfile(profile);
      investorProfile.parseJsonFields();
      const completionData = investorProfile.calculateCompletion();

      return res.json({
        success: true,
        data: {
          userType,
          completionPercentage: completionData.completionPercentage,
          isComplete: completionData.isComplete,
          incompleteSections: completionData.incompleteSections,
        },
      });
    }

    return res.status(400).json({
      error: "Invalid user type",
      message: "User must be either startup or investor",
    });
  } catch (err) {
    next(err);
  }
};

export const getStartupMatchExplanation = async (req, res, next) => {
  try {
    if (req.user.user_type !== "investor") {
      return res.status(403).json({
        success: false,
        error: "Only investors can request match explanations",
      });
    }

    const profile = await getStartupProfileById(req.params.id);
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Startup profile not found",
      });
    }

    const investorProfile = await getInvestorProfileByUserId(req.user.id);
    if (!investorProfile) {
      return res.status(400).json({
        success: false,
        error: "Complete your investor profile to view match explanations",
      });
    }

    await ensureInvestorMatchScores(req.user.id);
    const scoreMap = await getMatchScoresForInvestor(req.user.id, [
      profile.startup_profile_id,
    ]);
    const entry =
      scoreMap.get(String(profile.startup_profile_id)) ||
      calculateCompatibilityScore(profile, investorProfile);

    const explanation = await buildMatchExplanationAsync({
      matchScore: entry.match_score,
      dimensionScores: entry.dimension_scores,
      startup: profile,
      investor: investorProfile,
    });

    res.json({
      success: true,
      data: {
        startup_profile_id: profile.startup_profile_id,
        match_score: entry.match_score,
        explanation,
        source: process.env.GEMINI_API_KEY ? "gemini" : "rule_based",
      },
    });
  } catch (err) {
    next(err);
  }
};
