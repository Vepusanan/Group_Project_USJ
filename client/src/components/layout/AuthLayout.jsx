import React from "react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen relative bg-background flex flex-col">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-secondary/10 rounded-full blur-3xl" />
      </div>
      <main className="relative z-10 flex flex-1 items-center justify-center pb-8 pt-28 px-5 md:px-gutter">
        {children}
      </main>
    </div>
  );
};

export default AuthLayout;
