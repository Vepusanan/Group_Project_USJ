import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { apiService } from "../../services/apiService";
import { useProfileData } from "../../hooks/useProfileCache";

const updateSlider = (container, activeEl, setSliderStyle) => {
  if (!container || !activeEl) return;
  const containerRect = container.getBoundingClientRect();
  const activeRect = activeEl.getBoundingClientRect();
  setSliderStyle({
    left: activeRect.left - containerRect.left,
    width: activeRect.width,
    opacity: 1,
  });
};

const FloatingNavBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout, isLoading } = useAuth();
  const { profile } = useProfileData();
  const containerRef = useRef(null);
  const itemRefs = useRef({});
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0, opacity: 0 });
  const [unreadMessages, setUnreadMessages] = useState(0);

  const isInvestor = user?.userType === "investor";
  const profileImageUrl = isInvestor ? profile?.photo_url : profile?.logo_url;
  const isLoggedIn = !isLoading && isAuthenticated && user;

  const publicItems = useMemo(
    () => [
      {
        key: "home",
        label: "Home",
        isActive: (path, hash) => path === "/" && hash !== "#about",
        onClick: () => {
          if (location.pathname === "/") {
            navigate({ pathname: "/", hash: "" }, { replace: true });
            window.scrollTo({ top: 0, behavior: "smooth" });
          } else {
            navigate("/");
          }
        },
      },
      {
        key: "about",
        label: "About",
        isActive: (path, hash) => path === "/" && hash === "#about",
        onClick: () => {
          if (location.pathname === "/") {
            navigate({ pathname: "/", hash: "about" }, { replace: true });
            document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
          } else {
            navigate("/#about");
          }
        },
      },
      {
        key: "terms",
        to: "/terms",
        label: "Terms",
        isActive: (path) => path === "/terms",
      },
      {
        key: "privacy",
        to: "/privacy",
        label: "Privacy",
        isActive: (path) => path === "/privacy",
      },
    ],
    [location.pathname, navigate],
  );

  const authItems = useMemo(
    () => [
      {
        key: "startups",
        to: "/startups",
        label: "Startups",
        isActive: (path) => path.startsWith("/startups"),
      },
      {
        key: "investors",
        to: "/investors",
        label: "Investors",
        isActive: (path) => path.startsWith("/investors"),
      },
      ...(isInvestor
        ? [
            {
              key: "pipeline",
              to: "/pipeline",
              label: "Pipeline",
              isActive: (path) => path.startsWith("/pipeline"),
            },
          ]
        : [
            {
              key: "analytics",
              to: "/analytics",
              label: "Analytics",
              isActive: (path) => path.startsWith("/analytics"),
            },
          ]),
      {
        key: "connections",
        to: "/connections",
        label: "Connections",
        isActive: (path) => path.startsWith("/connections"),
      },
      {
        key: "messages",
        to: "/messages",
        label: "Messages",
        badge: unreadMessages,
        isActive: (path) => path.startsWith("/messages"),
      },
    ],
    [isInvestor, unreadMessages],
  );

  const items = isLoggedIn ? authItems : publicItems;

  const activeIndex = items.findIndex((item) =>
    item.isActive(location.pathname, location.hash),
  );

  const repositionSlider = useCallback(() => {
    const activeItem = items[activeIndex >= 0 ? activeIndex : 0];
    if (!activeItem) return;
    updateSlider(
      containerRef.current,
      itemRefs.current[activeItem.key],
      setSliderStyle,
    );
  }, [activeIndex, items]);

  useEffect(() => {
    repositionSlider();
    window.addEventListener("resize", repositionSlider);
    return () => window.removeEventListener("resize", repositionSlider);
  }, [repositionSlider, location.pathname, location.hash]);

  useEffect(() => {
    if (location.pathname === "/" && location.hash === "#about") {
      document.getElementById("about")?.scrollIntoView({ behavior: "smooth" });
    }
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isLoggedIn) return undefined;
    let mounted = true;
    const loadUnread = async () => {
      try {
        const result = await apiService.getConversations();
        if (!mounted || !result.success) return;
        const total = (result.data?.data || []).reduce(
          (sum, c) => sum + Number(c.unread_count || 0),
          0,
        );
        setUnreadMessages(total);
      } catch {
        /* non-critical */
      }
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isLoggedIn]);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      localStorage.removeItem("userData");
    }
    navigate("/login");
  };

  const linkClass = (active) =>
    `relative z-10 inline-flex shrink-0 items-center whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors !outline-none focus:!outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:ring-offset-1 sm:px-4 ${
      active
        ? "text-midnight-navy"
        : "text-slate-600 hover:text-midnight-navy"
    }`;

  return (
    <header className="pointer-events-none fixed top-4 inset-x-0 z-[200] px-5 md:px-gutter">
      <div className="pointer-events-auto mx-auto flex max-w-container items-center justify-center gap-2 sm:gap-3">
        <nav
          ref={containerRef}
          className="relative inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-full bg-white px-1.5 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-1 sm:px-2"
          aria-label="Main navigation"
        >
          <span
            className="pointer-events-none absolute top-1/2 h-[calc(100%-6px)] -translate-y-1/2 rounded-full bg-blue-500/25 transition-all duration-300 ease-out"
            style={{
              left: sliderStyle.left,
              width: sliderStyle.width,
              opacity: sliderStyle.opacity,
            }}
          />

          {items.map((item) => {
            const active = item.isActive(location.pathname, location.hash);

            if (item.onClick) {
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={item.onClick}
                  ref={(el) => {
                    itemRefs.current[item.key] = el;
                  }}
                  className={linkClass(active)}
                >
                  {item.label}
                </button>
              );
            }

            return (
              <Link
                key={item.key}
                to={item.to}
                ref={(el) => {
                  itemRefs.current[item.key] = el;
                }}
                className={linkClass(active)}
              >
                {item.label}
                {item.badge > 0 && (
                  <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {!isLoggedIn && (
            <>
              <span className="mx-1 hidden h-6 w-px shrink-0 bg-slate-200 sm:block" />
              <Link
                to="/login"
                className={`relative z-10 shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-semibold transition-colors outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/25 focus-visible:ring-offset-1 sm:px-4 ${
                  location.pathname === "/login"
                    ? "text-blue-600"
                    : "text-slate-600 hover:text-midnight-navy"
                }`}
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                className="relative z-10 shrink-0 whitespace-nowrap rounded-full bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm sm:px-4"
              >
                Sign Up
              </Link>
            </>
          )}
        </nav>

        {isLoggedIn && (
          <div className="flex shrink-0 items-center gap-1.5">
            <Link
              to="/profile"
              aria-label="Profile"
              className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-colors hover:border-slate-300"
            >
              {profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-4 w-4 text-slate-600" />
              )}
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="hidden h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-[0_4px_16px_rgba(0,0,0,0.08)] transition-colors hover:text-midnight-navy sm:flex"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default FloatingNavBar;
