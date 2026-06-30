import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  Check,
  CheckCircle2,
  Network,
  Zap,
  FileText,
  PieChart,
  Lock,
  TrendingUp,
  ShieldCheck,
  Eye,
  Users,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AUTH_STATUS } from "../utils/authStateMachine.js";
import ScrollReveal from "../components/ScrollReveal";
import step01Image from "../assets/home/pipeline/step-01-create-profile.png";
import step02Image from "../assets/home/pipeline/step-02-discover-connect.png";
import step03Image from "../assets/home/pipeline/step-03-collaborate-grow.png";
const CountUp = ({ end, duration = 2000, suffix = "" }) => {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasStarted(true);
          if (containerRef.current) {
            observer.unobserve(containerRef.current);
          }
        }
      },
      { threshold: 0.1 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!hasStarted) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easedProgress = progress * (2 - progress); // easeOutQuad
      
      setCount(Math.floor(easedProgress * end));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(end);
      }
    };

    window.requestAnimationFrame(step);
  }, [hasStarted, end, duration]);

  return <span ref={containerRef}>{count}{suffix}</span>;
};

const STATS = [
  { end: 500, suffix: "+", label: "Startups" },
  { end: 200, suffix: "+", label: "Investors" },
  { end: 1500, suffix: "+", label: "Connections" },
  { end: 50, suffix: "+", label: "Industries" },
];

const PIPELINE_STEPS = [
  {
    step: "01.",
    title: "Create Your Profile",
    description:
      "Build a comprehensive data-rich presence. Highlighting your KPIs, vision, and institutional-ready metrics for potential partners.",
    image: step01Image,
    imageAlt: "Professional founder building a polished institutional profile",
    imageClass: "object-cover object-top",
  },
  {
    step: "02.",
    title: "Discover & Connect",
    description:
      "Leverage our proprietary matching to identify the perfect partner. Filter by industry, stage, and strategic alignment in real-time.",
    image: step02Image,
    imageAlt: "Investor surveying opportunities to discover the right match",
    imageClass: "object-cover object-top",
    featured: true,
  },
  {
    step: "03.",
    title: "Collaborate & Grow",
    description:
      "Finalize terms within secure data rooms. Access legal toolkits and post-funding support to scale your horizons.",
    image: step03Image,
    imageAlt: "Founders and investors collaborating on a growth partnership",
    imageClass: "object-cover object-top",
  },
];

const SHOWROOM_DATA = {
  founder: {
    badge: "For Founders",
    title: "Accelerate Your Capital Access",
    description: "Equip your startup with standard-setting tools to present a compelling investment thesis, structure due diligence, and coordinate investor relations.",
    features: [
      {
        icon: FileText,
        title: "Pitch Deck Builder",
        desc: "Convert raw numbers into standard-setting investor slides with live feedback and engagement metrics."
      },
      {
        icon: PieChart,
        title: "Cap Table Management",
        desc: "Structure, model, and simulate dilution scenarios before closing seed, Series A, or venture rounds."
      },
      {
        icon: Lock,
        title: "Secure Data Room",
        desc: "Host compliance documents, financials, and legal drafts in single-access encrypted vaults."
      }
    ],
    dashboardMock: (
      <div className="w-full bg-[#1e293b] rounded-3xl p-6 border border-slate-700 text-slate-200 shadow-2xl relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <div>
            <h5 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Founder Dashboard</h5>
            <h4 className="text-sm font-bold text-white mt-0.5">Vortex AI Technologies</h4>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 badge-active-dot">
            Live Funding Round
          </span>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-850">
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Target Raise</span>
            <div className="text-base font-bold text-white mt-1">$2.5M</div>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-850">
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Committed</span>
            <div className="text-base font-bold text-blue-400 mt-1">$1.8M</div>
            <div className="w-full bg-slate-800 h-1 rounded-full mt-1.5 overflow-hidden">
              <div className="bg-blue-500 h-full rounded-full" style={{ width: '72%' }} />
            </div>
          </div>
          <div className="bg-slate-900/50 rounded-2xl p-3 border border-slate-850">
            <span className="text-[9px] uppercase tracking-wider text-slate-400">Deck Views</span>
            <div className="text-base font-bold text-white mt-1">142</div>
          </div>
        </div>

        {/* Live Engagement List */}
        <div>
          <h5 className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Active Diligence Requests</h5>
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-900/30 rounded-xl p-2.5 border border-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                <span className="text-[11px] font-medium text-slate-350">Audited Financials 2025</span>
              </div>
              <span className="text-[9px] text-slate-400">SeedCapital Partners</span>
            </div>
            <div className="flex justify-between items-center bg-slate-900/30 rounded-xl p-2.5 border border-slate-800/40">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[11px] font-medium text-slate-350">Cap Table Verification</span>
              </div>
              <span className="text-[9px] text-slate-400">Apex Ventures</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  investor: {
    badge: "For Investors",
    title: "Deploy Capital with Vetted Certainty",
    description: "Screen high-velocity opportunities, evaluate deep-tech KPIs, and coordinate term sheet collaboration in a fully compliant framework.",
    features: [
      {
        icon: TrendingUp,
        title: "Dynamic Deal Pipeline",
        desc: "Monitor deals as they transition through screening, initial meetings, technical evaluation, and investment."
      },
      {
        icon: ShieldCheck,
        title: "Compliance & Verification",
        desc: "Access platform-certified verification badges confirming founder identity, SEC compliance, and cap table integrity."
      },
      {
        icon: Eye,
        title: "Custom Watchlists",
        desc: "Receive real-time notifications on metrics improvements, team expansions, or pitch decks updates."
      }
    ],
    dashboardMock: (
      <div className="w-full bg-[#1e293b] rounded-3xl p-6 border border-slate-700 text-slate-200 shadow-2xl relative overflow-hidden">
        {/* Background ambient light */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-800">
          <div>
            <h5 className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Investor Portal</h5>
            <h4 className="text-sm font-bold text-white mt-0.5">Bluehorizon Capital</h4>
          </div>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/15 text-blue-400 border border-blue-500/20">
            Premium Dealflow
          </span>
        </div>

        {/* Pipeline Column Mocks */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Under Review</span>
              <span className="text-[9px] bg-slate-800 text-slate-350 px-1.5 py-0.5 rounded">2</span>
            </div>
            <div className="space-y-2">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <h5 className="text-[11px] font-bold text-white">QuantumCrypt</h5>
                <span className="text-[8px] text-slate-400">Cybersecurity • $1.5M Seed</span>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <h5 className="text-[11px] font-bold text-white">BioPulse AI</h5>
                <span className="text-[8px] text-slate-400">Healthcare • $3.0M Series A</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Due Diligence</span>
              <span className="text-[9px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-semibold">1</span>
            </div>
            <div className="bg-slate-900/60 p-2.5 rounded-xl border border-blue-500/30 relative">
              <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              <h5 className="text-[11px] font-bold text-white">Vortex AI Tech</h5>
              <span className="text-[8px] text-slate-400">Enterprise SaaS • $2.5M Raise</span>
              <div className="mt-1.5 text-[8px] bg-slate-800 text-amber-300 px-1.5 py-0.5 rounded inline-block font-semibold">
                Docs Vault Shared
              </div>
            </div>
          </div>
        </div>

        {/* Verification Check row */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-2.5 flex justify-between items-center text-[10px]">
          <span className="text-slate-400">Verified Platform Audits completed</span>
          <span className="text-emerald-400 font-bold">100% Verified</span>
        </div>
      </div>
    )
  }
};

const HomePage = () => {
  const [showroomTab, setShowroomTab] = useState("founder");
  const { authStatus, user } = useAuth();
  const roleLandingPath =
    user?.userType === "investor" ? "/startups" : "/investors";

  const isAppReady = authStatus === AUTH_STATUS.AUTHENTICATED_READY;
  const ctaLink = isAppReady ? roleLandingPath : "/signup";
  const ctaLabel = isAppReady ? "Explore Matches" : "Get Started Free";

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
          className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/45 to-slate-50/20"
          aria-hidden
        />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 pb-8 pt-6 text-center sm:px-6 sm:pb-10 md:px-10 lg:px-16">
          <div className="mx-auto flex w-full max-w-4xl flex-col items-center">
            <h1 className="mb-6 font-display text-[2rem] leading-[1.1] tracking-tight text-white drop-shadow-xl sm:text-5xl md:text-6xl lg:text-[3.75rem] animate-slide-up-fade font-extrabold">
              Scale Your Vision
              <br />
              With <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">Elite Capital</span>
            </h1>

            <p className="mb-8 max-w-2xl text-sm leading-relaxed text-slate-200 drop-shadow-md sm:text-base md:text-lg animate-slide-up-fade delay-100">
              Discover high-potential startups, connect with verified investors,
              and build funded ventures — all in one seamless platform.
            </p>

            <div className="animate-slide-up-fade delay-200 w-full flex justify-center">
              <Link
                to={ctaLink}
                className="inline-flex w-full max-w-xs items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-500 px-8 py-4 text-base font-bold text-white shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 animate-btn-glow"
              >
                {ctaLabel}
              </Link>
            </div>

            <p className="mt-8 font-label text-[10px] uppercase tracking-widest text-white/50 sm:text-xs animate-slide-up-fade delay-300">
              Trusted by 1,500+ founders worldwide
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-20 -mt-16 px-5 sm:-mt-20 md:-mt-24 md:px-16">
        <ScrollReveal direction="up" delay={200} className="w-full">
          <div className="glassmorphic-panel mx-auto grid max-w-container-max grid-cols-2 gap-6 rounded-[2.5rem] p-6 sm:gap-8 sm:p-8 md:grid-cols-4 md:gap-12 md:p-12 border border-white/40 shadow-2xl relative z-10">
            {STATS.map(({ end, suffix, label }) => (
              <div key={label} className="flex flex-col items-center text-center group transition-all duration-300">
                <div className="font-label text-2xl font-bold text-blue-600 sm:text-3xl md:text-4xl transition-all duration-300 group-hover:scale-110 group-hover:text-midnight-navy">
                  <CountUp end={end} suffix={suffix} />
                </div>
                <div className="mt-2 font-label text-[10px] uppercase tracking-wider text-slate-500 font-semibold sm:text-xs">
                  {label}
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* About */}
      <section
        id="about"
        className="scroll-mt-24 px-5 py-24 sm:py-28 md:px-16 flex justify-center bg-slate-50"
      >
        <ScrollReveal direction="up" className="w-full max-w-5xl">
          <div className="relative bg-[#fdfbf7] border border-[#f0ebd8]/80 rounded-[2.5rem] p-8 md:p-16 shadow-[0_12px_40px_rgba(240,235,216,0.35)] overflow-hidden transition-all duration-500 hover:shadow-[0_20px_60px_rgba(240,235,216,0.5)] hover:-translate-y-1">
            {/* Content Wrapper */}
            <div className="relative z-10 flex flex-col">
              {/* Title */}
              <h2 className="text-3xl md:text-[2.75rem] font-bold leading-[1.15] text-[#18181b] tracking-tight mb-6 max-w-2xl">
                Building Solutions, Expanding
                <br className="hidden md:inline" /> Horizons
              </h2>
              
              {/* Subtitle */}
              <p className="text-[#71717a] text-base md:text-lg leading-relaxed max-w-3xl mb-12">
                StartupConnect bridges the gap between ambitious founders and strategic
                investors through a seamless, secure verification engine.
              </p>

              {/* Cards Grid */}
              <div className="flex flex-col md:flex-row justify-between w-full gap-8 mt-4">
                {/* Card 1: Verified Ecosystem */}
                <div className="w-full md:w-[46%] bg-[#fdfbf7] border border-[#f0ebd8] rounded-[1.5rem] p-8 flex flex-col items-start transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
                  <Check className="h-6 w-6 text-[#18181b] mb-5 stroke-[2.5] transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                  <h4 className="text-lg md:text-xl font-bold text-[#18181b] mb-2">
                    Verified Ecosystem
                  </h4>
                  <p className="text-[#71717a] text-sm md:text-base leading-relaxed">
                    Rigorous vetting for every startup and strategic investor.
                  </p>
                </div>

                {/* Card 2: Rapid Deployment */}
                <div className="w-full md:w-[46%] bg-[#fdfbf7] border border-[#f0ebd8] rounded-[1.5rem] p-8 flex flex-col items-start transition-all duration-300 hover:shadow-xl hover:-translate-y-2 group">
                  <Zap className="h-6 w-6 text-amber-500 fill-amber-500 mb-5 stroke-[1.5] transition-all duration-300 group-hover:scale-125 group-hover:rotate-12" />
                  <h4 className="text-lg md:text-xl font-bold text-[#18181b] mb-2">
                    Rapid Deployment
                  </h4>
                  <p className="text-[#71717a] text-sm md:text-base leading-relaxed">
                    Accelerate capital allocation with automated workflows.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* Platform Showroom Section */}
      <section
        id="showroom"
        className="scroll-mt-24 px-5 py-24 sm:py-28 md:px-16 flex justify-center bg-slate-100/50"
      >
        <div className="w-full max-w-container-max flex flex-col items-center">
          <ScrollReveal direction="up" className="text-center mb-16 max-w-3xl">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-widest font-label">
              Platform Showroom
            </span>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-midnight-navy mt-4 mb-6">
              Engineered for Both Sides of the Deal
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed">
              Explore the customized workspace panels and analytics pipelines we've built specifically for startup fundraising and venture capital deployment.
            </p>
            
            {/* Interactive Toggle Switcher */}
            <div className="flex justify-center mt-10">
              <div className="relative flex bg-slate-200/80 p-1 rounded-2xl border border-slate-300/50 shadow-inner w-72">
                {/* Switch sliding indicator */}
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white rounded-xl shadow-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    showroomTab === "founder" ? "left-1" : "left-[calc(50%+2px)]"
                  }`}
                />
                <button
                  onClick={() => setShowroomTab("founder")}
                  className={`relative z-10 flex-1 py-2.5 text-xs font-bold font-label uppercase tracking-wider rounded-xl transition-colors duration-300 ${
                    showroomTab === "founder" ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Founders
                </button>
                <button
                  onClick={() => setShowroomTab("investor")}
                  className={`relative z-10 flex-1 py-2.5 text-xs font-bold font-label uppercase tracking-wider rounded-xl transition-colors duration-300 ${
                    showroomTab === "investor" ? "text-blue-600" : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Investors
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Showroom Content Card */}
          <ScrollReveal direction="none" delay={150} className="w-full">
            <div className="bg-white border border-slate-200/60 rounded-[2.5rem] p-8 md:p-12 shadow-xl overflow-hidden min-h-[480px] flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
              
              {/* Left Column: Features info */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center">
                <span className="inline-flex text-xs font-bold font-label text-blue-600 uppercase tracking-widest mb-4">
                  {SHOWROOM_DATA[showroomTab].badge}
                </span>
                <h3 className="text-2xl md:text-3.5xl font-bold text-midnight-navy mb-5 tracking-tight transition-all duration-305">
                  {SHOWROOM_DATA[showroomTab].title}
                </h3>
                <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8">
                  {SHOWROOM_DATA[showroomTab].description}
                </p>

                {/* Features Checklist */}
                <div className="space-y-6">
                  {SHOWROOM_DATA[showroomTab].features.map((feat) => {
                    const IconComp = feat.icon;
                    return (
                      <div key={feat.title} className="flex gap-4 group">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-midnight-navy group-hover:text-blue-600 transition-colors duration-200">
                            {feat.title}
                          </h4>
                          <p className="text-xs md:text-sm text-slate-500 mt-1 leading-relaxed">
                            {feat.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Premium Mock Dashboard Graphic */}
              <div className="w-full lg:w-1/2 flex items-center justify-center relative">
                {/* Glowing decorative gradient behind mock UI */}
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-indigo-500/5 rounded-3xl blur-2xl pointer-events-none" />
                <div className="w-full max-w-md transition-all duration-500 transform hover:scale-[1.02]">
                  {SHOWROOM_DATA[showroomTab].dashboardMock}
                </div>
              </div>

            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-24 bg-slate-50 px-5 py-24 sm:py-28 md:px-16 md:py-32"
      >
        <div className="mx-auto max-w-container-max">
          <ScrollReveal direction="up" className="mb-16 text-center sm:mb-20">
            <h2 className="mb-4 text-3xl font-bold text-midnight-navy sm:text-4xl md:text-5xl tracking-tight">
              The Pipeline to Success
            </h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600 sm:text-lg">
              Our streamlined process connects vision with resources through
              three critical phases.
            </p>
          </ScrollReveal>

          <div className="grid gap-8 md:grid-cols-3 md:gap-10 relative">
            {PIPELINE_STEPS.map(
              ({ step, title, description, image, imageAlt, imageClass, featured }, index) => (
                <ScrollReveal
                  key={step}
                  direction="up"
                  delay={index * 150}
                  className="h-full"
                >
                  <div
                    className={`interactive-hover-glow h-full bg-white border border-slate-100 hover:border-blue-200/50 rounded-[2rem] p-8 sm:p-10 relative overflow-hidden group shadow-[0_4px_24px_rgba(15,23,42,0.02)] ${
                      featured ? "md:-mt-2 ring-2 ring-blue-600/10 shadow-lg" : ""
                    }`}
                  >
                    {/* Step Connector Line on Desktop */}
                    {index < 2 && (
                      <div className="hidden md:block absolute top-12 -right-6 w-12 h-0.5 border-t-2 border-dashed border-slate-200 z-0" />
                    )}

                    {featured && (
                      <div className="pointer-events-none absolute right-0 top-0 p-4">
                        <Network className="h-16 w-16 text-blue-500/15 transition-transform duration-500 group-hover:scale-125 group-hover:rotate-45" />
                      </div>
                    )}
                    
                    <div className="mb-6 inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 font-label text-lg font-bold text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                      {step.replace(".", "")}
                    </div>
                    
                    <h3 className="mb-3 text-xl font-bold text-midnight-navy sm:mb-4 group-hover:text-blue-600 transition-colors duration-300">
                      {title}
                    </h3>
                    <p className="mb-6 text-slate-600 text-sm sm:text-base sm:mb-8 leading-relaxed">{description}</p>
                    
                    <div className="h-40 w-full overflow-hidden rounded-2xl border border-slate-100 sm:h-48 shadow-inner bg-slate-50 relative hover-zoom-container">
                      <img
                        src={image}
                        alt={imageAlt}
                        className={`hover-zoom-img h-full w-full ${imageClass}`}
                        loading="lazy"
                      />
                    </div>
                  </div>
                </ScrollReveal>
              ),
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section
        id="cta"
        className="relative scroll-mt-24 overflow-hidden px-5 py-20 sm:py-24 md:px-16 md:py-32 bg-slate-50"
      >
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[130px] sm:h-[900px] sm:w-[900px]" />
        </div>

        <ScrollReveal direction="up" className="w-full">
          <div className="relative z-10 mx-auto max-w-4xl rounded-[2.5rem] bg-gradient-to-br from-[#0f172a] to-[#1e293b] p-8 text-center sm:p-12 md:p-16 shadow-[0_20px_50px_rgba(15,23,42,0.35)] overflow-hidden border border-slate-800">
            <div className="absolute -left-16 -top-16 w-40 h-40 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -right-16 -bottom-16 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

            <h2 className="mb-4 text-3xl font-extrabold text-white sm:mb-6 sm:text-4xl md:text-5xl tracking-tight leading-tight">
              Raise the bar for your
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-indigo-300 bg-clip-text text-transparent">venture portfolio</span>
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-base text-slate-300 sm:text-lg leading-relaxed">
              Join the exclusive ecosystem where high-growth visionaries and
              institutional capital unite to build the future.
            </p>
            
            <div className="flex justify-center">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-blue-600 hover:bg-blue-500 px-10 py-4.5 text-base font-bold text-white no-underline shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 animate-btn-glow sm:px-12 sm:py-5"
              >
                Join the Pipeline
              </Link>
            </div>

            <div className="mt-10 flex flex-col items-center justify-center gap-4 font-label text-xs uppercase tracking-wider text-slate-400 sm:flex-row sm:gap-8">
              <span className="inline-flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                No upfront fees
              </span>
              <span className="inline-flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                SEC Compliant
              </span>
              <span className="inline-flex items-center gap-2 hover:text-emerald-400 transition-colors">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                $120M+ Capital Deployed
              </span>
            </div>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
};

export default HomePage;
