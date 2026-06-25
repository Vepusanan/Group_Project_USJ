import React, { Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import PageLoader from "../common/PageLoader";
import {
  getRoleHomePath,
  onboardingPathFor,
} from "../../utils/roleUtils";

const AuthSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-background">
    <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary-fixed border-t-primary" />
  </div>
);

const isAuthPending = (isLoading, isRevalidating) =>
  isLoading || isRevalidating;

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isRevalidating, user, authState } =
    useAuth();

  if (isAuthPending(isLoading, isRevalidating)) return <AuthSpinner />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (authState?.requiredRoute?.startsWith("/verify-email")) {
    return <Navigate to={authState.requiredRoute} replace />;
  }

  if (children) return children;
  return <Outlet />;
};

export const RoleRoute = ({ allowedTypes, children }) => {
  const { user, isLoading, isRevalidating } = useAuth();

  if (isAuthPending(isLoading, isRevalidating)) return <AuthSpinner />;
  if (!user || !allowedTypes.includes(user.userType)) {
    return <Navigate to={getRoleHomePath(user?.userType)} replace />;
  }

  if (children) return children;
  return <Outlet />;
};

export const AdminRoute = ({ children }) => {
  const { user, isLoading, isRevalidating } = useAuth();

  if (isAuthPending(isLoading, isRevalidating)) return <AuthSpinner />;
  if (!user?.isAdmin) {
    return <Navigate to="/settings" replace />;
  }

  if (children) return children;
  return <Outlet />;
};

export const OnboardingRoleRoute = ({ requiredType, children }) => {
  const { user, isLoading, isRevalidating } = useAuth();

  if (isAuthPending(isLoading, isRevalidating)) return <AuthSpinner />;
  if (user?.userType && user.userType !== requiredType) {
    return <Navigate to={onboardingPathFor(user.userType)} replace />;
  }

  return children;
};

export const OnboardingGuard = ({ children }) => {
  const { isAuthenticated, isLoading, isRevalidating, authState } = useAuth();

  if (isAuthPending(isLoading, isRevalidating)) return <AuthSpinner />;
  if (isAuthenticated && authState?.requiredRoute) {
    return <Navigate to={authState.requiredRoute} replace />;
  }

  if (children) {
    return (
      <Suspense fallback={<PageLoader className="min-h-[60vh]" />}>
        {children}
      </Suspense>
    );
  }

  return (
    <Suspense fallback={<PageLoader className="min-h-[60vh]" />}>
      <Outlet />
    </Suspense>
  );
};

/** Redirect verified users away from /verify-email. */
export const VerifyEmailRoute = ({ children }) => {
  const { isLoading, isRevalidating, isAuthenticated, authState, redirectPath } =
    useAuth();

  if (isAuthPending(isLoading, isRevalidating)) return <AuthSpinner />;
  if (
    isAuthenticated &&
    authState?.emailVerified &&
    !authState?.requiredRoute?.startsWith("/verify-email")
  ) {
    return <Navigate to={redirectPath || "/dashboard"} replace />;
  }

  return children;
};

/** Public routes that redirect authenticated users per /auth/me. */
export const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, isRevalidating, redirectPath } = useAuth();

  if (isAuthPending(isLoading, isRevalidating)) {
    return <PageLoader className="min-h-screen" />;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectPath || "/dashboard"} replace />;
  }

  return children;
};
