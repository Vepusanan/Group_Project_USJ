import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen relative bg-page flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-64 h-64 bg-primary-light rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-surface-alt rounded-full blur-3xl opacity-80" />
      </div>
      <main className="relative z-10 flex flex-1 items-center justify-center py-4 px-4 md:px-8">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
