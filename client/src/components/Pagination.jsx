import React from "react";

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  // Edge case
  if (totalPages <= 1) return null;

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

  return (
    <div className="flex justify-center items-center mt-12 gap-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
      >
        Previous
      </button>

      <div className="flex gap-1">
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`w-10 h-10 rounded-lg text-sm transition-colors ${
              currentPage === page
                ? "bg-purple-600/30 text-purple-300 border border-purple-500/50"
                : "text-gray-400 hover:bg-white/5 border border-transparent"
            }`}
          >
            {page}
          </button>
        ))}
      </div>

      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className="px-4 py-2 border border-gray-700 rounded-lg text-sm text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/5 transition"
      >
        Next
      </button>
    </div>
  );
};

export default Pagination;
