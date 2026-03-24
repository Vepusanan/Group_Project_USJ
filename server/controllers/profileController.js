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
import {
  uploadStartupLogo,
  uploadInvestorPhoto,
  uploadMultipleDocuments,
  deleteFromSupabase,
  extractFilePathFromUrl,
  BUCKETS,
} from "../utils/supabaseStorage.js";
import { StartupProfile } from "../models/StartupProfiles.js";
import { InvestorProfile } from "../models/InvestorProfile.js";
import { getPrivacySettingsByUserId } from "../repositories/PrivacySettingsRepository.js";
import {
  getConnectionBetweenUsers,
  isUsersConnected,
} from "../repositories/ConnectionRepository.js";

// Helper function to check if user can view profile based on privacy settings
const canViewProfile = async (profileUserId, requestingUserId) => {
  // Owner can always view their own profile
  if (requestingUserId && profileUserId === requestingUserId) {
    return { canView: true, isOwner: true, isConnected: false };
  }

  // Get privacy settings for the profile owner
  const privacySettings = await getPrivacySettingsByUserId(profileUserId);

  // If no privacy settings exist, default to public
  if (!privacySettings) {
    return { canView: true, isOwner: false, isConnected: false };
  }

  const { profile_visibility } = privacySettings;

  // If profile is public, anyone can view
  if (profile_visibility === "public") {
    return { canView: true, isOwner: false, isConnected: false };
  }

  // If profile is connections_only and user is not authenticated
  if (profile_visibility === "connections_only" && !requestingUserId) {
    return { canView: false, isOwner: false, isConnected: false };
  }

  // If profile is connections_only, check if users are connected
  if (profile_visibility === "connections_only") {
    const connected = await isUsersConnected(profileUserId, requestingUserId);
    return { canView: connected, isOwner: false, isConnected: connected };
  }

  return { canView: true, isOwner: false, isConnected: false };
};

// Create startup profile
export const createProfile = async (req, res, next) => {
  try {
    // only startup users can create startup profiles
    if (!req.user || req.user.user_type !== "startup") {
      return res
        .status(403)
        .json({ error: "Only startup users can create startup profiles" });
    }

    // Minimal validation
    const { company_name } = req.body;
    if (!company_name) {
      return res.status(400).json({ error: "company_name is required" });
    }

    // Parse JSON fields from form-data (they come as strings)
    const jsonFields = [
      "founders",
      "team",
      "funding",
      "traction",
      "documents",
      "social_media",
    ];
    for (const field of jsonFields) {
      if (req.body[field]) {
        // Only parse if it's a string, leave objects as-is
        if (typeof req.body[field] === "string") {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch (e) {
            return res.status(400).json({
              error: `Invalid JSON format for ${field}`,
              details: e.message,
            });
          }
        }
        // If it's already an object or array, leave it as-is
      }
    }

    // First create the profile to get an ID for file naming
    const tempProfile = await createStartupProfile(req.user.id, req.body);
    const startupId = tempProfile.id; // Handle logo upload to Supabase
    if (req.files && req.files.logo && req.files.logo[0]) {
      try {
        const logoUrl = await uploadStartupLogo(
          req.files.logo[0].path,
          startupId,
        );
        req.body.logo_url = logoUrl;
      } catch (error) {
        console.error("Logo upload failed:", error);
        // Continue without logo if upload fails
      }
    }

    // Handle document uploads to Supabase
    if (req.files && req.files.documents && req.files.documents.length > 0) {
      try {
        const documentsInfo = await uploadMultipleDocuments(
          req.files.documents,
          startupId,
        );
        req.body.documents = documentsInfo;
      } catch (error) {
        console.error("Document upload failed:", error);
        // Continue without documents if upload fails
        req.body.documents = [];
      }
    }

    // Update profile with file URLs if any were uploaded
    if (req.body.logo_url || req.body.documents) {
      const updated = await updateStartupProfile(startupId, req.user.id, {
        logo_url: req.body.logo_url,
        documents: req.body.documents,
      });
      return res.status(201).json({ success: true, data: updated });
    }

    // Return the temporary profile if no files were uploaded
    res.status(201).json({ success: true, data: tempProfile });
  } catch (err) {
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    if (!req.user) return res.status(401).json({ error: "Not authorized" });

    // Parse JSON fields from form-data (they come as strings)
    const jsonFields = [
      "founders",
      "team",
      "funding",
      "traction",
      "social_media",
    ];
    for (const field of jsonFields) {
      if (req.body[field]) {
        // Only parse if it's a string, leave objects as-is
        if (typeof req.body[field] === "string") {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch (e) {
            return res.status(400).json({
              error: `Invalid JSON format for ${field}`,
              details: e.message,
            });
          }
        }
        // If it's already an object or array, leave it as-is
      }
    }

    // Get existing profile for cleanup if needed
    const existingProfile = await getStartupProfileById(profileId);
    if (!existingProfile || existingProfile.user_id !== req.user.id) {
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    }

    // Handle new logo upload to Supabase
    if (req.files && req.files.logo && req.files.logo[0]) {
      try {
        // Delete old logo if it exists
        if (existingProfile.logo_url) {
          const oldLogoPath = extractFilePathFromUrl(
            existingProfile.logo_url,
            BUCKETS.STARTUP_LOGOS,
          );
          if (oldLogoPath) {
            await deleteFromSupabase(BUCKETS.STARTUP_LOGOS, oldLogoPath);
          }
        }

        const logoUrl = await uploadStartupLogo(
          req.files.logo[0].path,
          profileId,
        );
        req.body.logo_url = logoUrl;
      } catch (error) {
        console.error("Logo upload failed:", error);
        // Continue without updating logo if upload fails
      }
    }

    // Handle new document uploads to Supabase
    if (req.files && req.files.documents && req.files.documents.length > 0) {
      try {
        const newDocuments = await uploadMultipleDocuments(
          req.files.documents,
          profileId,
        );

        // Merge with existing documents if any
        let existingDocuments = [];
        if (existingProfile.documents) {
          // Handle both string and object types
          if (typeof existingProfile.documents === "string") {
            try {
              existingDocuments = JSON.parse(existingProfile.documents);
            } catch (e) {
              existingDocuments = [];
            }
          } else if (Array.isArray(existingProfile.documents)) {
            existingDocuments = existingProfile.documents;
          }
        }
        req.body.documents = [...existingDocuments, ...newDocuments];
      } catch (error) {
        console.error("Document upload failed:", error);
        // Continue without adding new documents if upload fails
      }
    }

    const updated = await updateStartupProfile(
      profileId,
      req.user.id,
      req.body,
    );
    if (!updated)
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const getProfile = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    const profile = await getStartupProfileById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Check privacy settings
    const requestingUserId = req.user ? req.user.id : null;
    const { canView, isOwner } = await canViewProfile(
      profile.user_id,
      requestingUserId,
    );

    // If user cannot view profile due to privacy settings
    if (!canView) {
      return res.status(403).json({
        error: "This profile is private",
        message:
          "This user has restricted their profile visibility to connections only",
      });
    }

    // Determine what to show: public fields always; private fields only to owner or connected investors.
    // For now: owner sees everything; others see public subset.
    let connectionStatus = null;
    if (requestingUserId && !isOwner) {
      const connection = await getConnectionBetweenUsers(
        profile.user_id,
        requestingUserId,
      );
      connectionStatus = connection?.normalized_status || null;
    }

    const publicFields = {
      id: profile.id,
      user_id: profile.user_id,
      company_name: profile.company_name,
      tagline: profile.tagline,
      description: profile.description,
      industry: profile.industry,
      logo_url: profile.logo_url,
      city: profile.city,
      country: profile.country,
      website: profile.website,
      linkedin: profile.linkedin,
      stage: profile.stage,
      connection_status: connectionStatus,
      traction: profile.traction
        ? typeof profile.traction === "string"
          ? JSON.parse(profile.traction)
          : profile.traction
        : null,
    };
    if (isOwner) {
      // owner gets full profile
      // parse JSON fields before returning (only if they're strings)
      const full = { ...profile };
      for (const key of [
        "founders",
        "team",
        "funding",
        "traction",
        "documents",
      ]) {
        if (full[key]) {
          // Only parse if it's a string
          if (typeof full[key] === "string") {
            try {
              full[key] = JSON.parse(full[key]);
            } catch (e) {
              // leave as-is if parsing fails
            }
          }
          // If already an object, leave it as-is
        }
      }
      return res.json({ success: true, data: full });
    } // Not owner: return public fields only
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
    for (const key of [
      "founders",
      "team",
      "funding",
      "traction",
      "documents",
    ]) {
      if (full[key]) {
        // Only parse if it's a string
        if (typeof full[key] === "string") {
          try {
            full[key] = JSON.parse(full[key]);
          } catch (e) {
            // leave as-is if parsing fails
          }
        }
        // If already an object, leave it as-is
      }
    }
    res.json({ success: true, data: full });
  } catch (err) {
    next(err);
  }
};

// Delete a document from startup profile
export const deleteDocument = async (req, res, next) => {
  try {
    const { profileId, documentIndex } = req.params;

    if (!req.user) return res.status(401).json({ error: "Not authorized" });

    // Get existing profile
    const profile = await getStartupProfileById(profileId);
    if (!profile || profile.user_id !== req.user.id) {
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    }

    // Parse existing documents
    let documents = [];
    if (profile.documents) {
      if (typeof profile.documents === "string") {
        try {
          documents = JSON.parse(profile.documents);
        } catch (e) {
          return res.status(400).json({ error: "Invalid documents format" });
        }
      } else if (Array.isArray(profile.documents)) {
        documents = profile.documents;
      }
    }
    const docIndex = parseInt(documentIndex);
    if (isNaN(docIndex) || docIndex < 0 || docIndex >= documents.length) {
      return res.status(400).json({ error: "Invalid document index" });
    }

    // Get document to delete
    const documentToDelete = documents[docIndex];

    // Delete from Supabase Storage
    if (documentToDelete.url) {
      const filePath = extractFilePathFromUrl(
        documentToDelete.url,
        BUCKETS.DOCUMENTS,
      );
      if (filePath) {
        await deleteFromSupabase(BUCKETS.DOCUMENTS, filePath);
      }
    }

    // Remove document from array
    documents.splice(docIndex, 1);

    // Update profile
    const updated = await updateStartupProfile(profileId, req.user.id, {
      documents,
    });

    res.json({
      success: true,
      message: "Document deleted successfully",
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

// Upload additional documents to existing profile
export const uploadDocuments = async (req, res, next) => {
  try {
    const { profileId } = req.params;

    if (!req.user) return res.status(401).json({ error: "Not authorized" });
    if (
      !req.files ||
      !req.files.documents ||
      req.files.documents.length === 0
    ) {
      return res.status(400).json({ error: "No documents provided" });
    }

    // Get existing profile
    const profile = await getStartupProfileById(profileId);
    if (!profile || profile.user_id !== req.user.id) {
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    }

    // Parse existing documents
    let existingDocuments = [];
    if (profile.documents) {
      if (typeof profile.documents === "string") {
        try {
          existingDocuments = JSON.parse(profile.documents);
        } catch (e) {
          existingDocuments = [];
        }
      } else if (Array.isArray(profile.documents)) {
        existingDocuments = profile.documents;
      }
    } // Upload new documents
    const newDocuments = await uploadMultipleDocuments(
      req.files.documents,
      profileId,
    );

    // Combine with existing documents
    const allDocuments = [...existingDocuments, ...newDocuments];

    // Update profile
    const updated = await updateStartupProfile(profileId, req.user.id, {
      documents: allDocuments,
    });

    res.json({
      success: true,
      message: `${newDocuments.length} documents uploaded successfully`,
      data: updated,
      newDocuments: newDocuments,
    });
  } catch (err) {
    next(err);
  }
};

// ===================== INVESTOR PROFILE CONTROLLERS =====================

// Create investor profile
export const createInvestorProfileController = async (req, res, next) => {
  try {
    // only investor users can create investor profiles
    if (!req.user || req.user.user_type !== "investor") {
      return res
        .status(403)
        .json({ error: "Only investor users can create investor profiles" });
    }

    // Minimal validation
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: "name is required" });
    }

    // Parse JSON fields from form-data (they come as strings)
    const jsonFields = [
      "industries",
      "geography",
      "investment_stage",
      "investment_structure",
      "portfolio_companies",
      "notable_exits",
      "network_resources",
      "social_media",
    ];
    for (const field of jsonFields) {
      if (req.body[field]) {
        // Only parse if it's a string, leave objects as-is
        if (typeof req.body[field] === "string") {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch (e) {
            return res.status(400).json({
              error: `Invalid JSON format for ${field}`,
              details: e.message,
            });
          }
        }
        // If it's already an object or array, leave it as-is
      }
    }

    // Parse boolean fields
    if (req.body.follow_on_investment !== undefined) {
      if (typeof req.body.follow_on_investment === "string") {
        req.body.follow_on_investment =
          req.body.follow_on_investment === "true";
      }
    }
    if (req.body.is_actively_investing !== undefined) {
      if (typeof req.body.is_actively_investing === "string") {
        req.body.is_actively_investing =
          req.body.is_actively_investing === "true";
      }
    }

    // Parse numeric fields
    if (req.body.investment_size_min) {
      req.body.investment_size_min = parseFloat(req.body.investment_size_min);
    }
    if (req.body.investment_size_max) {
      req.body.investment_size_max = parseFloat(req.body.investment_size_max);
    }
    if (req.body.years_of_experience) {
      req.body.years_of_experience = parseInt(req.body.years_of_experience);
    }
    if (req.body.total_investments) {
      req.body.total_investments = parseInt(req.body.total_investments);
    }

    // First create the profile to get an ID for file naming
    const tempProfile = await createInvestorProfile(req.user.id, req.body);
    const investorId = tempProfile.id;

    // Handle photo upload to Supabase
    if (req.files && req.files.photo && req.files.photo[0]) {
      try {
        const photoUrl = await uploadInvestorPhoto(
          req.files.photo[0].path,
          investorId,
        );
        req.body.photo_url = photoUrl;
      } catch (error) {
        console.error("Photo upload failed:", error);
        // Continue without photo if upload fails
      }
    }

    // Update profile with file URLs if any were uploaded
    if (req.body.photo_url) {
      const updated = await updateInvestorProfile(investorId, req.user.id, {
        photo_url: req.body.photo_url,
      });
      return res.status(201).json({ success: true, data: updated });
    }

    // Return the temporary profile if no files were uploaded
    res.status(201).json({ success: true, data: tempProfile });
  } catch (err) {
    next(err);
  }
};

// Update investor profile
export const updateInvestorProfileController = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    if (!req.user) return res.status(401).json({ error: "Not authorized" });

    // Parse JSON fields from form-data (they come as strings)
    const jsonFields = [
      "industries",
      "geography",
      "investment_stage",
      "investment_structure",
      "portfolio_companies",
      "notable_exits",
      "network_resources",
      "social_media",
    ];
    for (const field of jsonFields) {
      if (req.body[field]) {
        // Only parse if it's a string, leave objects as-is
        if (typeof req.body[field] === "string") {
          try {
            req.body[field] = JSON.parse(req.body[field]);
          } catch (e) {
            return res.status(400).json({
              error: `Invalid JSON format for ${field}`,
              details: e.message,
            });
          }
        }
        // If it's already an object or array, leave it as-is
      }
    }

    // Parse boolean fields
    if (req.body.follow_on_investment !== undefined) {
      if (typeof req.body.follow_on_investment === "string") {
        req.body.follow_on_investment =
          req.body.follow_on_investment === "true";
      }
    }
    if (req.body.is_actively_investing !== undefined) {
      if (typeof req.body.is_actively_investing === "string") {
        req.body.is_actively_investing =
          req.body.is_actively_investing === "true";
      }
    }

    // Parse numeric fields
    if (req.body.investment_size_min) {
      req.body.investment_size_min = parseFloat(req.body.investment_size_min);
    }
    if (req.body.investment_size_max) {
      req.body.investment_size_max = parseFloat(req.body.investment_size_max);
    }
    if (req.body.years_of_experience) {
      req.body.years_of_experience = parseInt(req.body.years_of_experience);
    }
    if (req.body.total_investments) {
      req.body.total_investments = parseInt(req.body.total_investments);
    }

    // Get existing profile for cleanup if needed
    const existingProfile = await getInvestorProfileById(profileId);
    if (!existingProfile || existingProfile.user_id !== req.user.id) {
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    }

    // Handle new photo upload to Supabase
    if (req.files && req.files.photo && req.files.photo[0]) {
      try {
        // Delete old photo if it exists
        if (existingProfile.photo_url) {
          const oldPhotoPath = extractFilePathFromUrl(
            existingProfile.photo_url,
            BUCKETS.INVESTOR_PHOTOS,
          );
          if (oldPhotoPath) {
            await deleteFromSupabase(BUCKETS.INVESTOR_PHOTOS, oldPhotoPath);
          }
        }

        const photoUrl = await uploadInvestorPhoto(
          req.files.photo[0].path,
          profileId,
        );
        req.body.photo_url = photoUrl;
      } catch (error) {
        console.error("Photo upload failed:", error);
        // Continue without updating photo if upload fails
      }
    }

    const updated = await updateInvestorProfile(
      profileId,
      req.user.id,
      req.body,
    );
    if (!updated)
      return res
        .status(404)
        .json({ error: "Profile not found or not owned by user" });
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// Get investor profile by ID
export const getInvestorProfileController = async (req, res, next) => {
  try {
    const profileId = req.params.id;
    const profile = await getInvestorProfileById(profileId);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Check privacy settings
    const requestingUserId = req.user ? req.user.id : null;
    const { canView, isOwner, isConnected } = await canViewProfile(
      profile.user_id,
      requestingUserId,
    );

    // If user cannot view profile due to privacy settings
    if (!canView) {
      return res.status(403).json({
        error: "This profile is private",
        message:
          "This user has restricted their profile visibility to connections only",
      });
    }

    // Parse JSON fields before returning
    const parseJsonField = (field) => {
      if (!field) return null;
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch (e) {
          return field;
        }
      }
      return field;
    };

    // Determine what to show: public fields always; private fields only to owner or connected startups.
    let connectionStatus = null;
    if (requestingUserId && !isOwner) {
      const connection = await getConnectionBetweenUsers(
        profile.user_id,
        requestingUserId,
      );
      connectionStatus = connection?.normalized_status || null;
    }

    const publicFields = {
      id: profile.id,
      user_id: profile.user_id,
      name: profile.name,
      firm_name: profile.firm_name,
      photo_url: profile.photo_url,
      city: profile.city,
      country: profile.country,
      website: profile.website,
      linkedin: profile.linkedin,
      investor_type: profile.investor_type,
      years_of_experience: profile.years_of_experience,
      investment_thesis: profile.investment_thesis,
      industries: parseJsonField(profile.industries),
      geography: parseJsonField(profile.geography),
      investment_stage: parseJsonField(profile.investment_stage),
      investment_size_min: profile.investment_size_min,
      investment_size_max: profile.investment_size_max,
      portfolio_companies: parseJsonField(profile.portfolio_companies),
      total_investments: profile.total_investments,
      is_actively_investing: profile.is_actively_investing,
      connection_status: connectionStatus,
    };

    if (isOwner) {
      // owner gets full profile
      const full = { ...profile };
      for (const key of [
        "industries",
        "geography",
        "investment_stage",
        "investment_structure",
        "portfolio_companies",
        "notable_exits",
      ]) {
        full[key] = parseJsonField(full[key]);
      }
      return res.json({ success: true, data: full });
    }

    if (isConnected) {
      const connectedViewFields = {
        ...publicFields,
        contact_email: profile.contact_email,
        contact_phone: profile.contact_phone,
        social_media: parseJsonField(profile.social_media),
      };

      return res.json({ success: true, data: connectedViewFields });
    }

    // not owner and not connected: return public fields only
    res.json({ success: true, data: publicFields });
  } catch (err) {
    next(err);
  }
};

// Get current investor user's profile
export const getMyInvestorProfile = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ error: "Not authorized" });
    const profile = await getInvestorProfileByUserId(req.user.id);
    if (!profile) return res.status(404).json({ error: "Profile not found" });

    // Parse JSON fields
    const parseJsonField = (field) => {
      if (!field) return null;
      if (typeof field === "string") {
        try {
          return JSON.parse(field);
        } catch (e) {
          return field;
        }
      }
      return field;
    };

    const full = { ...profile };
    for (const key of [
      "industries",
      "geography",
      "investment_stage",
      "investment_structure",
      "portfolio_companies",
      "notable_exits",
    ]) {
      full[key] = parseJsonField(full[key]);
    }
    res.json({ success: true, data: full });
  } catch (err) {
    next(err);
  }
};

// Get profile completion status
export const getProfileCompletion = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Not authorized" });
    }

    const userType = req.user.user_type;
    let profile = null;
    let completionData = null;

    if (userType === "startup") {
      // Get startup profile
      profile = await getStartupProfileByUserId(req.user.id);

      if (!profile) {
        return res.status(404).json({
          error: "Profile not found",
          message: "Please create a profile first",
        });
      }

      // Create StartupProfile instance and parse JSON fields
      const startupProfile = new StartupProfile(profile);
      startupProfile.parseJsonFields();

      // Calculate completion
      completionData = startupProfile.calculateCompletion();
    } else if (userType === "investor") {
      // Get investor profile
      profile = await getInvestorProfileByUserId(req.user.id);

      if (!profile) {
        return res.status(404).json({
          error: "Profile not found",
          message: "Please create a profile first",
        });
      }

      // Create InvestorProfile instance and parse JSON fields
      const investorProfile = new InvestorProfile(profile);
      investorProfile.parseJsonFields();

      // Calculate completion
      completionData = investorProfile.calculateCompletion();
    } else {
      return res.status(400).json({
        error: "Invalid user type",
        message: "User must be either startup or investor",
      });
    }

    res.json({
      success: true,
      data: {
        userType: userType,
        completionPercentage: completionData.completionPercentage,
        isComplete: completionData.isComplete,
        incompleteSections: completionData.incompleteSections,
      },
    });
  } catch (err) {
    next(err);
  }
};
