import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

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
          <linearGradient id="pdfchat-logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366F1" />
            <stop offset="50%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="pdfchat-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1E1B4B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0F172A" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id="pdfchat-sparkle-grad" x1="0%" y1="0%" x2="100%" y2="100%">
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
          fill="url(#pdfchat-bg-grad)"
          stroke="url(#pdfchat-logo-grad)"
          strokeWidth="1.5"
        />

        {/* PDF Document silhouette */}
        <path
          d="M10 8.5C10 7.67157 10.6716 7 11.5 7H19.5L25 12.5V26.5C25 27.3284 24.3284 28 23.5 28H11.5C10.6716 28 10 27.3284 10 26.5V8.5Z"
          fill="url(#pdfchat-logo-grad)"
          fillOpacity="0.18"
          stroke="url(#pdfchat-logo-grad)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />
        
        {/* Folded corner tab */}
        <path
          d="M19.5 7V12.5H25"
          stroke="url(#pdfchat-logo-grad)"
          strokeWidth="1.3"
          strokeLinejoin="round"
        />

        {/* Document lines */}
        <line x1="13.5" y1="16" x2="18.5" y2="16" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="13.5" y1="19.5" x2="17.5" y2="19.5" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />

        {/* AI Sparkle */}
        <path
          d="M22 17.5L22.8 19.8L25.1 20.6L22.8 21.4L22 23.7L21.2 21.4L18.9 20.6L21.2 19.8L22 17.5Z"
          fill="url(#pdfchat-sparkle-grad)"
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
  const [highlighted, setHighlighted] = useState(false);
  const [mockInput, setMockInput] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  return (
    <div className="w-full bg-surface-base text-on-surface font-body-md antialiased selection:bg-neon-indigo selection:text-text-primary min-h-screen">
      
      {/* HEADER / NAVIGATION */}
      <header className="fixed top-0 w-full z-50 bg-surface-glass backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] border-b border-glass-border/40">
        <div className="h-16 sm:h-20 max-w-[1240px] mx-auto px-4 sm:px-margin lg:px-margin-desktop flex items-center justify-between">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <Logo className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-105 shrink-0" />
            <span className="font-headline-sm text-base sm:text-headline-sm text-text-primary tracking-tight font-bold whitespace-nowrap">
              PDFChat AI
            </span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-space-lg" data-active-classes="text-on-surface font-semibold">
            <a aria-current="page" className="transition-colors text-on-surface font-semibold" data-path="features" href="#features">
              Features
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="how-it-works" href="#how-it-works">
              How It Works
            </a>
            <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="pricing" href="#pricing">
              Pricing
            </a>
            <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="docs" to="/docs">
              Docs
            </Link>
            <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="enterprise" to="/pricing#enterprise">
              Enterprise
            </Link>
          </nav>

          {/* CTA Actions */}
          <div className="flex items-center gap-1.5 sm:gap-space-sm shrink-0">
            {isAuthenticated ? (
              <Link
                className="inline-flex items-center justify-center px-3 sm:px-space-lg py-1.5 sm:py-space-sm rounded-full font-body-sm text-xs sm:text-body-sm font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia shadow-[0_0_20px_rgba(168,85,247,0.35)] hover:shadow-[0_0_28px_rgba(168,85,247,0.55)] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0"
                to="/app"
              >
                <span>Open App</span>
                <span className="material-symbols-outlined text-[16px] sm:text-[18px] ml-1">arrow_forward</span>
              </Link>
            ) : (
              <>
                <Link
                  className="hidden sm:inline-flex items-center px-space-md py-space-sm rounded-lg font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors whitespace-nowrap"
                  data-path="login"
                  to="/login"
                >
                  Sign In
                </Link>
                <Link
                  className="inline-flex items-center justify-center px-3 sm:px-space-lg py-1.5 sm:py-space-sm rounded-full font-body-sm text-xs sm:text-body-sm font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia shadow-[0_0_16px_rgba(168,85,247,0.35)] hover:shadow-[0_0_24px_rgba(168,85,247,0.55)] hover:-translate-y-0.5 transition-all whitespace-nowrap shrink-0"
                  data-path="signup"
                  to="/app"
                >
                  <span className="sm:hidden">Get Started</span>
                  <span className="hidden sm:inline">Get Started Free</span>
                </Link>
              </>
            )}

            <Link
              to="/login"
              aria-label="User Account"
              className="hidden sm:flex w-8 h-8 rounded-full bg-primary items-center justify-center ml-space-xs shrink-0 cursor-pointer hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </Link>

            {/* Mobile menu hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary rounded-lg transition-colors ml-0.5 shrink-0"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-[24px]">
                {mobileMenuOpen ? "close" : "menu"}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-surface-raised border-t border-glass-border px-margin py-4 space-y-3">
            <nav className="flex flex-col space-y-2">
              <a onClick={() => setMobileMenuOpen(false)} href="#features-mobile" className="text-body-sm text-on-surface-variant hover:text-on-surface py-1">Features</a>
              <a onClick={() => setMobileMenuOpen(false)} href="#pricing-mobile" className="text-body-sm text-on-surface-variant hover:text-on-surface py-1">Pricing</a>
              <Link onClick={() => setMobileMenuOpen(false)} to="/docs" className="text-body-sm text-on-surface-variant hover:text-on-surface py-1">Docs</Link>
              <Link onClick={() => setMobileMenuOpen(false)} to="/pricing#enterprise" className="text-body-sm text-on-surface-variant hover:text-on-surface py-1">Enterprise</Link>
            </nav>
            <div className="pt-2 border-t border-glass-border flex flex-col gap-2">
              <Link onClick={() => setMobileMenuOpen(false)} to="/login" className="text-center py-2 text-body-sm text-text-primary bg-surface-container rounded-lg">Sign In</Link>
              <Link onClick={() => setMobileMenuOpen(false)} to="/app" className="text-center py-2 text-body-sm font-semibold text-text-primary bg-gradient-to-r from-neon-indigo to-neon-fuchsia rounded-full">Get Started Free</Link>
            </div>
          </div>
        )}
      </header>

      {/* MAIN CONTAINER */}
      <main className="w-full pt-16 sm:pt-20 bg-surface-base">
        {/* ============================================================== */}
        {/* MOBILE LANDING VIEW (< md) — Exactly matching Figma Mobile */}
        {/* ============================================================== */}
        <div className="block md:hidden w-full px-4 pb-12 space-y-8 relative overflow-hidden">
          {/* Glowing Ambient Orbs for Mobile */}
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-72 h-72 bg-neon-indigo/20 rounded-full blur-[100px] pointer-events-none -z-10"></div>
          <div className="absolute top-96 -right-20 w-64 h-64 bg-neon-fuchsia/15 rounded-full blur-[110px] pointer-events-none -z-10"></div>

          {/* SECTION: Mobile Hero */}
          <section className="flex flex-col items-center text-center pt-3 relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high/80 backdrop-blur-md shadow-sm border border-white/5">
              <span className="material-symbols-outlined text-primary text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span className="font-label-code text-label-code text-primary tracking-tight">
                Powered by Gemini 2.5 + MongoDB Atlas
              </span>
            </div>

            <div className="space-y-3">
              <h1 className="font-display-hero-mobile text-display-hero-mobile text-text-primary tracking-tight leading-tight">
                Chat with any PDF.<br />
                <span className="bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia bg-clip-text text-transparent">
                  Extract answers in seconds.
                </span>
              </h1>
              <p className="font-body-md text-body-md text-text-secondary max-w-sm mx-auto leading-relaxed">
                Transform static research reports, legal dockets, and dense manuals into instant, verifiable conversational intelligence with exact citations.
              </p>
            </div>

            {/* Mobile Action Buttons */}
            <div className="flex flex-col w-full space-y-2.5 pt-2">
              <Link
                to="/app"
                className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia text-text-primary font-headline-sm text-body-lg font-semibold shadow-lg shadow-neon-violet/25 active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <span>Try It Free</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
              <a
                href="#pricing-mobile"
                className="w-full py-3 px-6 rounded-xl bg-surface-container-high/70 backdrop-blur-sm text-text-primary font-body-md text-body-md font-medium active:scale-[0.98] transition-transform flex items-center justify-center gap-1.5 border border-white/5"
              >
                <span>View Pricing</span>
                <span className="material-symbols-outlined text-xs text-text-secondary">south</span>
              </a>
            </div>

            {/* 3-Column Trust Grid */}
            <div className="grid grid-cols-3 gap-2 w-full pt-3">
              <div className="flex flex-col items-center p-2.5 rounded-xl bg-surface-container-low/60 backdrop-blur-sm text-center border border-white/5">
                <span className="material-symbols-outlined text-success text-lg mb-1" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified_user
                </span>
                <span className="font-badge-caps text-badge-caps text-text-primary uppercase tracking-wider font-semibold">
                  100% Private
                </span>
                <span className="font-body-sm text-[10px] text-text-muted mt-0.5 leading-tight">
                  Zero Retention
                </span>
              </div>
              <div className="flex flex-col items-center p-2.5 rounded-xl bg-surface-container-low/60 backdrop-blur-sm text-center border border-white/5">
                <span className="material-symbols-outlined text-neon-violet text-lg mb-1">
                  bolt
                </span>
                <span className="font-badge-caps text-badge-caps text-text-primary uppercase tracking-wider font-semibold">
                  Sub-second
                </span>
                <span className="font-body-sm text-[10px] text-text-muted mt-0.5 leading-tight">
                  Real-time Tokens
                </span>
              </div>
              <div className="flex flex-col items-center p-2.5 rounded-xl bg-surface-container-low/60 backdrop-blur-sm text-center border border-white/5">
                <span className="material-symbols-outlined text-primary text-lg mb-1">
                  menu_book
                </span>
                <span className="font-badge-caps text-badge-caps text-text-primary uppercase tracking-wider font-semibold">
                  Verifiable
                </span>
                <span className="font-body-sm text-[10px] text-text-muted mt-0.5 leading-tight">
                  Source Citations
                </span>
              </div>
            </div>
          </section>

          {/* SECTION: Mobile Workspace Preview */}
          <section className="w-full relative z-10">
            <div className="rounded-2xl bg-surface-container/90 backdrop-blur-xl p-4 shadow-2xl relative space-y-3 overflow-hidden border border-white/5">
              {/* Card Window Title */}
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-error/70"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/70"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-success/70"></div>
                </div>
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-container-high text-text-secondary text-[11px] font-label-code">
                  <span className="material-symbols-outlined text-[13px] text-primary">description</span>
                  <span className="truncate max-w-[130px]">Q3_Global_Semiconductor.pdf</span>
                </div>
                <span className="text-[10px] font-label-code text-text-muted">48 pgs</span>
              </div>

              {/* Excerpt Block */}
              <div className="rounded-xl bg-surface-container-lowest/80 p-3 space-y-2 text-left border border-white/5">
                <div className="flex items-center justify-between">
                  <span className="font-label-code text-[11px] text-text-muted uppercase">Excerpt • Page 14</span>
                  <span className="material-symbols-outlined text-text-muted text-xs">open_in_full</span>
                </div>
                <div className="font-body-sm text-body-sm text-text-secondary leading-relaxed bg-surface-container-low/50 p-2.5 rounded-lg">
                  "...Foundry yields surpassed forecast by{" "}
                  <mark
                    className={`transition-all duration-300 ${
                      highlighted
                        ? "bg-neon-fuchsia/40 text-text-primary px-1 py-0.5 rounded font-bold shadow-[0_0_12px_rgba(236,72,153,0.6)]"
                        : "bg-primary/25 text-primary px-1 py-0.5 rounded font-medium"
                    }`}
                  >
                    18.4% YoY
                  </mark>
                  , driving gross operating margin expansion to 54.2% across custom automotive silicon lines..."
                </div>
              </div>

              {/* Chat Thread */}
              <div className="space-y-2 pt-1 text-left">
                <div className="flex justify-end">
                  <div className="bg-neon-indigo/20 text-text-primary text-xs py-1.5 px-3 rounded-2xl rounded-tr-xs max-w-[85%] font-body-sm border border-neon-indigo/30">
                    What drove the automotive margin surge in Q3?
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 bg-surface-container-high/60 backdrop-blur-md p-3 rounded-2xl rounded-tl-xs border border-white/5">
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-neon-fuchsia text-sm">smart_toy</span>
                    <span className="font-label-code text-[11px] text-primary font-medium">Synthetics Engine</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping ml-auto"></span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-primary text-xs leading-normal">
                    Automotive margin expansion was primarily fueled by an{" "}
                    <strong className="text-neon-fuchsia">18.4% YoY foundry yield gain</strong> in custom packaging modules.
                  </p>
                  <div className="pt-1 flex items-center gap-2">
                    <button
                      onClick={triggerCitationGlow}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-neon-indigo/20 text-primary hover:bg-neon-indigo/30 active:scale-95 transition-all font-label-code text-[11px]"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[13px]">pin_drop</span>
                      <span>Page 14, Table 3.2</span>
                    </button>
                    <span className="text-[10px] font-label-code text-text-muted">99.8% confidence</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: Engine Architecture (Mobile Features) */}
          <section className="space-y-3 z-10 text-left" id="features-mobile">
            <div className="px-1">
              <span className="font-badge-caps text-badge-caps text-primary tracking-widest uppercase font-semibold">
                Engine Architecture
              </span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                Built for technical rigor
              </h2>
            </div>
            <div className="space-y-2.5">
              <div className="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-sm flex items-start gap-3 border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-neon-indigo/20 text-neon-indigo flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">segment</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-body-md text-text-primary font-semibold">Instant Chunking</h3>
                    <span className="font-label-code text-[10px] text-text-muted font-bold">01</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary text-xs leading-relaxed">
                    Multi-modal parser decomposes 500+ page blueprints, tables, and footers in under 4 seconds without OCR degradation.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-sm flex items-start gap-3 border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-neon-violet/20 text-neon-violet flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">hub</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-body-md text-text-primary font-semibold">Semantic Vector Search</h3>
                    <span className="font-label-code text-[10px] text-text-muted font-bold">02</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary text-xs leading-relaxed">
                    Powered by MongoDB Atlas Vector Search for sub-millisecond similarity queries across localized embeddings.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-container/70 backdrop-blur-sm flex items-start gap-3 border border-white/5">
                <div className="w-9 h-9 rounded-lg bg-neon-fuchsia/20 text-neon-fuchsia flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-lg">lock</span>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-headline-sm text-body-md text-text-primary font-semibold">Zero Training Retention</h3>
                    <span className="font-label-code text-[10px] text-text-muted font-bold">03</span>
                  </div>
                  <p className="font-body-sm text-body-sm text-text-secondary text-xs leading-relaxed">
                    Customer documents are strictly ephemeral in isolated enterprise enclaves, never ingested into foundational weights.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION: Straightforward Plans (Mobile Pricing) */}
          <section className="space-y-3 z-10 text-left" id="pricing-mobile">
            <div className="px-1">
              <span className="font-badge-caps text-badge-caps text-neon-violet tracking-widest uppercase font-semibold">
                Straightforward Plans
              </span>
              <h2 className="font-headline-sm text-headline-sm text-text-primary font-bold">
                Scale your document intellect
              </h2>
            </div>

            <div className="rounded-2xl p-5 bg-gradient-to-b from-surface-container-high to-surface-container relative shadow-xl overflow-hidden border border-white/5">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-neon-fuchsia/20 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-center justify-between">
                <span className="font-badge-caps text-badge-caps uppercase tracking-wider text-neon-fuchsia font-bold">
                  Most Popular
                </span>
                <span className="px-2 py-0.5 rounded-full bg-neon-violet/20 text-secondary text-[11px] font-label-code">
                  7-Day Free Trial
                </span>
              </div>
              <div className="mt-2">
                <h3 className="font-headline-sm text-headline-sm text-text-primary font-bold">Pro Researcher</h3>
                <p className="font-body-sm text-text-secondary text-xs">For analysts, litigators, and institutional researchers.</p>
              </div>
              <div className="my-4 flex items-baseline gap-1">
                <span className="font-display-hero-mobile text-display-hero-mobile font-bold text-text-primary tracking-tight">
                  $19
                </span>
                <span className="font-body-md text-body-md text-text-muted">/ month</span>
              </div>
              <ul className="space-y-2 mb-5 font-body-sm text-body-sm text-text-secondary text-xs">
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <span className="text-text-primary">Unlimited document uploads (up to 2,000 pgs/file)</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <span className="text-text-primary">Gemini 2.5 Flash + Atlas High-Throughput Cluster</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <span>Clickable inline source anchors</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-success text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                    check_circle
                  </span>
                  <span>Full markdown and LaTeX formula exports</span>
                </li>
              </ul>
              <Link
                to="/app"
                className="block w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia text-text-primary font-body-md text-body-md font-semibold text-center shadow-md active:scale-[0.98] transition-all"
              >
                Start 7-Day Pro Trial
              </Link>
              <p className="text-center font-body-sm text-[11px] text-text-muted mt-2">
                No credit card required upfront • Cancel anytime with 1 click
              </p>
            </div>

            <div className="rounded-xl bg-surface-container-low/70 p-3.5 flex items-center justify-between border border-white/5">
              <div className="space-y-0.5 pr-2">
                <div className="font-body-md text-body-md font-semibold text-text-primary text-xs">Need an Enterprise Enclave?</div>
                <div className="font-body-sm text-[11px] text-text-muted leading-tight">Dedicated VPC, custom LLM fine-tunes & SOC2 compliance.</div>
              </div>
              <Link
                to="/pricing#enterprise"
                className="px-3 py-1.5 rounded-lg bg-surface-container-highest text-primary font-body-sm text-xs font-medium shrink-0 active:scale-95 transition-transform"
              >
                Contact
              </Link>
            </div>
          </section>

          {/* Mobile Footer */}
          <footer className="pt-4 pb-2 text-center space-y-2 z-10 border-t border-glass-border/30 mt-6">
            <div className="flex items-center justify-center gap-3 text-text-muted text-xs font-body-sm">
              <Link className="hover:text-primary transition-colors" to="/privacy">Privacy</Link>
              <span>•</span>
              <Link className="hover:text-primary transition-colors" to="/privacy">Security Architecture</Link>
              <span>•</span>
              <Link className="hover:text-primary transition-colors" to="/docs">Documentation</Link>
            </div>
            <p className="font-label-code text-[10px] text-text-muted">
              © {new Date().getFullYear()} PDFChat Inc. Obsidian Synthetics Engine.
            </p>
          </footer>
        </div>

        {/* ============================================================== */}
        {/* DESKTOP / TABLET VIEW (md+) — Full Figma Desktop Layout */}
        {/* ============================================================== */}
        <div className="hidden md:flex flex-col w-full relative overflow-hidden text-on-surface">
          
          {/* Dynamic Atmospheric Glow Orbs */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[720px] h-[340px] bg-gradient-to-r from-neon-indigo/20 via-neon-violet/25 to-neon-fuchsia/15 blur-[130px] pointer-events-none rounded-full -z-10"></div>
          <div className="absolute top-[1200px] -left-48 w-[500px] h-[500px] bg-neon-indigo/10 blur-[140px] pointer-events-none rounded-full -z-10"></div>
          <div className="absolute top-[2100px] -right-48 w-[520px] h-[480px] bg-neon-violet/12 blur-[150px] pointer-events-none rounded-full -z-10"></div>
          <div className="absolute top-[3100px] left-1/3 w-[650px] h-[350px] bg-neon-fuchsia/10 blur-[160px] pointer-events-none rounded-full -z-10"></div>
          
          {/* Subtle Matrix Grid Overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#464554_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.07] pointer-events-none -z-10"></div>

          {/* SECTION 1: HERO SECTION */}
          <section className="max-w-[1240px] mx-auto w-full px-margin lg:px-margin-desktop pt-12 lg:pt-16 pb-20 flex flex-col items-center text-center">
            
            {/* Announcement Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface-container/90 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.12)] mb-8 transition-all hover:bg-surface-container-high cursor-default">
              <span className="w-2 h-2 rounded-full bg-neon-fuchsia animate-pulse"></span>
              <span className="font-label-code text-label-code text-primary font-medium tracking-tight">
                ✨ Powered by Gemini 2.5 + MongoDB Atlas Vector Search
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display-hero text-headline-xl lg:text-display-hero text-text-primary tracking-tight max-w-4xl mx-auto leading-tight mb-6">
              Chat with any PDF. <br className="hidden sm:inline" />
              <span className="bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(168,85,247,0.35)]">
                Extract answers in seconds.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="font-body-lg text-body-lg text-text-secondary max-w-2xl mx-auto mb-10 leading-relaxed">
              Turn long research papers, legal contracts, financial filings, and technical manuals into instant conversational insights. Get exact citations back to the source page.
            </p>

            {/* Dual CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto mb-12">
              <Link
                to="/app"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-headline-sm text-body-md font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia shadow-[0_0_28px_rgba(168,85,247,0.45)] hover:shadow-[0_0_36px_rgba(168,85,247,0.65)] hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                <span>Try It Free — No Card Needed</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <a
                className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3.5 rounded-full font-body-md text-body-md text-text-primary bg-surface-container/60 hover:bg-surface-container-high/80 backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)] transition-all"
                href="#pricing"
              >
                View Pricing &amp; Credits
              </a>
            </div>

            {/* Trust Badges Row */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-text-muted font-body-sm text-body-sm mb-16">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-success text-[18px]">shield</span>
                <span>100% Private &amp; Encrypted</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-neon-violet text-[18px]">bolt</span>
                <span>Sub-second Streaming</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[18px]">fact_check</span>
                <span>Page-level Citations</span>
              </div>
            </div>

            {/* HERO PRODUCT WORKSPACE MOCKUP (Glassmorphism + Dual Pane) */}
            <div
              ref={heroWindowRef}
              onMouseMove={handleMouseMove}
              className="w-full max-w-5xl rounded-2xl bg-surface-raised/95 backdrop-blur-2xl shadow-[0_24px_64px_-16px_rgba(0,0,0,0.8),inset_0_1px_1px_rgba(255,255,255,0.1)] p-3 sm:p-5 text-left border border-white/5"
            >
              {/* Window Title Bar */}
              <div className="flex items-center justify-between pb-4 px-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-error/70"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500/70"></div>
                  <div className="w-3 h-3 rounded-full bg-success/70"></div>
                  <span className="ml-3 font-label-code text-label-code text-text-muted hidden sm:inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-neon-violet">description</span>
                    Q3_Financial_Report.pdf • 48 pages
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-success/10 font-badge-caps text-badge-caps text-success font-semibold tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 rounded-full bg-success animate-ping"></span>
                    Vector Indexed
                  </span>
                  <span className="font-label-code text-label-code text-text-muted px-2 py-0.5 rounded bg-surface-container">
                    256 Dim
                  </span>
                </div>
              </div>

              {/* App Dual Split Canvas */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 h-[440px] sm:h-[480px]">
                
                {/* Left Pane: PDF Document Simulation with Highlighting */}
                <div className="md:col-span-5 hidden md:flex flex-col bg-surface-container-lowest/80 rounded-xl p-4 overflow-hidden relative border border-white/5">
                  <div className="flex items-center justify-between text-text-muted font-label-code text-body-sm mb-3 pb-2 bg-surface-container-low/40 rounded px-2">
                    <span>Page 14 / 48</span>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-text-primary transition-colors">zoom_in</span>
                      <span className="material-symbols-outlined text-[16px] cursor-pointer hover:text-text-primary transition-colors">zoom_out</span>
                    </div>
                  </div>

                  {/* Document Content Visual */}
                  <div className="space-y-2.5 opacity-90 overflow-hidden text-[11px] font-mono leading-relaxed text-text-secondary select-none">
                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
                      Section 3.2 // Consolidated Earnings
                    </p>
                    <p>
                      During the tertiary reporting period of the fiscal year, revenue streams sustained strong momentum across all core product lines.
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
                        "Net revenue reached $142.8 million in Q3, up +28.4% YoY, driven primarily by enterprise cloud adoption."
                      </p>
                    </div>
                    <p className="text-text-muted">
                      Operating expenses scaled at a modest +6.1%, yielding a structural operating margin expansion of 420 bps year-over-year.
                    </p>

                    {/* Miniature Data Chart Graphic */}
                    <div className="pt-2">
                      <div className="flex items-end gap-2 h-14 w-full bg-surface-container-low p-2 rounded">
                        <div className="w-1/6 bg-surface-variant h-5 rounded-t"></div>
                        <div className="w-1/6 bg-surface-variant h-7 rounded-t"></div>
                        <div className="w-1/6 bg-surface-variant h-8 rounded-t"></div>
                        <div className="w-1/6 bg-surface-variant h-9 rounded-t"></div>
                        <div className="w-1/6 bg-neon-indigo/60 h-11 rounded-t"></div>
                        <div className="w-1/6 bg-gradient-to-t from-neon-indigo to-neon-fuchsia h-full rounded-t shadow-[0_0_8px_rgba(236,72,153,0.4)]"></div>
                      </div>
                    </div>
                    <p className="text-text-muted text-[10px]">Table 3.2: Quarterly Revenue Trajectory in Millions (USD)</p>
                  </div>

                  <div className="absolute bottom-3 left-4 right-4 py-1.5 px-3 rounded-lg bg-surface-container/90 backdrop-blur-md text-[11px] text-text-muted flex items-center justify-between border border-white/5">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-neon-indigo"></span> Match confidence: 99.4%
                    </span>
                    <span className="font-label-code text-neon-fuchsia">Atlas Vector #8932</span>
                  </div>
                </div>

                {/* Right Pane: Real-Time Chat Workspace */}
                <div className="col-span-1 md:col-span-7 flex flex-col justify-between bg-surface-container-lowest/90 rounded-xl p-3 sm:p-5 relative border border-white/5">
                  {/* Chat Timeline */}
                  <div className="space-y-4 overflow-y-auto pr-1">
                    
                    {/* User Message Pill */}
                    <div className="flex items-start justify-end gap-2.5">
                      <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-gradient-to-r from-neon-indigo/80 to-neon-violet/80 p-3 sm:px-4 sm:py-2.5 text-text-primary text-body-sm shadow-md">
                        What was the net revenue growth in Q3 compared to last year?
                      </div>
                      <div className="w-7 h-7 rounded-full bg-surface-container-high flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[16px] text-text-secondary">person</span>
                      </div>
                    </div>

                    {/* AI Response Box */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-neon-indigo to-neon-fuchsia flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(168,85,247,0.5)]">
                        <span className="material-symbols-outlined text-[16px] text-text-primary">smart_toy</span>
                      </div>
                      <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-surface-container-high/70 backdrop-blur-md p-3.5 sm:p-4 text-body-sm shadow-sm space-y-3 border border-white/5">
                        <div className="flex items-center gap-2">
                          <span className="font-headline-sm text-body-sm font-semibold text-text-primary">Gemini 2.5 Flash</span>
                          <span className="font-badge-caps text-badge-caps uppercase tracking-wider text-success bg-success/15 px-2 py-0.5 rounded-full">
                            Streamed in 240ms
                          </span>
                        </div>
                        <p className="text-on-surface leading-relaxed text-body-sm">
                          Net revenue in Q3 reached <strong className="text-text-primary font-semibold">$142.8 million</strong>, representing a{" "}
                          <strong className="text-neon-fuchsia font-semibold">+28.4% YoY increase</strong>, driven primarily by accelerated enterprise cloud adoption and expansion in Tier-1 institutional contracts.
                        </p>

                        {/* Source Citations Grid */}
                        <div className="pt-2 flex flex-wrap items-center gap-2">
                          <span className="text-text-muted font-badge-caps text-badge-caps uppercase tracking-wider">Citations:</span>
                          <button
                            onClick={triggerCitationGlow}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neon-indigo/20 hover:bg-neon-indigo/35 text-text-primary font-label-code text-[11px] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px] text-neon-indigo">bookmark</span>
                            Page 14
                          </button>
                          <button
                            onClick={triggerCitationGlow}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-neon-violet/20 hover:bg-neon-violet/35 text-text-primary font-label-code text-[11px] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px] text-neon-violet">table_chart</span>
                            Table 3.2
                          </button>
                          <button
                            onClick={triggerCitationGlow}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-variant hover:bg-surface-bright text-text-secondary font-label-code text-[11px] transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">link</span>
                            Page 22
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Prompt Input */}
                  <div className="pt-3">
                    <form
                      onSubmit={handlePromptSubmit}
                      className="flex items-center gap-2 rounded-xl bg-surface-container px-3 py-2.5 shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] border border-white/5"
                    >
                      <span className="material-symbols-outlined text-text-muted text-[18px]">search</span>
                      <input
                        className="bg-transparent flex-1 font-body-sm text-body-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                        type="text"
                        value={mockInput}
                        onChange={(e) => setMockInput(e.target.value)}
                        placeholder="Ask about risks, forecasts, or summaries..."
                      />
                      <button
                        type="submit"
                        aria-label="Submit query"
                        className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neon-indigo to-neon-fuchsia flex items-center justify-center text-text-primary hover:opacity-90 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-[16px]">arrow_upward</span>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: CORE CAPABILITIES (3x2 Bento Grid) */}
          <section className="max-w-[1240px] mx-auto w-full px-margin lg:px-margin-desktop py-20" id="features">
            <div className="flex flex-col items-center text-center mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container font-badge-caps text-badge-caps text-neon-indigo uppercase tracking-wider mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/5">
                Core Capabilities
              </div>
              <h2 className="font-headline-xl text-headline-xl text-text-primary max-w-2xl leading-tight mb-4">
                Built for deep research, <br />
                <span className="bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia bg-clip-text text-transparent">
                  not just simple summarization.
                </span>
              </h2>
              <p className="font-body-md text-body-md text-text-secondary max-w-xl">
                A production-ready RAG pipeline engineered for complex legal docs, dense technical manuals, and multi-page reports.
              </p>
            </div>

            {/* 6 Capability Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="group relative rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 hover:bg-surface-container-high/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:-translate-y-1 border border-glass-border/40">
                <div className="w-12 h-12 rounded-xl bg-neon-indigo/15 flex items-center justify-center mb-5 text-neon-indigo group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">integration_instructions</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2.5 font-semibold">Instant PDF Chunking</h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Upload PDFs up to 50MB. Our intelligent parser preserves tables, structured headings, and text blocks seamlessly.
                </p>
              </div>

              <div className="group relative rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 hover:bg-surface-container-high/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:-translate-y-1 border border-glass-border/40">
                <div className="w-12 h-12 rounded-xl bg-neon-violet/15 flex items-center justify-center mb-5 text-neon-violet group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">troubleshoot</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2.5 font-semibold">Vector Semantic Search</h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Powered by high-dimensional embeddings and MongoDB Atlas Vector Search. Understands intent beyond exact keyword matches.
                </p>
              </div>

              <div className="group relative rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 hover:bg-surface-container-high/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:-translate-y-1 border border-glass-border/40">
                <div className="w-12 h-12 rounded-xl bg-neon-fuchsia/15 flex items-center justify-center mb-5 text-neon-fuchsia group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">verified</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2.5 font-semibold">Verified Page Citations</h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Every answer links directly to the specific page and paragraph in your PDF so you can verify facts in seconds.
                </p>
              </div>

              <div className="group relative rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 hover:bg-surface-container-high/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:-translate-y-1 border border-glass-border/40">
                <div className="w-12 h-12 rounded-xl bg-neon-fuchsia/15 flex items-center justify-center mb-5 text-neon-fuchsia group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">electric_bolt</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2.5 font-semibold">Real-Time AI Streaming</h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Experience token-by-token streaming responses generated by state-of-the-art Gemini LLMs with sub-second latency.
                </p>
              </div>

              <div className="group relative rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 hover:bg-surface-container-high/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:-translate-y-1 border border-glass-border/40">
                <div className="w-12 h-12 rounded-xl bg-neon-indigo/15 flex items-center justify-center mb-5 text-neon-indigo group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">folder_copy</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2.5 font-semibold">Multi-Session Library</h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Signed-in users can switch between multiple overlapping chunks, resume prior conversations, and export discussion summaries.
                </p>
              </div>

              <div className="group relative rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 hover:bg-surface-container-high/80 transition-all duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] hover:-translate-y-1 border border-glass-border/40">
                <div className="w-12 h-12 rounded-xl bg-success/15 flex items-center justify-center mb-5 text-success group-hover:scale-105 transition-transform">
                  <span className="material-symbols-outlined text-[24px]">enhanced_encryption</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2.5 font-semibold">Zero Data Training</h3>
                <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                  Your confidential documents and proprietary research are never used to train foundational AI models. Private and secure.
                </p>
              </div>
            </div>
          </section>

          {/* SECTION 3: SIMPLE 3-STEP PROCESS */}
          <section className="max-w-[1240px] mx-auto w-full px-margin lg:px-margin-desktop py-20" id="how-it-works">
            <div className="flex flex-col items-center text-center mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container font-badge-caps text-badge-caps text-neon-violet uppercase tracking-wider mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/5">
                Simple 3-Step Process
              </div>
              <h2 className="font-headline-xl text-headline-xl text-text-primary mb-4">
                From dense PDF to{" "}
                <span className="bg-gradient-to-r from-neon-indigo to-neon-fuchsia bg-clip-text text-transparent">
                  instant answers
                </span>
              </h2>
              <p className="font-body-md text-body-md text-text-secondary max-w-xl">
                No complex setup or model fine-tuning. Just upload your PDF and start asking questions.
              </p>
            </div>

            {/* Step Pipeline */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative mb-12">
              <div className="relative rounded-2xl bg-surface-container/60 backdrop-blur-md p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between border border-glass-border/40">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-xl bg-neon-indigo/20 flex items-center justify-center text-neon-indigo shadow-[0_0_20px_rgba(99,102,241,0.25)]">
                      <span className="material-symbols-outlined text-[24px]">cloud_upload</span>
                    </div>
                    <span className="font-label-code text-headline-xl font-bold text-outline-variant/30 select-none">01</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary mb-3 font-semibold">Upload your Document</h3>
                  <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                    Drag &amp; drop any PDF up to 50MB. Our engine parses raw text, multi-column layouts, and tables in seconds.
                  </p>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low/40 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center justify-between text-[11px] font-label-code text-text-muted mb-1.5">
                    <span>Parsing PDF nodes...</span>
                    <span className="text-success font-semibold">100%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                    <div className="w-full h-full bg-gradient-to-r from-neon-indigo to-neon-violet rounded-full"></div>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl bg-surface-container/60 backdrop-blur-md p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between border border-glass-border/40">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-xl bg-neon-violet/20 flex items-center justify-center text-neon-violet shadow-[0_0_20px_rgba(168,85,247,0.25)]">
                      <span className="material-symbols-outlined text-[24px]">hub</span>
                    </div>
                    <span className="font-label-code text-headline-xl font-bold text-outline-variant/30 select-none">02</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary mb-3 font-semibold">Vector Pipeline Indexing</h3>
                  <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                    The document is intelligently segmented into overlapping chunks, embedded into vector space, and indexed in Atlas.
                  </p>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low/40 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center justify-between text-[11px] font-label-code text-text-muted">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-neon-violet animate-pulse"></span>
                      Embedding generation
                    </span>
                    <span className="text-neon-violet font-semibold">1,536 Dim</span>
                  </div>
                </div>
              </div>

              <div className="relative rounded-2xl bg-surface-container/60 backdrop-blur-md p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between border border-glass-border/40">
                <div>
                  <div className="flex items-center justify-between mb-8">
                    <div className="w-12 h-12 rounded-xl bg-neon-fuchsia/20 flex items-center justify-center text-neon-fuchsia shadow-[0_0_20px_rgba(236,72,153,0.25)]">
                      <span className="material-symbols-outlined text-[24px]">chat_spark</span>
                    </div>
                    <span className="font-label-code text-headline-xl font-bold text-outline-variant/30 select-none">03</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary mb-3 font-semibold">Chat &amp; Verify Citations</h3>
                  <p className="font-body-sm text-body-sm text-text-secondary leading-relaxed">
                    Ask questions naturally. The system retrieves relevant context, streams answers, and highlights source pages.
                  </p>
                </div>
                <div className="mt-8 pt-4 bg-surface-container-low/40 rounded-lg p-3 flex items-center justify-between text-[11px] font-label-code text-text-muted border border-white/5">
                  <span className="text-neon-fuchsia font-semibold">Page 14, 22 verified</span>
                  <span className="material-symbols-outlined text-success text-[16px]">check_circle</span>
                </div>
              </div>
            </div>

            {/* CTA Button */}
            <div className="flex justify-center">
              <Link
                to="/app"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-headline-sm text-body-md font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:shadow-[0_0_32px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 transition-all"
              >
                <span>Try It In Your Browser Now</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </section>

          {/* SECTION 4: TESTIMONIALS & SOCIAL PROOF */}
          <section className="max-w-[1240px] mx-auto w-full px-margin lg:px-margin-desktop py-20">
            <div className="flex flex-col items-center text-center mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container font-badge-caps text-badge-caps text-success uppercase tracking-wider mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/5">
                Trusted by Professionals
              </div>
              <h2 className="font-headline-xl text-headline-xl text-text-primary mb-4 font-bold">
                Loved by researchers, analysts, and students
              </h2>
              <p className="font-body-md text-body-md text-text-secondary max-w-xl">
                Over 50,000+ documents processed this month across legal, medical, and financial domains.
              </p>
            </div>

            {/* Testimonials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="font-body-md text-body-md text-on-surface italic leading-relaxed mb-6">
                    “PDFChat cut our legal contract review time by over 65%. The citations feature makes verification foolproof because we can jump directly to clause paragraphs.”
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 bg-surface-container-low/30 -mx-7 -mb-7 p-5 rounded-b-2xl border-t border-white/5">
                  <TestimonialAvatar
                    src={ELENA_IMG}
                    name="Elena Rostova"
                    initials="ER"
                  />
                  <div className="min-w-0">
                    <div className="font-headline-sm text-body-sm font-semibold text-text-primary truncate">Elena Rostova</div>
                    <div className="font-body-sm text-[12px] text-text-muted truncate">Senior Legal Counsel • Apex Legal Partners</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="font-body-md text-body-md text-on-surface italic leading-relaxed mb-6">
                    “Analyzing 120-page clinical trial reports used to take my research group days. Now we extract statistical tables and drug efficacy data in minutes.”
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 bg-surface-container-low/30 -mx-7 -mb-7 p-5 rounded-b-2xl border-t border-white/5">
                  <TestimonialAvatar
                    src={MARCUS_IMG}
                    name="Dr. Marcus Vance"
                    initials="MV"
                  />
                  <div className="min-w-0">
                    <div className="font-headline-sm text-body-sm font-semibold text-text-primary truncate">Dr. Marcus Vance</div>
                    <div className="font-body-sm text-[12px] text-text-muted truncate">Biomedical Researcher • Stanford Medical Research</div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-7 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-5">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        star
                      </span>
                    ))}
                  </div>
                  <p className="font-body-md text-body-md text-on-surface italic leading-relaxed mb-6">
                    “The sub-second streaming answers and multi-session library allow me to cross-reference multiple quarterly earnings reports without reloading files.”
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 bg-surface-container-low/30 -mx-7 -mb-7 p-5 rounded-b-2xl border-t border-white/5">
                  <TestimonialAvatar
                    src={DAVID_IMG}
                    name="David Chen"
                    initials="DC"
                  />
                  <div className="min-w-0">
                    <div className="font-headline-sm text-body-sm font-semibold text-text-primary truncate">David Chen</div>
                    <div className="font-body-sm text-[12px] text-text-muted truncate">Equity Research Analyst • Horizon Capital</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 5: TRANSPARENT PRICING PLANS */}
          <section className="max-w-[1240px] mx-auto w-full px-margin lg:px-margin-desktop py-20" id="pricing">
            <div className="flex flex-col items-center text-center mb-16">
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-surface-container font-badge-caps text-badge-caps text-neon-fuchsia uppercase tracking-wider mb-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] border border-white/5">
                Transparent Pricing
              </div>
              <h2 className="font-headline-xl text-headline-xl text-text-primary mb-4 font-bold">
                Simple plans for{" "}
                <span className="bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia bg-clip-text text-transparent">
                  every workload
                </span>
              </h2>
              <p className="font-body-md text-body-md text-text-secondary max-w-xl">
                Start for free today. Upgrade when you need unlimited pages and multi-document storage.
              </p>
            </div>

            {/* 3 Tier Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 lg:gap-8 items-stretch mb-10">
              {/* Starter */}
              <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary mb-1 font-semibold">Starter</h3>
                  <p className="font-body-sm text-body-sm text-text-muted mb-6">Ideal for trying out vector search on personal PDFs.</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="font-display-hero text-headline-xl font-bold text-text-primary">$0</span>
                    <span className="font-body-sm text-body-sm text-text-muted">/forever</span>
                  </div>
                  <div className="space-y-3.5 mb-8">
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>Up to 3 PDF uploads per day</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>Maximum 25 pages per document</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>Fast Gemini streaming answers</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>Page-level source citations</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>7-day session history</span>
                    </div>
                  </div>
                </div>
                <Link
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-headline-sm text-body-sm font-semibold text-text-primary bg-surface-container-high hover:bg-surface-variant transition-colors shadow-sm"
                  to="/app"
                >
                  <span>Start Free</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>

              {/* Pro Researcher */}
              <div className="relative rounded-2xl bg-surface-container/90 backdrop-blur-2xl p-8 shadow-[0_0_36px_rgba(168,85,247,0.25),inset_0_1px_1px_rgba(255,255,255,0.12)] flex flex-col justify-between lg:-translate-y-2 border border-neon-violet/40">
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-neon-indigo to-neon-fuchsia font-badge-caps text-badge-caps text-text-primary font-bold uppercase tracking-wider shadow-[0_0_16px_rgba(236,72,153,0.5)]">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Most Popular
                  </span>
                </div>
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary mb-1 font-semibold">Pro Researcher</h3>
                  <p className="font-body-sm text-body-sm text-text-muted mb-6">For professionals, students, and active researchers.</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="font-display-hero text-headline-xl font-bold text-text-primary">$19</span>
                    <span className="font-body-sm text-body-sm text-text-muted">/per month</span>
                  </div>
                  <div className="space-y-3.5 mb-8">
                    <div className="flex items-center gap-3 text-body-sm text-text-primary font-medium">
                      <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                      <span>Unlimited PDF uploads</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-text-primary font-medium">
                      <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                      <span>Up to 500 pages per document</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-text-primary font-medium">
                      <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                      <span>High-precision vector re-ranking</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-text-primary font-medium">
                      <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                      <span>Multi-document library storage</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-text-primary font-medium">
                      <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                      <span>Export summaries to Markdown/PDF</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-text-primary font-medium">
                      <span className="material-symbols-outlined text-neon-fuchsia text-[18px]">check_circle</span>
                      <span>Priority streaming queue</span>
                    </div>
                  </div>
                </div>
                <Link
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-headline-sm text-body-sm font-semibold text-text-primary bg-gradient-to-r from-neon-indigo via-neon-violet to-neon-fuchsia shadow-[0_0_24px_rgba(168,85,247,0.4)] hover:shadow-[0_0_32px_rgba(168,85,247,0.6)] hover:-translate-y-0.5 transition-all"
                  to="/app"
                >
                  <span>Upgrade to Pro</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>

              {/* Team & Enterprise */}
              <div className="rounded-2xl bg-surface-container/70 backdrop-blur-xl p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.06)] flex flex-col justify-between border border-glass-border/40 hover:-translate-y-1 transition-transform">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary mb-1 font-semibold">Team &amp; Enterprise</h3>
                  <p className="font-body-sm text-body-sm text-text-muted mb-6">Collaborative knowledge bases for teams and firms.</p>
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="font-display-hero text-headline-xl font-bold text-text-primary">$49</span>
                    <span className="font-body-sm text-body-sm text-text-muted">/per seat/month</span>
                  </div>
                  <div className="space-y-3.5 mb-8">
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>Shared organization document vault</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>SOC 2 compliance documentation</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>Custom chunking &amp; embedding models</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>Dedicated API access &amp; webhook support</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>99.9% uptime SLA</span>
                    </div>
                    <div className="flex items-center gap-3 text-body-sm text-on-surface">
                      <span className="material-symbols-outlined text-success text-[18px]">check_circle</span>
                      <span>Dedicated account manager</span>
                    </div>
                  </div>
                </div>
                <Link
                  className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-headline-sm text-body-sm font-semibold text-text-primary bg-surface-container-high hover:bg-surface-variant transition-colors shadow-sm"
                  to="/pricing#enterprise"
                >
                  <span>Contact Sales</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </Link>
              </div>
            </div>

            {/* Credit Packs link */}
            <div className="text-center font-body-sm text-body-sm text-text-muted">
              Need pay-as-you-go credit packs instead of a monthly subscription?{" "}
              <Link
                className="text-primary hover:text-text-primary underline ml-1 inline-flex items-center gap-0.5"
                to="/pricing"
              >
                View Credit Packs
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* DESKTOP FOOTER */}
      <footer className="hidden md:block w-full bg-surface-raised mt-space-3xl border-t border-glass-border">
        <div className="max-w-[1240px] mx-auto px-margin lg:px-margin-desktop py-space-3xl">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-space-xl">
            <div className="col-span-2 md:col-span-4 lg:col-span-2 pr-space-lg">
              <div className="flex items-center gap-space-sm mb-space-md">
                <Logo className="w-7 h-7" />
                <span className="font-headline-sm text-headline-sm text-text-primary tracking-tight font-bold">
                  PDFChat AI
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-text-muted mb-space-lg max-w-sm leading-relaxed">
                Enterprise neural synthesis engine for technical researchers, legal counsels, and data analysts with verifiable citations.
              </p>
              <div className="inline-flex items-center gap-space-sm px-space-md py-space-xs rounded-full bg-surface-container border border-white/5">
                <span className="material-symbols-outlined text-success text-[16px]">verified_user</span>
                <span className="font-badge-caps text-badge-caps text-on-surface uppercase tracking-wider font-semibold">
                  SOC2 Type II Certified
                </span>
              </div>
            </div>

            <div>
              <div className="font-badge-caps text-badge-caps uppercase tracking-wider text-text-muted mb-space-md font-semibold">
                Product
              </div>
              <ul className="space-y-space-sm">
                <li className="list-none">
                  <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="features" href="#features">
                    Document Synthesis
                  </a>
                </li>
                <li className="list-none">
                  <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="features" href="#features">
                    Citation Graph
                  </a>
                </li>
                <li className="list-none">
                  <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="features" href="#features">
                    Multi-Doc Queries
                  </a>
                </li>
                <li className="list-none">
                  <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="pricing" href="#pricing">
                    Pricing Tiers
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-badge-caps text-badge-caps uppercase tracking-wider text-text-muted mb-space-md font-semibold">
                Resources
              </div>
              <ul className="space-y-space-sm">
                <li className="list-none">
                  <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="docs" to="/docs">
                    API Reference
                  </Link>
                </li>
                <li className="list-none">
                  <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="docs" to="/docs">
                    SDK Documentation
                  </Link>
                </li>
                <li className="list-none">
                  <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="how-it-works" href="#how-it-works">
                    Architecture Guide
                  </a>
                </li>
                <li className="list-none">
                  <a className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="how-it-works" href="#how-it-works">
                    Case Studies
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <div className="font-badge-caps text-badge-caps uppercase tracking-wider text-text-muted mb-space-md font-semibold">
                Legal &amp; Trust
              </div>
              <ul className="space-y-space-sm">
                <li className="list-none">
                  <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="enterprise" to="/privacy">
                    Privacy Architecture
                  </Link>
                </li>
                <li className="list-none">
                  <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="enterprise" to="/privacy">
                    SOC2 Compliance
                  </Link>
                </li>
                <li className="list-none">
                  <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="enterprise" to="/terms">
                    Terms of Service
                  </Link>
                </li>
                <li className="list-none">
                  <Link className="font-body-sm text-body-sm text-on-surface-variant hover:text-on-surface transition-colors" data-path="enterprise" to="/privacy">
                    Security Whitepaper
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-space-2xl pt-space-xl flex flex-col sm:flex-row items-center justify-between gap-space-md border-t border-glass-border/40">
            <p className="font-body-sm text-body-sm text-text-muted">
              © {new Date().getFullYear()} PDFChat AI, Inc. All rights reserved. Zero document retention architecture.
            </p>
            <div className="flex items-center gap-space-lg">
              <span className="font-label-code text-label-code text-text-muted flex items-center gap-space-xs">
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

