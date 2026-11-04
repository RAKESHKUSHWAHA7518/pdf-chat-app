import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/authContext.js";

const ELENA_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuDqQliqZu1Yvw6_zYrMbPstYpEx8kJ0Rd34DOxfKAhMDCuo27E7sNNxVqqEAiZB6Wbc4h1EyYj2HTAlDRw6ShLV2CI7VoprJ2Ux8c4k2L_0_UrsuuykHeX8lwy4aWB-s0sIvSIvP2T_hVM4-y_U7Ru6JacHnJi0xcBOpM8VQGxogQsq4bU-R3gycso0Xf_gIpjSiEszG5TVol8wMvetd7kLkCEmk9VJrYGnvu4NrlWA";
const MARCUS_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuAN2nnJl780Ih3oNFlDh8TW1SHj72J630Sg_r77r_z8emKtsbo72szQnbyJvGTWjf83rTMshdVyRhwDvgQ2WNFffTaH3qPfaAk1BrT-s8yC6ZLEpHPTq6-IQQ0B3IzSoNENBawu5SpqNLyZObpYRKPWPFo9OsP0kC26Q6sOBiqNmGUhphpIfQ8MWcSVzdve1cLK8xiqWPvbtvnoW8hlHZAda5hpHJQ1bE-Ac_FM0J6C";
const DAVID_IMG = "https://lh3.googleusercontent.com/aida-public/AB6AXuAQIm68sUxiYiekV0qs--jI44ejuYLw4RBj6DG7-EBiPfj020Ogvi8U79QQmCTmRgEjkxXGIGuG2DalDxhLhrVqEDiNzLaA0NwzsV2aTMPyviwW5XcfbSc9qHDkeuye9CNa_JsDQ5TW2KpKvabFB18Mtdft-tuccBDLtvWqF-4KcU4_I02aklG-osG6kmZSrARRn6rSrIID4aYuFemRXakvbyZUB-whZxvOVqcywm3y";

function Logo({ className = "w-8 h-8" }) {
  return (
    <div className={`relative flex items-center justify-center shrink-0 ${className}`}>
      <svg
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-[0_2px_10px_rgba(168,85,247,0.45)]"
      >
        <defs>
          <linearGradient id="devsuite-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="devsuite-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="devsuite-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F472B6" />
            <stop offset="100%" stopColor="#C084FC" />
          </linearGradient>
        </defs>

        {/* Container badge */}
        <rect
          x="1.5"
          y="1.5"
          width="33"
          height="33"
          rx="9"
          fill="url(#devsuite-bg-grad)"
          stroke="url(#devsuite-logo-grad)"
          strokeWidth="1.5"
        />

        {/* Document / Code bracket silhouette */}
        <path
          d="M10 8.5C10 7.67157 10.6716 7 11.5 7H19.5L25 12.5V26.5C25 27.3284 24.3284 28 23.5 28H11.5C10.6716 28 10 27.3284 10 26.5V8.5Z"
          fill="url(#devsuite-logo-grad)"
          fillOpacity="0.18"
          stroke="url(#devsuite-logo-grad)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />

        {/* Folded corner tab */}
        <path
          d="M19.5 7V12.5H25"
          stroke="url(#devsuite-logo-grad)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />

        {/* Code glyph lines */}
        <line x1="13.5" y1="16" x2="18.5" y2="16" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="13.5" y1="19.5" x2="17.5" y2="19.5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />

        {/* AI Sparkle */}
        <path
          d="M22 17.5L22.8 19.8L25.1 20.6L22.8 21.4L22 23.7L21.2 21.4L18.9 20.6L21.2 19.8L22 17.5Z"
          fill="url(#devsuite-sparkle-grad)"
        />
        <circle cx="15.5" cy="23.5" r="1.1" fill="#6366F1" />
      </svg>
    </div>
  );
}

function TestimonialAvatar({ src, name, initials }) {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) {
    return (
      <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-neon-indigo via-neon-violet to-neon-fuchsia flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
        {initials}
      </div>
    );
  }
  return (
    <img
      className="w-11 h-11 rounded-full object-cover shadow-md shrink-0"
      src={src}
      alt={name}
      onError={() => setHasError(true)}
    />
  );
}

export function LandingPage() {
  const [activeHeroTab, setActiveHeroTab] = useState("pdf-chat");
  const [highlighted, setHighlighted] = useState(false);
  const [mockInput, setMockInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pricingInterval, setPricingInterval] = useState("monthly"); // "monthly" | "yearly"
  const heroWindowRef = useRef(null);
  const { isAuthenticated } = useAuth();

  const handleMouseMove = (e) => {
    if (!heroWindowRef.current) return;
    const rect = heroWindowRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    heroWindowRef.current.style.setProperty("--mouse-x", `${x}px`);
    heroWindowRef.current.style.setProperty("--mouse-y", `${y}px`);
  };

  const triggerCitationGlow = () => {
    setHighlighted(true);
    setTimeout(() => setHighlighted(false), 2200);
  };

  const handlePromptSubmit = (e) => {
    e.preventDefault();
    if (mockInput.trim()) {
      window.location.href = `/dashboard/chat-pdf?q=${encodeURIComponent(mockInput)}`;
    } else {
      window.location.href = "/app";
    }
  };

  const HERO_TABS = [
    { id: "pdf-chat", label: "PDF Intelligence", icon: "description", badge: "RAG Engine" },

    { id: "diagrams", label: "Architecture Studio", icon: "schema", badge: "Mermaid.js" },
    { id: "ats-matcher", label: "ATS Resume Matcher", icon: "track_changes", badge: "STAR AI" },
    { id: "repo-docs", label: "Repo Docs Gen", icon: "menu_book", badge: "Docs Gen" },

  ];

  return (
    <div className="w-full bg-surface-base text-on-surface font-body-md antialiased selection:bg-neon-indigo selection:text-text-primary min-h-screen overflow-x-hidden relative">

      {/* ───────────────────────────────────────────────────────────── */}
      {/* HEADER / NAVIGATION                                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      <header className="fixed top-0 w-full z-50 bg-surface-glass backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.4)] border-b border-glass-border/40">
        <div className="h-16 sm:h-20 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">

          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2.5 sm:gap-3 group shrink-0">
            <Logo className="w-8 h-8 sm:w-9 sm:h-9 transition-transform group-hover:scale-105 shrink-0" />
            <div className="flex flex-col">
              <span className="font-headline-sm text-lg sm:text-headline-sm text-text-primary tracking-tight font-bold whitespace-nowrap flex items-center gap-1.5">
                DevSuite AI
                <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded-full bg-neon-indigo/20 text-neon-indigo border border-neon-indigo/30 hidden sm:inline-block">
                  v2.5
                </span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-7">
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium" href="#suite">
              AI Workspaces
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium" href="#features">
              Features
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium" href="#how-it-works">
              How It Works
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium" href="#pricing">
              Pricing
            </a>
            <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors font-medium" to="/docs">
              Docs
            </Link>
          </nav>

          {/* CTA Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {isAuthenticated ? (
              <Link
                className="inline-flex items-center justify-center px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-full font-body-sm text-xs sm:text-body-sm font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_28px_rgba(168,85,247,0.55)] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0"
                to="/app"
              >
                <span className="hidden sm:inline">Open&nbsp;</span>
                <span>Dashboard</span>
                <span className="material-symbols-outlined text-[14px] sm:text-[18px] ml-1">arrow_forward</span>
              </Link>
            ) : (
              <>
                <Link
                  className="hidden sm:inline-flex items-center px-4 py-2 rounded-lg font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
                  to="/login"
                >
                  Sign In
                </Link>
                <Link
                  className="inline-flex items-center justify-center px-3 sm:px-6 py-1.5 sm:py-2.5 rounded-full font-body-sm text-xs sm:text-body-sm font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia shadow-[0_0_18px_rgba(168,85,247,0.4)] hover:shadow-[0_0_28px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0"
                  to="/app"
                >
                  <span>Launch Free</span>
                  <span className="material-symbols-outlined text-[14px] sm:text-[16px] ml-1">bolt</span>
                </Link>
              </>
            )}

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-9 h-9 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg transition-colors shrink-0 bg-surface-container"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[22px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-surface-raised border-t border-glass-border px-5 py-5 space-y-4">
            <nav className="flex flex-col space-y-2.5">
              <a onClick={() => setMobileMenuOpen(false)} href="#suite" className="text-body-sm text-on-surface-variant hover:text-on-surface py-1 font-medium">All 7 AI Workspaces</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#features" className="text-body-sm text-on-surface-variant hover:text-on-surface py-1 font-medium">Core Capabilities</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#pricing" className="text-body-sm text-on-surface-variant hover:text-on-surface py-1 font-medium">Pricing &amp; Plans</a>
              <Link onClick={() => setMobileMenuOpen(false)} to="/docs" className="text-body-sm text-on-surface-variant hover:text-on-surface py-1 font-medium">Documentation</Link>
            </nav>
            <div className="pt-3 border-t border-glass-border flex flex-col gap-2.5">
              <Link onClick={() => setMobileMenuOpen(false)} to="/login" className="text-center py-2.5 text-body-sm text-text-primary bg-surface-container rounded-lg font-medium">Sign In</Link>
              <Link onClick={() => setMobileMenuOpen(false)} to="/app" className="text-center py-2.5 text-body-sm font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia rounded-full shadow-md">Get Started Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN CONTENT                                                  */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="w-full pt-20 sm:pt-24 bg-surface-base overflow-x-hidden relative">

        {/* Dynamic Atmospheric Glow Orbs (contained to prevent horizontal overflow) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
          <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[800px] max-w-[100vw] h-[380px] bg-gradient-to-r from-neon-indigo/25 via-neon-violet/25 to-neon-fuchsia/20 blur-[140px] rounded-full"></div>
          <div className="absolute top-[1300px] -left-48 w-[550px] h-[550px] bg-neon-indigo/15 blur-[160px] rounded-full"></div>
          <div className="absolute top-[2400px] -right-48 w-[550px] h-[550px] bg-neon-fuchsia/15 blur-[170px] rounded-full"></div>
          <div className="absolute inset-0 bg-[radial-gradient(#464554_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.06]"></div>
        </div>

        {/* ============================================================== */}
        {/* SECTION 1: HERO SECTION                                         */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 pt-8 sm:pt-14 pb-16 flex flex-col items-center text-center">

          {/* Announcement Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container/90 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] border border-white/10 mb-6 transition-all hover:border-neon-indigo/50 cursor-default">
            <span className="w-2 h-2 rounded-full bg-neon-fuchsia animate-pulse"></span>
            <span className="font-label-code text-xs sm:text-label-code text-text-primary font-medium tracking-tight">
              ✨ DevSuite AI 2.0 • Powered by Gemini 2.5 Flash + MongoDB Atlas
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-display-hero text-3xl sm:text-5xl lg:text-6xl text-text-primary tracking-tight max-w-4xl mx-auto leading-[1.12] mb-5 font-extrabold">
            The All-in-One AI Suite for <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(168,85,247,0.4)]">
              Developers &amp; Tech Careers.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="font-body-lg text-sm sm:text-base lg:text-lg text-text-secondary max-w-2xl mx-auto mb-8 sm:mb-10 leading-relaxed">
            Chat with 500+ page technical PDFs with verifiable citations, generate viral GitHub profile READMEs, pass applicant tracking systems with Google STAR resume rewrites, and render live architecture diagrams.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 w-full sm:w-auto mb-10">
            <Link
              to="/app"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-headline-sm text-body-md font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia shadow-[0_0_28px_rgba(168,85,247,0.45)] hover:shadow-[0_0_38px_rgba(168,85,247,0.7)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
            >
              <span>Explore All 7 Workspaces Free</span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </Link>
            <a
              className="w-full sm:w-auto inline-flex items-center justify-center px-7 py-3.5 rounded-full font-body-md text-body-md text-text-primary bg-surface-container/70 hover:bg-surface-container-high/90 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] border border-white/5 transition-all"
              href="#suite"
            >
              <span>See Workspaces</span>
              <span className="material-symbols-outlined text-[16px] ml-1.5 text-text-muted">south</span>
            </a>
          </div>

          {/* Trust Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-5 sm:gap-9 text-text-muted font-body-sm text-xs sm:text-body-sm mb-12">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-success text-[18px]">verified_user</span>
              <span>Zero Document Training</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-neon-violet text-[18px]">bolt</span>
              <span>Sub-Second Streaming</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">token</span>
              <span>Free Starter Quota Included</span>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────── */}
          {/* INTERACTIVE MULTI-TOOL HERO PLAYGROUND (THE SHOWSTOPPER)       */}
          {/* ───────────────────────────────────────────────────────────── */}
          <div className="w-full max-w-5xl flex flex-col items-center">

            {/* Interactive Tab Switcher */}
            <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-surface-container/90 backdrop-blur-xl border border-glass-border mb-4 max-w-full overflow-x-auto scrollbar-none shadow-lg">
              {HERO_TABS.map((tab) => {
                const isActive = activeHeroTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveHeroTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl text-xs sm:text-body-sm font-semibold whitespace-nowrap transition-all ${
                      isActive
                        ? "bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia text-text-primary shadow-[0_0_16px_rgba(168,85,247,0.45)] scale-100"
                        : "text-text-secondary hover:text-text-primary hover:bg-surface-container-high/60"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Hero Product Window Frame */}
            <div
              ref={heroWindowRef}
              onMouseMove={handleMouseMove}
              className="w-full rounded-2xl bg-surface-raised/95 backdrop-blur-2xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] p-3 sm:p-5 text-left border border-white/10 relative overflow-hidden"
            >
              {/* Window Controls Header */}
              <div className="flex items-center justify-between pb-3 px-1 border-b border-glass-border/40 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error/70"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-success/70"></div>
                  <span className="ml-3 font-label-code text-xs text-text-muted hidden sm:inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[15px] text-neon-indigo">terminal</span>
                    devsuite.ai // workspace // {activeHeroTab}
                  </span>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/15 font-badge-caps text-[10px] text-success font-semibold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping"></span>
                    Live Engine
                  </span>
                  <Link
                    to={
                      activeHeroTab === "pdf-chat"
                        ? "/dashboard/chat-pdf"
                        : activeHeroTab === "diagrams"
                        ? "/dashboard/diagrams"
                        : activeHeroTab === "ats-matcher"
                        ? "/dashboard/ats-matcher"
                        : activeHeroTab === "repo-docs"
                        ? "/dashboard/repo-docs"
                        : "/dashboard/chat-pdf"
                    }
                    className="font-label-code text-xs px-2.5 py-1 rounded-lg bg-surface-container-high hover:bg-surface-variant text-neon-violet hover:text-text-primary transition-all flex items-center gap-1 font-semibold"
                  >
                    <span>Launch</span>
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                  </Link>
                </div>
              </div>

              {/* ───────────────────────────────────────────────────────── */}
              {/* TAB 1: PDF CHAT PREVIEW                                  */}
              {/* ───────────────────────────────────────────────────────── */}
              {activeHeroTab === "pdf-chat" && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 h-[420px] sm:h-[460px]">
                  {/* Left Pane: PDF Document Simulation */}
                  <div className="md:col-span-5 hidden md:flex flex-col bg-surface-container-lowest/80 rounded-xl p-4 overflow-hidden relative border border-white/5">
                    <div className="flex items-center justify-between text-text-muted font-label-code text-xs mb-3 pb-2 bg-surface-container-low/40 rounded px-2">
                      <span>Research_Paper_Q3.pdf • Pg 14</span>
                      <span className="text-neon-indigo font-semibold">Atlas Vector #8932</span>
                    </div>

                    <div className="space-y-2.5 opacity-90 overflow-hidden text-[11px] font-mono leading-relaxed text-text-secondary select-none">
                      <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
                        Section 3.2 // Distributed Consensus Latency
                      </p>
                      <p>
                        Across high-throughput Raft clusters, batch pipelining sustained low jitter during failover simulations.
                      </p>
                      <div
                        className={`p-2.5 rounded transition-all duration-500 ${
                          highlighted
                            ? "bg-neon-indigo/35 ring-2 ring-neon-fuchsia shadow-[0_0_20px_rgba(236,72,153,0.4)]"
                            : "bg-neon-indigo/15 shadow-[inset_0_0_12px_rgba(99,102,241,0.2)]"
                        } text-text-primary`}
                      >
                        <span className="text-neon-fuchsia font-bold font-label-code">[Target Source Citation §14.3]</span>
                        <p className="font-semibold text-text-primary mt-1">
                          "p99 write latency dropped to 4.2ms under 50,000 req/sec load with zero partition split-brain occurrences."
                        </p>
                      </div>
                      <p className="text-text-muted">
                        Memory consumption stabilized at 410MB per node with sub-second snapshot recoveries.
                      </p>
                    </div>

                    <div className="absolute bottom-3 left-4 right-4 py-1.5 px-3 rounded-lg bg-surface-container/90 backdrop-blur-md text-[11px] text-text-muted flex items-center justify-between border border-white/5">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-neon-indigo"></span> Match confidence: 99.4%
                      </span>
                      <span className="font-label-code text-success font-semibold">Zero Hallucinations</span>
                    </div>
                  </div>

                  {/* Right Pane: Real-Time Chat Workspace */}
                  <div className="col-span-1 md:col-span-7 flex flex-col justify-between bg-surface-container-lowest/90 rounded-xl p-3 sm:p-5 relative border border-white/5">
                    <div className="space-y-3.5 overflow-y-auto pr-1">
                      <div className="flex items-start justify-end gap-2">
                        <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-neon-indigo/80 to-neon-violet/80 p-3 text-text-primary text-xs sm:text-body-sm shadow-md">
                          What was the p99 write latency under 50k req/sec load?
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-indigo to-neon-fuchsia flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                          <span className="material-symbols-outlined text-[16px] text-text-primary">smart_toy</span>
                        </div>
                        <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-surface-container-high/70 backdrop-blur-md p-3.5 text-xs sm:text-body-sm shadow-sm space-y-2.5 border border-white/5">
                          <div className="flex items-center gap-2">
                            <span className="font-headline-sm font-semibold text-text-primary">Gemini 2.5 Flash</span>
                            <span className="font-badge-caps text-[10px] uppercase tracking-wider text-success bg-success/15 px-2 py-0.5 rounded-full">
                              Streamed in 180ms
                            </span>
                          </div>
                          <p className="text-on-surface leading-relaxed">
                            Under 50,000 req/sec load, the <strong className="text-text-primary font-semibold">p99 write latency dropped to 4.2ms</strong> with zero partition split-brain occurrences, maintaining steady 410MB node footprint.
                          </p>

                          <div className="pt-1.5 flex flex-wrap items-center gap-2">
                            <span className="text-text-muted text-[11px] font-semibold uppercase">Citations:</span>
                            <button
                              onClick={triggerCitationGlow}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neon-indigo/20 hover:bg-neon-indigo/35 text-text-primary font-label-code text-[11px] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[13px] text-neon-indigo">bookmark</span>
                              Page 14 (§14.3)
                            </button>
                            <button
                              onClick={triggerCitationGlow}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neon-violet/20 hover:bg-neon-violet/35 text-text-primary font-label-code text-[11px] transition-colors"
                            >
                              <span className="material-symbols-outlined text-[13px] text-neon-violet">table_chart</span>
                              Table 3.2
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <form onSubmit={handlePromptSubmit} className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2 border border-white/10">
                        <span className="material-symbols-outlined text-text-muted text-[18px]">search</span>
                        <input
                          className="bg-transparent flex-1 text-xs sm:text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                          type="text"
                          value={mockInput}
                          onChange={(e) => setMockInput(e.target.value)}
                          placeholder="Ask anything about the document..."
                        />
                        <button type="submit" className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-indigo to-neon-fuchsia flex items-center justify-center text-text-primary">
                          <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────── */}

              {/* ───────────────────────────────────────────────────────── */}


              {/* ───────────────────────────────────────────────────────── */}
              {/* TAB 3: ARCHITECTURE DIAGRAMS PREVIEW                     */}
              {/* ───────────────────────────────────────────────────────── */}
              {activeHeroTab === "diagrams" && (
                <div className="flex flex-col justify-between bg-surface-container-lowest/90 rounded-xl p-4 sm:p-6 h-[420px] sm:h-[460px] overflow-y-auto border border-white/5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-glass-border mb-3">
                      <div>
                        <div className="font-bold text-text-primary text-sm sm:text-base">
                          High-Concurrency Microservices Architecture
                        </div>
                        <div className="text-xs text-text-muted font-mono">Mermaid.js Flowchart • SVG &amp; 2x Retina PNG Export</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-md bg-indigo-500/20 text-indigo-300 font-mono font-semibold">
                          Retina 2x Export
                        </span>
                      </div>
                    </div>

                    {/* Interactive diagram visual representation */}
                    <div className="p-4 rounded-xl bg-surface-container/60 border border-white/5 flex flex-col items-center justify-center space-y-3">
                      <div className="px-5 py-2 rounded-lg bg-neon-indigo/30 border border-neon-indigo/50 text-xs font-mono text-white font-bold shadow-md">
                        [Client App] (Next.js 14)
                      </div>
                      <div className="text-neon-violet font-bold text-xs">↓ HTTPS / gRPC</div>
                      <div className="px-6 py-2.5 rounded-lg bg-neon-violet/30 border border-neon-violet/50 text-xs font-mono text-white font-bold shadow-md">
                        [Cloud API Gateway] &amp; Rate Limiter
                      </div>
                      <div className="text-neon-fuchsia font-bold text-xs">↓ Async Event Bus</div>
                      <div className="grid grid-cols-3 gap-3 w-full max-w-lg">
                        <div className="p-2.5 rounded-lg bg-surface-container-high text-center border border-white/5">
                          <div className="text-xs font-bold text-text-primary">Auth Service</div>
                          <div className="text-[10px] text-text-muted font-mono">JWT + Redis</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container-high text-center border border-white/5">
                          <div className="text-xs font-bold text-text-primary">Inference Core</div>
                          <div className="text-[10px] text-text-muted font-mono">Gemini 2.5 Flash</div>
                        </div>
                        <div className="p-2.5 rounded-lg bg-surface-container-high text-center border border-white/5">
                          <div className="text-xs font-bold text-text-primary">Data Vault</div>
                          <div className="text-[10px] text-text-muted font-mono">MongoDB Atlas</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-glass-border">
                    <span className="text-xs text-text-muted">Describe in natural English → Instant interactive diagram</span>
                    <Link to="/dashboard/diagrams" className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                      <span>Open Diagram Studio</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────── */}
              {/* TAB 4: ATS RESUME MATCHER PREVIEW                        */}
              {/* ───────────────────────────────────────────────────────── */}
              {activeHeroTab === "ats-matcher" && (
                <div className="flex flex-col justify-between bg-surface-container-lowest/90 rounded-xl p-4 sm:p-6 h-[420px] sm:h-[460px] overflow-y-auto border border-white/5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-glass-border mb-4">
                      <div>
                        <div className="font-bold text-text-primary text-sm sm:text-base">
                          ATS Match Analysis: Senior Full-Stack Engineer at Stripe
                        </div>
                        <div className="text-xs text-text-muted font-mono">Google STAR Rewriter &amp; Keyword Extraction</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-success/20 text-success text-xs font-bold font-mono">
                          89% Match Score
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 mb-3">
                      <div className="sm:col-span-4 p-3.5 rounded-xl bg-surface-container/70 border border-white/5 flex flex-col justify-between">
                        <div className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Keywords Match</div>
                        <div className="text-2xl font-extrabold text-success">14 / 16</div>
                        <div className="text-[11px] text-text-secondary mt-1">Matched: React, Node, Microservices, MongoDB, Docker</div>
                      </div>
                      <div className="sm:col-span-8 p-3.5 rounded-xl bg-surface-container/70 border border-white/5 space-y-2">
                        <div className="text-xs text-text-muted uppercase font-bold tracking-wider">Missing Critical Tech</div>
                        <div className="flex flex-wrap gap-1.5">
                          <span className="px-2 py-0.5 rounded bg-error/20 text-error text-[11px] font-mono font-semibold">+ Kafka Event Sinks</span>
                          <span className="px-2 py-0.5 rounded bg-error/20 text-error text-[11px] font-mono font-semibold">+ GraphQL Subscriptions</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs text-amber-300 font-bold">
                        <span className="material-symbols-outlined text-[16px]">auto_fix_high</span>
                        Google STAR Framework Rewrite
                      </div>
                      <p className="text-xs text-text-secondary leading-relaxed">
                        <strong className="text-text-primary">Before:</strong> "Built APIs for product payments."<br />
                        <strong className="text-success font-semibold">After:</strong> "Architected resilient Stripe checkout webhooks with Redis deduplication, achieving 99.98% payment success rate across $4.2M monthly transactions."
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-glass-border">
                    <span className="text-xs text-text-muted">Beat Taleo, Workday, and Greenhouse ATS screening</span>
                    <Link to="/dashboard/ats-matcher" className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold flex items-center gap-1.5 shadow-md">
                      <span>Test Your Resume</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────── */}
              {/* TAB 5: REPO DOCS STUDIO PREVIEW                          */}
              {/* ───────────────────────────────────────────────────────── */}
              {activeHeroTab === "repo-docs" && (
                <div className="flex flex-col justify-between bg-surface-container-lowest/90 rounded-xl p-4 sm:p-6 h-[420px] sm:h-[460px] overflow-y-auto border border-white/5 space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-3 border-b border-glass-border mb-3">
                      <div>
                        <div className="font-bold text-text-primary text-sm sm:text-base">
                          Target: https://github.com/expressjs/express
                        </div>
                        <div className="text-xs text-text-muted font-mono">Deep File Tree Inspection + Automatic Architecture Badges</div>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded bg-cyan-500/20 text-cyan-300 font-semibold font-mono">
                        Generated in 4s
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl bg-surface-container/70 border border-white/5 space-y-2 font-mono text-xs">
                      <div className="text-cyan-400 font-bold"># Express.js — Production Microservice Framework</div>
                      <p className="text-text-secondary">
                        Fast, unopinionated, minimalist web framework for Node.js.
                      </p>
                      <div className="pt-2 flex flex-wrap gap-2 text-[11px] text-text-muted">
                        <span>📦 npm: v4.18.2</span>
                        <span>⭐ Stars: 64,500</span>
                        <span>📄 License: MIT</span>
                        <span>🔒 CodeQL: Passing</span>
                      </div>
                      <div className="pt-2 text-text-secondary">
                        <strong>Architecture Pipeline:</strong> Router Middleware → Request Validation → Controller Dispatch → Error Handler.
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-glass-border">
                    <span className="text-xs text-text-muted">Supports public repos or private repos via linked GitHub token</span>
                    <Link to="/dashboard/repo-docs" className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                      <span>Generate Repo README</span>
                      <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </Link>
                  </div>
                </div>
              )}

              {/* ───────────────────────────────────────────────────────── */}

              {/* ───────────────────────────────────────────────────────── */}

            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 2: THE 7 DEVELOPER AI WORKSPACES                       */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 border-t border-glass-border/30" id="suite">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-neon-indigo/15 font-badge-caps text-badge-caps text-neon-indigo uppercase tracking-wider mb-4 border border-neon-indigo/20">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-indigo animate-pulse"></span>
              The Complete Developer AI Ecosystem
            </div>
            <h2 className="font-headline-xl text-2xl sm:text-4xl lg:text-5xl text-text-primary max-w-3xl leading-tight mb-4 font-extrabold">
              Document research and focused developer tools. <br />
              <span className="bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia bg-clip-text text-transparent">
                One unified developer command center.
              </span>
            </h2>
            <p className="font-body-md text-sm sm:text-base text-text-secondary max-w-2xl">
              From digesting 500+ page technical manuals to elevating your open-source identity, passing ATS resume algorithms, and designing distributed architecture systems.
            </p>
          </div>

          {/* 7 Workspaces Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {/* Tool 1: PDF Chat */}
            <Link to="/dashboard/chat-pdf" className="group rounded-2xl bg-surface-container/80 backdrop-blur-xl p-7 hover:bg-surface-container-high/90 transition-all duration-300 border border-glass-border/50 hover:border-neon-indigo/50 hover:-translate-y-1 shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-neon-indigo/15 text-neon-indigo flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">description</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-headline-sm text-lg text-text-primary font-bold">PDF Chat &amp; Vault</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-neon-indigo/20 text-neon-indigo font-bold">RAG Core</span>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Chat with 500+ page research papers and complex manuals with zero hallucinations and verified source page citations.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-white/5 flex items-center text-xs font-semibold text-neon-indigo group-hover:translate-x-1 transition-transform">
                <span>Open PDF Workspace</span>
                <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
              </div>
            </Link>


            {/* Tool 4: ATS Resume Matcher */}
            <Link to="/dashboard/ats-matcher" className="group rounded-2xl bg-surface-container/80 backdrop-blur-xl p-7 hover:bg-surface-container-high/90 transition-all duration-300 border border-glass-border/50 hover:border-amber-500/50 hover:-translate-y-1 shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">track_changes</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-headline-sm text-lg text-text-primary font-bold">ATS Resume Matcher</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold">STAR AI</span>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Benchmark your resume against real job descriptions, reveal missing tech keywords, and get Google STAR rewrites with metrics.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-white/5 flex items-center text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
                <span>Scan Resume Fit</span>
                <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
              </div>
            </Link>

            {/* Tool 5: Repo README Studio */}
            <Link to="/dashboard/repo-docs" className="group rounded-2xl bg-surface-container/80 backdrop-blur-xl p-7 hover:bg-surface-container-high/90 transition-all duration-300 border border-glass-border/50 hover:border-cyan-500/50 hover:-translate-y-1 shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">menu_book</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-headline-sm text-lg text-text-primary font-bold">Repo README Studio</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">Docs Gen</span>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Paste any GitHub URL or select a repository. Inspects the file tree, extracts dependencies, and generates clean documentation.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-white/5 flex items-center text-xs font-semibold text-cyan-400 group-hover:translate-x-1 transition-transform">
                <span>Generate Repo Docs</span>
                <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
              </div>
            </Link>

            {/* Tool 6: Architecture Diagrams */}
            <Link to="/dashboard/diagrams" className="group rounded-2xl bg-surface-container/80 backdrop-blur-xl p-7 hover:bg-surface-container-high/90 transition-all duration-300 border border-glass-border/50 hover:border-indigo-500/50 hover:-translate-y-1 shadow-lg flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">schema</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-headline-sm text-lg text-text-primary font-bold">Architecture Diagrams</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold">Mermaid.js</span>
                </div>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Describe complex distributed systems in plain English and render interactive Mermaid.js flowcharts with SVG &amp; PNG exports.
                </p>
              </div>
              <div className="pt-5 mt-4 border-t border-white/5 flex items-center text-xs font-semibold text-indigo-400 group-hover:translate-x-1 transition-transform">
                <span>Diagram Studio</span>
                <span className="material-symbols-outlined text-[16px] ml-1">arrow_forward</span>
              </div>
            </Link>


          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 3: SIMPLE 3-STEP PIPELINE                              */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-20" id="how-it-works">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container font-badge-caps text-badge-caps text-neon-violet uppercase tracking-wider mb-4 border border-white/5">
              Production AI Pipeline
            </div>
            <h2 className="font-headline-xl text-2xl sm:text-4xl lg:text-5xl text-text-primary mb-4 font-extrabold">
              Engineered for developer speed &amp;{" "}
              <span className="bg-gradient-to-r from-neon-indigo to-neon-fuchsia bg-clip-text text-transparent">
                absolute accuracy.
              </span>
            </h2>
            <p className="font-body-md text-sm sm:text-base text-text-secondary max-w-xl">
              Zero manual prompt engineering required. Upload your files or paste a repo URL and let the Gemini 2.5 Flash pipeline execute.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative mb-12">
            <div className="relative rounded-2xl bg-surface-container/60 backdrop-blur-md p-7 flex flex-col justify-between border border-glass-border/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-neon-indigo/20 flex items-center justify-center text-neon-indigo shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                    <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                  </div>
                  <span className="font-label-code text-3xl font-bold text-outline-variant/30 select-none">01</span>
                </div>
                <h3 className="font-headline-sm text-lg text-text-primary mb-2.5 font-bold">Upload Document or Connect GitHub</h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Upload PDF research files, resumes, or link your GitHub account. Multi-modal parsers extract text and layout trees in seconds.
                </p>
              </div>
            </div>

            <div className="relative rounded-2xl bg-surface-container/60 backdrop-blur-md p-7 flex flex-col justify-between border border-glass-border/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-neon-violet/20 flex items-center justify-center text-neon-violet shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                    <span className="material-symbols-outlined text-[24px]">hub</span>
                  </div>
                  <span className="font-label-code text-3xl font-bold text-outline-variant/30 select-none">02</span>
                </div>
                <h3 className="font-headline-sm text-lg text-text-primary mb-2.5 font-bold">Vector Search &amp; AST Analysis</h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Documents are embedded into high-dimensional vectors in MongoDB Atlas, while repositories are mapped through dependency trees.
                </p>
              </div>
            </div>

            <div className="relative rounded-2xl bg-surface-container/60 backdrop-blur-md p-7 flex flex-col justify-between border border-glass-border/40">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-neon-fuchsia/20 flex items-center justify-center text-neon-fuchsia shadow-[0_0_20px_rgba(236,72,153,0.25)]">
                    <span className="material-symbols-outlined text-[24px]">bolt</span>
                  </div>
                  <span className="font-label-code text-3xl font-bold text-outline-variant/30 select-none">03</span>
                </div>
                <h3 className="font-headline-sm text-lg text-text-primary mb-2.5 font-bold">Streamed AI Synthesis</h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Receive verified page citations, production-ready markdown, STAR resume improvements, or responsive Mermaid diagrams.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 4: TESTIMONIALS                                         */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col items-center text-center mb-16">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container font-badge-caps text-badge-caps text-success uppercase tracking-wider mb-4 border border-white/5">
              Trusted by 10,000+ Engineers &amp; Researchers
            </div>
            <h2 className="font-headline-xl text-2xl sm:text-4xl text-text-primary mb-3 font-extrabold">
              Engineers level up their careers with DevSuite AI
            </h2>
            <p className="font-body-md text-sm sm:text-base text-text-secondary max-w-xl">
              From college students to senior staff architects at leading tech firms.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 shadow-lg flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="font-body-md text-body-sm text-on-surface italic leading-relaxed mb-6">
                  “The ATS Resume Matcher was a game-changer. It spotted 4 crucial microservices skills missing from my resume and gave me Google STAR rewrites that helped me land interviews at Stripe and Datadog.”
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <TestimonialAvatar src={ELENA_IMG} name="Elena Rostova" initials="ER" />
                <div className="min-w-0">
                  <div className="font-bold text-text-primary text-xs truncate">Elena Rostova</div>
                  <div className="text-[11px] text-text-muted truncate">Senior Distributed Systems Engineer</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 shadow-lg flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="font-body-md text-body-sm text-on-surface italic leading-relaxed mb-6">
                  “Architecture Diagram Studio is insane. I describe complex Kafka event pipelines in plain sentences, and it immediately outputs beautiful Mermaid flowcharts that export straight to HD PNG for my design reviews.”
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <TestimonialAvatar src={MARCUS_IMG} name="Dr. Marcus Vance" initials="MV" />
                <div className="min-w-0">
                  <div className="font-bold text-text-primary text-xs truncate">Dr. Marcus Vance</div>
                  <div className="text-[11px] text-text-muted truncate">Principal Cloud Architect • FinTech</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 shadow-lg flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
              <div>
                <div className="flex items-center gap-1 text-amber-400 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  ))}
                </div>
                <p className="font-body-md text-body-sm text-on-surface italic leading-relaxed mb-6">
                  “Inspect supporting passages, ask follow-up questions, and return to saved document conversations.”
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-white/5">
                <TestimonialAvatar src={DAVID_IMG} name="David Chen" initials="DC" />
                <div className="min-w-0">
                  <div className="font-bold text-text-primary text-xs truncate">David Chen</div>
                  <div className="text-[11px] text-text-muted truncate">Full-Stack Lead • Open Source Contributor</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* SECTION 5: TRANSPARENT PRICING & RAZORPAY PLANS                */}
        {/* ============================================================== */}
        <section className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-20 border-t border-glass-border/30" id="pricing">
          <div className="flex flex-col items-center text-center mb-14">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container font-badge-caps text-badge-caps text-neon-fuchsia uppercase tracking-wider mb-4 border border-white/5">
              Simple, Transparent Pricing
            </div>
            <h2 className="font-headline-xl text-2xl sm:text-4xl lg:text-5xl text-text-primary mb-4 font-extrabold">
              Fair plans for{" "}
              <span className="bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia bg-clip-text text-transparent">
                individual developers &amp; teams.
              </span>
            </h2>
            <p className="font-body-md text-sm sm:text-base text-text-secondary max-w-xl mb-6">
              Start completely free. Upgrade to Pro for unlimited AI operations or purchase flexible pay-as-you-go credits.
            </p>

            {/* Monthly / Yearly Switcher */}
            <div className="flex items-center gap-2 p-1 rounded-xl bg-surface-container border border-white/10">
              <button
                onClick={() => setPricingInterval("monthly")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  pricingInterval === "monthly"
                    ? "bg-gradient-to-r from-neon-indigo to-neon-fuchsia text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                Monthly Billing
              </button>
              <button
                onClick={() => setPricingInterval("yearly")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  pricingInterval === "yearly"
                    ? "bg-gradient-to-r from-neon-indigo to-neon-fuchsia text-white shadow-sm"
                    : "text-text-secondary hover:text-text-primary"
                }`}
              >
                <span>Annual (Save 17%)</span>
                <span className="px-1.5 py-0.2 rounded bg-success/30 text-success text-[10px] font-bold">2 Months Free</span>
              </button>
            </div>
          </div>

          {/* Pricing Tiers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch mb-12">

            {/* Starter Plan */}
            <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-8 flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
              <div>
                <h3 className="font-headline-sm text-xl text-text-primary mb-1 font-bold">Free Starter</h3>
                <p className="font-body-sm text-xs text-text-muted mb-6">Perfect for testing all 7 DevSuite tools.</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display-hero text-4xl font-extrabold text-text-primary">₹0</span>
                  <span className="text-xs text-text-muted">/ forever</span>
                </div>
                <div className="space-y-3 mb-8 text-xs text-on-surface">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                    <span>3 Free Full Credits upon signup</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                    <span>Access to all 7 Developer Workspaces</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                    <span>Gemini 2.5 Flash streaming inference</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                    <span>PDF citations &amp; GitHub markdown preview</span>
                  </div>
                </div>
              </div>
              <Link
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-headline-sm text-xs font-semibold text-text-primary bg-surface-container-high hover:bg-surface-variant transition-colors"
                to="/app"
              >
                <span>Start Free</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* DevSuite Pro (Most Popular) */}
            <div className="relative rounded-2xl bg-surface-container/90 backdrop-blur-2xl p-8 shadow-[0_0_36px_rgba(168,85,247,0.3)] flex flex-col justify-between border border-neon-violet/50 md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-neon-indigo to-neon-fuchsia text-[10px] text-text-primary font-bold uppercase tracking-wider shadow-md">
                  <span className="material-symbols-outlined text-[13px]">auto_awesome</span>
                  Most Popular
                </span>
              </div>
              <div>
                <h3 className="font-headline-sm text-xl text-text-primary mb-1 font-bold">DevSuite Pro</h3>
                <p className="font-body-sm text-xs text-text-muted mb-6">For engineers, active job seekers, and architects.</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display-hero text-4xl font-extrabold text-text-primary">
                    {pricingInterval === "monthly" ? "₹299" : "₹2,990"}
                  </span>
                  <span className="text-xs text-text-muted">
                    {pricingInterval === "monthly" ? "/ month" : "/ year"}
                  </span>
                </div>
                <div className="space-y-3 mb-8 text-xs text-text-primary font-medium">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                    <span>Unlimited PDF Chat &amp; Document Library</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                    <span>Unlimited GitHub Profile README commits</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                    <span>Full ATS Resume scans + Google STAR rewrites</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                    <span>HD 2x Retina Architecture Diagram exports</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                    <span>Source-linked document answers and saved conversations</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                    <span>Priority queue for zero latency responses</span>
                  </div>
                </div>
              </div>
              <Link
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-headline-sm text-xs font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all"
                to="/pricing"
              >
                <span>Upgrade with Razorpay</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            {/* Pay-as-you-go Credit Packs */}
            <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-8 flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
              <div>
                <h3 className="font-headline-sm text-xl text-text-primary mb-1 font-bold">Credit Packs</h3>
                <p className="font-body-sm text-xs text-text-muted mb-6">Pay only when you need it. No monthly renewal.</p>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-display-hero text-4xl font-extrabold text-text-primary">₹49</span>
                  <span className="text-xs text-text-muted">/ 10 Credits</span>
                </div>
                <div className="space-y-3 mb-8 text-xs text-on-surface">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                    <span>10 Credits for ₹49 (or 50 Credits for ₹199)</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                    <span>Never expire — keep in your account forever</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                    <span>Use across all 7 AI workspaces anytime</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                    <span>Instant activation via UPI, Cards, NetBanking</span>
                  </div>
                </div>
              </div>
              <Link
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-headline-sm text-xs font-semibold text-text-primary bg-surface-container-high hover:bg-surface-variant transition-colors"
                to="/pricing"
              >
                <span>View Credit Packs</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* FOOTER                                                        */}
      {/* ───────────────────────────────────────────────────────────── */}
      <footer className="w-full bg-surface-raised border-t border-glass-border/50 py-12">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-10">
            <div className="col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <Logo className="w-7 h-7" />
                <span className="font-headline-sm text-lg text-text-primary font-bold">
                  DevSuite AI
                </span>
              </div>
              <p className="font-body-sm text-xs text-text-muted max-w-sm leading-relaxed mb-4">
                The all-in-one developer and career intelligence platform. Powered by Google Gemini 2.5 Flash and MongoDB Atlas Vector Search.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-white/5 text-[11px] text-text-secondary">
                <span className="material-symbols-outlined text-success text-[15px]">verified_user</span>
                <span>Zero Document Training Guarantee</span>
              </div>
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-text-muted tracking-wider mb-3">Workspaces</div>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><Link className="hover:text-text-primary transition-colors" to="/dashboard/chat-pdf">PDF Chat &amp; Vault</Link></li>
                <li></li>
                <li><Link className="hover:text-text-primary transition-colors" to="/dashboard/ats-matcher">ATS Resume Matcher</Link></li>
                <li><Link className="hover:text-text-primary transition-colors" to="/dashboard/diagrams">Architecture Studio</Link></li>
                <li></li>
              </ul>
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-text-muted tracking-wider mb-3">Resources</div>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><Link className="hover:text-text-primary transition-colors" to="/docs">API Reference</Link></li>
                <li><a className="hover:text-text-primary transition-colors" href="#how-it-works">Pipeline Architecture</a></li>
                <li><Link className="hover:text-text-primary transition-colors" to="/pricing">Pricing &amp; Packs</Link></li>
                <li><Link className="hover:text-text-primary transition-colors" to="/dashboard/documents">Document Library</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-xs uppercase font-bold text-text-muted tracking-wider mb-3">Trust &amp; Legal</div>
              <ul className="space-y-2 text-xs text-text-secondary">
                <li><Link className="hover:text-text-primary transition-colors" to="/privacy">Privacy Architecture</Link></li>
                <li><Link className="hover:text-text-primary transition-colors" to="/terms">Terms of Service</Link></li>
                <li><Link className="hover:text-text-primary transition-colors" to="/privacy">Security Whitepaper</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-glass-border/30 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
            <p>© {new Date().getFullYear()} DevSuite AI, Inc. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                All Systems Operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
