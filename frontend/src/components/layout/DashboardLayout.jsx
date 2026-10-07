// src/components/layout/DashboardLayout.jsx — Unified multi-tool dashboard shell with responsive sidebar.
import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "../dashboard/Sidebar";
import { useAuth } from "../../hooks/useAuth";
import { useGithubIntegration } from "../../hooks/useGithubIntegration";
import { getCreditBalance } from "../../api";

export function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(() => (typeof window !== "undefined" ? window.innerWidth < 1024 : false));
  const { auth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const { status: githubStatus } = useGithubIntegration(auth);
  const [credits, setCredits] = useState(0);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      getCreditBalance(auth)
        .then((bal) => setCredits(bal?.credits ?? 0))
        .catch(() => {});
    }
  }, [auth, isAuthenticated]);

  const handleManagePlan = () => {
    navigate("/pricing");
  };

  return (
    <div className="h-screen w-screen flex bg-slate-950 text-slate-100 overflow-hidden">
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
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
