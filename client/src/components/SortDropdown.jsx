import React from "react";
import { ChevronDown } from "lucide-react";

const SortDropdown = ({ setSort }) => {
    return (
        <div className="relative group">
            <select
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-[#111111] border border-white/10 rounded-lg py-2 pl-4 pr-10 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
            >
                <option value="newest">Newest first</option>
                <option value="alphabetical">Alphabetical</option>
                <option value="recently_updated">Recently updated</option>
            </select>
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
    );
};

export default SortDropdown;
