export const AI_UNAVAILABLE_MESSAGE =
  "AI features are temporarily unavailable. Core platform features continue to work normally.";

export const buildPitchDeckAnalysisFallback = (companyName) => ({
  summary: `Automated AI review is unavailable for ${companyName || "this startup"}'s pitch deck right now. Review the deck manually using standard investor sections: Problem, Solution, Market, Product, Business Model, Traction, Team, Financials, and Ask.`,
  sections_present: [],
  structure: [],
  missing_sections: [],
  improvement_suggestions: [
    "Ensure each standard investor section is clearly labelled in the deck.",
    "Lead with the problem and quantify market opportunity where possible.",
    "Include traction metrics and a specific funding ask with use of funds.",
  ],
  strengths: [],
  observations: [],
  source: "fallback",
  degraded: true,
  message: AI_UNAVAILABLE_MESSAGE,
});

export const buildFinancialDocAnalysisFallback = (documentName, companyName) => ({
  summary: `AI summarisation is unavailable for "${documentName || "this document"}" (${companyName || "startup"}). Open the document directly to review business overview, financials, and risks.`,
  business_overview: "",
  market_opportunity: "",
  revenue_model: "",
  traction: "",
  funding_requirements: "",
  key_risks: [],
  document_type: "",
  key_metrics: [],
  risks: [],
  follow_up_questions: [],
  source: "fallback",
  degraded: true,
  message: AI_UNAVAILABLE_MESSAGE,
});

export const buildDiscoveryFiltersFallback = (phrase) => ({
  industry: null,
  location_country: null,
  funding_stage: null,
  revenue_status: null,
  max_amount: null,
  keywords: String(phrase || "").trim() || null,
  source: "fallback",
  degraded: true,
  message: AI_UNAVAILABLE_MESSAGE,
});

export const buildMeetingBriefFallback = (context = {}) => ({
  company_overview: context.startup_name
    ? `Meeting with ${context.startup_name}. Review the startup profile and recent connection activity before the call.`
    : "Review the startup profile and connection history before this meeting.",
  recent_activity_and_signals:
    "AI-generated activity synthesis is unavailable. Check pitch deck engagement, Q&A threads, and connection notes manually.",
  key_questions_to_explore: [
    "What problem are you solving and for whom?",
    "What traction or milestones have you achieved since our last interaction?",
    "What are your funding needs and intended use of capital?",
  ],
  suggested_talking_points: [
    "Product roadmap and near-term milestones",
    "Unit economics and growth drivers",
    "Team strengths and hiring plans",
  ],
  source: "fallback",
  degraded: true,
  message: AI_UNAVAILABLE_MESSAGE,
});
