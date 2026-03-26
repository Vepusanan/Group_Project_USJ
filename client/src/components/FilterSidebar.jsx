import React from "react";

const FILTER_OPTIONS = {
  investorTypes: ["Angel Investor", "VC Firm", "Private Equity", "Family Office"],
  locations: ["London, UK", "San Francisco, CA", "New York, NY", "Remote"],
  industries: ["FinTech", "SaaS", "AI/ML", "HealthTech", "E-commerce"],
  stages: ["Pre-seed", "Seed", "Series A", "Series B", "Series C+"],
};

const FilterSidebar = ({ filters, setFilters }) => {
  const handleSelectChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value === "" ? undefined : value,
    }));
  };

  const handleClearFilters = () => {
    setFilters({});
  };

  return (
    <div className="bg-black/40 border border-gray-700/50 rounded-xl p-5 sticky top-24">
      <h2 className="text-xl font-bold mb-6 text-white border-b border-gray-700/50 pb-4">
        Filters
      </h2>

      <div className="space-y-6">
        {/* Investor Type */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-white/90">
            Investor type
          </label>
          <div className="relative">
            <select
              className="w-full bg-black border border-gray-700 rounded-md py-2 px-3 text-sm text-gray-300 appearance-none focus:outline-none focus:border-purple-500"
              value={filters.investorType || ""}
              onChange={(e) => handleSelectChange("investorType", e.target.value)}
            >
              <option value="">All Types</option>
              {FILTER_OPTIONS.investorTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-white/90">
            Location
          </label>
          <div className="relative">
            <select
              className="w-full bg-black border border-gray-700 rounded-md py-2 px-3 text-sm text-gray-300 appearance-none focus:outline-none focus:border-purple-500"
              value={filters.location || ""}
              onChange={(e) => handleSelectChange("location", e.target.value)}
            >
              <option value="">All Locations</option>
              {FILTER_OPTIONS.locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Industries */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-white/90">
            Industries
          </label>
          <div className="relative">
            <select
              className="w-full bg-black border border-gray-700 rounded-md py-2 px-3 text-sm text-gray-300 appearance-none focus:outline-none focus:border-purple-500"
              value={filters.industry || ""}
              onChange={(e) => handleSelectChange("industry", e.target.value)}
            >
              <option value="">All Industries</option>
              {FILTER_OPTIONS.industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Investment Stage */}
        <div>
          <label className="block text-sm font-semibold mb-2 text-white/90">
            Investment Stage
          </label>
          <div className="relative">
            <select
              className="w-full bg-black border border-gray-700 rounded-md py-2 px-3 text-sm text-gray-300 appearance-none focus:outline-none focus:border-purple-500"
              value={filters.stage || ""}
              onChange={(e) => handleSelectChange("stage", e.target.value)}
            >
              <option value="">All Stages</option>
              {FILTER_OPTIONS.stages.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
              <svg className="fill-current h-4 w-4" viewBox="0 0 20 20">
                <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Amount Range UI Mockup */}
        <div className="pt-2 border-t border-gray-700/50">
          <label className="block text-sm font-semibold mb-4 text-white/90">
            Investment Amount
          </label>
          <div className="relative w-full h-1 bg-gray-700 rounded">
            <div className="absolute top-0 left-0 bg-blue-500 h-1 rounded w-3/4"></div>
            <div className="absolute top-1/2 -translate-y-1/2 left-0 w-3 h-3 bg-white rounded-full cursor-pointer shadow"></div>
            <div className="absolute top-1/2 -translate-y-1/2 left-3/4 w-3 h-3 bg-white rounded-full cursor-pointer shadow"></div>
          </div>
          <div className="flex justify-between mt-3 text-xs font-semibold text-gray-400">
            <span>$50K</span>
            <span>$10M+</span>
          </div>
        </div>

        <button
          onClick={handleClearFilters}
          className="w-full mt-4 py-2 border border-gray-600 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition"
        >
          Clear filters
        </button>
      </div>
    </div>
  );
};

export default FilterSidebar;
