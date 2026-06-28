import React from "react";
import { Link } from "react-router-dom";
import { BadgeCheck, ShieldCheck, ArrowRight, Clock, XCircle } from "lucide-react";
import VerificationBadge from "../common/VerificationBadge";

const VERIFY_PATH = "/settings?tab=verification";

// How-to-verify guidance keyed by current tier.
const NEXT_STEPS = {
  UNVERIFIED: {
    title: "Boost trust with verification",
    steps: [
      "Add your public LinkedIn URL to get Identity Verified instantly.",
      "Submit an incorporation / fund document for Business Verified (admin reviewed).",
    ],
    cta: "Verify now",
  },
  IDENTITY_VERIFIED: {
    title: "Reach the highest trust tier",
    steps: [
      "Submit an incorporation / fund registration document.",
      "An admin reviews it (usually within 48 hours) to award Business Verified.",
    ],
    cta: "Upgrade to Business Verified",
  },
};

const ProfileVerificationCard = ({ status }) => {
  if (!status) return null;

  const tier = status.verification_tier || "UNVERIFIED";
  const latest = status.latest_request;
  const pendingBusiness =
    latest?.requested_tier === "BUSINESS_VERIFIED" &&
    latest?.status === "pending";
  const rejectedBusiness =
    latest?.requested_tier === "BUSINESS_VERIFIED" &&
    latest?.status === "rejected";
  const isBusinessVerified = tier === "BUSINESS_VERIFIED";
  const guidance = NEXT_STEPS[tier];

  return (
    <div className="rounded-xl border border-line bg-surface-alt p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <p className="text-xs text-content-muted uppercase tracking-wide">
            Verification
          </p>
          <VerificationBadge tier={tier} size="lg" />
        </div>
        {isBusinessVerified && (
          <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
            <ShieldCheck className="w-4 h-4" />
            Fully verified
          </span>
        )}
      </div>

      {/* Pending / rejected business request states */}
      {pendingBusiness && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <Clock className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Your Business Verified request is under admin review (usually within
            48 hours).
          </span>
        </div>
      )}
      {rejectedBusiness && (
        <div className="mt-3 flex items-start gap-2 rounded-lg border border-error/30 bg-error/10 px-3 py-2 text-sm text-error">
          <XCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            Your last Business Verified request was rejected
            {latest?.rejection_reason ? `: ${latest.rejection_reason}` : "."} You
            can resubmit with updated documents.
          </span>
        </div>
      )}

      {/* How-to-verify guidance + CTA (hidden once Business Verified) */}
      {!isBusinessVerified && guidance && !pendingBusiness && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-sm font-medium text-content flex items-center gap-1.5">
              <BadgeCheck className="w-4 h-4 text-primary" />
              {guidance.title}
            </p>
            <ul className="mt-1.5 space-y-1">
              {guidance.steps.map((step) => (
                <li
                  key={step}
                  className="text-xs text-content-secondary flex items-start gap-1.5"
                >
                  <span className="mt-1 h-1 w-1 rounded-full bg-content-muted shrink-0" />
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <Link
            to={VERIFY_PATH}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-content-inverse text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {guidance.cta}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Resubmit CTA after rejection */}
      {rejectedBusiness && (
        <Link
          to={VERIFY_PATH}
          className="mt-3 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-content-inverse text-sm font-medium hover:opacity-90 transition-opacity"
        >
          Resubmit documents
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
};

export default ProfileVerificationCard;
