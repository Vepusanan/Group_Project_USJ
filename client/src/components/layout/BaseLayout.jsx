import React from "react";

const BaseLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      {/* Header is now global in App.js */}
      <main className="flex-grow w-full pt-24 md:pt-28 lg:pt-32">
        {children}
      </main>
      {/* Footer is also global in App.js, removed from here */}
    </div>
  );
};

export default BaseLayout;
