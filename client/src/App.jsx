import React, { useEffect, useState } from "react";
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
import InvestorProfilePage from "./pages/InvestorProfilePage";
import MyProfilePage from "./pages/MyProfilePage";
import EditProfilePage from "./pages/EditProfilePage";
import SettingsPage from "./pages/SettingsPage";
import Header from "./components/common/Header.jsx";
import Footer from "./components/common/Footer";
import { useAuth } from "./hooks/useAuth";
import { profileService } from "./services/profileService";
import { investorProfileService } from "./services/investorProfileService";

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
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return isAuthenticated && user ? children : <Navigate to="/login" replace />;
};

// Redirects users without a profile to their onboarding route.
// Wraps all protected routes except the onboarding pages themselves.
// Module-level cache: userId -> redirect path (null = has profile, string = needs onboarding)
export const onboardingCheckCache = new Map();
export const clearOnboardingCache = () => onboardingCheckCache.clear();

const OnboardingGuard = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  const userId = user?.id ?? null;
  const cached = userId ? onboardingCheckCache.get(userId) : undefined;
  // If already cached we know the answer synchronously — no spinner needed.
  const alreadyChecked = cached !== undefined;

  const [checking, setChecking] = useState(!alreadyChecked);
  const [onboardingPath, setOnboardingPath] = useState(alreadyChecked ? cached : null);

  useEffect(() => {
    if (isLoading || !isAuthenticated || !user) return;
    if (onboardingCheckCache.has(user.id)) return;

    const check = async () => {
      let redirect = null;
      try {
        if (user.userType === "startup") {
          const result = await profileService.getMyProfile();
          const data = result.data?.data || result.data;
          const hasProfile = Boolean(data?.startup_profile_id || data?.id);
          if (!hasProfile) redirect = "/onboarding";
        } else if (user.userType === "investor") {
          const result = await investorProfileService.getMyProfile();
          const data = result.data?.data || result.data;
          const hasProfile = Boolean(data?.investor_profile_id || data?.id);
          if (!hasProfile) redirect = "/investor-onboarding";
        }
      } catch {
        // network error — allow through rather than blocking the user
      } finally {
        onboardingCheckCache.set(user.id, redirect);
        setOnboardingPath(redirect);
        setChecking(false);
      }
    };

    check();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isAuthenticated, userId]);

  if (isLoading || checking) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
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
      <div className="flex justify-center items-center min-h-screen bg-black">
        <div className="w-16 h-16 border-4 border-blue-600/30 border-t-blue-600 rounded-full animate-spin"></div>
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
                    <h1 className="text-3xl font-bold text-white mb-4">
                      404 - Page Not Found
                    </h1>
                    <p className="text-lg text-gray-300 mb-6">
                      The page you're looking for doesn't exist.
                    </p>
                    <a
                      href="/"
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-md hover:opacity-90 transition-opacity"
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

const AppShell = () => {
  const location = useLocation();
  const isHomePage = location.pathname === "/";

  return (
    <div className={`min-h-screen bg-black text-white relative${!isHomePage ? " overflow-hidden" : ""}`}>
      {!isHomePage && (
        <div className="absolute inset-0 pointer-events-none">
          <img
            src="/images/background/upLight.png"
            alt=""
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] max-w-none block opacity-90"
            style={{ maskImage: "linear-gradient(to bottom, black 50%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 50%, transparent 100%)" }}
          />
          <img
            src="/images/background/footerLight.png"
            alt=""
            className="absolute bottom-[-260px] left-1/2 -translate-x-1/2 w-[2200px] max-w-none opacity-95"
          />
        </div>
      )}

      <div className="relative z-10">
        <AppContent />
      </div>
    </div>
  );
};

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
