import React, { useState } from "react";

const FilterSidebar = ({ filters, setFilters }) => {
    // Local state to hold selections before "Apply" is clicked
    // Keys must match backend API query params (snake_case)
    const [localFilters, setLocalFilters] = useState({
        industry: filters.industry || "",
        location_country: filters.location_country || "",
        funding_stage: filters.funding_stage || "",
        revenue_status: filters.revenue_status || "",
    });

    const industries = ["Fintech", "Healthtech", "Edtech", "AI", "E-commerce"];
    const locations = ["San Francisco", "New York", "London", "Remote", "Berlin"];
    const fundingStages = ["Pre-seed", "Seed", "Series A", "Series B", "Series C+"];
    const revenueStatuses = ["Pre-revenue", "Generating Revenue", "Profitable"];

    const handleChange = (e) => {
        const { name, value } = e.target;
        setLocalFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleApply = () => {
        setFilters(localFilters);
    };

    const handleClear = () => {
        const emptyFilters = {
            industry: "",
            location_country: "",
            funding_stage: "",
            revenue_status: "",
        };
        setLocalFilters(emptyFilters);
        setFilters({});
    };

    return (
        <div className="bg-[#111111] border border-white/10 rounded-xl p-6 text-sm">
            <h3 className="text-lg font-semibold mb-6 flex items-center justify-between">
                Filters
                {(localFilters.industry || localFilters.location_country || localFilters.funding_stage || localFilters.revenue_status) && (
                     <button
                        onClick={handleClear}
                        className="text-xs text-gray-400 hover:text-white transition-colors underline"
                     >
                         Clear All
                     </button>
                )}
            </h3>

            {/* Industry */}
            <div className="mb-5">
                <label className="block text-gray-400 mb-2">Industry</label>
                <select
                    name="industry"
                    value={localFilters.industry}
                    onChange={handleChange}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">All Industries</option>
                    {industries.map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                    ))}
                </select>
            </div>

            {/* Location */}
            <div className="mb-5">
                <label className="block text-gray-400 mb-2">Location</label>
                <select
                    name="location_country"
                    value={localFilters.location_country}
                    onChange={handleChange}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">All Locations</option>
                    {locations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                    ))}
                </select>
            </div>

            {/* Funding Stage */}
            <div className="mb-5">
                <label className="block text-gray-400 mb-2">Funding Stage</label>
                <select
                    name="funding_stage"
                    value={localFilters.funding_stage}
                    onChange={handleChange}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">All Stages</option>
                    {fundingStages.map(stage => (
                        <option key={stage} value={stage}>{stage}</option>
                    ))}
               </select>
            </div>

            {/* Revenue Status */}
            <div className="mb-6">
                <label className="block text-gray-400 mb-2">Revenue Status</label>
                <select
                    name="revenue_status"
                    value={localFilters.revenue_status}
                    onChange={handleChange}
                    className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                >
                    <option value="">All Statuses</option>
                    {revenueStatuses.map(status => (
                        <option key={status} value={status}>{status}</option>
                    ))}
               </select>
            </div>

            <button
                onClick={handleApply}
                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
                Apply Filters
            </button>
        </div>
    );
};

export default FilterSidebar;
