import React from "react";
import { useAuth } from "../hooks/useAuth";
import Button from "../components/common/Button";
import { Link, useNavigate } from "react-router-dom";

const HomePage = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen bg-black overflow-hidden bg-[url('../../public/images/hero-background/hero-background.png')] bg-cover bg-center relative z-10">
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
                to="/dashboard"
                className="px-4 py-2 bg-blue-500/20 rounded-full text-sm font-medium border border-blue-400/40 hover:bg-blue-500/50 hover:border-blue-400/60 transition-all duration-300"
              >
                <span className="text-white hover:text-transparent hover:bg-gradient-to-r hover:from-blue-300 hover:to-purple-300 hover:bg-clip-text transition-all duration-300">
                  Dashboard
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
                <Link to="/dashboard">
                  <Button
                    variant="gradient-border"
                    size="lg"
                    className="w-[220px]"
                  >
                    Go to Dashboard
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
    </div>
  );
};

export default HomePage;
