import React from "react";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/common/Button";
import { Link, useNavigate } from "react-router-dom";

const HomePage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const roleLandingPath =
    user?.userType === "investor" ? "/startups" : "/investors";

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      localStorage.removeItem("userData");
    }
    navigate("/login");
  };

  return (
    <div className="relative">
      {/* ── HERO SECTION — full viewport height ── */}
      <div className="h-screen bg-black bg-[url('/images/hero-background/hero-background.png')] bg-cover bg-center relative z-10 flex flex-col overflow-hidden">
        {/* Header Section */}
        <div className="relative w-full max-w-full flex justify-between items-center px-6 py-4 md:px-8 lg:px-12 xl:px-16 mb-4">
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

        {/* Conditional buttons based on authentication */}
        <div className="flex items-center space-x-3">
          {isAuthenticated && user ? (
            <>
              <Link
                to={roleLandingPath}
                className="px-4 py-2 bg-blue-500/20 rounded-full text-sm font-medium border border-blue-400/40 hover:bg-blue-500/50 hover:border-blue-400/60 transition-all duration-300"
              >
                <span className="text-white hover:text-transparent hover:bg-gradient-to-r hover:from-blue-300 hover:to-purple-300 hover:bg-clip-text transition-all duration-300">
                  Explore
                </span>
              </Link>

              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 rounded-full text-sm font-medium border border-red-400/40 hover:bg-red-500/50 hover:border-red-400/60 transition-all duration-300"
              >
                <span className="text-white hover:text-transparent hover:bg-gradient-to-r hover:from-red-300 hover:to-pink-300 hover:bg-clip-text transition-all duration-300">
                  Logout
                </span>
              </button>
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

              <Link
                to="/login"
                className="px-4 py-2 bg-purple-500/20 rounded-full text-sm font-medium border border-purple-400/30 hover:bg-purple-500/50 hover:border-purple-400/60 transition-all duration-300"
              >
                <span className="text-white hover:text-transparent hover:bg-gradient-to-r hover:from-blue-300 hover:to-purple-300 hover:bg-clip-text transition-all duration-300">
                  Login
                </span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 container mx-auto px-6 md:px-10 lg:px-20 py-8">
        <div className="h-4 md:h-8 lg:h-12"></div>

        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row items-center justify-between min-h-[70vh]">
          <div className="lg:w-1/2 lg:pr-12 text-center lg:text-left">
            <h1 className="text-5xl md:text-6xl lg:text-[50px] font-bold leading-[100%] tracking-[-4%] mb-8">
              <span className="block text-white mb-4">Connect Startups</span>
              <span
                className="block"
                style={{
                  background:
                    "linear-gradient(90.27deg, #FFFFFF 1.63%, rgba(255, 255, 255, 0.7) 103.32%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                with the Right Investors
              </span>
            </h1>

            <div
              className="text-[40px] font-normal leading-[100%] tracking-[-4%] mb-10"
              style={{
                fontFamily: "'LIBRARY 3 AM', sans-serif",
                background:
                  "linear-gradient(90.27deg, #FFFFFF 1.63%, rgba(255, 255, 255, 0) 103.32%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              STARTHUB CAPITAL
            </div>

            <p
              className="text-gray-300 text-lg leading-relaxed mb-10 max-w-[468px] mx-auto lg:mx-0"
              style={{ textShadow: "0px 4px 4px rgba(0, 0, 0, 0.25)" }}
            >
              A smart matching platform that helps founders showcase their
              ideas, connect with verified investors, and secure funding faster,
              while giving investors a seamless way to discover high-potential
              startups that fit their goals.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              {isAuthenticated && user ? (
                <Link to={roleLandingPath}>
                  <Button
                    variant="gradient-border"
                    size="lg"
                    className="w-[220px]"
                  >
                    Explore Matches
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/signup">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center font-medium transition-all duration-300 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed relative bg-transparent text-white overflow-hidden group px-6 py-3 text-lg h-14 rounded-lg uppercase font-bold tracking-wider w-[150px] mr-4"
                    >
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-[2px] group-hover:blur-[3px] transition-all rounded-lg"></span>
                      <span className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-100 group-hover:opacity-90 transition-opacity shadow-lg shadow-blue-500/20 rounded-lg"></span>
                      <span className="absolute inset-[2px] bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-colors group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-pink-500 rounded-lg"></span>
                      <span className="relative z-10">SIGNUP</span>
                    </button>
                  </Link>

                  <Link to="/login">
                    <Button
                      variant="gradient-border"
                      size="lg"
                      className="w-[150px] flex items-center justify-center gap-2"
                    >
                      LOGIN
                      <span className="text-lg font-bold">{"->"}</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="lg:w-1/2 lg:pl-12 mt-12 lg:mt-0 flex justify-center">
            <div className="relative w-full max-w-md">
              <div className="relative animate-float">
                <img
                  src="/images/home/homepagerocket.png"
                  alt="Rocket Launching"
                  className="w-full h-auto max-w-md mx-auto"
                />

                <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 w-32 h-32">
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-500/70 via-cyan-400/60 to-transparent rounded-full blur-xl opacity-70 animate-pulse"></div>
                  <div
                    className="absolute inset-2 bg-gradient-to-t from-cyan-300/80 to-transparent rounded-full blur-md opacity-80 animate-pulse"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="absolute inset-4 bg-gradient-to-t from-white to-transparent rounded-full blur-sm opacity-90 animate-pulse"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>{/* end hero */}

      {/* ── HOW IT WORKS ─────────────────────────────────────────────────── */}
      <div className="relative bg-[#080808] border-t border-white/5">
        <div className="container mx-auto px-6 md:px-10 lg:px-20 py-24">

          {/* Section header */}
          <div className="text-center mb-16">
            <span className="inline-block px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold tracking-widest uppercase mb-4">
              How it works
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              From Profile to Partnership
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base leading-relaxed">
              Three simple steps to connect founders with the right investors and turn ideas into funded ventures.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 relative">
            {/* Connector line (desktop) */}
            <div className="hidden md:block absolute top-10 left-[calc(16.67%+1rem)] right-[calc(16.67%+1rem)] h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />

            {[
              {
                number: "01",
                title: "Create Your Profile",
                description: "Startups showcase their vision, team, traction, and funding needs. Investors highlight their thesis, check size, and portfolio focus.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                ),
                accent: "from-purple-600 to-indigo-600",
                border: "border-purple-500/20",
                glow: "bg-purple-500/5",
              },
              {
                number: "02",
                title: "Discover & Connect",
                description: "Browse curated profiles filtered by industry, stage, and location. Send connection requests to the partners that match your goals.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M8.25 10.875a2.625 2.625 0 115.25 0 2.625 2.625 0 01-5.25 0z" />
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.125 4.5a4.125 4.125 0 102.338 7.524l2.007 2.006a.75.75 0 101.06-1.06l-2.006-2.007a4.125 4.125 0 00-3.399-6.463z" clipRule="evenodd" />
                  </svg>
                ),
                accent: "from-blue-600 to-cyan-600",
                border: "border-blue-500/20",
                glow: "bg-blue-500/5",
              },
              {
                number: "03",
                title: "Collaborate & Grow",
                description: "Once connected, message directly, share pitch decks, and build the relationships that turn promising startups into success stories.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
                  </svg>
                ),
                accent: "from-emerald-600 to-teal-600",
                border: "border-emerald-500/20",
                glow: "bg-emerald-500/5",
              },
            ].map((step) => (
              <div
                key={step.number}
                className={`relative rounded-2xl border ${step.border} ${step.glow} p-8 flex flex-col items-center text-center backdrop-blur-sm`}
              >
                {/* Step number */}
                <div className="text-[11px] font-bold tracking-widest text-gray-600 mb-4">{step.number}</div>

                {/* Icon circle */}
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${step.accent} flex items-center justify-center text-white mb-5 shadow-lg`}>
                  {step.icon}
                </div>

                <h3 className="text-white font-bold text-lg mb-3">{step.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          {!isAuthenticated && (
            <div className="text-center mt-16">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-purple-900/40"
              >
                Get Started Free
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
