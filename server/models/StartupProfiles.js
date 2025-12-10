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
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  /**
   * Get public fields that are visible to all users
   * @returns {Object} Public profile data
   */
  getPublicFields() {
    return {
      id: this.id,
      company_name: this.company_name,
      tagline: this.tagline,
      description: this.description,
      industry: this.industry,
      logo_url: this.logo_url,
      city: this.city,
      country: this.country,
      website: this.website,
      linkedin: this.linkedin,
      stage: this.stage,
      traction: this.traction,
      social_media: this.social_media,
    };
  }

  /**
   * Parse JSON fields from database strings
   * @param {Array} fields - Field names to parse
   */
  parseJsonFields(fields = ["founders", "team", "funding", "traction", "documents", "social_media"]) {
    for (const field of fields) {
      if (this[field] && typeof this[field] === 'string') {
        try {
          this[field] = JSON.parse(this[field]);
        } catch (e) {
          // Keep as-is if parsing fails
        }
      }
    }
  }
}

// Startup profile model - business logic layer