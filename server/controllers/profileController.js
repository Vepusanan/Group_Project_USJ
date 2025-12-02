import { createStartupProfile, getStartupProfileById, updateStartupProfile, getStartupProfileByUserId } from "../models/StartupProfiles.js";
import { uploadStartupLogo, uploadMultipleDocuments, deleteFromSupabase, extractFilePathFromUrl, BUCKETS } from "../utils/supabaseStorage.js";

// Create startup profile
export const createProfile = async (req, res, next) => {
	try {
		// only startup users can create startup profiles
		if (!req.user || req.user.user_type !== "startup") {
			return res.status(403).json({ error: "Only startup users can create startup profiles" });
		}

	// Minimal validation
	const { company_name } = req.body;
	if (!company_name) {
		return res.status(400).json({ error: "company_name is required" });
	}

	// Parse JSON fields from form-data (they come as strings)
	const jsonFields = ['founders', 'team', 'funding', 'traction', 'documents'];
	for (const field of jsonFields) {
		if (req.body[field]) {
			// Only parse if it's a string, leave objects as-is
			if (typeof req.body[field] === 'string') {
				try {
					req.body[field] = JSON.parse(req.body[field]);
				} catch (e) {
					return res.status(400).json({ 
						error: `Invalid JSON format for ${field}`,
						details: e.message 
					});
				}
			}
			// If it's already an object or array, leave it as-is
		}
	}

	// First create the profile to get an ID for file naming
	const tempProfile = await createStartupProfile(req.user.id, req.body);
	const startupId = tempProfile.id;		// Handle logo upload to Supabase
		if (req.files && req.files.logo && req.files.logo[0]) {
			try {
				const logoUrl = await uploadStartupLogo(req.files.logo[0].path, startupId);
				req.body.logo_url = logoUrl;
			} catch (error) {
				console.error('Logo upload failed:', error);
				// Continue without logo if upload fails
			}
		}

		// Handle document uploads to Supabase
		if (req.files && req.files.documents && req.files.documents.length > 0) {
			try {
				const documentsInfo = await uploadMultipleDocuments(req.files.documents, startupId);
				req.body.documents = documentsInfo;
			} catch (error) {
				console.error('Document upload failed:', error);
				// Continue without documents if upload fails
				req.body.documents = [];
			}
		}

		// Update profile with file URLs if any were uploaded
		if (req.body.logo_url || req.body.documents) {
			const updated = await updateStartupProfile(startupId, req.user.id, {
				logo_url: req.body.logo_url,
				documents: req.body.documents
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
	const jsonFields = ['founders', 'team', 'funding', 'traction'];
	for (const field of jsonFields) {
		if (req.body[field]) {
			// Only parse if it's a string, leave objects as-is
			if (typeof req.body[field] === 'string') {
				try {
					req.body[field] = JSON.parse(req.body[field]);
				} catch (e) {
					return res.status(400).json({ 
						error: `Invalid JSON format for ${field}`,
						details: e.message 
					});
				}
			}
			// If it's already an object or array, leave it as-is
		}
	}

	// Get existing profile for cleanup if needed
	const existingProfile = await getStartupProfileById(profileId);
		if (!existingProfile || existingProfile.user_id !== req.user.id) {
			return res.status(404).json({ error: "Profile not found or not owned by user" });
		}

		// Handle new logo upload to Supabase
		if (req.files && req.files.logo && req.files.logo[0]) {
			try {
				// Delete old logo if it exists
				if (existingProfile.logo_url) {
					const oldLogoPath = extractFilePathFromUrl(existingProfile.logo_url, BUCKETS.STARTUP_LOGOS);
					if (oldLogoPath) {
						await deleteFromSupabase(BUCKETS.STARTUP_LOGOS, oldLogoPath);
					}
				}
				
				const logoUrl = await uploadStartupLogo(req.files.logo[0].path, profileId);
				req.body.logo_url = logoUrl;
			} catch (error) {
				console.error('Logo upload failed:', error);
				// Continue without updating logo if upload fails
			}
		}

		// Handle new document uploads to Supabase
		if (req.files && req.files.documents && req.files.documents.length > 0) {
			try {
				const newDocuments = await uploadMultipleDocuments(req.files.documents, profileId);
				
			// Merge with existing documents if any
			let existingDocuments = [];
			if (existingProfile.documents) {
				// Handle both string and object types
				if (typeof existingProfile.documents === 'string') {
					try {
						existingDocuments = JSON.parse(existingProfile.documents);
					} catch (e) {
						existingDocuments = [];
					}
				} else if (Array.isArray(existingProfile.documents)) {
					existingDocuments = existingProfile.documents;
				}
			}				req.body.documents = [...existingDocuments, ...newDocuments];
			} catch (error) {
				console.error('Document upload failed:', error);
				// Continue without adding new documents if upload fails
			}
		}

		const updated = await updateStartupProfile(profileId, req.user.id, req.body);
		if (!updated) return res.status(404).json({ error: "Profile not found or not owned by user" });
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

		// Determine what to show: public fields always; private fields only to owner or connected investors.
		// For now: owner sees everything; others see public subset.
		const publicFields = {
			id: profile.id,
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
		traction: profile.traction ? (typeof profile.traction === 'string' ? JSON.parse(profile.traction) : profile.traction) : null,
	};	if (req.user && req.user.id === profile.user_id) {
		// owner gets full profile
		// parse JSON fields before returning (only if they're strings)
		const full = { ...profile };
		for (const key of ["founders", "team", "funding", "traction", "documents"]) {
			if (full[key]) {
				// Only parse if it's a string
				if (typeof full[key] === 'string') {
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
	}		// Not owner: return public fields only
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
		for (const key of ["founders", "team", "funding", "traction", "documents"]) {
			if (full[key]) {
				// Only parse if it's a string
				if (typeof full[key] === 'string') {
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
			return res.status(404).json({ error: "Profile not found or not owned by user" });
		}
		
	// Parse existing documents
	let documents = [];
	if (profile.documents) {
		if (typeof profile.documents === 'string') {
			try {
				documents = JSON.parse(profile.documents);
			} catch (e) {
				return res.status(400).json({ error: "Invalid documents format" });
			}
		} else if (Array.isArray(profile.documents)) {
			documents = profile.documents;
		}
	}		const docIndex = parseInt(documentIndex);
		if (isNaN(docIndex) || docIndex < 0 || docIndex >= documents.length) {
			return res.status(400).json({ error: "Invalid document index" });
		}
		
		// Get document to delete
		const documentToDelete = documents[docIndex];
		
		// Delete from Supabase Storage
		if (documentToDelete.url) {
			const filePath = extractFilePathFromUrl(documentToDelete.url, BUCKETS.DOCUMENTS);
			if (filePath) {
				await deleteFromSupabase(BUCKETS.DOCUMENTS, filePath);
			}
		}
		
		// Remove document from array
		documents.splice(docIndex, 1);
		
		// Update profile
		const updated = await updateStartupProfile(profileId, req.user.id, { documents });
		
		res.json({ 
			success: true, 
			message: "Document deleted successfully",
			data: updated 
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
		if (!req.files || !req.files.documents || req.files.documents.length === 0) {
			return res.status(400).json({ error: "No documents provided" });
		}
		
		// Get existing profile
		const profile = await getStartupProfileById(profileId);
		if (!profile || profile.user_id !== req.user.id) {
			return res.status(404).json({ error: "Profile not found or not owned by user" });
		}
		
	// Parse existing documents
	let existingDocuments = [];
	if (profile.documents) {
		if (typeof profile.documents === 'string') {
			try {
				existingDocuments = JSON.parse(profile.documents);
			} catch (e) {
				existingDocuments = [];
			}
		} else if (Array.isArray(profile.documents)) {
			existingDocuments = profile.documents;
		}
	}		// Upload new documents
		const newDocuments = await uploadMultipleDocuments(req.files.documents, profileId);
		
		// Combine with existing documents
		const allDocuments = [...existingDocuments, ...newDocuments];
		
		// Update profile
		const updated = await updateStartupProfile(profileId, req.user.id, { 
			documents: allDocuments 
		});
		
		res.json({ 
			success: true, 
			message: `${newDocuments.length} documents uploaded successfully`,
			data: updated,
			newDocuments: newDocuments
		});
	} catch (err) {
		next(err);
	}
};