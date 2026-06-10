import React, { Suspense, useEffect, useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./ErrorBoundary";
import BaseLayout from "./components/layout/BaseLayout";
import AuthLayout from "./components/layout/AuthLayout";
import PageLayout from "./components/layout/PageLayout";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegistrationPage from "./pages/RegistrationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import OnboardingPage from "./pages/OnboardingPage";
import InvestorOnboardingPage from "./pages/InvestorOnboardingPage";
import StartupsPage from "./pages/StartupsPage";
import InvestorsPage from "./pages/InvestorsPage";
import ConnectionsPage from "./pages/ConnectionsPage";
import MessagesPage from "./pages/MessagesPage";
import StartupProfilePage from "./pages/StartupProfilePage";
const PitchDeckViewerPage = React.lazy(() => import("./pages/PitchDeckViewerPage"));
import DataRoomManagePage from "./pages/DataRoomManagePage";
import DataRoomViewerPage from "./pages/DataRoomViewerPage";
import FundingRoundManagePage from "./pages/FundingRoundManagePage";
import DealPipelinePage from "./pages/DealPipelinePage";
import StartupComparisonPage from "./pages/StartupComparisonPage";
import StartupAnalyticsPage from "./pages/StartupAnalyticsPage";
import WatchlistPage from "./pages/WatchlistPage";
import AdminVerificationPage from "./pages/AdminVerificationPage";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import InvestorProfilePage from "./pages/InvestorProfilePage";
import MyProfilePage from "./pages/MyProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import SettingsPage from "./pages/SettingsPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer";
import { useAuth } from "./hooks/useAuth";
import { useProfileExistence } from "./hooks/useProfileCache";

const getRoleHomePath = (userType) =>
  userType === "investor" ? "/startups" : "/investors";

const AuthenticatedRedirect = () => {
  const { user } = useAuth();
  return <Navigate to={user?.userType ? "/dashboard" : "/"} replace />;
};

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-page">
        <div className="w-16 h-16 border-4 border-primary-light border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated && user ? children : <Navigate to="/login" replace />;
};

// Redirects users without a profile to their onboarding route.
// Wraps all protected routes except the onboarding pages themselves.
// Backed by useProfileExistence so the answer is fetched once per session and
// shared with every other consumer (LoginForm, OnboardingPage, etc.).
const OnboardingGuard = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { isReady, onboardingPath } = useProfileExistence();

  if (authLoading || (isAuthenticated && !isReady)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-page">
        <div className="w-16 h-16 border-4 border-primary-light border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (onboardingPath) {
    return <Navigate to={onboardingPath} replace />;
  }

  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-page">
        <div className="w-16 h-16 border-4 border-primary-light border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return <AuthenticatedRedirect />;
  }

  return children;
};

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const hideHeaderRoutes = ["/"];
  const showBgRoutes = location.pathname !== "/";

  const shouldShowHeader = !hideHeaderRoutes.includes(location.pathname);
  const shouldShowBg = showBgRoutes;

  return (
    <div className="flex flex-col min-h-screen relative">
      {shouldShowBg && <div className="page-hero-bg" />}

      {shouldShowHeader && (
        <div className="relative z-10">
          <Header />
        </div>
      )}

      <div className="relative flex flex-col flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <AuthLayout>
                  <LoginPage />
                </AuthLayout>
              </PublicRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicRoute>
                <AuthLayout>
                  <RegistrationPage />
                </AuthLayout>
              </PublicRoute>
            }
          />

          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />

          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <AuthLayout>
                  <ForgotPasswordPage />
                </AuthLayout>
              </PublicRoute>
            }
          />

          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <AuthLayout>
                  <ResetPasswordPage />
                </AuthLayout>
              </PublicRoute>
            }
          />

          <Route
            path="/verify-email"
            element={
              <PublicRoute>
                <AuthLayout>
                  <EmailVerificationPage />
                </AuthLayout>
              </PublicRoute>
            }
          />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/investor-onboarding"
            element={
              <ProtectedRoute>
                <InvestorOnboardingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <Navigate to={getRoleHomePath(user?.userType)} replace />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/startups"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <StartupsPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/startups/:id"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <StartupProfilePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <StartupAnalyticsPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/funding-round"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <FundingRoundManagePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/data-room"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <DataRoomManagePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/startups/:id/data-room"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <DataRoomViewerPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/startups/:id/pitch-deck"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <Suspense
                    fallback={
                      <div className="min-h-screen flex items-center justify-center bg-page">
                        <div className="w-10 h-10 border-4 border-primary-light border-t-primary rounded-full animate-spin" />
                      </div>
                    }
                  >
                    <PitchDeckViewerPage />
                  </Suspense>
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/investors"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <InvestorsPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/investors/:id"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <InvestorProfilePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/pipeline"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <DealPipelinePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/compare"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <StartupComparisonPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/watchlist"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <WatchlistPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <AdminAnalyticsPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/verification"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <AdminVerificationPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/connections"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <ConnectionsPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/messages"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <MessagesPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <MyProfilePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/profile/edit"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <EditProfilePage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <OnboardingGuard>
                  <SettingsPage />
                </OnboardingGuard>
              </ProtectedRoute>
            }
          />

          <Route
            path="*"
            element={
              <BaseLayout>
                <PageLayout>
                  <div className="flex flex-col justify-center items-center min-h-[50vh] text-center">
                    <h1 className="text-3xl font-bold text-content mb-4">
                      404 - Page Not Found
                    </h1>
                    <p className="text-lg text-content-secondary mb-6">
                      The page you're looking for doesn't exist.
                    </p>
                    <a
                      href="/"
                      className="btn-primary-token px-4 py-2 text-sm"
                    >
                      Go to Home
                    </a>
                  </div>
                </PageLayout>
              </BaseLayout>
            }
          />
        </Routes>

        <Footer />
      </div>
    </div>
  );
};

const AppShell = () => (
  <div className="min-h-screen bg-page text-content relative">
    <AppContent />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <AppShell />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
