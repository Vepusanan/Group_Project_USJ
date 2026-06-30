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
  Link2,
  UserPlus,
  Compass,
  Handshake,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { AUTH_STATUS } from "../utils/authStateMachine.js";
import ScrollReveal from "../components/ScrollReveal";
const LightMeshSVG = () => (
  <svg className="w-full h-full opacity-[0.22] text-slate-400" viewBox="0 0 100 100" fill="none" stroke="currentColor">
    <path d="M0,0 L30,20 L50,0 L80,30 L100,10 M30,20 L60,50 L80,30 M0,50 L30,20 L30,70 M30,70 L60,50 L50,100 M60,50 L100,60 L80,30 M100,60 L100,10 M30,70 L0,100 L50,100 M100,60 L100,100 L50,100" strokeWidth="0.5" />
    <circle cx="30" cy="20" r="1.2" fill="currentColor" />
    <circle cx="50" cy="0" r="1.2" fill="currentColor" />
    <circle cx="80" cy="30" r="1.2" fill="currentColor" />
    <circle cx="60" cy="50" r="1.2" fill="currentColor" />
    <circle cx="30" cy="70" r="1.2" fill="currentColor" />
    <circle cx="100" cy="60" r="1.2" fill="currentColor" />
  </svg>
);

const GlobeNetworkSVG = () => (
  <div className="w-full h-full bg-[#0a1128]/90 rounded-3xl relative overflow-hidden flex items-center justify-center border border-blue-500/20 shadow-md">
    <div className="absolute w-20 h-20 bg-blue-500/10 rounded-full blur-xl" />
    <svg className="w-4/5 h-4/5 stroke-blue-400/40" viewBox="0 0 100 100" fill="none">
      <circle cx="50" cy="50" r="35" stroke="rgba(59,130,246,0.12)" strokeWidth="1" />
      <circle cx="50" cy="50" r="25" stroke="rgba(59,130,246,0.08)" strokeWidth="1" />
      <path d="M50,15 L35,30 L65,30 L50,15 M35,30 L25,50 L50,50 L35,30 M65,30 L75,50 L50,50 L65,30 M25,50 L35,70 L65,70 L75,50 M35,70 L50,85 L65,70" strokeWidth="0.5" />
      <path d="M50,15 L50,85 M25,50 L75,50" strokeWidth="0.5" strokeDasharray="1,2" />
      <circle cx="50" cy="15" r="1.5" fill="#60a5fa" />
      <circle cx="35" cy="30" r="1.5" fill="#60a5fa" />
      <circle cx="65" cy="30" r="1.5" fill="#60a5fa" />
      <circle cx="25" cy="50" r="1.5" fill="#60a5fa" />
      <circle cx="75" cy="50" r="1.5" fill="#60a5fa" />
      <circle cx="35" cy="70" r="1.5" fill="#60a5fa" />
      <circle cx="65" cy="70" r="1.5" fill="#60a5fa" />
      <circle cx="50" cy="85" r="1.5" fill="#60a5fa" />
      <circle cx="50" cy="50" r="2" fill="#3b82f6" className="animate-pulse" />
    </svg>
  </div>
);

const LandscapeMeshSVG = () => (
  <div className="w-full h-full bg-[#080d1e]/90 rounded-3xl relative overflow-hidden flex items-center justify-center border border-indigo-500/20 shadow-md">
    <div className="absolute w-20 h-20 bg-indigo-500/10 rounded-full blur-xl" />
    <svg className="w-full h-full opacity-70 stroke-indigo-400/45" viewBox="0 0 100 60" fill="none">
      <path d="M0,40 Q25,25 50,40 T100,35 M0,47 Q25,32 50,47 T100,42 M0,54 Q25,39 50,54 T100,49" strokeWidth="0.5" />
      <path d="M10,60 L20,32 M30,60 L40,35 M50,60 L50,40 M70,60 L60,35 M90,60 L80,32" strokeWidth="0.5" />
      <circle cx="20" cy="32" r="1" fill="#818cf8" />
      <circle cx="40" cy="35" r="1" fill="#818cf8" />
      <circle cx="50" cy="40" r="1" fill="#818cf8" />
      <circle cx="60" cy="35" r="1" fill="#818cf8" />
      <circle cx="80" cy="32" r="1" fill="#818cf8" />
    </svg>
  </div>
);

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
    image: "/images/home/card1.png",
    imageAlt: "Create profile illustration",
  },
  {
    step: "02.",
    title: "Discover & Connect",
    description:
      "Leverage our proprietary matching to identify the perfect partner. Filter by industry, stage, and strategic alignment in real-time.",
    image: "/images/home/card3.png",
    imageAlt: "Discover and connect illustration",
  },
  {
    step: "03.",
    title: "Collaborate & Grow",
    description:
      "Finalize terms within secure data rooms. Access legal toolkits and post-funding support to scale your horizons.",
    image: "/images/home/card2.png",
    imageAlt: "Collaborate and grow illustration",
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
      {/* Global SVG clip-path for double-layered glassmorphic cutout layout */}
      <svg className="absolute w-0 h-0" width="0" height="0">
        <defs>
          <clipPath id="glass-clip" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 L 0.54,0 Q 0.58,0 0.58,0.05 L 0.58,0.36 Q 0.58,0.45 0.67,0.45 L 1,0.45 L 1,1 L 0,1 Z" />
          </clipPath>
          <clipPath id="about-glass-clip" clipPathUnits="objectBoundingBox">
            {/* Optimized for narrower 3-column cards */}
            <path d="M 0,0 L 0.66,0 Q 0.70,0 0.70,0.05 L 0.70,0.26 Q 0.70,0.32 0.80,0.32 L 1,0.32 L 1,1 L 0,1 Z" />
          </clipPath>
        </defs>
      </svg>
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
        className="scroll-mt-24 px-5 py-24 sm:py-28 md:px-16 flex justify-center bg-[#faf8f5] border-t border-slate-100"
      >
        <div className="w-full max-w-container-max flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Details */}
          <div className="w-full lg:w-[38%] flex flex-col justify-start">
            <ScrollReveal direction="left" className="w-full">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-widest font-label w-max mb-4 inline-block">
                About Us
              </span>
              <h2 className="text-3.5xl md:text-[2.75rem] font-bold leading-[1.1] text-midnight-navy tracking-tight mb-6 font-display">
                Bridging the Gap in Venture Financing
              </h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-8 text-justify">
                StartupConnect matches high-growth startups with strategic capitals, and strategic investors. We believe the next through an integrated vetting, evaluation, and secure compliance environment. We remove operational friction so you can focus on building relationships.
              </p>
              
              <div className="space-y-4 mb-10">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Accredited and vetted investor pool</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center flex-shrink-0">
                    <Check className="h-3 w-3 stroke-[3]" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">SEC and regulatory compliance safeguards</span>
                </div>
              </div>

              {/* Key Platform Pillars with line & diamond */}
              <div className="flex items-center gap-4">
                <span className="font-display text-base font-bold text-midnight-navy tracking-tight whitespace-nowrap">
                  Key Platform Pillars
                </span>
                <div className="h-[1px] flex-grow bg-slate-200 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 border border-slate-300 bg-[#faf8f5]" />
                </div>
              </div>
            </ScrollReveal>
          </div>
          {/* Right Column: 3 Content Cards */}
          <div className="w-full lg:w-[62%] grid grid-cols-1 sm:grid-cols-3 gap-6">
            
            {/* Card 1: Building Solutions */}
            <ScrollReveal direction="up" delay={100} className="h-full">
              <div
                className="group relative h-[440px] bg-gradient-to-br from-amber-500 to-orange-600 rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-4 border-white/90 overflow-hidden flex flex-col justify-between"
              >
                {/* Glassmorphic Background overlay clipped to expose the top-right color quadrant */}
                <div 
                  className="absolute inset-0 bg-white/75 backdrop-blur-lg z-0" 
                  style={{ clipPath: "url(#about-glass-clip)" }}
                />

                {/* White Highlight Border Stroke matching the custom cutout curve */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M 66,0 Q 70,0 70,5 L 70,26 Q 70,32 80,32 L 100,32" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.75)" 
                    strokeWidth="1.5" 
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* Content Layers */}
                <div className="relative z-20 flex flex-col justify-between h-full w-full">
                  <div className="flex justify-between items-start">
                    <div className="w-[64%]">
                      <span className="px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/80 border border-slate-200/40 text-slate-700 shadow-sm">
                        FOUNDATION
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-4 leading-tight tracking-tight">
                        Building Solutions, Expanding Horizons
                      </h3>
                    </div>

                    {/* Icon placed inside the exposed color quadrant */}
                    <div className="absolute top-0 right-0 w-[30%] h-[30%] flex items-center justify-end mt-4 mr-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/90 shadow-lg border border-amber-200/40 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                        <Link2 className="h-5.5 w-5.5 text-amber-600 rotate-45" />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed text-justify font-normal mt-auto pr-1">
                    StartupConnect bridges the gap between ambitious founders and strategic investors. We believe the next generation of deep tech and software innovations shouldn't be stalled by access to capital.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 2: Verified Ecosystem */}
            <ScrollReveal direction="up" delay={200} className="h-full">
              <div
                className="group relative h-[440px] bg-gradient-to-br from-blue-500 to-indigo-600 rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-4 border-white/90 overflow-hidden flex flex-col justify-between"
              >
                {/* Glassmorphic Background overlay clipped to expose the top-right color quadrant */}
                <div 
                  className="absolute inset-0 bg-white/75 backdrop-blur-lg z-0" 
                  style={{ clipPath: "url(#about-glass-clip)" }}
                />

                {/* White Highlight Border Stroke matching the custom cutout curve */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M 66,0 Q 70,0 70,5 L 70,26 Q 70,32 80,32 L 100,32" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.75)" 
                    strokeWidth="1.5" 
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* Content Layers */}
                <div className="relative z-20 flex flex-col justify-between h-full w-full">
                  <div className="flex justify-between items-start">
                    <div className="w-[64%]">
                      <span className="px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/80 border border-slate-200/40 text-slate-700 shadow-sm">
                        TRUST
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-4 leading-tight tracking-tight">
                        Verified Ecosystem
                      </h3>
                    </div>

                    {/* Icon placed inside the exposed color quadrant */}
                    <div className="absolute top-0 right-0 w-[30%] h-[30%] flex items-center justify-end mt-4 mr-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/90 shadow-lg border border-blue-200/40 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                        <ShieldCheck className="h-5.5 w-5.5 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed text-justify font-normal mt-auto pr-1">
                    Every participant undergoes rigorous background checks and accreditation verification to ensure high-stakes professional integrity. Our secure framework checks credentials, verifies investor status, and validates startup histories to foster trust and accelerate high-value dealmaking.
                  </p>
                </div>
              </div>
            </ScrollReveal>

            {/* Card 3: Rapid Deployment */}
            <ScrollReveal direction="up" delay={300} className="h-full">
              <div
                className="group relative h-[440px] bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-4 border-white/90 overflow-hidden flex flex-col justify-between"
              >
                {/* Glassmorphic Background overlay clipped to expose the top-right color quadrant */}
                <div 
                  className="absolute inset-0 bg-white/75 backdrop-blur-lg z-0" 
                  style={{ clipPath: "url(#about-glass-clip)" }}
                />

                {/* White Highlight Border Stroke matching the custom cutout curve */}
                <svg 
                  className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                  viewBox="0 0 100 100" 
                  preserveAspectRatio="none"
                >
                  <path 
                    d="M 66,0 Q 70,0 70,5 L 70,26 Q 70,32 80,32 L 100,32" 
                    fill="none" 
                    stroke="rgba(255,255,255,0.75)" 
                    strokeWidth="1.5" 
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>

                {/* Content Layers */}
                <div className="relative z-20 flex flex-col justify-between h-full w-full">
                  <div className="flex justify-between items-start">
                    <div className="w-[64%]">
                      <span className="px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/80 border border-slate-200/40 text-slate-700 shadow-sm">
                        SPEED
                      </span>
                      <h3 className="text-lg font-bold text-slate-900 mt-4 leading-tight tracking-tight">
                        Rapid Deployment
                      </h3>
                    </div>

                    {/* Icon placed inside the exposed color quadrant */}
                    <div className="absolute top-0 right-0 w-[30%] h-[30%] flex items-center justify-end mt-4 mr-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/90 shadow-lg border border-emerald-200/40 flex items-center justify-center group-hover:scale-110 transition-all duration-500">
                        <TrendingUp className="h-5.5 w-5.5 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed text-justify font-normal mt-auto pr-1">
                    Accelerate the fundraising process from months to weeks using our targeted matching algorithms and deal pipeline automation. Connect instantly with active venture capital firms, manage document shares, and streamline communications to close funding rounds faster.
                  </p>
                </div>
              </div>
            </ScrollReveal>

          </div>
        </div>
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
              <div className="relative flex bg-slate-300/30 backdrop-blur-md p-1 rounded-2xl border border-slate-200/40 shadow-lg w-72">
                {/* Switch sliding indicator */}
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white/90 backdrop-blur-sm rounded-xl shadow-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                    showroomTab === "founder" ? "left-1" : "left-[calc(50%+2px)]"
                  }`}
                />
                <button
                  onClick={() => setShowroomTab("founder")}
                  className={`relative z-10 flex-1 py-2.5 text-xs font-bold font-label uppercase tracking-wider rounded-xl transition-colors duration-305 ${
                    showroomTab === "founder" ? "text-blue-600" : "text-slate-700 hover:text-slate-950"
                  }`}
                >
                  Founders
                </button>
                <button
                  onClick={() => setShowroomTab("investor")}
                  className={`relative z-10 flex-1 py-2.5 text-xs font-bold font-label uppercase tracking-wider rounded-xl transition-colors duration-305 ${
                    showroomTab === "investor" ? "text-blue-600" : "text-slate-700 hover:text-slate-955"
                  }`}
                >
                  Investors
                </button>
              </div>
            </div>
          </ScrollReveal>

          {/* Showroom Content Card */}
          <ScrollReveal direction="none" delay={150} className="w-full">
            <div 
              className={`group relative border-4 border-white/95 rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-hidden min-h-[480px] flex flex-col lg:flex-row items-center gap-12 lg:gap-16 transition-all duration-700 ${
                showroomTab === "founder" 
                  ? "bg-gradient-to-br from-blue-500 via-indigo-650 to-purple-800" 
                  : "bg-gradient-to-br from-purple-500 via-indigo-650 to-blue-800"
              }`}
            >
              {/* Glassmorphic Background overlay clipped to expose the top-right color quadrant */}
              <div 
                className="absolute inset-0 bg-white/75 backdrop-blur-xl z-0 pointer-events-none" 
                style={{ clipPath: "url(#glass-clip)" }}
              />

              {/* White Highlight Border Stroke matching the custom cutout curve */}
              <svg 
                className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                viewBox="0 0 100 100" 
                preserveAspectRatio="none"
              >
                <path 
                  d="M 54,0 Q 58,0 58,5 L 58,36 Q 58,45 67,45 L 100,45" 
                  fill="none" 
                  stroke="rgba(255,255,255,0.75)" 
                  strokeWidth="1.5" 
                  vectorEffect="non-scaling-stroke"
                />
              </svg>

              {/* Left Column: Features info */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center relative z-20">
                <span className="inline-flex px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/80 border border-slate-200/40 text-slate-700 shadow-sm w-max mb-5">
                  {SHOWROOM_DATA[showroomTab].badge}
                </span>
                <h3 className="text-2xl md:text-3.5xl font-bold text-slate-900 mb-5 tracking-tight transition-all duration-300">
                  {SHOWROOM_DATA[showroomTab].title}
                </h3>
                <p className="text-slate-700 text-sm md:text-base leading-relaxed mb-8">
                  {SHOWROOM_DATA[showroomTab].description}
                </p>

                {/* Features Checklist */}
                <div className="space-y-6">
                  {SHOWROOM_DATA[showroomTab].features.map((feat) => {
                    const IconComp = feat.icon;
                    return (
                      <div key={feat.title} className="flex gap-4 group">
                        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-50/80 border border-blue-100/30 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all duration-300 shadow-sm">
                          <IconComp className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors duration-200">
                            {feat.title}
                          </h4>
                          <p className="text-xs md:text-sm text-slate-600 mt-1 leading-relaxed">
                            {feat.desc}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Premium Mock Dashboard Graphic */}
              <div className="w-full lg:w-1/2 flex items-center justify-center relative z-20">
                {/* Glowing decorative gradient behind mock UI */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-white/5 rounded-3xl blur-2xl pointer-events-none" />
                <div className="w-full max-w-md transition-all duration-500 transform hover:scale-[1.02] shadow-2xl rounded-3xl">
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
        className="scroll-mt-24 bg-[#faf8f5] px-5 py-24 sm:py-28 md:px-16 md:py-32 border-t border-slate-100 relative overflow-hidden"
      >


        {/* Background glow decorators */}
        <div className="absolute -left-40 top-40 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -right-40 bottom-20 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-container-max relative z-10">
          <ScrollReveal direction="up" className="mb-16 text-center sm:mb-20">
            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 uppercase tracking-widest font-label w-max mb-4 inline-block">
              Platform Workflow
            </span>
            <h2 className="mb-4 text-3.5xl md:text-[2.75rem] font-bold text-midnight-navy sm:text-4xl md:text-5xl tracking-tight font-display">
              The Pipeline to Success
            </h2>
            <p className="mx-auto max-w-2xl text-sm md:text-base text-slate-655">
              Our streamlined matching pipeline connects ambitious vision with strategic resources through three transparent, security-first phases.
            </p>
          </ScrollReveal>

          <div className="grid gap-16 lg:grid-cols-3 lg:gap-10 relative">
            {PIPELINE_STEPS.map(
              ({ step, title, description, image, imageAlt }, index) => {
                const stepNum = step.replace(".", "");

                // Premium base/watermark colors corresponding to step index
                const stepColors = [
                  {
                    cardBg: "from-blue-500 to-indigo-650",
                    watermarkText: "text-blue-950/20",
                    bulletText: "text-blue-600",
                  },
                  {
                    cardBg: "from-amber-500 to-orange-655",
                    watermarkText: "text-amber-955/20",
                    bulletText: "text-amber-600",
                  },
                  {
                    cardBg: "from-emerald-500 to-teal-655",
                    watermarkText: "text-emerald-955/20",
                    bulletText: "text-emerald-600",
                  },
                ][index];

                const pipelineFeatures = [
                  [
                    "Data-Rich Pitch Decks",
                    "Verified Key Metrics",
                    "Institutional-Ready Profiles"
                  ],
                  [
                    "Proprietary Matchmaking",
                    "Real-Time Inboxes",
                    "Calendar Connections"
                  ],
                  [
                    "Secure Data Rooms",
                    "Legal Frameworks",
                    "Post-Funding Analytics"
                  ]
                ];

                return (
                  <ScrollReveal
                    key={step}
                    direction="up"
                    delay={index * 150}
                    className="h-full relative"
                  >
                    {/* Step Connector Line on Desktop */}
                    {index < 2 && (
                      <div className="hidden lg:block absolute top-[50%] -right-12 w-14 h-24 z-0 pointer-events-none -translate-y-1/2">
                        <svg className="w-full h-full text-slate-200" viewBox="0 0 60 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M 0 75 Q 15 75 15 60 L 15 30 Q 15 15 30 15 L 45 15" />
                        </svg>
                      </div>
                    )}

                    <div
                      className={`group relative h-[475px] bg-gradient-to-br ${stepColors.cardBg} rounded-[2.5rem] p-8 shadow-xl transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl border-4 border-white/90 overflow-hidden flex flex-col justify-between`}
                    >
                      {/* Glassmorphic Background overlay clipped to expose the top-right color quadrant */}
                      <div 
                        className="absolute inset-0 bg-white/75 backdrop-blur-lg z-0" 
                        style={{ clipPath: "url(#glass-clip)" }}
                      />

                      {/* White Highlight Border Stroke matching the custom cutout curve */}
                      <svg 
                        className="absolute inset-0 w-full h-full pointer-events-none z-10" 
                        viewBox="0 0 100 100" 
                        preserveAspectRatio="none"
                      >
                        <path 
                          d="M 54,0 Q 58,0 58,5 L 58,36 Q 58,45 67,45 L 100,45" 
                          fill="none" 
                          stroke="rgba(255,255,255,0.75)" 
                          strokeWidth="1.5" 
                          vectorEffect="non-scaling-stroke"
                        />
                      </svg>

                      {/* Content Layers on top of glass */}
                      <div className="relative z-20 flex flex-col justify-between h-full w-full">
                        {/* Top Area */}
                        <div className="flex justify-between items-start">
                          {/* Title + Badging */}
                          <div className="w-[54%]">
                            <div className="flex items-center gap-3 mb-4">
                              <span className="px-3.5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-white/80 border border-slate-200/40 text-slate-700 shadow-sm">
                                STEP {stepNum}
                              </span>
                              <span className={`text-4xl font-extrabold font-sans leading-none select-none ${stepColors.watermarkText}`}>
                                {stepNum}
                              </span>
                            </div>
                            <h3 className="text-2.5xl font-bold text-slate-900 leading-tight tracking-tight">
                              {title}
                            </h3>
                          </div>

                          {/* Image placed inside the exposed color quadrant */}
                          <div className="absolute top-0 right-0 w-[42%] h-[40%] flex items-center justify-end">
                            <img
                              src={image}
                              alt={imageAlt}
                              className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                              loading="lazy"
                            />
                          </div>
                        </div>

                        {/* Bottom Area */}
                        <div className="space-y-4 pt-6 mt-auto">
                          <p className="text-sm text-slate-700 leading-relaxed text-justify font-normal pr-1">
                            {description}
                          </p>
                          <div className="border-t border-slate-200/60 w-full" />
                          <ul className="space-y-3">
                            {pipelineFeatures[index].map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-3 text-xs font-bold text-slate-800">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] bg-white border border-slate-200/40 shadow-sm ${stepColors.bulletText}`}>✓</span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                );
              },
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
