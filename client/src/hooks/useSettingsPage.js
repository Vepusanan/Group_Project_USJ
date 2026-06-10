import { useCallback, useEffect, useState } from "react";
import { apiService } from "../services/apiService";
import { profileService } from "../services/profileService";
import engagementService from "../services/engagementService";

const DEFAULT_PRIVACY = {
  profile_visibility: "public",
  connection_request_setting: true,
  show_connections_list: true,
  show_activity_status: true,
};

const DEFAULT_NOTIFICATIONS = {
  email_connection_requests: true,
  email_messages: true,
  email_profile_views: false,
  email_weekly_digest: true,
  notification_frequency: "instant",
  inapp_connection_requests: true,
  inapp_messages: true,
  inapp_profile_views: true,
  inapp_system_updates: true,
};

export function useSettingsPage({ isStartup }) {
  const [activeTab, setActiveTab] = useState("account");
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState({});

  const [privacy, setPrivacy] = useState(DEFAULT_PRIVACY);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATIONS);
  const [privacyLoaded, setPrivacyLoaded] = useState(false);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);

  const [verification, setVerification] = useState(null);
  const [verificationLoaded, setVerificationLoaded] = useState(false);
  const [identityLinkedinUrl, setIdentityLinkedinUrl] = useState("");
  const [businessLinkedinUrl, setBusinessLinkedinUrl] = useState("");
  const [businessDoc, setBusinessDoc] = useState(null);

  const [startupProfileId, setStartupProfileId] = useState(null);
  const [profileDocsLoaded, setProfileDocsLoaded] = useState(false);
  const [pitchDeckFile, setPitchDeckFile] = useState(null);
  const [currentPitchDeckUrl, setCurrentPitchDeckUrl] = useState(null);
  const [founderVideoFile, setFounderVideoFile] = useState(null);
  const [currentFounderVideoUrl, setCurrentFounderVideoUrl] = useState(null);
  const [pitchDeckAnalysis, setPitchDeckAnalysis] = useState(null);
  const [pitchDeckAnalysisLoading, setPitchDeckAnalysisLoading] = useState(false);
  const [pitchDeckAnalysisError, setPitchDeckAnalysisError] = useState("");

  const [accountForm, setAccountForm] = useState({
    newEmail: "",
    deletePassword: "",
  });
  const [securityForm, setSecurityForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsLoaded, setSessionsLoaded] = useState(false);

  const [tabLoading, setTabLoading] = useState(false);

  const setFb = useCallback(
    (tab, type, message) =>
      setFeedback((prev) => ({ ...prev, [tab]: { type, message } })),
    [],
  );
  const clearFb = useCallback(
    (tab) => setFeedback((prev) => ({ ...prev, [tab]: null })),
    [],
  );

  const loadPrivacy = useCallback(async () => {
    const res = await apiService.getPrivacySettings();
    if (res.success) {
      setPrivacy((prev) => ({ ...prev, ...(res.data?.data || {}) }));
      setPrivacyLoaded(true);
    } else {
      setFb("privacy", "error", res.error || "Failed to load privacy settings");
    }
  }, [setFb]);

  const loadNotifications = useCallback(async () => {
    const res = await apiService.getNotificationSettings();
    if (res.success) {
      setNotifications((prev) => ({ ...prev, ...(res.data?.data || {}) }));
      setNotificationsLoaded(true);
    } else {
      setFb(
        "notifications",
        "error",
        res.error || "Failed to load notification settings",
      );
    }
  }, [setFb]);

  const loadVerification = useCallback(async () => {
    const res = await engagementService.getVerificationStatus();
    if (res.success) {
      setVerification(res.data);
      const linkedin = res.data?.linkedin_profile_url || "";
      setIdentityLinkedinUrl(linkedin);
      setBusinessLinkedinUrl(linkedin);
      setVerificationLoaded(true);
    }
  }, []);

  const loadStartupDocs = useCallback(async () => {
    const res = await profileService.getMyProfile();
    if (res.success) {
      const profile = res.data?.data || res.data;
      setStartupProfileId(profile?.startup_profile_id || profile?.id || null);
      setCurrentPitchDeckUrl(profile?.pitch_deck_url || null);
      setCurrentFounderVideoUrl(profile?.founder_video_url || null);
      setProfileDocsLoaded(true);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await apiService.getSessions();
      if (res.success) {
        setSessions(res.data?.sessions || res.data || []);
        setSessionsLoaded(true);
      } else {
        setFb("security", "error", res.error || "Failed to load sessions");
      }
    } catch {
      setFb("security", "error", "Network error — sessions could not be loaded.");
    } finally {
      setSessionsLoading(false);
    }
  }, [setFb]);

  const reloadStartupDocs = useCallback(async () => {
    if (!isStartup) return;
    await loadStartupDocs();
  }, [isStartup, loadStartupDocs]);

  useEffect(() => {
    let cancelled = false;

    const loadTabData = async () => {
      setTabLoading(true);
      try {
        if (activeTab === "privacy" && !privacyLoaded) {
          await loadPrivacy();
        }
        if (activeTab === "notifications" && !notificationsLoaded) {
          await loadNotifications();
        }
        if (activeTab === "verification" && !verificationLoaded) {
          await loadVerification();
        }
        if (activeTab === "profile" && isStartup && !profileDocsLoaded) {
          await loadStartupDocs();
        }
        if (activeTab === "security" && !sessionsLoaded) {
          await loadSessions();
        }
      } catch {
        if (!cancelled) {
          setFb(activeTab, "error", "Network error — please refresh and try again.");
        }
      } finally {
        if (!cancelled) setTabLoading(false);
      }
    };

    loadTabData();
    return () => {
      cancelled = true;
    };
  }, [
    activeTab,
    isStartup,
    privacyLoaded,
    notificationsLoaded,
    verificationLoaded,
    profileDocsLoaded,
    sessionsLoaded,
    loadPrivacy,
    loadNotifications,
    loadVerification,
    loadStartupDocs,
    loadSessions,
    setFb,
  ]);

  return {
    activeTab,
    setActiveTab,
    busy,
    setBusy,
    feedback,
    setFb,
    clearFb,
    tabLoading,
    privacy,
    setPrivacy,
    notifications,
    setNotifications,
    verification,
    identityLinkedinUrl,
    setIdentityLinkedinUrl,
    businessLinkedinUrl,
    setBusinessLinkedinUrl,
    businessDoc,
    setBusinessDoc,
    loadVerification,
    startupProfileId,
    pitchDeckFile,
    setPitchDeckFile,
    currentPitchDeckUrl,
    founderVideoFile,
    setFounderVideoFile,
    currentFounderVideoUrl,
    pitchDeckAnalysis,
    setPitchDeckAnalysis,
    pitchDeckAnalysisLoading,
    setPitchDeckAnalysisLoading,
    pitchDeckAnalysisError,
    setPitchDeckAnalysisError,
    reloadStartupDocs,
    accountForm,
    setAccountForm,
    securityForm,
    setSecurityForm,
    sessions,
    sessionsLoading,
    loadSessions,
  };
}
