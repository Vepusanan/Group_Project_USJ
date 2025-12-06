/**
 * Investor Profile Model
 * Contains business logic and data transformation for investor profiles
 * Database queries are handled by investorProfileRepository.js
 */

/**
 * Investor Profile class/object structure
 * This can be extended with business logic methods, validations, etc.
 */
export class InvestorProfile {
  constructor(data) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.name = data.name;
    this.firm_name = data.firm_name;
    this.photo_url = data.photo_url;
    this.city = data.city;
    this.country = data.country;
    this.website = data.website;
    this.linkedin = data.linkedin;
    this.investor_type = data.investor_type;
    this.years_of_experience = data.years_of_experience;
    this.background = data.background;
    this.investment_thesis = data.investment_thesis;
    this.industries = data.industries;
    this.geography = data.geography;
    this.investment_stage = data.investment_stage;
    this.investment_size_min = data.investment_size_min;
    this.investment_size_max = data.investment_size_max;
    this.investment_structure = data.investment_structure;
    this.follow_on_investment = data.follow_on_investment;
    this.investment_timeline = data.investment_timeline;
    this.portfolio_companies = data.portfolio_companies;
    this.notable_exits = data.notable_exits;
    this.total_investments = data.total_investments;
    this.investment_criteria = data.investment_criteria;
    this.red_flags = data.red_flags;
    this.ideal_founder_profile = data.ideal_founder_profile;
    this.contact_email = data.contact_email;
    this.contact_phone = data.contact_phone;
    this.preferred_contact_method = data.preferred_contact_method;
    this.is_actively_investing = data.is_actively_investing;
    this.profile_visibility = data.profile_visibility;
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
      name: this.name,
      firm_name: this.firm_name,
      photo_url: this.photo_url,
      city: this.city,
      country: this.country,
      website: this.website,
      linkedin: this.linkedin,
      investor_type: this.investor_type,
      years_of_experience: this.years_of_experience,
      investment_thesis: this.investment_thesis,
      industries: this.industries,
      geography: this.geography,
      investment_stage: this.investment_stage,
      investment_size_min: this.investment_size_min,
      investment_size_max: this.investment_size_max,
      portfolio_companies: this.portfolio_companies,
      total_investments: this.total_investments,
      is_actively_investing: this.is_actively_investing,
    };
  }

  /**
   * Parse JSON fields from database strings
   * @param {Array} fields - Field names to parse
   */
  parseJsonFields(fields = ["industries", "geography", "investment_stage", "investment_structure", "portfolio_companies", "notable_exits"]) {
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

// Investor profile model - business logic layer