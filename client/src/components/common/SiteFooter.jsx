import React from "react";
import { Link } from "react-router-dom";

const SiteFooter = () => (
  <footer className="mt-auto w-full border-t border-slate-200 bg-slate-50 py-10 sm:py-12">
    <div className="mx-auto flex max-w-container-max flex-col items-center justify-between gap-8 px-5 md:flex-row md:px-16">
      <div className="flex flex-col items-center gap-3 md:items-start md:gap-4">
        <div className="text-lg font-bold text-midnight-navy">StartHub Capital</div>
        <p className="max-w-xs text-center font-label text-xs uppercase tracking-wider text-slate-600 md:text-left">
          © {new Date().getFullYear()} StartHub Capital. All rights reserved.
          Institutional Grade Venture Capital.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-6 sm:gap-8">
        <Link
          to="/privacy"
          className="font-label text-xs uppercase tracking-wider text-slate-600 transition-colors hover:text-midnight-navy"
        >
          Privacy Policy
        </Link>
        <Link
          to="/terms"
          className="font-label text-xs uppercase tracking-wider text-slate-600 transition-colors hover:text-midnight-navy"
        >
          Terms of Service
        </Link>
        <a
          href="mailto:support@starthub.capital"
          className="font-label text-xs uppercase tracking-wider text-slate-600 transition-colors hover:text-midnight-navy"
        >
          Contact
        </a>
      </div>
    </div>
  </footer>
);

export default SiteFooter;
