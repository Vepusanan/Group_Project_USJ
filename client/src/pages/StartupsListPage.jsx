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
import StartupCard from "../components/StartupCard";
import Pagination from "../components/Pagination";
import api from "../services/apiService";

const StartupsListPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();

  const [startups, setStartups] = useState([]);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState("grid");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch API
  useEffect(() => {
    fetchStartups();
  }, [search, filters, sort, page]);

  const fetchStartups = async () => {
    setLoading(true);
    try {
      // Map `search` to `q` as required by the backend API
      const res = await api.getStartups({
        q: search,
        ...filters,
        sort,
        page,
        limit: 12,
      });

      if (res.success) {
        const data = res.data;
        // Handle both array response and paginated object response formats
        if (Array.isArray(data)) {
          setStartups(data);
          setTotalPages(1);
        } else {
          setStartups(data.startups || data.data || []);
          setTotalPages(
            data.totalPages || Math.ceil((data.total || 0) / 12) || 1,
          );
        }
      } else {
        console.error(res.error);
        setStartups([]);
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

          <div className="hidden md:flex items-center gap-10 lg:gap-12 text-sm lg:text-base">
            <Link
              to="/startups"
              className="flex items-center gap-2 text-purple-300 hover:text-purple-200 transition"
            >
              <LayoutGrid size={16} />
              <span>Startups</span>
            </Link>
            <Link
              to="/investors"
              className="flex items-center gap-2 text-gray-200 hover:text-purple-300 transition"
            >
              <Users size={16} />
              <span>Investors</span>
            </Link>
            <Link
              to="/connections"
              className="flex items-center gap-2 text-gray-200 hover:text-purple-300 transition"
            >
              <Link2 size={16} />
              <span>My Connections</span>
            </Link>
            <Link
              to="/messages"
              className="flex items-center gap-2 text-gray-200 hover:text-purple-300 transition"
            >
              <MessageSquare size={16} />
              <span>Messages</span>
            </Link>
          </div>

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
          {/* Title */}
          <h1 className="text-4xl font-bold mb-2">Discover Startups</h1>
          <p className="text-gray-400 mb-8">
            Browse and connect with innovative startups seeking funding
          </p>

          <div className="flex gap-6">
            {/* ========== SIDEBAR ========== */}
            <div className="hidden md:block w-[260px]">
              <FilterSidebar filters={filters} setFilters={setFilters} />
            </div>

            {/* ========== MAIN SECTION ========== */}
            <div className="flex-1">
              {/* Top Bar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <SearchBar setSearch={setSearch} />

                <div className="flex items-center gap-3">
                  <SortDropdown setSort={setSort} />
                  <ViewToggle view={view} setView={setView} />
                </div>
              </div>

              {/* ========== LIST ========== */}
              {loading ? (
                <div className="text-center py-20 text-gray-400">
                  Loading startups...
                </div>
              ) : startups.length === 0 ? (
                <div className="text-center py-20">
                  <h3 className="text-xl font-semibold">No startups found</h3>
                  <p className="text-gray-400 mt-2">
                    Try adjusting search or filters
                  </p>
                </div>
              ) : (
                <div
                  className={
                    view === "grid"
                      ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                      : "flex flex-col gap-4"
                  }
                >
                  {startups.map((startup) => (
                    <StartupCard
                      key={startup._id || startup.id}
                      startup={startup}
                      view={view}
                    />
                  ))}
                </div>
              )}

              {/* Pagination component */}
              {!loading && startups.length > 0 && (
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

export default StartupsListPage;
