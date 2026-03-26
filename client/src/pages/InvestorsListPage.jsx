import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  Link2,
  MessageSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import SearchBar from "../components/SearchBar";
import FilterSidebar from "../components/FilterSidebar";
import SortDropdown from "../components/SortDropdown";
import ViewToggle from "../components/ViewToggle";
import InvestorCard from "../components/InvestorCard";
import Pagination from "../components/Pagination";
import apiService from "../services/apiService";

const InvestorsListPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const [investors, setInvestors] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter & UI States
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch API whenever filters or page changes
  useEffect(() => {
    fetchInvestors();
  }, [search, filters, sort, page]);

  const fetchInvestors = async () => {
    setLoading(true);
    try {
      // Map `search` to `q` to match typical backend conventions, passing the rest as params
      const res = await apiService.getInvestors({
        q: search,
        ...filters,
        sort,
        page,
        limit: 12, // Number of items per page
      });

      if (res.success) {
        const data = res.data;
        // Handle different possible backend pagination responses
        if (Array.isArray(data)) {
          setInvestors(data);
          setTotalPages(1);
        } else {
          setInvestors(data.investors || data.data || []);
          setTotalPages(
            data.totalPages || Math.ceil((data.total || 0) / 12) || 1
          );
        }
      } else {
        console.error("Failed to fetch investors:", res.error);
        setInvestors([]);
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

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
    <div className="min-h-screen relative overflow-hidden bg-black text-white">
      {/* Background Lighting Effect matching reference */}
      <div className="absolute inset-0 pointer-events-none">
        <img
          src="/images/background/upLight.png"
          alt=""
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[140vw] max-w-none opacity-90"
        />
      </div>

      <div className="relative z-10">
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center px-6 py-4 md:px-10 lg:px-16">
          <Link to="/" className="flex items-center space-x-2 group">
            <img
              src="/images/home/rocketicon.png"
              alt="logo"
              className="w-6 h-6"
            />
            <span className="text-xl font-bold">
              <span className="text-white group-hover:text-purple-300 transition">
                StartHub
              </span>
              <span className="ml-1 text-white group-hover:text-blue-300 transition">
                Capital
              </span>
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-10 lg:gap-12 text-sm lg:text-base">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-gray-200 hover:text-purple-300 transition"
            >
              <LayoutGrid size={16} />
              <span>Startups</span>
            </Link>
            <Link
              to="/investors"
              className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition"
            >
              <Users size={16} />
              <span>Investors</span>
            </Link>
            <Link
              to="/connections" // Placeholder route
              className="flex items-center gap-2 text-gray-200 hover:text-purple-300 transition"
            >
              <Link2 size={16} />
              <span>My Connections</span>
            </Link>
            <Link
              to="/messages" // Placeholder route
              className="flex items-center gap-2 text-gray-200 hover:text-purple-300 transition"
            >
              <MessageSquare size={16} />
              <span>Messages</span>
            </Link>
          </div>

          {/* Profile & Settings UI */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-white/20 bg-black/30 flex items-center justify-center text-white/80 hover:text-white hover:border-purple-300/60 transition"
              aria-label="Settings"
            >
              <Settings size={14} />
            </button>

            {isAuthenticated && user && (
              <img
                src={user.profilePic || "/images/default-avatar.png"}
                alt="user"
                className="w-8 h-8 rounded-full border border-yellow-400/70"
              />
            )}

            <button
              type="button"
              onClick={handleLogout}
              className="w-8 h-8 rounded-full border border-white/20 bg-black/30 flex items-center justify-center text-white/80 hover:text-white hover:border-purple-300/60 transition"
              aria-label="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>

        {/* ================= CONTENT ================= */}
        <div className="px-6 md:px-10 lg:px-20 py-8">
          {/* Title Area */}
          <h1 className="text-4xl font-bold mb-2">Discover Investors</h1>
          <p className="text-gray-400 mb-8 max-w-2xl">
            Connect with investors who match your startup's vision
          </p>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* ========== SIDEBAR (Desktop) ========== */}
            <div className="hidden lg:block w-[280px] shrink-0">
              <FilterSidebar filters={filters} setFilters={setFilters} />
            </div>

            {/* ========== MAIN LIST SECTION ========== */}
            <div className="flex-1 min-w-0">
              {/* Top Controls Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <SearchBar setSearch={setSearch} />

                <div className="flex items-center gap-3">
                  <SortDropdown setSort={setSort} />
                  <ViewToggle view={view} setView={setView} />
                </div>
              </div>

              {/* Mobile Sidebar (Optional future implementation) */}
              <div className="lg:hidden mb-6">
                 {/* For mobile, you might have a modal or accordion for filters, skipped for now to match basic mockup */}
              </div>

              {/* ========== ITEMS ========== */}
              {loading ? (
                <div className="text-center py-20 text-gray-400">
                  <div className="w-10 h-10 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                  Loading investors...
                </div>
              ) : investors.length === 0 ? (
                <div className="text-center py-20 border border-gray-800 rounded-xl bg-gray-900/20">
                  <h3 className="text-xl font-semibold text-white mb-2">No investors found</h3>
                  <p className="text-gray-400">
                    Try adjusting your search or filters to find what you're looking for.
                  </p>
                </div>
              ) : (
                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
                      : "flex flex-col gap-4"
                  }
                >
                  {investors.map((investor, idx) => (
                    <InvestorCard
                      key={investor._id || investor.id || idx}
                      investor={investor}
                      view={view}
                    />
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && investors.length > 0 && (
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvestorsListPage;
