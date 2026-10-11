import { useState, useEffect } from "react";
import { Link, useNavigate, useOutletContext } from "react-router-dom";
import {
  User,
  Shield,
  CreditCard,
  LogOut,
  ArrowLeft,
  CheckCircle2,
  Key,
  ShieldCheck,
  AlertCircle,
  Loader2,
  ExternalLink
} from "lucide-react";
import { Github } from "../components/icons/Github";
import { useAuth } from "../hooks/useAuth";
import { useGithubIntegration } from "../hooks/useGithubIntegration";
import { getCreditBalance } from "../api";
import { Button, InteractiveCard, Badge } from "../components/ui";
import PricingPage from "../components/PricingPage.jsx";

export function SettingsPage() {
  const { auth, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const outlet = useOutletContext();
  const [balance, setBalance] = useState(null);
  const [showPricingModal, setShowPricingModal] = useState(false);

  // GitHub integration hook
  const { status: ghStatus, loading: ghLoading, connectWithToken, disconnect } = useGithubIntegration(auth);
  const [patInput, setPatInput] = useState("");
  const [connectingGh, setConnectingGh] = useState(false);
  const [ghError, setGhError] = useState(null);
  const [ghSuccess, setGhSuccess] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    getCreditBalance(auth)
      .then(setBalance)
      .catch((e) => console.log("Balance fetch error:", e));
  }, [auth, isAuthenticated]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const handleConnectGh = async (e) => {
    e.preventDefault();
    if (!patInput.trim()) return;
    setGhError(null);
    setGhSuccess(null);
    setConnectingGh(true);
    try {
      await connectWithToken(patInput.trim());
      setPatInput("");
      setGhSuccess("GitHub account connected successfully!");
      setTimeout(() => setGhSuccess(null), 4000);
    } catch (err) {
      setGhError(err.message || "Failed to link GitHub token");
    } finally {
      setConnectingGh(false);
    }
  };

  const handleDisconnectGh = async () => {
    setGhError(null);
    setGhSuccess(null);
    try {
      await disconnect();
    } catch {
      setGhError("Failed to disconnect GitHub");
    }
  };

  return (
    <div className="flex-1 h-full overflow-y-auto py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Header */}
      <div className="mb-8">
        <Link to="/dashboard/chat-pdf" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Chat Workspace
        </Link>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Account Settings
        </h1>
        <p className="text-xs text-slate-400">
          Manage your personal profile, credentials, and plan subscriptions.
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Card */}
        <InteractiveCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" />
              User Profile
            </h3>
            <Badge variant="success" size="sm">Active Account</Badge>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Email Address</span>
              <span className="text-slate-200 font-mono text-sm">{auth?.email || "Unknown"}</span>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Authentication Method</span>
              <span className="text-slate-200 font-medium">Standard JWT Token</span>
            </div>
          </div>
        </InteractiveCard>

        {/* Subscription & Credits Status */}
        <InteractiveCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-purple-400" />
              Subscription & Credits
            </h3>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (outlet?.openPricingModal) {
                  outlet.openPricingModal();
                } else {
                  setShowPricingModal(true);
                }
              }}
            >
              Manage Plans
            </Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1">Document Credits</span>
              <span className="text-xl font-bold text-white">
                {balance?.credits ?? 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1">Current Plan</span>
              <span className="text-xl font-bold text-indigo-400">
                {balance?.isPro ? (balance?.planLabel || "Pro Member") : "Free Account"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1">Vector Storage</span>
              <span className="text-xl font-bold text-white">Encrypted</span>
            </div>
          </div>
        </InteractiveCard>

        {/* GitHub Developer Integration */}
        <InteractiveCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Github className="w-4 h-4 text-slate-300" />
              GitHub Developer Integration
            </h3>
            {ghStatus?.connected ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 size={11} className="mr-1" /> Connected
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm">Not Linked</Badge>
            )}
          </div>

          <p className="text-xs text-slate-400 mb-6 leading-relaxed">
            Connect your GitHub account to enable 1-Click Publishing to your special profile repository (<code className="bg-slate-900 text-indigo-300 px-1 py-0.5 rounded font-mono">username/username</code>) directly from GitHub Studio and Resume-to-README.
          </p>

          {ghSuccess && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 size={14} className="shrink-0" />
              <span>{ghSuccess}</span>
            </div>
          )}

          {ghError && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle size={14} className="shrink-0" />
              <span>{ghError}</span>
            </div>
          )}

          {ghStatus?.connected ? (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {ghStatus.avatarUrl ? (
                  <img src={ghStatus.avatarUrl} alt="GitHub Avatar" className="w-10 h-10 rounded-full border border-slate-700" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-300 font-bold">
                    <Github size={18} />
                  </div>
                )}
                <div>
                  <span className="text-sm font-bold text-white block">@{ghStatus.githubUsername}</span>
                  <a
                    href={`https://github.com/${ghStatus.githubUsername}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                  >
                    View GitHub Profile <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={handleDisconnectGh}>
                Disconnect GitHub
              </Button>
            </div>
          ) : (
            <form onSubmit={handleConnectGh} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  GitHub Personal Access Token (PAT)
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={patInput}
                    onChange={(e) => setPatInput(e.target.value)}
                    placeholder="ghp_... or github_pat_..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                    required
                  />
                  <Button type="submit" size="sm" variant="primary" disabled={connectingGh}>
                    {connectingGh && <Loader2 size={13} className="animate-spin mr-1.5" />}
                    {connectingGh ? "Verifying..." : "Connect"}
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1 text-slate-400">
                  <ShieldCheck size={13} className="text-emerald-400 shrink-0" />
                  Token is AES-256 encrypted in MongoDB and never sent to clients.
                </span>
                <a
                  href="https://github.com/settings/tokens/new?scopes=repo&description=DevSuite+AI"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 underline font-medium shrink-0 ml-2"
                >
                  Generate Token (repo scope)
                </a>
              </div>
            </form>
          )}
        </InteractiveCard>

        {/* Security & Danger Zone */}
        <InteractiveCard className="p-6 border-red-500/20 bg-red-950/10">
          <h3 className="text-base font-bold text-white flex items-center gap-2 mb-2 text-red-300">
            <Shield className="w-4 h-4 text-red-400" />
            Session & Security
          </h3>
          <p className="text-xs text-slate-400 mb-6">
            Sign out of your active session on this device.
          </p>

          <Button variant="danger" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-1.5" /> Sign Out
          </Button>
        </InteractiveCard>
      </div>

      {/* Pricing / Plan Management Modal */}
      {showPricingModal && (
        <PricingPage
          auth={auth}
          onClose={() => {
            setShowPricingModal(false);
            if (isAuthenticated && auth) {
              getCreditBalance(auth)
                .then((b) => setBalance(b))
                .catch(() => {});
            }
            if (outlet?.refreshCredits) {
              outlet.refreshCredits();
            }
          }}
        />
      )}
    </div>
  );
}
