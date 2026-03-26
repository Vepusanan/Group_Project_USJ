import React from "react";

/**
 * SortDropdown Component
 * Handles the sort selection (Newest First, Alphabetical, Most Experienced, etc.)
 */
const SortDropdown = ({ setSort }) => {
  return (
    <div className="relative text-sm">
      <select
        onChange={(e) => setSort(e.target.value)}
        className="appearance-none bg-black/40 border border-gray-700/50 text-gray-300 rounded-lg px-4 py-2 pr-10 focus:outline-none focus:border-purple-500/50 focus:bg-black/60 cursor-pointer h-full transition-colors"
      >
        <option value="newest">Sort by Newest First</option>
        <option value="alphabetical">Sort by Alphabetical</option>
        <option value="experienced">Sort by Most Experienced</option>
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center px-1 text-gray-500">
        <svg
          className="fill-current h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
        >
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </div>
  );
};

export default SortDropdown;
