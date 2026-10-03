import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ArrowRight, Lock, Mail, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { login as apiLogin } from "../api";
import { Button, Input, InteractiveCard } from "../components/ui";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiLogin(email, password);
      login(data);
      navigate("/app");
    } catch (err) {
      setError(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-2xl overflow-hidden animate-scale-in">
        
        {/* Left Column: Visual Showcase */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-indigo-950/60 via-purple-950/30 to-slate-950 border-r border-slate-800/80 relative">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">PDFChat AI</span>
            </Link>

            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              Welcome back to your <br />
              <span className="text-gradient">AI Document Workspace</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Resume your research sessions, cross-examine multiple PDFs, and review past insights with citation accuracy.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Unlimited saved document library</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Full chat history and page bookmarking</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Encrypted vector storage & private retrieval</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sign In Form */}
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Sign in to your account
            </h1>
            <p className="text-xs text-slate-400">
              Don't have an account yet?{" "}
              <Link to="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Create one free →
              </Link>
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 animate-shake">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked
                  className="rounded bg-slate-900 border-slate-700 text-indigo-500 focus:ring-0"
                />
                Remember me
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("Please contact support or register a new demo account."); }} className="text-indigo-400 hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-4 justify-center"
            >
              Sign In to PDFChat <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          {/* Guest Shortcut */}
          <div className="mt-8 pt-6 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400 mb-2">Want to try without creating an account?</p>
            <Link to="/app">
              <Button variant="ghost" size="sm" className="text-xs text-indigo-300">
                Continue as Guest Trial →
              </Button>
            </Link>
          </div>
        </div>
      </div>
  );
}
