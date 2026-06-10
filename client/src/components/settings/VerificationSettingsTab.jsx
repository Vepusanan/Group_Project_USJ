import React from "react";
import { Link } from "react-router-dom";
import VerificationBadge from "../common/VerificationBadge";
import { Feedback, SectionHeader, inputCls } from "./SettingsPrimitives";

const VerificationSettingsTab = ({
  user,
  verification,
  feedback,
  busy,
  identityLinkedinUrl,
  setIdentityLinkedinUrl,
  businessLinkedinUrl,
  setBusinessLinkedinUrl,
  businessDoc,
  setBusinessDoc,
  onSubmitIdentity,
  onSubmitBusiness,
}) => (
  <div>
    <SectionHeader
      title="Verification badges"
      description="Build trust with investors by verifying your identity and business."
    />
    <Feedback feedback={feedback} />

    <div className="rounded-lg border border-line p-4 mb-6 space-y-2">
      <p className="text-sm text-content-secondary">Current status</p>
      <VerificationBadge tier={verification?.verification_tier || "UNVERIFIED"} size="lg" />
      {verification?.needs_annual_review && (
        <p className="text-xs text-warning">
          Your Business Verified status is due for annual review. Please resubmit
          updated documentation.
        </p>
      )}
      {verification?.latest_request?.status === "pending" && (
        <p className="text-xs text-warning">
          Business verification pending administrator review (typically within 48
          hours).
        </p>
      )}
      {verification?.latest_request?.status === "rejected" && (
        <p className="text-xs text-error">
          Rejected:{" "}
          {verification.latest_request.rejection_reason || "See email for details"}
        </p>
      )}
      {verification?.is_admin && (
        <div className="flex flex-wrap gap-4">
          <Link to="/admin/analytics" className="text-sm text-primary hover:underline">
            Platform analytics dashboard →
          </Link>
          <Link to="/admin/verification" className="text-sm text-primary hover:underline">
            Verification review queue →
          </Link>
        </div>
      )}
    </div>

    <form
      onSubmit={onSubmitIdentity}
      className="rounded-lg border border-line p-4 space-y-3 mb-4"
    >
      <h3 className="text-sm font-semibold text-content">Identity Verified</h3>
      <p className="text-xs text-content-muted">
        Requires verified email and a publicly accessible LinkedIn profile.
        Identity Verified is also awarded automatically when both conditions are
        met via your profile or email verification.
      </p>
      <input
        className={inputCls}
        value={identityLinkedinUrl}
        onChange={(e) => setIdentityLinkedinUrl(e.target.value)}
        placeholder="https://www.linkedin.com/in/your-profile"
        required
      />
      <button
        type="submit"
        disabled={!!busy || !verification?.email_verified}
        className="px-4 py-2 rounded-lg bg-primary text-sm text-content-inverse disabled:opacity-50"
      >
        {busy === "verification.identity" ? "Submitting…" : "Claim Identity Verified"}
      </button>
    </form>

    <form
      onSubmit={onSubmitBusiness}
      className="rounded-lg border border-line p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold text-content">Business Verified</h3>
      <p className="text-xs text-content-muted">
        {user?.userType === "investor"
          ? "Upload fund registration, investment track record, or professional investor credentials."
          : "Upload a certificate of incorporation or equivalent registration (issued within the last 3 years)."}
      </p>
      <input
        className={inputCls}
        value={businessLinkedinUrl}
        onChange={(e) => setBusinessLinkedinUrl(e.target.value)}
        placeholder="LinkedIn profile URL"
        required
      />
      <input
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={(e) => setBusinessDoc(e.target.files?.[0] || null)}
        className="text-sm text-content-secondary"
      />
      <button
        type="submit"
        disabled={!!busy}
        className="px-4 py-2 rounded-lg bg-primary text-sm text-content-inverse disabled:opacity-50"
      >
        {busy === "verification.business" ? "Submitting…" : "Submit for Business Verified"}
      </button>
    </form>
  </div>
);

export default VerificationSettingsTab;
