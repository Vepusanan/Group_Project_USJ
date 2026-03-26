import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

/**
 * SearchBar Component
 * Includes an internal debounce mechanism so it only updates
 * the parent state after the user stops typing for 500ms.
 */
const SearchBar = ({ setSearch }) => {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(inputValue);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, setSearch]);

  return (
    <div className="relative w-full md:w-96 text-gray-300">
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search size={18} className="text-gray-500" />
      </div>
      <input
        type="text"
        placeholder="Search by name, firm or keyword..."
        className="w-full pl-10 pr-4 py-2.5 bg-black/40 border border-gray-700/50 rounded-lg focus:outline-none focus:border-purple-500/50 focus:bg-black/60 transition-colors text-sm"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
      />
    </div>
  );
};

export default SearchBar;
