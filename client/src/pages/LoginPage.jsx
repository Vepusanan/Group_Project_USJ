import React from "react";
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import LoginForm from "../components/auth/LoginForm";
import Button from "../components/common/Button";

const LoginPage = () => {
  return (
    <div className="w-full max-w-[480px] mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 mb-2">
          <Rocket className="w-8 h-8 text-primary fill-primary/20" />
          <span className="font-display text-headline-md font-bold text-primary tracking-tight">
            StartHub Capital
          </span>
        </div>
        <p className="text-body-md text-on-surface-variant">
          The high-velocity ecosystem for venture scale.
        </p>
      </div>

      <div className="surface-card premium-shadow p-8 md:p-10">
        <div className="mb-8">
          <h1 className="font-display text-headline-md text-on-surface mb-2">
            Welcome Back
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Access your capital management dashboard.
          </p>
        </div>

        <LoginForm />

        <div className="text-right pt-2">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-outline-variant" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-background px-3 font-label text-label-caps uppercase tracking-wider text-outline text-xs">
            New here?
          </span>
        </div>
      </div>

      <Link to="/signup">
        <Button variant="secondary" size="lg" fullWidth>
          Create an account
        </Button>
      </Link>
    </div>
  );
};

export default LoginPage;
