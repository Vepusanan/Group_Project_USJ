import React, { Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import PageLoader from "../common/PageLoader";
import {
  getRoleHomePath,
  onboardingPathFor,
} from "../../utils/roleUtils";
import { useAuth } from "../../hooks/useAuth";
import { useAuthRouteGuard } from "../../hooks/useAuthRouteGuard";
import { GUARD_MODE, AUTH_STATUS } from "@shared/authStateMachine.mjs";

const AuthSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" />
  </div>
);

function AuthRouteGate({ guardMode, children, pendingFallback }) {
  const { pending, decision } = useAuthRouteGuard(guardMode);

  if (pending) {
    return pendingFallback ?? <AuthSpinner />;
  }

  if (decision.redirect) {
    return <Navigate to={decision.redirect} replace />;
  }

  return children ?? <Outlet />;
}

export const ProtectedRoute = ({ children }) => (
  <AuthRouteGate guardMode={GUARD_MODE.PROTECTED}>{children}</AuthRouteGate>
);

export const RoleRoute = ({ allowedTypes, children }) => {
  const { user } = useAuth();
  const { pending } = useAuthRouteGuard(GUARD_MODE.APP);

  if (pending) return <AuthSpinner />;
  if (!user || !allowedTypes.includes(user.userType)) {
    return <Navigate to={getRoleHomePath(user?.userType)} replace />;
  }

  return children ?? <Outlet />;
};

export const AdminRoute = ({ children }) => {
  const { user } = useAuth();
  const { pending } = useAuthRouteGuard(GUARD_MODE.APP);

  if (pending) return <AuthSpinner />;
  if (!user?.isAdmin) {
    return <Navigate to="/settings" replace />;
  }

  return children ?? <Outlet />;
};

export const OnboardingRoleRoute = ({ requiredType, children }) => {
  const { user } = useAuth();
  const { pending } = useAuthRouteGuard(GUARD_MODE.PROTECTED);

  if (pending) return <AuthSpinner />;
  if (user?.userType && user.userType !== requiredType) {
    return <Navigate to={onboardingPathFor(user.userType)} replace />;
  }

  return children;
};

export const OnboardingGuard = ({ children }) => (
  <AuthRouteGate
    guardMode={GUARD_MODE.APP}
    pendingFallback={<AuthSpinner />}
  >
    {children ? (
      <Suspense fallback={<PageLoader className="min-h-[60vh]" />}>
        {children}
      </Suspense>
    ) : (
      <Suspense fallback={<PageLoader className="min-h-[60vh]" />}>
        <Outlet />
      </Suspense>
    )}
  </AuthRouteGate>
);

export const VerifyEmailRoute = ({ children }) => (
  <AuthRouteGate
    guardMode={GUARD_MODE.VERIFY_EMAIL}
    pendingFallback={<PageLoader className="min-h-screen" />}
  >
    {children}
  </AuthRouteGate>
);

export const PublicRoute = ({ children }) => (
  <AuthRouteGate
    guardMode={GUARD_MODE.PUBLIC_AUTH}
    pendingFallback={<PageLoader className="min-h-screen" />}
  >
    {children}
  </AuthRouteGate>
);

export { AUTH_STATUS };
