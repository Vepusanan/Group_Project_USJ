import { lazy } from "react";

// Public marketing & auth — loaded on demand after the shell.
export const HomePage = lazy(() => import("../pages/HomePage"));
export const LoginPage = lazy(() => import("../pages/LoginPage"));
export const RegistrationPage = lazy(() => import("../pages/RegistrationPage"));
export const ForgotPasswordPage = lazy(() => import("../pages/ForgotPasswordPage"));
export const ResetPasswordPage = lazy(() => import("../pages/ResetPasswordPage"));
export const EmailVerificationPage = lazy(() => import("../pages/EmailVerificationPage"));
export const TermsPage = lazy(() => import("../pages/TermsPage"));
export const PrivacyPolicyPage = lazy(() => import("../pages/PrivacyPolicyPage"));

// Onboarding
export const OnboardingPage = lazy(() => import("../pages/OnboardingPage"));
export const InvestorOnboardingPage = lazy(() => import("../pages/InvestorOnboardingPage"));

// Discovery & profiles
export const StartupsPage = lazy(() => import("../pages/StartupsPage"));
export const InvestorsPage = lazy(() => import("../pages/InvestorsPage"));
export const StartupProfilePage = lazy(() => import("../pages/StartupProfilePage"));
export const InvestorProfilePage = lazy(() => import("../pages/InvestorProfilePage"));

// Workspace
export const ConnectionsPage = lazy(() => import("../pages/ConnectionsPage"));
export const MessagesPage = lazy(() => import("../pages/MessagesPage"));
export const DealPipelinePage = lazy(() => import("../pages/DealPipelinePage"));
export const WatchlistPage = lazy(() => import("../pages/WatchlistPage"));
export const StartupComparisonPage = lazy(() => import("../pages/StartupComparisonPage"));

// Startup tools
export const StartupAnalyticsPage = lazy(() => import("../pages/StartupAnalyticsPage"));
export const FundingRoundManagePage = lazy(() => import("../pages/FundingRoundManagePage"));
export const DataRoomManagePage = lazy(() => import("../pages/DataRoomManagePage"));
export const DataRoomViewerPage = lazy(() => import("../pages/DataRoomViewerPage"));
export const PitchDeckViewerPage = lazy(() => import("../pages/PitchDeckViewerPage"));

// Account & admin
export const MyProfilePage = lazy(() => import("../pages/MyProfilePage"));
export const EditProfilePage = lazy(() => import("../pages/EditProfilePage"));
export const SettingsPage = lazy(() => import("../pages/SettingsPage"));
export const AdminAnalyticsPage = lazy(() => import("../pages/AdminAnalyticsPage"));
export const AdminVerificationPage = lazy(() => import("../pages/AdminVerificationPage"));
