import React from "react";
import { Link } from "react-router-dom";

const SiteFooter = () => (
  <footer className="w-full bg-[#faf8f5] border-t border-slate-200 py-8 relative overflow-hidden">
    <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-6 px-5 md:flex-row md:px-16 relative z-10">
      <div className="flex flex-col items-center gap-2 md:items-start">
        <div className="text-base font-bold text-midnight-navy tracking-tight flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          StartupConnect
        </div>
        <p className="text-center text-[11px] text-slate-500 md:text-left font-normal max-w-sm leading-relaxed">
          © {new Date().getFullYear()} StartupConnect. All rights reserved. <br />
          Institutional Grade Venture Capital Matching Infrastructure.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
        <Link
          to="/privacy"
          className="text-xs text-slate-600 font-semibold tracking-wide transition-colors hover:text-blue-600"
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          className="text-xs text-slate-600 font-semibold tracking-wide transition-colors hover:text-blue-600"
        >
          Terms of Service
        </Link>
        <a
          href="mailto:support@startupconnect.com"
          className="text-xs text-slate-600 font-semibold tracking-wide transition-colors hover:text-blue-600"
        >
          Contact Support
        </a>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
