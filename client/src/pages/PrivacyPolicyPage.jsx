import React from "react";
import { Link } from "react-router-dom";
import PageLayout from "../components/layout/PageLayout";

const PrivacyPolicyPage = () => (
  <PageLayout title="Privacy Policy">
    <div className="max-w-3xl mx-auto prose prose-sm text-content-secondary">
      <p className="text-content-muted text-sm mb-6">Last updated: June 2026</p>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-content">Data we collect</h2>
        <p>
          We collect account information (name, email, role), profile data you provide, messages
          between connected users, and usage signals needed for analytics and security (e.g. login
          events, session metadata).
        </p>

        <h2 className="text-lg font-semibold text-content">How we use data</h2>
        <p>
          Data is used to operate the platform, facilitate connections, send notifications you opt
          into, and improve matching. AI features may process profile and document content with PII
          redaction where configured.
        </p>

        <h2 className="text-lg font-semibold text-content">Your rights (GDPR / CCPA)</h2>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Access & portability</strong> — download your data from Settings → Password &
            Security.
          </li>
          <li>
            <strong>Erasure</strong> — delete your account from Settings (30-day grace period).
          </li>
          <li>
            <strong>Rectification</strong> — update profile and account details at any time.
          </li>
          <li>
            <strong>Restriction</strong> — adjust privacy and notification preferences in Settings.
          </li>
        </ul>

        <h2 className="text-lg font-semibold text-content">Data retention</h2>
        <p>
          Active account data is retained while your account exists. Deleted accounts are permanently
          removed after the grace period. Unverified registrations may be purged after 7 days.
        </p>

        <h2 className="text-lg font-semibold text-content">Contact</h2>
        <p>
          For privacy requests, contact the platform administrator listed in your organisation&apos;s
          deployment documentation.
        </p>
      </section>

      <p className="mt-8 text-sm">
        <Link to="/terms" className="text-primary hover:underline">
          Terms of Service
        </Link>
        {" · "}
        <Link to="/settings" className="text-primary hover:underline">
          Account settings
        </Link>
      </p>
    </div>
  </PageLayout>
);

export default PrivacyPolicyPage;
