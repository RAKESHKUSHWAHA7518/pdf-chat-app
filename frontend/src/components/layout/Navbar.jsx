import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FileText, Sparkles, Menu, X, ArrowRight, ArrowLeft } from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { Button } from "../ui/Button";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  const navLinks = [
    { label: "Features", href: "/#features", isHash: true },
    { label: "GitHub Studio", href: "/dashboard/github-studio", isHash: false },
    { label: "Resume to README", href: "/dashboard/resume-to-readme", isHash: false },
    { label: "Pricing", href: "/pricing", isHash: false },
    { label: "Docs", href: "/docs", isHash: false },
  ];

  // --- Auth Pages Minimal Navbar ---
  if (isAuthPage) {
    const isLogin = location.pathname === "/login";
    return (
      <header className="w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              PDFChat <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            </span>
          </Link>

          {/* Right link */}
          <div className="flex items-center gap-4 text-xs">
            <span className="hidden sm:inline text-slate-400">
              {isLogin ? "New to PDFChat?" : "Already have an account?"}
            </span>
            <Link to={isLogin ? "/signup" : "/login"}>
              <Button size="sm" variant="secondary" className="text-xs">
                {isLogin ? "Create Free Account" : "Sign In"}
              </Button>
            </Link>
            <Link
              to="/"
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium ml-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
            </Link>
          </div>
        </div>
      </header>
    );
  }

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

  // --- Marketing Floating Island Navbar ---
  return (
    <header className="sticky top-3 z-40 max-w-7xl mx-24 px-4 px-4 sm:px-6 pointer-events-none">
      <div className="navbar-island pointer-events-auto">
        <div className="flex h-14 items-center justify-between">

          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 group shrink-0">
            <Logo className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-105 shrink-0" />
            <span className="font-headline-sm text-base sm:text-headline-sm text-text-primary tracking-tight font-bold whitespace-nowrap">
              PDFChat AI
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-300 bg-slate-900/60 border border-slate-800/80 rounded-full px-3 py-1">
            {navLinks.map((link) => {
              const isActive = !link.isHash && location.pathname === link.href;
              return link.isHash ? (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-3 py-1.5 rounded-full text-slate-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 ${isActive
                    ? "bg-indigo-500/20 text-indigo-300 font-semibold border border-indigo-500/30"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                    }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* CTA Buttons */}
          {/* <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard/chat-pdf">
                <Button size="sm" variant="primary" className="text-xs shadow-md">
                  Open App <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <button className="text-xs font-semibold text-slate-300 hover:text-white px-3.5 py-1.5 rounded-xl hover:bg-white/5 transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" variant="primary" className="text-xs shadow-md shadow-indigo-500/20">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
          </div> */}

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

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800/80 pt-3 pb-4 space-y-3 animate-fade-in">
            <nav className="flex flex-col space-y-1">
              {navLinks.map((link) => (
                link.isHash ? (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5"
                  >
                    {link.label}
                  </a>
                ) : (
                  <Link
                    key={link.label}
                    to={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xs font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5"
                  >
                    {link.label}
                  </Link>
                )
              ))}
            </nav>
            <div className="pt-3 border-t border-slate-800/80 flex flex-col gap-2">
              {isAuthenticated ? (
                <Link to="/dashboard/chat-pdf" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full text-xs" size="sm">
                    Open App
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" className="w-full text-xs" size="sm">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" className="w-full text-xs" size="sm">
                      Get Started Free
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
