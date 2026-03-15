import React from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import Button from "../common/Button";

const EmailVerification = () => {
  const [searchParams] = useSearchParams();
  const { error: authError } = useAuth();

  const email = searchParams.get("email") || "yourmail@gmail.com";

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

      <h1 className="text-2xl font-bold text-white mb-4">
        Verify your email address
      </h1>

      <p className="text-gray-400 mb-8 text-sm leading-relaxed max-w-md mx-auto">
        You've entered{" "}
        <span className="text-blue-400 font-medium">{email}</span> as the email
        address for your account. Please verify this email address from your
        inbox.
      </p>

      {authError && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
          <p className="text-red-400 text-sm text-center">{authError}</p>
        </div>
      )}

      <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg max-w-md mx-auto">
        <p className="text-blue-300 text-sm text-center">
          Watch your email and click the verification link to verify your
          account.
        </p>
      </div>

      <div className="w-full max-w-md mx-auto">
        <Link to="/login">
          <Button
            variant="gradient-border"
            size="lg"
            fullWidth
            className="h-12"
          >
            Login
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default EmailVerification;
