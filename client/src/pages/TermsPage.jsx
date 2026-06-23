import React from "react";
import { Link } from "react-router-dom";
import LegalPageLayout, {
  LegalSection,
  legalLinkClass,
} from "../components/layout/LegalPageLayout";

const TermsPage = () => (
  <LegalPageLayout
    title="Terms of Service"
    lastUpdated="June 2026"
    version={import.meta.env.VITE_TERMS_VERSION || "2026-06"}
    footerLinks={
      <Link to="/privacy" className={legalLinkClass}>
        Privacy Policy
      </Link>
    }
  >
    <LegalSection title="1. Acceptance">
      <p>
        By creating an account on StartHub Capital you agree to these terms. You
        must be at least 18 years old and provide accurate registration
        information.
      </p>
    </LegalSection>

    <LegalSection title="2. Platform use">
      <p>
        The platform connects startups and investors for discovery, messaging,
        and deal workflow. You agree not to misuse the service, harass other
        users, or upload unlawful content.
      </p>
    </LegalSection>

    <LegalSection title="3. Your content">
      <p>
        You retain ownership of content you upload. You grant us a limited
        licence to host and display it to users you authorise (e.g. connected
        investors) for platform functionality.
      </p>
    </LegalSection>

    <LegalSection title="4. Account termination">
      <p>
        You may delete your account at any time from Settings. We may suspend
        accounts that violate these terms or our trust policies.
      </p>
    </LegalSection>

    <LegalSection title="5. Disclaimer">
      <p>
        StartHub Capital does not provide investment advice. All investment
        decisions are your responsibility. AI-generated summaries are
        informational only.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export default TermsPage;
