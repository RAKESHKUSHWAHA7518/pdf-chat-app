import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../dashboard/Sidebar";
import { useAuth } from "../../hooks/authContext.js";
import { useGithubIntegration } from "../../hooks/useGithubIntegration";
import { getCreditBalance } from "../../api";
import PricingPage from "../PricingPage.jsx";
import { Menu, Sparkles, Zap } from "lucide-react";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));
  const [mobileOpen, setMobileOpen] = useState(false);
  const { auth, isAuthenticated } = useAuth();
  const { status: githubStatus } = useGithubIntegration(auth);
  const [credits, setCredits] = useState(0);
  const [showPricingModal, setShowPricingModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
      if (window.innerWidth >= 1024) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const refreshCredits = useCallback(() => {
    if (isAuthenticated && auth) {
      getCreditBalance(auth)
        .then((bal) => setCredits(bal?.credits ?? 0))
        .catch(() => {});
    }
  }, [auth, isAuthenticated]);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  const handleManagePlan = () => {
    setShowPricingModal(true);
  };

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Multi-Tool Sidebar (Docked on lg+, Drawer on mobile) */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
        auth={auth}
        githubStatus={githubStatus}
        credits={credits}
        onManagePlan={handleManagePlan}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden bg-slate-950 relative">
        {/* Mobile Top App Bar (visible on < lg) */}
        <div className="lg:hidden h-14 bg-slate-950/95 border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between shrink-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              aria-label="Open navigation menu"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Sparkles size={14} />
              </div>
              <span className="font-extrabold text-white text-sm tracking-tight">DevSuite AI</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManagePlan}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-semibold hover:border-indigo-400 transition-colors"
            >
              <Zap size={12} className="text-indigo-400" />
              <span>{credits ?? 0}</span>
            </button>
          </div>
        </div>

        {/* Child Workspace Route */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
          <Outlet context={{ openPricingModal: handleManagePlan, refreshCredits, credits }} />
        </div>
      </main>

      {/* Manage Plan & Pricing Modal Popup */}
      {showPricingModal && (
        <PricingPage
          auth={auth}
          onClose={() => {
            setShowPricingModal(false);
            refreshCredits();
          }}
        />
      )}
    </div>
  );
}

export default DashboardLayout;
