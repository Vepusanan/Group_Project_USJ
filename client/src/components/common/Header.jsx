import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Rocket, Settings, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/apiService";
import { useProfileData } from "../../hooks/useProfileCache";
import {
  floatingNavIconClass,
  floatingNavLinkClass,
  floatingNavPillClass,
  floatingNavShellClass,
  iconButtonClass,
} from "../../styles/theme";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const isVerifyEmailPage = location.pathname === "/verify-email";
  const isLoginPage = location.pathname === "/login";
  const isOnboardingPage =
    location.pathname === "/onboarding" ||
    location.pathname === "/investor-onboarding";
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const dropdownRef = useRef(null);
  const { profile } = useProfileData();

  const isInvestor = user?.userType === "investor";
  const profileImageUrl = isInvestor ? profile?.photo_url : profile?.logo_url;
  const userInitial = (user?.firstName || user?.name || user?.email || "U")
    .charAt(0)
    .toUpperCase();
  const navItems = [
    { to: "/startups", label: "Startups" },
    { to: "/investors", label: "Investors" },
    ...(isInvestor
      ? [
          { to: "/pipeline", label: "Pipeline" },
          { to: "/watchlist", label: "Watchlist" },
        ]
      : [{ to: "/analytics", label: "Analytics" }]),
    { to: "/connections", label: "Connections" },
    { to: "/messages", label: "Messages" },
  ];

  const showAppNav =
    isAuthenticated && user && !isOnboardingPage && !isVerifyEmailPage;

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      localStorage.removeItem("userData");
    }
    setShowMobileNav(false);
    navigate("/login");
  };

  useEffect(() => {
    setShowMobileNav(false);
    setShowNotifications(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const result = await apiService.getNotifications();
        if (!isMounted || !result.success) return;
        setNotifications(result.data?.data || []);
      } catch {
        /* non-critical */
      }
    };
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!showNotifications) return;
    const onClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [showNotifications]);

  const handleNotificationClick = async (notification) => {
    const result = await apiService.markNotificationRead(notification.key);
    if (result.success) {
      setNotifications((prev) =>
        prev.filter((item) => item.key !== notification.key),
      );
    }

    if (notification.type === "data_room_access" && notification.data?.startupProfileId) {
      setShowNotifications(false);
      navigate(`/startups/${notification.data.startupProfileId}/data-room`);
      return;
    }

    if (
      notification.type === "meeting_request" ||
      notification.type === "meeting_confirmed" ||
      notification.type === "meeting_declined"
    ) {
      setShowNotifications(false);
      const connectionId = notification.data?.connectionId;
      if (connectionId) {
        navigate(`/connections?open=meetings&connectionId=${connectionId}`);
      } else {
        navigate("/connections");
      }
      return;
    }

    if (
      notification.type === "connection_request" ||
      notification.type === "dd_checklist_shared" ||
      notification.type === "dd_checklist_response" ||
      notification.type === "qa_question" ||
      notification.type === "qa_answer"
    ) {
      setShowNotifications(false);
      navigate("/connections");
    }
  };

  const notificationsDropdown = (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        aria-label="Open notifications"
        onClick={() => setShowNotifications((p) => !p)}
        className={`${floatingNavIconClass} relative`}
      >
        <Bell className="w-4 h-4" />
        {!showNotifications && notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-error text-on-primary text-[10px] font-semibold flex items-center justify-center">
            {notifications.length > 9 ? "9+" : notifications.length}
          </span>
        )}
      </button>
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] surface-card p-3 z-50 before:block">
          <p className="text-sm font-semibold text-on-surface mb-2">
            Notifications
          </p>
          {notifications.length === 0 ? (
            <p className="text-sm text-outline py-3">No new notifications.</p>
          ) : (
            <div className="space-y-2 max-h-80 overflow-auto">
              {notifications.map((notification) => (
                <button
                  key={notification.key}
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className="w-full text-left rounded-xl border border-outline-variant/40 bg-surface-container-low p-3 hover:bg-primary-fixed transition-colors"
                >
                  <p className="text-sm text-on-surface font-medium">
                    {notification.title}
                  </p>
                  <p className="text-xs text-outline mt-1">
                    {notification.message}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  if (showAppNav) {
    return (
      <header className={floatingNavShellClass}>
        <div className={`${floatingNavPillClass} px-3 py-2 md:px-4 md:py-2.5`}>
          <div className="flex items-center justify-between gap-2 md:gap-3">
            <Link
              to={isInvestor ? "/startups" : "/investors"}
              className="flex shrink-0 items-center"
              aria-label="StartHub Capital home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-on-primary shadow-soft">
                <Rocket className="h-4 w-4" />
              </span>
            </Link>

            <nav className="hidden xl:flex flex-1 items-center justify-center gap-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => floatingNavLinkClass(isActive)}
                >
                  {item.label}
                </NavLink>
              ))}
              <NavLink
                to="/settings"
                className={({ isActive }) => floatingNavLinkClass(isActive)}
              >
                Settings
              </NavLink>
            </nav>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                aria-label={showMobileNav ? "Close menu" : "Open menu"}
                aria-expanded={showMobileNav}
                onClick={() => setShowMobileNav((prev) => !prev)}
                className={`${floatingNavIconClass} xl:hidden`}
              >
                {showMobileNav ? (
                  <X className="w-4 h-4" />
                ) : (
                  <Menu className="w-4 h-4" />
                )}
              </button>

              <div className="hidden sm:block">{notificationsDropdown}</div>

              <Link
                to="/settings"
                aria-label="Open settings"
                className={`${floatingNavIconClass} hidden md:inline-flex xl:hidden ${
                  location.pathname === "/settings"
                    ? "!bg-primary !text-on-primary !border-primary"
                    : ""
                }`}
              >
                <Settings className="w-4 h-4" />
              </Link>

              <Link
                to="/profile"
                aria-label="Open profile"
                className="inline-flex items-center gap-2 rounded-full bg-primary pl-1 pr-3 py-1 text-on-primary shadow-soft hover:bg-primary-dark transition-colors shrink-0"
              >
                <span className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-primary-fixed">
                  {profileImageUrl ? (
                    <img
                      src={profileImageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-primary">
                      {userInitial}
                    </span>
                  )}
                </span>
                <span className="hidden md:inline text-sm font-semibold max-w-[120px] truncate">
                  {user?.firstName || user?.name || "Profile"}
                </span>
              </Link>

              <button
                onClick={handleLogout}
                aria-label="Log out"
                className={`${floatingNavIconClass} hidden lg:inline-flex`}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {showMobileNav && (
            <nav className="mt-3 border-t border-primary/15 pt-3 xl:hidden">
              <div className="grid grid-cols-2 gap-1 sm:grid-cols-3">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMobileNav(false)}
                    className={({ isActive }) =>
                      `rounded-xl px-3 py-2 text-center text-xs font-label uppercase tracking-wider transition-all ${
                        isActive
                          ? "bg-primary text-on-primary font-bold shadow-soft"
                          : "text-primary font-semibold hover:bg-primary-fixed"
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                ))}
                <NavLink
                  to="/settings"
                  onClick={() => setShowMobileNav(false)}
                  className={({ isActive }) =>
                    `rounded-xl px-3 py-2 text-center text-xs font-label uppercase tracking-wider transition-all ${
                      isActive
                        ? "bg-primary text-on-primary font-bold shadow-soft"
                        : "text-primary font-semibold hover:bg-primary-fixed"
                    }`
                  }
                >
                  Settings
                </NavLink>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
                {notificationsDropdown}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 rounded-xl border border-primary/20 bg-primary-fixed/40 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary-fixed transition-colors"
                >
                  Log out
                </button>
              </div>
            </nav>
          )}
        </div>
      </header>
    );
  }

  return (
    <header className="fixed top-0 z-50 w-full h-16 bg-surface/95 backdrop-blur-md border-b border-outline-variant/40 shadow-sm">
      <div className="relative mx-auto max-w-container flex h-full items-center justify-between px-5 md:px-gutter">
        <Link
          to="/"
          className="font-display text-headline-md font-bold text-primary tracking-tight shrink-0"
        >
          StartHub Capital
        </Link>

        {!isVerifyEmailPage && (
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && user ? (
              isOnboardingPage && (
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  className={iconButtonClass}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              )
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
                >
                  Sign up
                </Link>
                {!isLoginPage && (
                  <Link
                    to="/login"
                    className="btn-primary-token px-4 py-2 text-sm rounded-xl"
                  >
                    Login
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
