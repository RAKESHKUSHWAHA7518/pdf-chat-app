// src/components/dashboard/Sidebar.jsx — Modern collapsible navigation for DevSuite AI.
import { NavLink, Link, useLocation } from "react-router-dom";
import {
  FileText,
  FolderOpen,
  FileCode,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertCircle,
  Home,
  Target,
  BookOpen,
  Network,
  Mail,
} from "lucide-react";
import { Github } from "../icons/Github";

export function Sidebar({ collapsed, onToggle, auth, githubStatus, credits, onManagePlan }) {
  const location = useLocation();

  const navItems = [
    { label: "Chat with PDF", path: "/dashboard/chat-pdf", icon: FileText, altPath: "/app" },
    { label: "Document Vault", path: "/dashboard/documents", icon: FolderOpen },
    { label: "GitHub Profile Studio", path: "/dashboard/github-studio", icon: Github, badge: "Popular" },
    { label: "Resume to README", path: "/dashboard/resume-to-readme", icon: FileCode, badge: "AI" },
    { label: "Cover Letter AI", path: "/dashboard/cover-letter", icon: Mail, badge: "AI" },
    { label: "ATS Resume Matcher", path: "/dashboard/ats-matcher", icon: Target, badge: "STAR" },
    { label: "Repo README Studio", path: "/dashboard/repo-docs", icon: BookOpen, badge: "New" },
    { label: "Architecture Diagrams", path: "/dashboard/diagrams", icon: Network, badge: "Mermaid" },
    { label: "Settings & Integrations", path: "/dashboard/settings", icon: Settings, altPath: "/settings" },
  ];

  return (
    <aside
      className={`h-screen bg-slate-950/95 border-r border-slate-800/80 flex flex-col transition-all duration-300 z-30 shrink-0 select-none ${
        collapsed ? "w-16 md:w-20" : "w-64"
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
        <Link to="/" className="flex items-center gap-2.5 overflow-hidden group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shrink-0 shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-200">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-sm tracking-tight flex items-center gap-1.5">
                DevSuite AI
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Developer Tools</span>
            </div>
          )}
        </Link>
        <button
          type="button"
          onClick={onToggle}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-900 border border-slate-800 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="px-2 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {!collapsed ? "AI Workspaces" : "•"}
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            location.pathname === item.path ||
            (item.altPath && location.pathname === item.altPath);

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group relative ${
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
              }`}
            >
              <Icon className="w-4 h-4 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}

        {/* Back to Home link */}
        <div className="pt-4 mt-4 border-t border-slate-800/60">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-900/40 rounded-xl transition-colors"
          >
            <Home className="w-4 h-4 shrink-0" />
            {!collapsed && <span>Back to Home</span>}
          </Link>
        </div>
      </nav>

      {/* Bottom Integrations & Credits Pill */}
      <div className="p-3 border-t border-slate-800/80 space-y-2 shrink-0">
        {/* GitHub Status Pill */}
        {!collapsed ? (
          <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] flex items-center justify-between">
            <div className="flex items-center gap-2 truncate">
              <Github className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-slate-300 truncate">
                {githubStatus?.connected ? githubStatus.githubUsername : "GitHub: Unlinked"}
              </span>
            </div>
            {githubStatus?.connected ? (
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold shrink-0">
                <CheckCircle2 size={11} /> Linked
              </span>
            ) : (
              <Link
                to="/dashboard/settings"
                className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold shrink-0"
              >
                Connect
              </Link>
            )}
          </div>
        ) : (
          <div
            className="flex justify-center p-2 rounded-xl bg-slate-900/60 border border-slate-800/60"
            title={githubStatus?.connected ? `GitHub Linked: @${githubStatus.githubUsername}` : "GitHub: Unlinked"}
          >
            <Github className={`w-4 h-4 ${githubStatus?.connected ? "text-emerald-400" : "text-slate-500"}`} />
          </div>
        )}

        {/* User Credits & Plan */}
        {!collapsed && auth && (
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-indigo-950/40 to-slate-900 border border-indigo-500/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-slate-300 font-medium text-[11px]">{credits ?? 0} Credits</span>
            </div>
            {onManagePlan && (
              <button
                type="button"
                onClick={onManagePlan}
                className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                title="Manage Plan & Credits"
              >
                Manage
              </button>
            )}
          </div>
        )}

        {/* Collapsed view credit button */}
        {collapsed && auth && onManagePlan && (
          <button
            type="button"
            onClick={onManagePlan}
            className="w-full flex justify-center p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-900/40 hover:text-indigo-300 transition-colors cursor-pointer"
            title={`${credits ?? 0} Credits — Manage Plan`}
          >
            <Zap className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
export default Sidebar;
