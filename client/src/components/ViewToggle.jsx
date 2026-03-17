import React from "react";
import { LayoutGrid, List } from "lucide-react";

const ViewToggle = ({ view, setView }) => {
    return (
        <div className="flex items-center bg-[#111111] border border-white/10 rounded-lg overflow-hidden">
            <button
                onClick={() => setView("grid")}
                className={`p-2 transition-colors ${
                    view === "grid" 
                        ? "bg-white/10 text-white" 
                        : "text-gray-400 hover:text-white"
                }`}
                title="Grid View"
            >
                <LayoutGrid className="w-5 h-5" />
            </button>
            <button
                onClick={() => setView("list")}
                className={`p-2 transition-colors ${
                    view === "list" 
                        ? "bg-white/10 text-white" 
                        : "text-gray-400 hover:text-white"
                }`}
                title="List View"
            >
                <List className="w-5 h-5" />
            </button>
        </div>
    );
};

export default ViewToggle;
