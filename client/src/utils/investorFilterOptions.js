/** Values must match `investor_type_enum` in the database. */
export const INVESTOR_TYPE_OPTIONS = [
  { value: "ANGEL", label: "Angel Investor" },
  { value: "VC_FIRM", label: "VC Firm" },
  { value: "CORPORATE_VC", label: "Corporate VC" },
  { value: "FAMILY_OFFICE", label: "Family Office" },
  { value: "ACCELERATOR", label: "Accelerator" },
  { value: "INCUBATOR", label: "Incubator" },
  { value: "PRIVATE_EQUITY", label: "Private Equity" },
];

/**
 * Stage preference values stored in `stage_preference` (jsonb).
 * Includes funding rounds and company maturity stages used by existing profiles.
 */
export const INVESTOR_STAGE_OPTIONS = [
  { value: "PRE_SEED", label: "Pre-seed", group: "Funding round" },
  { value: "SEED", label: "Seed", group: "Funding round" },
  { value: "SERIES_A", label: "Series A", group: "Funding round" },
  { value: "SERIES_B", label: "Series B", group: "Funding round" },
  { value: "SERIES_C", label: "Series C", group: "Funding round" },
  { value: "SERIES_D_PLUS", label: "Series D+", group: "Funding round" },
  { value: "IDEA", label: "Idea", group: "Company stage" },
  { value: "MVP", label: "MVP", group: "Company stage" },
  { value: "EARLY_REVENUE", label: "Early revenue", group: "Company stage" },
  { value: "GROWTH", label: "Growth", group: "Company stage" },
  { value: "SCALING", label: "Scaling", group: "Company stage" },
];

export const INVESTOR_INDUSTRY_OPTIONS = [
  "FinTech",
  "HealthTech",
  "EdTech",
  "AgriTech",
  "CleanTech",
  "AI/ML",
  "SaaS",
  "E-Commerce",
  "Logistics",
  "LegalTech",
  "PropTech",
  "InsurTech",
  "FoodTech",
  "TravelTech",
  "Gaming",
  "Cybersecurity",
  "Blockchain",
  "IoT",
  "BioTech",
  "SpaceTech",
  "Other",
];
