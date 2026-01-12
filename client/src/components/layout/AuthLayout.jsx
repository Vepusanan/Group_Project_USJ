import React from 'react';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      {/* Main Content - REDUCE padding-top */}
      <main className="relative z-10 flex-grow flex items-center justify-center py-8 px-4 md:px-8">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;