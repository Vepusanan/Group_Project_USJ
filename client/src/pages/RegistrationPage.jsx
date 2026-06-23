import React from "react";
import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import RegistrationForm from "../components/auth/RegistrationForm";
import Button from "../components/common/Button";

const RegistrationPage = () => {
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

      {/* Form Card */}
      <div className="surface-card premium-shadow p-8 md:p-10">
        <div className="mb-8">
          <h1 className="font-display text-headline-md text-on-surface mb-2">
            Create your account
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Join StartHub and start connecting.
          </p>
        </div>

        <RegistrationForm />
      </div>

      {/* Button with text - OUTSIDE the card */}
      <div className="mt-6 mb-6 text-center">
        <Link to="/login">
          <Button
            variant="white-border"
            size="lg"
            fullWidth
            className="max-w-[480px] mx-auto"
          >
            Already have an account?
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RegistrationPage;
