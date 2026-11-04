import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FileText, ArrowRight, ShieldCheck, CheckCircle2, Zap } from "lucide-react";
import { useAuth } from "../hooks/authContext.js";
import { signup as apiSignup } from "../api";
import { Button, Input } from "../components/ui";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const getStrength = (pass) => {
    let score = 0;
    if (pass.length >= 8) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    return score;
  };

  const strength = getStrength(password);
  const strengthColors = ["bg-slate-700", "bg-red-500", "bg-amber-500", "bg-emerald-400", "bg-emerald-500"];
  const strengthLabels = ["Too short", "Weak", "Fair", "Strong", "Excellent"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const data = await apiSignup(email, password);
      login(data);
      navigate("/app");
    } catch (err) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-3xl border border-slate-800 bg-slate-950/80 shadow-2xl backdrop-blur-2xl overflow-hidden animate-scale-in">
        
        {/* Left Column: Visual Benefits */}
        <div className="hidden md:flex flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-purple-950/60 via-indigo-950/40 to-slate-950 border-r border-slate-800/80">
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 mb-8">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <span className="font-extrabold text-white text-lg tracking-tight">PDFChat AI</span>
            </Link>

            <h2 className="text-2xl font-bold text-white tracking-tight leading-snug">
              Unlock unlimited <br />
              <span className="text-gradient">Document Intelligence</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              Create your account in 30 seconds. No credit card required. Includes 3 free document credits immediately to index and chat with your PDFs.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-slate-800/80 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
              <span>3 free document credits upon signup</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Instant Gemini 2.5 streaming responses</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Strict enterprise-grade confidentiality</span>
            </div>
          </div>
        </div>

        {/* Right Column: Sign Up Form */}
        <div className="p-8 lg:p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white tracking-tight mb-1">
              Create your free account
            </h1>
            <p className="text-xs text-slate-400">
              Already have an account?{" "}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Sign in here →
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
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />

            <Input
              label="Create password"
              type="password"
              placeholder="At least 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            {/* Password strength meter */}
            {password.length > 0 && (
              <div className="space-y-1.5 pt-0.5">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Strength: {strengthLabels[strength]}</span>
                  <span>{password.length}/8 min chars</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden flex gap-1">
                  {[...Array(4)].map((_, i) => (
                    <div
                      key={i}
                      className={`h-full flex-1 transition-all duration-300 rounded-full ${
                        i < strength ? strengthColors[strength] : "bg-slate-800"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}

            <Input
              label="Confirm password"
              type="password"
              placeholder="Re-type password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full mt-4 justify-center"
            >
              Create Free Account <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <p className="mt-6 text-center text-[11px] text-slate-500 leading-relaxed">
            By creating an account, you agree to our{" "}
            <Link to="/terms" className="text-slate-400 underline hover:text-white">Terms of Service</Link> and{" "}
            <Link to="/privacy" className="text-slate-400 underline hover:text-white">Privacy Policy</Link>.
          </p>
        </div>
      </div>
  );
}
