import React, { Suspense } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthProvider, RouteChangeAuthSync } from "./context/AuthContext";
import ErrorBoundary from "./ErrorBoundary";
import BaseLayout from "./components/layout/BaseLayout";
import AuthLayout from "./components/layout/AuthLayout";
import PageLayout from "./components/layout/PageLayout";
import FloatingNavBar from "./components/common/FloatingNavBar.jsx";
import SiteFooter from "./components/common/SiteFooter";
import PageLoader from "./components/common/PageLoader";
import ScrollToTop from "./components/routing/ScrollToTop";
import {
  AdminRoute,
  OnboardingGuard,
  OnboardingRoleRoute,
  ProtectedRoute,
  PublicRoute,
  RoleRoute,
  VerifyEmailRoute,
} from "./components/routing/ProtectedAppLayout";
import {
  HomePage,
  LoginPage,
  RegistrationPage,
  ForgotPasswordPage,
  ResetPasswordPage,
  EmailVerificationPage,
  TermsPage,
  PrivacyPolicyPage,
} from "./routes/authPages";
import {
  AdminAnalyticsPage,
  AdminFraudReportsPage,
  AdminVerificationPage,
  ConnectionsPage,
  DataRoomManagePage,
  DataRoomViewerPage,
  DealPipelinePage,
  EditProfilePage,
  FundingRoundManagePage,
  InvestorOnboardingPage,
  InvestorProfilePage,
  InvestorsPage,
  MessagesPage,
  MyProfilePage,
  OnboardingPage,
  PitchDeckViewerPage,
  SettingsPage,
  StartupAnalyticsPage,
  StartupComparisonPage,
  StartupProfilePage,
  StartupsPage,
} from "./routes/lazyPages";
import { getRoleHomePath } from "./utils/roleUtils";
import { useAuth } from "./hooks/useAuth";

const AUTH_CHROMELESS_ROUTES = [
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/onboarding",
  "/investor-onboarding",
];

const LazyPage = ({ children }) => (
  <Suspense fallback={<PageLoader className="min-h-[60vh]" />}>{children}</Suspense>
);

// /analytics is shared: startups see their analytics dashboard, investors see
// their deal pipeline + watchlist (formerly the separate "Pipeline" page).
const RoleAnalyticsPage = () => {
  const { user } = useAuth();
  return user?.userType === "investor" ? (
    <DealPipelinePage />
  ) : (
    <StartupAnalyticsPage />
  );
};

const AppContent = () => {
  const location = useLocation();
  const { user } = useAuth();
  const showBgRoutes =
    location.pathname !== "/" &&
    location.pathname !== "/terms" &&
    location.pathname !== "/privacy";

  // Full-screen viewers render their own header/controls, so the floating nav
  // bar must be hidden — it overlaps and intercepts clicks on their controls.
  const isChromelessViewer = /\/pitch-deck$/.test(location.pathname);

  const shouldShowChrome =
    !AUTH_CHROMELESS_ROUTES.includes(location.pathname) && !isChromelessViewer;
  const shouldShowBg = showBgRoutes;

  return (
    <div className="relative flex min-h-screen flex-col">
      {shouldShowBg && <div className="page-hero-bg" />}

      {shouldShowChrome && <FloatingNavBar />}

      <div className="relative flex flex-1 flex-col">
        <Routes>
          <Route
            path="/"
            element={
              <LazyPage>
                <HomePage />
              </LazyPage>
            }
          />

          <Route
            path="/login"
            element={
              <PublicRoute>
                <LazyPage>
                  <AuthLayout>
                    <LoginPage />
                  </AuthLayout>
                </LazyPage>
              </PublicRoute>
            }
          />

          <Route
            path="/signup"
            element={
              <PublicRoute>
                <LazyPage>
                  <AuthLayout>
                    <RegistrationPage />
                  </AuthLayout>
                </LazyPage>
              </PublicRoute>
            }
          />

          <Route
            path="/terms"
            element={
              <LazyPage>
                <TermsPage />
              </LazyPage>
            }
          />

          <Route
            path="/privacy"
            element={
              <LazyPage>
                <PrivacyPolicyPage />
              </LazyPage>
            }
          />

          <Route
            path="/forgot-password"
            element={
              <PublicRoute>
                <LazyPage>
                  <AuthLayout>
                    <ForgotPasswordPage />
                  </AuthLayout>
                </LazyPage>
              </PublicRoute>
            }
          />

          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <LazyPage>
                  <AuthLayout>
                    <ResetPasswordPage />
                  </AuthLayout>
                </LazyPage>
              </PublicRoute>
            }
          />

          <Route
            path="/verify-email"
            element={
              <VerifyEmailRoute>
                <LazyPage>
                  <AuthLayout>
                    <EmailVerificationPage />
                  </AuthLayout>
                </LazyPage>
              </VerifyEmailRoute>
            }
          />

          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingRoleRoute requiredType="startup">
                  <LazyPage>
                    <OnboardingPage />
                  </LazyPage>
                </OnboardingRoleRoute>
              </ProtectedRoute>
            }
          />

          <Route
            path="/investor-onboarding"
            element={
              <ProtectedRoute>
                <OnboardingRoleRoute requiredType="investor">
                  <LazyPage>
                    <InvestorOnboardingPage />
                  </LazyPage>
                </OnboardingRoleRoute>
              </ProtectedRoute>
            }
          />

          <Route element={<ProtectedRoute />}>
            <Route element={<OnboardingGuard />}>
              <Route
                path="/dashboard"
                element={<Navigate to={getRoleHomePath(user?.userType)} replace />}
              />

              <Route path="/startups" element={<StartupsPage />} />
              <Route path="/startups/:id" element={<StartupProfilePage />} />
              <Route
                path="/analytics"
                element={
                  <RoleRoute allowedTypes={["startup", "investor"]}>
                    <RoleAnalyticsPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/funding-round"
                element={
                  <RoleRoute allowedTypes={["startup"]}>
                    <FundingRoundManagePage />
                  </RoleRoute>
                }
              />
              <Route
                path="/data-room"
                element={
                  <RoleRoute allowedTypes={["startup"]}>
                    <DataRoomManagePage />
                  </RoleRoute>
                }
              />
              <Route path="/startups/:id/data-room" element={<DataRoomViewerPage />} />
              <Route path="/startups/:id/pitch-deck" element={<PitchDeckViewerPage />} />
              <Route path="/investors" element={<InvestorsPage />} />
              <Route path="/investors/:id" element={<InvestorProfilePage />} />
              {/* Legacy routes — investor pipeline + watchlist now live on /analytics. */}
              <Route
                path="/pipeline"
                element={<Navigate to="/analytics" replace />}
              />
              <Route
                path="/compare"
                element={
                  <RoleRoute allowedTypes={["investor"]}>
                    <StartupComparisonPage />
                  </RoleRoute>
                }
              />
              <Route
                path="/watchlist"
                element={<Navigate to="/analytics" replace />}
              />
              <Route
                path="/admin/analytics"
                element={
                  <AdminRoute>
                    <AdminAnalyticsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/verification"
                element={
                  <AdminRoute>
                    <AdminVerificationPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <AdminRoute>
                    <AdminFraudReportsPage />
                  </AdminRoute>
                }
              />
              <Route path="/connections" element={<ConnectionsPage />} />
              <Route path="/messages" element={<MessagesPage />} />
              <Route path="/profile" element={<MyProfilePage />} />
              <Route path="/profile/edit" element={<EditProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          <Route
            path="*"
            element={
              <BaseLayout>
                <PageLayout>
                  <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
                    <h1 className="mb-4 text-3xl font-bold text-content">
                      404 - Page Not Found
                    </h1>
                    <p className="mb-6 text-lg text-content-secondary">
                      The page you're looking for doesn't exist.
                    </p>
                    <a href="/" className="btn-primary-token px-4 py-2 text-sm">
                      Go to Home
                    </a>
                  </div>
                </PageLayout>
              </BaseLayout>
            }
          />
        </Routes>

        {shouldShowChrome && <SiteFooter />}
      </div>
    </div>
  );
};

const AppShell = () => {
  const { isLoading } = useAuth();
  const [showLoader, setShowLoader] = React.useState(true);
  const [isFading, setIsFading] = React.useState(false);

  React.useEffect(() => {
    const minLoadTime = 2800; // 2.8s loader presentation
    const startTime = Date.now();

    if (!isLoading) {
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minLoadTime - elapsedTime);

      const timer = setTimeout(() => {
        setIsFading(true);
        const unmountTimer = setTimeout(() => {
          setShowLoader(false);
        }, 700); // 700ms transition fade out
        return () => clearTimeout(unmountTimer);
      }, remainingTime);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  return (
    <div className="relative min-h-screen bg-background text-on-surface">
      {showLoader && (
        <div 
          className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950/25 backdrop-blur-xl overflow-hidden transition-all duration-700 ease-in-out ${
            isFading ? "opacity-0 scale-95 pointer-events-none" : "opacity-100"
          }`}
        >
          <style>{`
            @keyframes real-handshake-left {
              0% { transform: translateX(-100%) translateY(0) rotate(-10deg); opacity: 0; }
              12% { opacity: 1; }
              30% { transform: translateX(9.5%) translateY(0) rotate(0deg); opacity: 1; }
              /* Synchronized shake */
              40% { transform: translateX(9.5%) translateY(-6px) rotate(0deg); opacity: 1; }
              50% { transform: translateX(9.5%) translateY(4px) rotate(0deg); opacity: 1; }
              60% { transform: translateX(9.5%) translateY(-4px) rotate(0deg); opacity: 1; }
              70% { transform: translateX(9.5%) translateY(2px) rotate(0deg); opacity: 1; }
              78% { transform: translateX(9.5%) translateY(0) rotate(0deg); opacity: 1; }
              85% { opacity: 1; }
              98% { opacity: 0; }
              100% { transform: translateX(-100%) translateY(0) rotate(-10deg); opacity: 0; }
            }
            @keyframes real-handshake-right {
              0% { transform: translateX(100%) translateY(0) rotate(10deg); opacity: 0; }
              12% { opacity: 1; }
              30% { transform: translateX(-13.5%) translateY(0) rotate(0deg); opacity: 1; }
              /* Synchronized shake */
              40% { transform: translateX(-13.5%) translateY(-6px) rotate(0deg); opacity: 1; }
              50% { transform: translateX(-13.5%) translateY(4px) rotate(0deg); opacity: 1; }
              60% { transform: translateX(-13.5%) translateY(-4px) rotate(0deg); opacity: 1; }
              70% { transform: translateX(-13.5%) translateY(2px) rotate(0deg); opacity: 1; }
              78% { transform: translateX(-13.5%) translateY(0) rotate(0deg); opacity: 1; }
              85% { opacity: 1; }
              98% { opacity: 0; }
              100% { transform: translateX(100%) translateY(0) rotate(10deg); opacity: 0; }
            }
            .animate-real-hand-l {
              animation: real-handshake-left 3.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
            }
            .animate-real-hand-r {
              animation: real-handshake-right 3.5s cubic-bezier(0.25, 1, 0.5, 1) infinite;
            }
          `}</style>

          {/* Ambient lighting decor */}
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

          {/* Clean minimal content (no cards, no circles, no white backgrounds) */}
          <div className="relative z-10 flex flex-col items-center max-w-sm w-full mx-4">
            
            {/* The Handshake Loader Container */}
            <div className="relative flex items-center justify-center w-60 h-60">
              
              {/* Left Hand container (Light blue cuff) */}
              <div className="absolute inset-0 animate-real-hand-l z-20">
                <img 
                  src="/images/loader/left_hand.png" 
                  alt="Left Hand" 
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Right Hand container (Dark blue cuff) */}
              <div className="absolute inset-0 animate-real-hand-r z-10">
                <img 
                  src="/images/loader/right_hand.png" 
                  alt="Right Hand" 
                  className="w-full h-full object-contain"
                />
              </div>

            </div>

            {/* Brand Typography */}
            <div className="mt-4 text-center space-y-2.5 relative z-10">
              <h2 className="text-2xl font-bold tracking-[0.2em] text-[#1A1A1A] uppercase font-sans">
                STARTUP<span className="text-blue-600 font-extrabold">CONNECT</span>
              </h2>
              <p className="text-[10px] font-semibold tracking-[0.3em] text-[#8C8273] uppercase animate-pulse">
                BRIDGING CAPITAL & INNOVATION
              </p>
            </div>
          </div>
        </div>
      )}
      <AppContent />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true,
          }}
        >
          <ScrollToTop />
          <RouteChangeAuthSync />
          <AppShell />
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
