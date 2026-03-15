import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const isHomePage = location.pathname === "/";
  const isVerifyEmailPage = location.pathname === "/verify-email";
  const isLoginPage = location.pathname === "/login";

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
