import React from "react";
import { Link } from "react-router-dom";
import {
  BadgeCheck,
  CheckCircle2,
  Gauge,
  Network,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

const STATS = [
  { value: "500+", label: "Startups" },
  { value: "200+", label: "Investors" },
  { value: "1500+", label: "Connections" },
  { value: "50+", label: "Industries" },
];

const PIPELINE_STEPS = [
  {
    step: "01.",
    title: "Create Your Profile",
    description:
      "Build a comprehensive data-rich presence. Highlighting your KPIs, vision, and institutional-ready metrics for potential partners.",
    image: "/images/home/pipeline/step-01-create-profile.png",
    imageAlt: "Professional founder building a polished institutional profile",
    imageClass: "object-cover object-top",
  },
  {
    step: "02.",
    title: "Discover & Connect",
    description:
      "Leverage our proprietary matching to identify the perfect partner. Filter by industry, stage, and strategic alignment in real-time.",
    image: "/images/home/pipeline/step-02-discover-connect.png",
    imageAlt: "Investor surveying opportunities to discover the right match",
    imageClass: "object-cover object-top",
    featured: true,
  },
  {
    step: "03.",
    title: "Collaborate & Grow",
    description:
      "Finalize terms within secure data rooms. Access legal toolkits and post-funding support to scale your horizons.",
    image: "/images/home/pipeline/step-03-collaborate-grow.png",
    imageAlt: "Founders and investors collaborating on a growth partnership",
    imageClass: "object-cover object-top",
  },
];

const HomePage = () => {
  const { isAuthenticated, user } = useAuth();
  const roleLandingPath =
    user?.userType === "investor" ? "/startups" : "/investors";

  const ctaLink = isAuthenticated && user ? roleLandingPath : "/signup";
  const ctaLabel = isAuthenticated && user ? "Explore Matches" : "Get Started Free";

  return (
    <div className="overflow-x-hidden bg-slate-50 font-sans text-slate-900">
      <section className="relative flex w-full flex-col min-h-[100dvh] lg:h-[100dvh] lg:min-h-0">
        <img
          src="/images/hero-background/hero-vortex.png"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/10 sm:from-black/60 sm:via-black/30 sm:to-black/10"
          aria-hidden
        />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-6 text-center sm:px-6 sm:pb-10 md:px-10 lg:px-16">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
            <h1 className="mb-4 font-display text-[1.625rem] leading-[1.12] tracking-tight text-white drop-shadow-lg sm:mb-5 sm:text-4xl sm:leading-[1.1] md:text-5xl lg:text-[3.25rem]">
              Scale Your Vision
              <br />
              With Elite Capital
            </h1>

            <p className="mb-6 max-w-xl text-sm leading-relaxed text-white/90 drop-shadow-md sm:mb-8 sm:text-base md:text-lg">
              Discover high-potential startups, connect with verified investors,
              and build funded ventures — all in one seamless platform.
            </p>

            <Link
              to={ctaLink}
              className="inline-flex w-full max-w-xs items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-on-surface shadow-lg transition-colors hover:bg-white/90 sm:w-auto sm:px-8 sm:py-3.5"
            >
              {ctaLabel}
            </Link>

            <p className="mt-5 font-label text-[10px] uppercase tracking-widest text-white/60 sm:mt-8 sm:text-xs">
              Trusted by 1,500+ founders worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-20 -mt-16 px-5 sm:-mt-20 md:-mt-24 md:px-16">
        <div className="light-card-surface mx-auto grid max-w-container-max grid-cols-2 gap-6 rounded-[2rem] p-6 sm:gap-8 sm:p-8 md:grid-cols-4 md:gap-12 md:p-12">
          {STATS.map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <div className="font-label text-2xl font-bold text-midnight-navy sm:text-3xl md:text-4xl">
                {value}
              </div>
              <div className="mt-1 font-label text-xs uppercase tracking-wider text-slate-600">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section
        id="about"
        className="scroll-mt-24 overflow-hidden px-5 py-20 sm:py-24 md:px-16 md:py-32"
      >
        <div className="mx-auto grid max-w-container-max items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <div className="relative">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-blue-500/5 blur-[100px]" />
            <h2 className="relative mb-6 text-3xl font-bold leading-tight text-midnight-navy sm:mb-8 sm:text-4xl md:text-5xl">
              Building Solutions,
              <br />
              Expanding Horizons
            </h2>
            <p className="relative mb-8 text-base leading-relaxed text-slate-600 sm:text-lg">
              StartHub bridges the gap between ambitious founders and strategic
              investors. We believe the next generation of deep tech and software
              innovations shouldn&apos;t be stalled by access to capital.
            </p>
            <div className="relative space-y-4">
              <div className="flex items-start gap-4">
                <BadgeCheck className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <h4 className="text-lg font-semibold text-midnight-navy">
                    Verified Ecosystem
                  </h4>
                  <p className="text-slate-600">
                    Every participant undergoes rigorous vetting to ensure
                    high-stakes professional integrity.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <Gauge className="mt-1 h-5 w-5 shrink-0 text-blue-600" />
                <div>
                  <h4 className="text-lg font-semibold text-midnight-navy">
                    Rapid Deployment
                  </h4>
                  <p className="text-slate-600">
                    Accelerate the fundraising process from months to weeks with
                    targeted matching algorithms.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 rounded-[2rem] bg-blue-500/5 opacity-0 blur-3xl transition-opacity duration-1000 group-hover:opacity-100" />
            <div className="relative aspect-video overflow-hidden rounded-[2rem] border border-slate-200 shadow-xl lg:aspect-square">
              <img
                src="/images/home/about-solutions.png"
                alt="Growth and strategic vision for founders and investors"
                className="h-full w-full scale-[1.15] object-cover object-center transition-all duration-700 group-hover:scale-110"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:py-24 md:px-16 md:py-32"
      >
        <div className="mx-auto max-w-container-max">
          <div className="mb-12 text-center sm:mb-16 md:mb-20">
            <h2 className="mb-3 text-3xl font-bold text-midnight-navy sm:mb-4 sm:text-4xl md:text-5xl">
              The Pipeline to Success
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              Our streamlined process connects vision with resources through
              three critical phases.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3 md:gap-8">
            {PIPELINE_STEPS.map(
              ({ step, title, description, image, imageAlt, imageClass, featured }) => (
                <div
                  key={step}
                  className={`light-card-surface hover-lift group relative overflow-hidden rounded-3xl p-8 sm:p-10 ${
                    featured ? "md:-mt-2" : ""
                  }`}
                >
                  {featured && (
                    <div className="pointer-events-none absolute right-0 top-0 p-4">
                      <Network className="h-16 w-16 text-blue-500/10 transition-transform group-hover:scale-125" />
                    </div>
                  )}
                  <div className="mb-5 font-label text-xl font-bold text-blue-600 sm:mb-6">
                    {step}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-midnight-navy sm:mb-4">
                    {title}
                  </h3>
                  <p className="mb-6 text-slate-600 sm:mb-8">{description}</p>
                  <div className="h-40 w-full overflow-hidden rounded-xl border border-slate-100 sm:h-48">
                    <img
                      src={image}
                      alt={imageAlt}
                      className={`h-full w-full ${imageClass}`}
                      loading="lazy"
                    />
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="cta"
        className="relative scroll-mt-24 overflow-hidden px-5 py-16 sm:py-20 md:px-16 md:py-24"
      >
        <div className="absolute inset-0 z-0 bg-slate-50">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-[120px] sm:h-[800px] sm:w-[800px]" />
        </div>

        <div className="light-card-surface relative z-10 mx-auto max-w-4xl rounded-[2rem] p-6 text-center sm:rounded-[3rem] sm:p-8 md:p-12">
          <h2 className="mb-4 text-3xl font-bold text-midnight-navy sm:mb-5 sm:text-4xl md:text-5xl">
            Raise the bar for your
            <br />
            <span className="text-blue-600">venture portfolio</span>
          </h2>
          <p className="mx-auto mb-5 max-w-xl text-base text-slate-600 sm:mb-6 sm:text-lg">
            Join the exclusive ecosystem where high-growth visionaries and
            institutional capital unite to build the future.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center justify-center rounded-2xl bg-[#0f172a] px-10 py-4 text-base font-bold !text-white no-underline shadow-xl transition-all hover:scale-105 hover:!text-white hover:!bg-[#1e293b] active:scale-95 sm:px-12 sm:py-5"
          >
            Join the Pipeline
          </Link>
          <div className="mt-4 flex flex-col items-center justify-center gap-2 font-label text-xs uppercase tracking-wider text-slate-600 sm:mt-5 sm:flex-row sm:gap-5">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              No upfront fees
            </span>
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              SEC Compliant
            </span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
