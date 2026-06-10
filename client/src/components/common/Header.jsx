import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Menu, Settings, X } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/apiService";
import { useProfileData } from "../../hooks/useProfileCache";
import { iconButtonClass, navLinkClass } from "../../styles/theme";

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
    { to: "/connections", label: "My Connections" },
    { to: "/messages", label: "Messages" },
  ];

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

  return (
    <header className="sticky top-0 z-50 w-full bg-surface/95 backdrop-blur-md border-b border-line">
      <div className="relative w-full flex justify-between items-center px-4 py-3 sm:px-6 md:px-8 lg:px-12 xl:px-16">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center shadow-soft shrink-0">
            <img
              src="/images/home/rocketicon.png"
              alt="StartHub Capital Logo"
              className="w-5 h-6 object-contain brightness-0 invert"
            />
          </div>
          <span className="text-lg sm:text-xl font-bold text-content truncate">
            StartHub <span className="text-primary">Capital</span>
          </span>
        </Link>

        {!isVerifyEmailPage && (
          <div className="flex items-center gap-2 sm:gap-3">
            {isAuthenticated && user ? (
              isOnboardingPage ? (
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  className={iconButtonClass}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <>
                  <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2">
                    <nav className="flex items-center gap-1">
                      {navItems.map((item) => (
                        <NavLink
                          key={item.to}
                          to={item.to}
                          className={({ isActive }) => navLinkClass(isActive)}
                        >
                          {item.label}
                        </NavLink>
                      ))}
                    </nav>
                  </div>

                  <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                    <button
                      type="button"
                      aria-label={showMobileNav ? "Close menu" : "Open menu"}
                      aria-expanded={showMobileNav}
                      onClick={() => setShowMobileNav((prev) => !prev)}
                      className={`${iconButtonClass} lg:hidden`}
                    >
                      {showMobileNav ? (
                        <X className="w-5 h-5" />
                      ) : (
                        <Menu className="w-5 h-5" />
                      )}
                    </button>

                    <div className="relative" ref={dropdownRef}>
                      <button
                        type="button"
                        aria-label="Open notifications"
                        onClick={() => setShowNotifications((p) => !p)}
                        className={`${iconButtonClass} relative`}
                      >
                        <Bell className="w-5 h-5" />
                        {!showNotifications && notifications.length > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-error text-content-inverse text-[10px] font-semibold flex items-center justify-center">
                            {notifications.length > 9
                              ? "9+"
                              : notifications.length}
                          </span>
                        )}
                      </button>
                      {showNotifications && (
                        <div className="absolute right-0 mt-2 w-[min(20rem,calc(100vw-2rem))] surface-card p-3 z-50">
                          <p className="text-sm font-semibold text-content mb-2">
                            Notifications
                          </p>
                          {notifications.length === 0 ? (
                            <p className="text-sm text-content-muted py-3">
                              No new notifications.
                            </p>
                          ) : (
                            <div className="space-y-2 max-h-80 overflow-auto">
                              {notifications.map((notification) => (
                                <button
                                  key={notification.key}
                                  type="button"
                                  onClick={() =>
                                    handleNotificationClick(notification)
                                  }
                                  className="w-full text-left rounded-lg border border-line bg-surface-alt p-3 hover:bg-primary-light transition-colors"
                                >
                                  <p className="text-sm text-content font-medium">
                                    {notification.title}
                                  </p>
                                  <p className="text-xs text-content-muted mt-1">
                                    {notification.message}
                                  </p>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <Link
                      to="/settings"
                      aria-label="Open settings"
                      className={`${iconButtonClass} ${location.pathname === "/settings" ? "bg-primary-light text-primary border-primary-light" : ""}`}
                    >
                      <Settings className="w-5 h-5" />
                    </Link>

                    <Link
                      to="/profile"
                      aria-label="Open profile"
                      className={`w-10 h-10 rounded-full border overflow-hidden flex items-center justify-center transition-colors shrink-0 ${location.pathname.startsWith("/profile") ? "border-primary ring-2 ring-primary-light" : "border-line hover:border-primary"}`}
                    >
                      {profileImageUrl ? (
                        <img
                          src={profileImageUrl}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-primary-light flex items-center justify-center text-primary font-semibold text-sm">
                          {userInitial}
                        </div>
                      )}
                    </Link>

                    <button
                      onClick={handleLogout}
                      aria-label="Log out"
                      className={`${iconButtonClass} hidden sm:inline-flex`}
                    >
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )
            ) : (
              <>
                <Link
                  to="/signup"
                  className="px-3 sm:px-4 py-2 text-sm font-medium text-content-secondary hover:text-content transition-colors"
                >
                  Sign up
                </Link>
                {!isLoginPage && (
                  <Link to="/login" className="btn-primary-token px-3 sm:px-4 py-2 text-sm">
                    Login
                  </Link>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {isAuthenticated && user && !isOnboardingPage && !isVerifyEmailPage && showMobileNav && (
        <nav className="lg:hidden border-t border-line bg-surface px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-light text-primary"
                    : "text-content-secondary hover:text-content hover:bg-surface-alt"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="w-full text-left rounded-lg px-3 py-2.5 text-sm font-medium text-content-secondary hover:text-content hover:bg-surface-alt sm:hidden"
          >
            Log out
          </button>
        </nav>
      )}
    </header>
  );
};

export default Header;
