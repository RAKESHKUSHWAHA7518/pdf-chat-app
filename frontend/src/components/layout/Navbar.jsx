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
    { label: "How It Works", href: "/#how-it-works", isHash: true },
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

  // --- Marketing Floating Island Navbar ---
  return (
    <header className="sticky top-3 z-40 w-full px-4 sm:px-6 pointer-events-none">
      <div className="navbar-island pointer-events-auto">
        <div className="flex h-14 items-center justify-between">
          
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
              PDFChat <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
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
                  className={`px-3 py-1.5 rounded-full transition-all duration-200 ${
                    isActive
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
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              <Link to="/app">
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
                <Link to="/app" onClick={() => setMobileMenuOpen(false)}>
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
