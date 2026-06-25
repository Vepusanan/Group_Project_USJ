import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { clearProfileCaches } from "../../hooks/useProfileCache";
import { onboardingPathFor } from "../../utils/roleUtils";
import Button from "../common/Button";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { error: authError, resendVerification, verifyEmail } = useAuth();

  const emailParam = searchParams.get("email");
  const tokenParam = searchParams.get("token");
  const hasRealEmail = Boolean(emailParam);
  const email = emailParam || "yourmail@gmail.com";

  const [cooldown, setCooldown] = useState(0);
  const [status, setStatus] = useState("idle");
  const [feedback, setFeedback] = useState("");
  const verificationStarted = useRef(null);

  useEffect(() => {
    if (!tokenParam) return;
    if (verificationStarted.current === tokenParam) return;
    verificationStarted.current = tokenParam;

    const runVerification = async () => {
      setStatus("verifying");
      setFeedback("");
      const result = await verifyEmail(tokenParam);
      if (result?.success) {
        clearProfileCaches();
        setStatus("verified");
        setFeedback(result.message || "Email verified successfully!");
        const destination =
          result.redirectPath ||
          onboardingPathFor(result.user?.userType) ||
          "/dashboard";
        console.info("[auth] verification_redirect", {
          destination,
          userType: result.user?.userType,
        });
        navigate(destination, { replace: true });
        return;
      }
      setStatus("error");
      setFeedback(result?.error || "Email verification failed.");
    };

    runVerification();
  }, [tokenParam, verifyEmail, navigate]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || status === "sending" || !hasRealEmail) return;
    setStatus("sending");
    setFeedback("");
    const result = await resendVerification(email);
    if (result?.success === false) {
      setStatus("error");
      setFeedback(result.error || "Failed to resend verification email.");
      return;
    }
    setStatus("success");
    setFeedback(result?.message || "A new verification link has been sent.");
    setCooldown(60);
  };

  const resendLabel = !hasRealEmail
    ? "Resend verification email"
    : cooldown > 0
      ? `Resend in ${cooldown}s`
      : status === "sending"
        ? "Sending…"
        : "Resend verification email";

  return (
    <div className="text-center">
      {/* Email Verification Image */}
      <div className="mb-6 relative inline-block">
        <div className="w-48 h-48 rounded-full flex items-center justify-center mx-auto overflow-hidden">
          <img
            src="/images/email/emailverification.png"
            alt="Email Verification"
            className="w-full h-full object-contain"
          />
        </div>
      </div>

      <h1 className="text-2xl font-bold text-content mb-4">
        Verify your email address
      </h1>

      <p className="text-content-muted mb-8 text-sm leading-relaxed max-w-md mx-auto">
        You've entered{" "}
        <span className="text-primary font-medium">{email}</span> as the email
        address for your account. Please verify this email address from your
        inbox.
      </p>

      {authError && (
        <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg">
          <p className="text-error text-sm text-center">{authError}</p>
        </div>
      )}

      {status === "verifying" && (
        <div className="mb-6 p-4 bg-primary-light border border-primary-light rounded-lg max-w-md mx-auto">
          <p className="text-primary text-sm text-center">
            Verifying your email…
          </p>
        </div>
      )}

      {status === "verified" && feedback && (
        <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-lg max-w-md mx-auto">
          <p className="text-success text-sm text-center">{feedback}</p>
        </div>
      )}

      {status !== "verifying" && status !== "verified" && (
        <div className="mb-6 p-4 bg-primary-light border border-primary-light rounded-lg max-w-md mx-auto">
          <p className="text-primary text-sm text-center">
            Watch your email and click the verification link to verify your
            account. In local development, the link is also printed in the
            server terminal.
          </p>
        </div>
      )}

      <div className="w-full max-w-md mx-auto space-y-3">
        <Button
          variant="white-border"
          size="lg"
          fullWidth
          className="h-12"
          disabled={cooldown > 0 || status === "sending" || !hasRealEmail}
          onClick={handleResend}
        >
          {resendLabel}
        </Button>

        {!hasRealEmail && (
          <p className="text-content-muted text-xs text-center">
            Email address not available — open this page from your signup
            confirmation link.
          </p>
        )}

        {hasRealEmail && status === "success" && feedback && (
          <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
            <p className="text-success text-sm text-center">{feedback}</p>
          </div>
        )}

        {hasRealEmail && status === "error" && feedback && (
          <div className="p-3 bg-error/10 border border-error/30 rounded-lg">
            <p className="text-error text-sm text-center">{feedback}</p>
          </div>
        )}

        <Link to="/login" className="block">
          <Button
            variant="gradient-border"
            size="lg"
            fullWidth
            className="h-12"
          >
            Login
          </Button>
        </Link>

        <div className="pt-2 text-center">
          <Link
            to="/signup"
            className="text-sm text-content-muted hover:text-primary transition-colors"
          >
            ← Wrong email? Change it
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EmailVerification;
