/**
 * Startup Profile Model
 * Contains business logic and data transformation for startup profiles.
 */
export class StartupProfile {
  constructor(data = {}) {
    this.startup_profile_id = data.startup_profile_id || data.id;
    this.user_id = data.user_id;

    this.company_name = data.company_name;
    this.founder_names = data.founder_names;
    this.tagline = data.tagline;
    this.detailed_description = data.detailed_description || data.description;
    this.industry = data.industry;
    this.founded_date = data.founded_date;
    this.current_stage = data.current_stage || data.stage;

    this.team_size = data.team_size;
    this.key_team_members = data.key_team_members;
    this.team_photo_url = data.team_photo_url;

    this.funding_stage = data.funding_stage;
    this.amount_seeking = data.amount_seeking;
    this.previous_funding = data.previous_funding;
    this.use_of_funds = data.use_of_funds;
    this.revenue_status = data.revenue_status;

    this.key_metrics = data.key_metrics;
    this.major_achievements = data.major_achievements;
    this.customer_testimonials = data.customer_testimonials;

    this.pitch_deck_url = data.pitch_deck_url;
    this.business_plan_url = data.business_plan_url;
    this.product_demo_url = data.product_demo_url;
    this.founder_video_url = data.founder_video_url;
    this.founder_video_thumbnail_url = data.founder_video_thumbnail_url;

    this.primary_contact_name = data.primary_contact_name;
    this.contact_email = data.contact_email;
    this.phone_number = data.phone_number || data.contact_phone;
    this.social_media_links = data.social_media_links || data.social_media;

    this.location_country = data.location_country || null;
    this.location_city = data.location_city || null;
    this.website_url = data.website_url || null;

    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  validate() {
    const errors = [];

    const requiredStringFields = [
      "company_name",
      "founder_names",
      "tagline",
      "detailed_description",
      "industry",
      "current_stage",
      "funding_stage",
      "use_of_funds",
      "revenue_status",
      "primary_contact_name",
      "contact_email",
    ];

    for (const field of requiredStringFields) {
      const value = this[field];
      if (!value || (typeof value === "string" && value.trim().length === 0)) {
        errors.push(`${field} is required`);
      }
    }

    if (!this.founded_date) {
      errors.push("founded_date is required");
    }

    if (this.team_size == null || Number(this.team_size) <= 0) {
      errors.push("team_size must be greater than 0");
    }

    if (this.amount_seeking == null || Number(this.amount_seeking) <= 0) {
      errors.push("amount_seeking must be greater than 0");
    }

    if (this.previous_funding != null && Number(this.previous_funding) < 0) {
      errors.push("previous_funding must be greater than or equal to 0");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  getPublicFields() {
    return {
      startup_profile_id: this.startup_profile_id,
      user_id: this.user_id,
      company_name: this.company_name,
      founder_names: this.founder_names,
      tagline: this.tagline,
      detailed_description: this.detailed_description,
      description: this.detailed_description,
      industry: this.industry,
      founded_date: this.founded_date,
      current_stage: this.current_stage,
      team_size: this.team_size,
      key_team_members: this.key_team_members,
      team_photo_url: this.team_photo_url,
      funding_stage: this.funding_stage,
      stage: this.current_stage,
      amount_seeking: this.amount_seeking,
      previous_funding: this.previous_funding,
      use_of_funds: this.use_of_funds,
      revenue_status: this.revenue_status,
      key_metrics: this.key_metrics,
      major_achievements: this.major_achievements,
      customer_testimonials: this.customer_testimonials,
      has_pitch_deck: Boolean(this.pitch_deck_url),
      has_business_plan: Boolean(this.business_plan_url),
      product_demo_url: this.product_demo_url,
      has_founder_video: Boolean(this.founder_video_url),
      founder_video_thumbnail_url: this.founder_video_thumbnail_url,
      primary_contact_name: this.primary_contact_name,
      contact_email: this.contact_email,
      contact_phone: this.phone_number,
      phone_number: this.phone_number,
      logo_url: this.logo_url,
      social_media_links: this.social_media_links,
      social_media: this.social_media_links,
      location_country: this.location_country,
      location_city: this.location_city,
      website_url: this.website_url,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }

  parseJsonFields(fields = ["social_media_links"]) {
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
          "company_name",
          "founder_names",
          "tagline",
          "detailed_description",
          "industry",
          "founded_date",
          "current_stage",
          "team_size",
          "funding_stage",
          "amount_seeking",
          "use_of_funds",
          "revenue_status",
          "primary_contact_name",
          "contact_email",
        ],
      },
      important: {
        weight: 30,
        fields: [
          "key_team_members",
          "previous_funding",
          "key_metrics",
          "major_achievements",
          "customer_testimonials",
        ],
      },
      optional: {
        weight: 20,
        fields: [
          "team_photo_url",
          "pitch_deck_url",
          "business_plan_url",
          "product_demo_url",
          "founder_video_url",
          "phone_number",
          "social_media_links",
        ],
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
