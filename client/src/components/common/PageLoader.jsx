import React from "react";

const PageLoader = ({ className = "min-h-[50vh]" }) => (
  <div className={`flex items-center justify-center ${className}`}>
    <div
      className="h-10 w-10 animate-spin rounded-full border-4 border-primary-fixed border-t-primary"
      role="status"
      aria-label="Loading"
    />
  </div>
);

export default PageLoader;
