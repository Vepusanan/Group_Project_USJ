import { lazyWithRetry } from "../utils/lazyWithRetry";

// Public marketing & auth — loaded on demand after the shell.
export const HomePage = lazyWithRetry(() => import("../pages/HomePage"));
export const LoginPage = lazyWithRetry(() => import("../pages/LoginPage"));
export const RegistrationPage = lazyWithRetry(() => import("../pages/RegistrationPage"));
export const ForgotPasswordPage = lazyWithRetry(() => import("../pages/ForgotPasswordPage"));
export const ResetPasswordPage = lazyWithRetry(() => import("../pages/ResetPasswordPage"));
export const EmailVerificationPage = lazyWithRetry(() => import("../pages/EmailVerificationPage"));
export const TermsPage = lazyWithRetry(() => import("../pages/TermsPage"));
export const PrivacyPolicyPage = lazyWithRetry(() => import("../pages/PrivacyPolicyPage"));

// Onboarding
export const OnboardingPage = lazyWithRetry(() => import("../pages/OnboardingPage"));
export const InvestorOnboardingPage = lazyWithRetry(() => import("../pages/InvestorOnboardingPage"));

// Discovery & profiles
export const StartupsPage = lazyWithRetry(() => import("../pages/StartupsPage"));
export const InvestorsPage = lazyWithRetry(() => import("../pages/InvestorsPage"));
export const StartupProfilePage = lazyWithRetry(() => import("../pages/StartupProfilePage"));
export const InvestorProfilePage = lazyWithRetry(() => import("../pages/InvestorProfilePage"));

// Workspace
export const ConnectionsPage = lazyWithRetry(() => import("../pages/ConnectionsPage"));
export const MessagesPage = lazyWithRetry(() => import("../pages/MessagesPage"));
export const DealPipelinePage = lazyWithRetry(() => import("../pages/DealPipelinePage"));
export const WatchlistPage = lazyWithRetry(() => import("../pages/WatchlistPage"));
export const StartupComparisonPage = lazyWithRetry(() => import("../pages/StartupComparisonPage"));

// Startup tools
export const StartupAnalyticsPage = lazyWithRetry(() => import("../pages/StartupAnalyticsPage"));
export const FundingRoundManagePage = lazyWithRetry(() => import("../pages/FundingRoundManagePage"));
export const DataRoomManagePage = lazyWithRetry(() => import("../pages/DataRoomManagePage"));
export const DataRoomViewerPage = lazyWithRetry(() => import("../pages/DataRoomViewerPage"));
export const PitchDeckViewerPage = lazyWithRetry(() => import("../pages/PitchDeckViewerPage"));

// Account & admin
export const MyProfilePage = lazyWithRetry(() => import("../pages/MyProfilePage"));
export const EditProfilePage = lazyWithRetry(() => import("../pages/EditProfilePage"));
export const SettingsPage = lazyWithRetry(() => import("../pages/SettingsPage"));
export const AdminAnalyticsPage = lazyWithRetry(() => import("../pages/AdminAnalyticsPage"));
export const AdminVerificationPage = lazyWithRetry(() => import("../pages/AdminVerificationPage"));
