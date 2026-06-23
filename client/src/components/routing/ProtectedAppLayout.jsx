import React, { Suspense } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useProfileExistence } from "../../hooks/useProfileCache";
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

export const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <AuthSpinner />;
  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  if (children) return children;
  return <Outlet />;
};

export const RoleRoute = ({ allowedTypes, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthSpinner />;
  if (!user || !allowedTypes.includes(user.userType)) {
    return <Navigate to={getRoleHomePath(user?.userType)} replace />;
  }

  if (children) return children;
  return <Outlet />;
};

export const AdminRoute = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthSpinner />;
  if (!user?.isAdmin) {
    return <Navigate to="/settings" replace />;
  }

  if (children) return children;
  return <Outlet />;
};

export const OnboardingRoleRoute = ({ requiredType, children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) return <AuthSpinner />;
  if (user?.userType && user.userType !== requiredType) {
    return <Navigate to={onboardingPathFor(user.userType)} replace />;
  }

  return children;
};

export const OnboardingGuard = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isReady, onboardingPath } = useProfileExistence();

  if (authLoading || (isAuthenticated && !isReady)) return <AuthSpinner />;
  if (onboardingPath) return <Navigate to={onboardingPath} replace />;

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
