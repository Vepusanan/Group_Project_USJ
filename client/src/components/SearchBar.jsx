import React, { useState, useEffect } from "react";
import { Search } from "lucide-react";

const SearchBar = ({ setSearch }) => {
    const [inputValue, setInputValue] = useState("");

    // Debounce the search input
    useEffect(() => {
        const handler = setTimeout(() => {
            setSearch(inputValue);
        }, 500); // 500ms delay

        return () => {
            clearTimeout(handler);
        };
    }, [inputValue, setSearch]);

    return (
        <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
                type="text"
                placeholder="Search startups by name or keyword..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="w-full bg-white/5 border border-white/20 rounded-lg py-2 pl-10 pr-4 text-white focus:outline-none focus:border-purple-500 transition-colors"
            />
        </div>
    );
};

export default SearchBar;
