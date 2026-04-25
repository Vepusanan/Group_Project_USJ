import React, { useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { Bell, LogOut, Settings } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/apiService";
import profileService from "../../services/profileService";
import investorProfileService from "../../services/investorProfileService";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const isHomePage = location.pathname === "/";
  const isVerifyEmailPage = location.pathname === "/verify-email";
  const isLoginPage = location.pathname === "/login";
  const isOnboardingPage =
    location.pathname === "/onboarding" ||
    location.pathname === "/investor-onboarding";
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const dropdownRef = useRef(null);

  const isInvestor = user?.userType === "investor";
  const userInitial = (user?.firstName || user?.name || user?.email || "U")
    .charAt(0)
    .toUpperCase();
  const navItems = [
    { to: "/startups", label: "Startups" },
    { to: "/investors", label: "Investors" },
    { to: "/connections", label: "My Connections" },
    { to: "/messages", label: "Messages" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userData");
    }
    navigate("/login");
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    const loadNotifications = async () => {
      try {
        const result = await apiService.getNotifications();
        if (!isMounted || !result.success) return;
        setNotifications(result.data?.data || []);
      } catch {
        // silent — notifications are non-critical
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
    if (!isAuthenticated || !user) return;
    let isMounted = true;
    const loadProfileImage = async () => {
      try {
        const result = isInvestor
          ? await investorProfileService.getMyProfile()
          : await profileService.getMyProfile();
        if (!isMounted || !result.success) return;
        const p = result.data?.data || result.data;
        const url = isInvestor ? p?.photo_url : p?.logo_url;
        if (url) setProfileImageUrl(url);
      } catch {
        // silent — avatar falls back to initials
      }
    };
    loadProfileImage();
    return () => { isMounted = false; };
  }, [isAuthenticated, user?.id, isInvestor]);

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

  const handleMarkNotificationRead = async (notificationKey) => {
    const result = await apiService.markNotificationRead(notificationKey);
    if (!result.success) return;
    setNotifications((prev) =>
      prev.filter((item) => item.key !== notificationKey),
    );
  };

  return (
    <div
      className={`relative w-full max-w-full flex justify-between items-center px-6 py-4 md:px-8 lg:px-12 xl:px-16 ${isHomePage ? "mb-0 bg-black/35" : "mb-1"}`}
    >
      {/* Logo Section */}
      <Link to="/" className="flex items-center space-x-2 group">
        <div className="w-8 h-8 flex items-center justify-center">
          <img
            src="/images/home/rocketicon.png"
            alt="StartHub Capital Logo"
            className="w-6 h-7 object-contain"
          />
        </div>
        <span className="text-xl font-bold">
          <span className="text-white group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all duration-300">
            StartHub
          </span>
          <span className="text-white ml-1 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text transition-all duration-300">
            Capital
          </span>
        </span>
      </Link>

      {!isVerifyEmailPage && (
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <>
              {isOnboardingPage ? (
                // During onboarding: only show logout so the flow cannot be skipped
                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="w-11 h-11 rounded-full border border-white/25 bg-black/20 text-white flex items-center justify-center hover:bg-red-500/25 hover:border-red-300/50 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              ) : (
                <>
              <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 items-center gap-2">
                <nav className="flex items-center gap-2">
                  {navItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        `px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-300 ${
                          isActive
                            ? "bg-purple-500/30 border-purple-400/60 text-white"
                            : "bg-white/5 border-white/15 text-gray-200 hover:bg-white/10"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  ))}
                </nav>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    aria-label="Open notifications"
                    onClick={() => setShowNotifications((prev) => !prev)}
                    className="w-11 h-11 rounded-full border border-white/25 bg-black/20 text-white flex items-center justify-center hover:bg-white/10 transition-all duration-300 relative"
                  >
                    <Bell className="w-5 h-5" />
                    {notifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
                        {notifications.length > 9 ? "9+" : notifications.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-[320px] rounded-xl border border-white/15 bg-[#161324] shadow-2xl p-3 z-50">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-white">
                          Notifications
                        </p>
                      </div>

                      {notifications.length === 0 ? (
                        <p className="text-sm text-gray-300 py-3">
                          No new notifications.
                        </p>
                      ) : (
                        <div className="space-y-2 max-h-80 overflow-auto pr-1">
                          {notifications.map((notification) => (
                            <button
                              key={notification.key}
                              type="button"
                              onClick={() =>
                                handleMarkNotificationRead(notification.key)
                              }
                              className="w-full text-left rounded-lg border border-white/10 bg-black/20 p-3 hover:bg-white/5"
                            >
                              <p className="text-sm text-white font-medium">
                                {notification.title}
                              </p>
                              <p className="text-xs text-gray-300 mt-1">
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
                  className={`w-11 h-11 rounded-full border flex items-center justify-center transition-all duration-300 ${
                    location.pathname === "/settings"
                      ? "bg-gradient-to-r from-purple-600/80 to-indigo-600/80 border-purple-300/60 text-white"
                      : "bg-purple-500/30 border-purple-300/40 text-white hover:bg-purple-500/50"
                  }`}
                >
                  <Settings className="w-5 h-5" />
                </Link>

                <Link
                  to="/profile"
                  aria-label="Open profile"
                  className={`w-11 h-11 rounded-full border overflow-hidden flex items-center justify-center transition-all duration-300 ${
                    location.pathname.startsWith("/profile")
                      ? "border-purple-300/70 ring-2 ring-purple-400/30"
                      : "border-white/30 hover:border-purple-300/60"
                  }`}
                >
                  {profileImageUrl
                    ? <img src={profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-gradient-to-r from-amber-300 to-purple-400 flex items-center justify-center text-black font-semibold text-sm">{userInitial}</div>
                  }
                </Link>

                <button
                  onClick={handleLogout}
                  aria-label="Log out"
                  className="w-11 h-11 rounded-full border border-white/25 bg-black/20 text-white flex items-center justify-center hover:bg-red-500/25 hover:border-red-300/50 transition-all duration-300"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
                </>
              )}
            </>
          ) : (
            <>
              <Link
                to="/signup"
                className="px-4 py-2 bg-purple-500/20 rounded-full text-sm font-medium border border-purple-400/40 hover:bg-purple-500/50 hover:border-purple-400/60 transition-all duration-300"
              >
                <span className="text-white hover:text-transparent hover:bg-gradient-to-r hover:from-purple-300 hover:to-blue-300 hover:bg-clip-text transition-all duration-300">
                  Signup
                </span>
              </Link>

              <span className="text-gray-600"> </span>
              {!isLoginPage && (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-purple-500/20 rounded-full text-sm font-medium border border-purple-400/30 hover:bg-purple-500/50 hover:border-purple-400/60 transition-all duration-300"
                >
                  <span className="text-white hover:text-transparent hover:bg-gradient-to-r hover:from-blue-300 hover:to-purple-300 hover:bg-clip-text transition-all duration-300">
                    Login
                  </span>
                </Link>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Header;
