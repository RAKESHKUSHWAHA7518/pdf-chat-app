import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Shield, CreditCard, LogOut, ArrowLeft, CheckCircle2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { getCreditBalance } from "../api";
import { Button, InteractiveCard, Badge } from "../components/ui";

export function SettingsPage() {
  const { auth, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(null);

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

  return (
    <div className="py-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <Link to="/app" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-2">
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
            <Link to="/pricing">
              <Button size="sm" variant="outline">
                Manage Plans
              </Button>
            </Link>
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
                {balance?.isPro ? "Pro Member" : "Free Tier"}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-slate-500 block mb-1">Vector Storage</span>
              <span className="text-xl font-bold text-white">Encrypted</span>
            </div>
          </div>
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
    </div>
  );
}
