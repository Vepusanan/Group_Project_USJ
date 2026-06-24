import React, { useEffect, useMemo } from "react";
import {
  Settings2,
  FileText,
  Eye,
  Bell,
  Shield,
  BadgeCheck,
  Loader2,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiService } from "../services/apiService";
import { profileService } from "../services/profileService";
import engagementService from "../services/engagementService";
import pitchDeckService from "../services/pitchDeckService";
import { useAuth } from "../hooks/useAuth";
import { useSettingsPage } from "../hooks/useSettingsPage";
import { validation } from "../utils/validation";
import AccountSettingsTab from "../components/settings/AccountSettingsTab";
import PrivacySettingsTab from "../components/settings/PrivacySettingsTab";
import NotificationSettingsTab from "../components/settings/NotificationSettingsTab";
import SecuritySettingsTab from "../components/settings/SecuritySettingsTab";
import VerificationSettingsTab from "../components/settings/VerificationSettingsTab";
import ProfileDocumentsTab from "../components/settings/ProfileDocumentsTab";
import { pageContainerClass, pageContentClass } from "../styles/theme";

const BASE_NAV_ITEMS = [
  { key: "account", label: "Account Settings", icon: Settings2 },
  { key: "profile", label: "Profile Settings", icon: FileText, startupOnly: true },
  { key: "privacy", label: "Privacy Settings", icon: Eye },
  { key: "notifications", label: "Notification Settings", icon: Bell },
  { key: "security", label: "Password & Security", icon: Shield },
  { key: "verification", label: "Verification", icon: BadgeCheck },
];

const SettingsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const role = user?.userType || "startup";
  const isStartup = role === "startup";
  const navItems = useMemo(
    () => BASE_NAV_ITEMS.filter((item) => !item.startupOnly || isStartup),
    [isStartup],
  );

  const settings = useSettingsPage({ isStartup });

  const initialTab = searchParams.get("tab");
  useEffect(() => {
    if (navItems.some((item) => item.key === initialTab)) {
      settings.setActiveTab(initialTab);
    }
  }, [initialTab, navItems, settings.setActiveTab]);

  const savePrivacy = async () => {
    settings.clearFb("privacy");
    settings.setBusy("privacy");
    const result = await apiService.updatePrivacySettings(settings.privacy);
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("privacy", "error", result.error || "Failed to save");
      return;
    }
    settings.setFb("privacy", "success", "Privacy settings saved.");
  };

  const saveNotifications = async () => {
    settings.clearFb("notifications");
    settings.setBusy("notifications");
    const result = await apiService.updateNotificationSettings(settings.notifications);
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("notifications", "error", result.error || "Failed to save");
      return;
    }
    settings.setFb("notifications", "success", "Notification settings saved.");
  };

  const changeEmail = async (event) => {
    event.preventDefault();
    if (!settings.accountForm.newEmail.trim()) {
      settings.setFb("account", "error", "New email is required");
      return;
    }
    settings.clearFb("account");
    settings.setBusy("account.email");
    const result = await apiService.changeEmail(settings.accountForm.newEmail);
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("account", "error", result.error || "Failed to change email");
      return;
    }
    settings.setFb("account", "success", "Verification email sent to your new address.");
    settings.setAccountForm((prev) => ({ ...prev, newEmail: "" }));
  };

  const deleteAccount = async (event) => {
    event.preventDefault();
    if (!settings.accountForm.deletePassword) {
      settings.setFb("account", "error", "Password is required");
      return;
    }
    settings.clearFb("account");
    settings.setBusy("account.delete");
    const result = await apiService.deleteAccount(settings.accountForm.deletePassword);
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("account", "error", result.error || "Failed to delete account");
      return;
    }
    settings.setFb(
      "account",
      "success",
      "Account deletion scheduled. You have 30 days to cancel.",
    );
    settings.setAccountForm((prev) => ({ ...prev, deletePassword: "" }));
  };

  const changePassword = async (event) => {
    event.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = settings.securityForm;
    if (!currentPassword || !newPassword) {
      settings.setFb("security", "error", "All fields are required");
      return;
    }

    const passwordCheck = validation.password(newPassword);
    if (!passwordCheck.isValid) {
      settings.setFb("security", "error", passwordCheck.error);
      return;
    }

    if (newPassword !== confirmPassword) {
      settings.setFb("security", "error", "Passwords do not match");
      return;
    }

    settings.clearFb("security");
    settings.setBusy("security.pw");
    const result = await apiService.changePassword({ currentPassword, newPassword });
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("security", "error", result.error || "Failed to change password");
      return;
    }
    settings.setFb(
      "security",
      "success",
      "Password changed. All other sessions will be signed out.",
    );
    settings.setSecurityForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
  };

  const logoutAll = async () => {
    settings.clearFb("security");
    settings.setBusy("security.logoutAll");
    const result = await apiService.logoutAllDevices();
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("security", "error", result.error || "Failed");
      return;
    }
    await logout();
    navigate("/login");
  };

  const revokeSession = async (sessionId) => {
    settings.clearFb("security");
    settings.setBusy(`security.revoke.${sessionId}`);
    const result = await apiService.revokeSession(sessionId);
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("security", "error", result.error || "Failed to revoke session");
      return;
    }
    settings.setFb("security", "success", "Session revoked.");
    await settings.loadSessions();
  };

  const downloadData = async () => {
    settings.clearFb("security");
    settings.setBusy("security.export");
    const result = await apiService.exportAccountData();
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("security", "error", result.error || "Failed to export data");
      return;
    }
    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `account-export-${user?.id || "data"}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    settings.setFb("security", "success", "Your data export has been downloaded.");
  };

  const submitIdentity = async (event) => {
    event.preventDefault();
    settings.setBusy("verification.identity");
    settings.clearFb("verification");
    const result = await engagementService.submitIdentityVerification(
      settings.identityLinkedinUrl,
    );
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("verification", "error", result.error);
      return;
    }
    settings.setFb(
      "verification",
      "success",
      result.message || "Identity Verified badge awarded",
    );
    await settings.loadVerification();
  };

  const submitBusiness = async (event) => {
    event.preventDefault();
    if (!settings.businessDoc) {
      settings.setFb("verification", "error", "Upload supporting documentation");
      return;
    }
    settings.setBusy("verification.business");
    settings.clearFb("verification");
    const result = await engagementService.submitBusinessVerification(
      settings.businessLinkedinUrl,
      settings.businessDoc,
    );
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("verification", "error", result.error);
      return;
    }
    settings.setFb("verification", "success", result.message || "Submitted for review");
    settings.setBusinessDoc(null);
    await settings.loadVerification();
  };

  const saveDocuments = async () => {
    settings.clearFb("profile");
    if (!settings.startupProfileId) {
      settings.setFb("profile", "error", "Startup profile not found.");
      return;
    }
    if (!settings.pitchDeckFile && !settings.founderVideoFile) {
      settings.setFb("profile", "error", "Select a pitch deck PDF or founder video to upload.");
      return;
    }

    settings.setBusy("profile");
    const formData = new FormData();
    if (settings.pitchDeckFile) formData.append("pitch_deck", settings.pitchDeckFile);
    if (settings.founderVideoFile) formData.append("founder_video", settings.founderVideoFile);

    const result = await profileService.updateProfile(settings.startupProfileId, formData);
    settings.setBusy("");
    if (!result.success) {
      settings.setFb("profile", "error", result.error || "Failed to upload documents");
      return;
    }

    settings.setPitchDeckFile(null);
    settings.setFounderVideoFile(null);
    await settings.reloadStartupDocs();
    settings.setFb(
      "profile",
      "success",
      "Documents uploaded. Your interactive pitch deck viewer is active on your profile.",
    );
  };

  const handleAnalyzePitchDeck = async () => {
    if (!settings.startupProfileId) return;
    settings.setPitchDeckAnalysisLoading(true);
    settings.setPitchDeckAnalysisError("");
    const result = await pitchDeckService.analyzeDeck(settings.startupProfileId);
    settings.setPitchDeckAnalysisLoading(false);
    if (!result.success) {
      settings.setPitchDeckAnalysisError(result.error || "Analysis failed");
      return;
    }
    settings.setPitchDeckAnalysis(result.data);
  };

  const renderActiveTab = () => {
    switch (settings.activeTab) {
      case "account":
        return (
          <AccountSettingsTab
            user={user}
            role={role}
            feedback={settings.feedback.account}
            accountForm={settings.accountForm}
            setAccountForm={settings.setAccountForm}
            busy={settings.busy}
            onChangeEmail={changeEmail}
            onDeleteAccount={deleteAccount}
          />
        );
      case "profile":
        return (
          <ProfileDocumentsTab
            feedback={settings.feedback.profile}
            busy={settings.busy}
            pitchDeckFile={settings.pitchDeckFile}
            setPitchDeckFile={settings.setPitchDeckFile}
            currentPitchDeckUrl={settings.currentPitchDeckUrl}
            founderVideoFile={settings.founderVideoFile}
            setFounderVideoFile={settings.setFounderVideoFile}
            currentFounderVideoUrl={settings.currentFounderVideoUrl}
            pitchDeckAnalysis={settings.pitchDeckAnalysis}
            pitchDeckAnalysisLoading={settings.pitchDeckAnalysisLoading}
            pitchDeckAnalysisError={settings.pitchDeckAnalysisError}
            onSaveDocuments={saveDocuments}
            onAnalyzePitchDeck={handleAnalyzePitchDeck}
          />
        );
      case "privacy":
        return (
          <PrivacySettingsTab
            privacy={settings.privacy}
            setPrivacy={settings.setPrivacy}
            feedback={settings.feedback.privacy}
            busy={settings.busy}
            onSave={savePrivacy}
          />
        );
      case "notifications":
        return (
          <NotificationSettingsTab
            notifications={settings.notifications}
            setNotifications={settings.setNotifications}
            feedback={settings.feedback.notifications}
            busy={settings.busy}
            onSave={saveNotifications}
          />
        );
      case "security":
        return (
          <SecuritySettingsTab
            feedback={settings.feedback.security}
            securityForm={settings.securityForm}
            setSecurityForm={settings.setSecurityForm}
            busy={settings.busy}
            sessions={settings.sessions}
            sessionsLoading={settings.sessionsLoading}
            onChangePassword={changePassword}
            onLogoutAll={logoutAll}
            onRevokeSession={revokeSession}
            onDownloadData={downloadData}
          />
        );
      case "verification":
        return (
          <VerificationSettingsTab
            user={user}
            verification={settings.verification}
            feedback={settings.feedback.verification}
            busy={settings.busy}
            identityLinkedinUrl={settings.identityLinkedinUrl}
            setIdentityLinkedinUrl={settings.setIdentityLinkedinUrl}
            businessLinkedinUrl={settings.businessLinkedinUrl}
            setBusinessLinkedinUrl={settings.setBusinessLinkedinUrl}
            businessDoc={settings.businessDoc}
            setBusinessDoc={settings.setBusinessDoc}
            onSubmitIdentity={submitIdentity}
            onSubmitBusiness={submitBusiness}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className={pageContainerClass}>
      <div className={pageContentClass}>
        <div className="mb-8">
          <span className="font-label text-label-caps uppercase tracking-widest text-primary mb-2 block">
            Account
          </span>
          <h1 className="font-display text-headline-lg text-on-surface">Settings</h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          <nav className="lg:w-60 flex-shrink-0">
            <ul className="space-y-1 rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-2">
              {navItems.map(({ key, label, icon: Icon }) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => {
                      settings.setActiveTab(key);
                      settings.clearFb(key);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors ${
                      settings.activeTab === key
                        ? "bg-primary-fixed text-primary font-semibold"
                        : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface"
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>

          <main className="flex-1 min-w-0 surface-card p-6 md:p-8">
            {settings.tabLoading ? (
              <div className="flex items-center gap-2 text-content-muted text-sm py-8">
                <Loader2 className="w-5 h-5 animate-spin" />
                Loading…
              </div>
            ) : (
              renderActiveTab()
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
