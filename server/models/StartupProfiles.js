/**
 * Startup Profile Model
 * Contains business logic and data transformation for startup profiles
 * Database queries are handled by startupProfileRepository.js
 */

/**
 * Startup Profile class/object structure
 * This can be extended with business logic methods, validations, etc.
 */
export class StartupProfile {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.company_name = data.company_name;
    this.founders = data.founders;
    this.logo_url = data.logo_url;
    this.city = data.city;
    this.country = data.country;
    this.website = data.website;
    this.linkedin = data.linkedin;
    this.tagline = data.tagline;
    this.description = data.description;
    this.industry = data.industry;
    this.founded_date = data.founded_date;
    this.stage = data.stage;
    this.team = data.team;
    this.funding = data.funding;
    this.traction = data.traction;
    this.documents = data.documents;
    this.primary_contact_name = data.primary_contact_name;
    this.contact_email = data.contact_email;
    this.contact_phone = data.contact_phone;
    this.social_media = data.social_media;
    this.location_country = data.location_country;
    this.location_city = data.location_city;
    this.funding_stage = data.funding_stage;
    this.revenue_status = data.revenue_status;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get public fields that are visible to all users
   * @returns {Object} Public profile data
   */
  getPublicFields() {
    const normalizedCity = this.location_city || this.city || null;
    const normalizedCountry = this.location_country || this.country || null;
    const normalizedFundingStage = this.funding_stage || this.stage || null;

    return {
      id: this.id,
      user_id: this.user_id,
      company_name: this.company_name,
      tagline: this.tagline,
      description: this.description,
      industry: this.industry,
      logo_url: this.logo_url,
      city: normalizedCity,
      country: normalizedCountry,
      location_city: normalizedCity,
      location_country: normalizedCountry,
      website: this.website,
      linkedin: this.linkedin,
      stage: normalizedFundingStage,
      funding_stage: normalizedFundingStage,
      revenue_status: this.revenue_status,
      traction: this.traction,
      social_media: this.social_media,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  /**
   * Parse JSON fields from database strings
   * @param {Array} fields - Field names to parse
   */
  parseJsonFields(
    fields = [
      "founders",
      "team",
      "funding",
      "traction",
      "documents",
      "social_media",
    ],
  ) {
    for (const field of fields) {
      if (this[field] && typeof this[field] === "string") {
        try {
          this[field] = JSON.parse(this[field]);
        } catch (e) {
          // Keep as-is if parsing fails
        }
      }
    }
  }

  /**
   * Calculate profile completion percentage
   * @returns {Object} Completion data with percentage and incomplete sections
   */
  calculateCompletion() {
    // Define field groups with weights
    const fieldGroups = {
      required: {
        weight: 40,
        fields: ["company_name", "industry", "description", "city", "country"],
      },
      important: {
        weight: 35,
        fields: [
          "founders",
          "tagline",
          "stage",
          "website",
          "linkedin",
          "contact_email",
        ],
      },
      optional: {
        weight: 25,
        fields: [
          "logo_url",
          "founded_date",
          "team",
          "funding",
          "traction",
          "documents",
          "primary_contact_name",
          "contact_phone",
          "social_media",
        ],
      },
    };

    const incompleteSections = [];
    let totalScore = 0;

    // Calculate completion for each group
    for (const [groupName, groupData] of Object.entries(fieldGroups)) {
      const { fields, weight } = groupData;
      let filledCount = 0;

      const missingFields = [];

      for (const field of fields) {
        const value = this[field];
        let isFilled = false;

        if (value !== null && value !== undefined && value !== "") {
          if (typeof value === "string") {
            isFilled = value.trim().length > 0;
          } else if (Array.isArray(value)) {
            isFilled = value.length > 0;
          } else if (typeof value === "object") {
            isFilled = Object.keys(value).length > 0;
          } else {
            isFilled = true;
          }
        }

        if (isFilled) {
          filledCount++;
        } else {
          missingFields.push(field);
        }
      }

      const groupCompletion = (filledCount / fields.length) * weight;
      totalScore += groupCompletion;

      if (missingFields.length > 0) {
        incompleteSections.push({
          section: groupName,
          missingFields: missingFields,
          completionRate: Math.round((filledCount / fields.length) * 100),
        });
      }
    }

    return {
      completionPercentage: Math.round(totalScore),
      incompleteSections: incompleteSections,
      isComplete: Math.round(totalScore) === 100,
    };
  }
}

// Startup profile model - business logic layer
