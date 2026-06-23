import React from "react";
import { Link } from "react-router-dom";
import LegalPageLayout, {
  LegalSection,
  legalLinkClass,
} from "../components/layout/LegalPageLayout";

const PrivacyPolicyPage = () => (
  <LegalPageLayout
    title="Privacy Policy"
    lastUpdated="June 2026"
    footerLinks={
      <Link to="/terms" className={legalLinkClass}>
        Terms of Service
      </Link>
    }
  >
    <LegalSection title="Data we collect">
      <p>
        We collect account information (name, email, role), profile data you
        provide, messages between connected users, and usage signals needed for
        analytics and security (e.g. login events, session metadata).
      </p>
    </LegalSection>

    <LegalSection title="How we use data">
      <p>
        Data is used to operate the platform, facilitate connections, send
        notifications you opt into, and improve matching. AI features may process
        profile and document content with PII redaction where configured.
      </p>
    </LegalSection>

    <LegalSection title="Your rights (GDPR / CCPA)">
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong className="font-semibold text-midnight-navy">
            Access &amp; portability
          </strong>{" "}
          — download your data from Settings → Password &amp; Security.
        </li>
        <li>
          <strong className="font-semibold text-midnight-navy">Erasure</strong>{" "}
          — delete your account from Settings (30-day grace period).
        </li>
        <li>
          <strong className="font-semibold text-midnight-navy">
            Rectification
          </strong>{" "}
          — update profile and account details at any time.
        </li>
        <li>
          <strong className="font-semibold text-midnight-navy">
            Restriction
          </strong>{" "}
          — adjust privacy and notification preferences in Settings.
        </li>
      </ul>
    </LegalSection>

    <LegalSection title="Data retention">
      <p>
        Active account data is retained while your account exists. Deleted
        accounts are permanently removed after the grace period. Unverified
        registrations may be purged after 7 days.
      </p>
    </LegalSection>

    <LegalSection title="Contact">
      <p>
        For privacy requests, contact the platform administrator listed in your
        organisation&apos;s deployment documentation.
      </p>
    </LegalSection>
  </LegalPageLayout>
);

export default PrivacyPolicyPage;
