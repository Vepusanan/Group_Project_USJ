import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen relative">
      {/* Main Content */}
      <main className="relative flex-grow flex items-center justify-center py-8 px-4 md:px-8">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
