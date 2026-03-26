import React from "react";
import { LayoutGrid, List } from "lucide-react";

/**
 * ViewToggle Component
 * Allows users to switch between Grid and List views.
 */
const ViewToggle = ({ view, setView }) => {
  return (
    <div className="flex bg-gray-800/40 border border-gray-700/50 rounded-lg overflow-hidden p-[2px]">
      <button
        onClick={() => setView("grid")}
        className={`p-1.5 rounded-md transition-all ${
          view === "grid"
            ? "bg-gray-600/80 text-white shadow-sm"
            : "text-gray-400 hover:text-white"
        }`}
        aria-label="Grid View"
      >
        <LayoutGrid size={18} />
      </button>

      <button
        onClick={() => setView("list")}
        className={`p-1.5 rounded-md transition-all ${
          view === "list"
            ? "bg-gray-600/80 text-white shadow-sm"
            : "text-gray-400 hover:text-white"
        }`}
        aria-label="List View"
      >
        <List size={18} />
      </button>
    </div>
  );
};

export default ViewToggle;
