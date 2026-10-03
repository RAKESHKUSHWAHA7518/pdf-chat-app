import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { AmbientBackground } from "./AmbientBackground";

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative">
      <AmbientBackground />
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function AuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative overflow-x-hidden">
      <AmbientBackground />
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-8 px-4 sm:px-6">
        <Outlet />
      </main>
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-900/80">
        <div className="flex items-center justify-center gap-4">
          <span>© {new Date().getFullYear()} PDFChat AI</span>
          <span>·</span>
          <a href="/privacy" className="hover:text-slate-400">Privacy</a>
          <span>·</span>
          <a href="/terms" className="hover:text-slate-400">Terms</a>
        </div>
      </footer>
    </div>
  );
}

export function AppLayout() {
  return (
    <div className="h-screen w-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      <Outlet />
    </div>
  );
}
