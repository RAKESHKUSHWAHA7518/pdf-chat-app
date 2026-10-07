import { useState, useEffect, useCallback } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "../dashboard/Sidebar";
import { useAuth } from "../../hooks/useAuth";
import { useGithubIntegration } from "../../hooks/useGithubIntegration";
import { getCreditBalance } from "../../api";
import PricingPage from "../PricingPage.jsx";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));
  const { auth, isAuthenticated } = useAuth();
  const { status: githubStatus } = useGithubIntegration(auth);
  const [credits, setCredits] = useState(0);
  const [showPricingModal, setShowPricingModal] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
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
      {/* Collapsible Multi-Tool Sidebar */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        auth={auth}
        githubStatus={githubStatus}
        credits={credits}
        onManagePlan={handleManagePlan}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 relative">
        <Outlet context={{ openPricingModal: handleManagePlan, refreshCredits, credits }} />
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
