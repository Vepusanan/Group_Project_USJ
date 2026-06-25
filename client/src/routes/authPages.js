/**
 * Auth entry pages — eagerly imported (not lazy) so /login and /signup never
 * depend on a separate dev-server fetch for RegistrationPage.jsx etc.
 */
export { default as HomePage } from "../pages/HomePage";
export { default as LoginPage } from "../pages/LoginPage";
export { default as RegistrationPage } from "../pages/RegistrationPage";
export { default as ForgotPasswordPage } from "../pages/ForgotPasswordPage";
export { default as ResetPasswordPage } from "../pages/ResetPasswordPage";
export { default as EmailVerificationPage } from "../pages/EmailVerificationPage";
export { default as TermsPage } from "../pages/TermsPage";
export { default as PrivacyPolicyPage } from "../pages/PrivacyPolicyPage";
