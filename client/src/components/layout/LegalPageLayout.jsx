import React, { useEffect } from "react";

const LegalPageLayout = ({
  title,
  lastUpdated,
  version,
  children,
  footerLinks,
}) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  return (
  <div className="bg-slate-50 pb-12 md:pb-16">
    <div className="mx-auto max-w-container-max px-5 py-10 md:px-16 md:py-14">
      <header className="mb-8 md:mb-10">
        <span className="mb-2 block font-label text-xs uppercase tracking-widest text-blue-600">
          Legal
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-midnight-navy md:text-4xl">
          {title}
        </h1>
        {lastUpdated && (
          <p className="mt-3 text-sm text-slate-500">
            Last updated: {lastUpdated}
            {version ? ` · Version ${version}` : ""}
          </p>
        )}
      </header>

      <article className="light-card-surface rounded-2xl p-6 md:rounded-[2rem] md:p-10 lg:p-12">
        <div className="mx-auto max-w-3xl space-y-8 text-base leading-relaxed text-slate-600">
          {children}
        </div>

        {footerLinks && (
          <div className="mx-auto mt-10 flex max-w-3xl flex-wrap gap-x-4 gap-y-2 border-t border-slate-100 pt-6 text-sm">
            {footerLinks}
          </div>
        )}
      </article>
    </div>
  </div>
  );
};

export const LegalSection = ({ title, children }) => (
  <section>
    <h2 className="mb-3 text-lg font-semibold text-midnight-navy">{title}</h2>
    <div className="space-y-3">{children}</div>
  </section>
);

export const legalLinkClass =
  "font-medium text-blue-600 transition-colors hover:text-blue-700 hover:underline";

export default LegalPageLayout;
