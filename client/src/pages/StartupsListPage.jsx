import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import SearchBar from "../components/SearchBar";
import FilterSidebar from "../components/FilterSidebar";
import SortDropdown from "../components/SortDropdown";
import ViewToggle from "../components/ViewToggle";
import StartupCard from "../components/StartupCard";
import Pagination from "../components/Pagination";
import api from "../services/apiService";

const StartupsListPage = () => {
    const { isAuthenticated, user } = useAuth();

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
            const res = await api.getStartups({ q: search, ...filters, sort, page, limit: 12 });
            
            if (res.success) {
                const data = res.data;
                // Handle both array response and paginated object response formats
                if (Array.isArray(data)) {
                    setStartups(data);
                    setTotalPages(1);
                } else {
                    setStartups(data.startups || data.data || []);
                    setTotalPages(data.totalPages || Math.ceil((data.total || 0) / 12) || 1);
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

    return (
        <div className="min-h-screen bg-black bg-[url('../../public/images/hero-background/hero-background.png')] bg-cover bg-center text-white">

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

                {/* Nav */}
                <div className="flex items-center space-x-6">
                    <Link to="/startups" className="hover:text-purple-300">Startups</Link>
                    <Link to="/investors" className="hover:text-purple-300">Investors</Link>
                    <Link to="/connections" className="hover:text-purple-300">My Connections</Link>
                    <Link to="/messages" className="hover:text-purple-300">Messages</Link>

                    {isAuthenticated && user && (
                        <img
                            src={user.profilePic || "/images/default-avatar.png"}
                            alt="user"
                            className="w-8 h-8 rounded-full"
                        />
                    )}
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
                                    <StartupCard key={startup._id || startup.id} startup={startup} view={view} />
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

            {/* ================= FOOTER ================= */}
            <div className="mt-20 px-6 md:px-10 lg:px-20 py-10 border-t border-white/10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">

                    <div>
                        <h2 className="text-lg font-bold mb-2">StartHub Capital</h2>
                        <p className="text-gray-400 text-sm">
                            Connect startups with the right investors.
                        </p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">Quick Links</h3>
                        <p className="text-gray-400 text-sm">About Us</p>
                        <p className="text-gray-400 text-sm">Services</p>
                        <p className="text-gray-400 text-sm">FAQ</p>
                    </div>

                    <div>
                        <h3 className="font-semibold mb-2">
                            Join the StartupHub Community
                        </h3>
                        <div className="flex mt-3">
                            <input
                                type="email"
                                placeholder="Enter your Gmail"
                                className="px-4 py-2 rounded-l-lg bg-black border border-white/20 outline-none"
                            />
                            <button className="px-4 py-2 rounded-r-lg bg-gradient-to-r from-purple-500 to-blue-500">
                                Join Us
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default StartupsListPage;