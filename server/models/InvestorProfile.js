/**
 * Investor Profile Model
 * Contains business logic and data transformation for investor profiles.
 */
export class InvestorProfile {
  constructor(data = {}) {
    this.investor_profile_id = data.investor_profile_id || data.id;
    this.user_id = data.user_id;

    this.name_or_firm = data.name_or_firm || data.name || data.firm_name;
    this.photo_url = data.photo_url || null;
    this.investor_type = data.investor_type;
    this.years_of_experience = data.years_of_experience;
    this.professional_background =
      data.professional_background || data.background;
    this.investment_thesis = data.investment_thesis;

    this.industries_of_interest =
      data.industries_of_interest || data.industries;
    this.geographic_preference = data.geographic_preference || data.geography;
    this.stage_preference = data.stage_preference || data.investment_stage;

    this.min_investment_size =
      data.min_investment_size || data.investment_size_min;
    this.max_investment_size =
      data.max_investment_size || data.investment_size_max;
    this.investment_structure = data.investment_structure;
    this.follow_on_investment = data.follow_on_investment;
    this.investment_timeline = data.investment_timeline;

    this.number_of_investments =
      data.number_of_investments || data.total_investments;
    this.portfolio_companies = data.portfolio_companies;
    this.successful_exits = data.successful_exits || data.notable_exits;
    this.notable_achievements = data.notable_achievements;

    this.what_you_look_for = data.what_you_look_for || data.investment_criteria;
    this.deal_breakers = data.deal_breakers || data.red_flags;
    this.value_add = data.value_add;
    this.network_resources = data.network_resources;

    this.primary_contact_email =
      data.primary_contact_email || data.contact_email;
    this.phone_number = data.phone_number || data.contact_phone;
    this.social_media = data.social_media;
    this.preferred_contact_method = data.preferred_contact_method;

    this.location_country = data.location_country || null;
    this.location_city = data.location_city || null;

    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  getPublicFields() {
    return {
      investor_profile_id: this.investor_profile_id,
      user_id: this.user_id,
      name_or_firm: this.name_or_firm,
      name: this.name_or_firm,
      firm_name: this.name_or_firm,
      photo_url: this.photo_url,
      investor_type: this.investor_type,
      years_of_experience: this.years_of_experience,
      professional_background: this.professional_background,
      investment_thesis: this.investment_thesis,
      industries_of_interest: this.industries_of_interest,
      geographic_preference: this.geographic_preference,
      stage_preference: this.stage_preference,
      investment_stage: this.stage_preference,
      min_investment_size: this.min_investment_size,
      max_investment_size: this.max_investment_size,
      investment_size_min: this.min_investment_size,
      investment_size_max: this.max_investment_size,
      investment_structure: this.investment_structure,
      follow_on_investment: this.follow_on_investment,
      investment_timeline: this.investment_timeline,
      number_of_investments: this.number_of_investments,
      total_investments: this.number_of_investments,
      portfolio_companies: this.portfolio_companies,
      successful_exits: this.successful_exits,
      notable_achievements: this.notable_achievements,
      what_you_look_for: this.what_you_look_for,
      deal_breakers: this.deal_breakers,
      value_add: this.value_add,
      network_resources: this.network_resources,
      social_media: this.social_media,
      primary_contact_email: this.primary_contact_email,
      contact_email: this.primary_contact_email,
      phone_number: this.phone_number,
      contact_phone: this.phone_number,
      preferred_contact_method: this.preferred_contact_method,
      location_country: this.location_country,
      location_city: this.location_city,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  parseJsonFields(
    fields = [
      "industries_of_interest",
      "geographic_preference",
      "stage_preference",
      "investment_structure",
      "social_media",
    ],
  ) {
    for (const field of fields) {
      if (this[field] && typeof this[field] === "string") {
        try {
          this[field] = JSON.parse(this[field]);
        } catch (error) {
          // Keep original value if JSON parsing fails.
        }
      }
    }
  }

  calculateCompletion() {
    const fieldGroups = {
      required: {
        weight: 50,
        fields: [
          "name_or_firm",
          "investor_type",
          "years_of_experience",
          "professional_background",
          "investment_thesis",
          "industries_of_interest",
          "geographic_preference",
          "stage_preference",
          "min_investment_size",
          "max_investment_size",
          "investment_structure",
          "follow_on_investment",
          "investment_timeline",
          "what_you_look_for",
          "value_add",
          "primary_contact_email",
          "preferred_contact_method",
        ],
      },
      important: {
        weight: 30,
        fields: [
          "number_of_investments",
          "portfolio_companies",
          "successful_exits",
          "deal_breakers",
          "network_resources",
        ],
      },
      optional: {
        weight: 20,
        fields: ["notable_achievements", "phone_number", "social_media"],
      },
    };

    const incompleteSections = [];
    let totalScore = 0;

    for (const [groupName, groupData] of Object.entries(fieldGroups)) {
      const { fields, weight } = groupData;
      let filledCount = 0;
      const missingFields = [];

      for (const field of fields) {
        const value = this[field];
        let isFilled = false;

        if (value !== null && value !== undefined && value !== "") {
          if (value instanceof Date) {
            isFilled = !Number.isNaN(value.getTime());
          } else if (typeof value === "string") {
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
          filledCount += 1;
        } else {
          missingFields.push(field);
        }
      }

      totalScore += (filledCount / fields.length) * weight;

      if (missingFields.length > 0) {
        incompleteSections.push({
          section: groupName,
          missingFields,
          completionRate: Math.round((filledCount / fields.length) * 100),
        });
      }
    }

    return {
      completionPercentage: Math.round(totalScore),
      incompleteSections,
      isComplete: Math.round(totalScore) === 100,
    };
  }
}
