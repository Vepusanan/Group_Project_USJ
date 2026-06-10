import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";

const TermsPage = () => (
  <PageLayout title="Terms of Service">
    <div className="max-w-3xl mx-auto prose prose-sm text-content-secondary">
      <p className="text-content-muted text-sm mb-6">
        Last updated: June 2026 · Version {import.meta.env.VITE_TERMS_VERSION || "2026-06"}
      </p>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-content">1. Acceptance</h2>
        <p>
          By creating an account on Startup Connect you agree to these terms. You must be at least
          18 years old and provide accurate registration information.
        </p>

        <h2 className="text-lg font-semibold text-content">2. Platform use</h2>
        <p>
          The platform connects startups and investors for discovery, messaging, and deal workflow.
          You agree not to misuse the service, harass other users, or upload unlawful content.
        </p>

        <h2 className="text-lg font-semibold text-content">3. Your content</h2>
        <p>
          You retain ownership of content you upload. You grant us a limited licence to host and
          display it to users you authorise (e.g. connected investors) for platform functionality.
        </p>

        <h2 className="text-lg font-semibold text-content">4. Account termination</h2>
        <p>
          You may delete your account at any time from Settings. We may suspend accounts that violate
          these terms or our trust policies.
        </p>

        <h2 className="text-lg font-semibold text-content">5. Disclaimer</h2>
        <p>
          Startup Connect does not provide investment advice. All investment decisions are your
          responsibility. AI-generated summaries are informational only.
        </p>
      </section>

      <p className="mt-8 text-sm">
        <Link to="/privacy" className="text-primary hover:underline">
          Privacy Policy
        </Link>
        {" · "}
        <Link to="/signup" className="text-primary hover:underline">
          Back to registration
        </Link>
      </p>
    </div>
  </PageLayout>
);

export default TermsPage;
