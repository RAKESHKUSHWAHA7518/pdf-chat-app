// src/pages/RepoDocsPage.jsx — GitHub Repo to README Generator & Docs Studio.
import { useState, useEffect } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  BookOpen,
  Sparkles,
  GitBranch,
  Copy,
  Check,
  Download,
  UploadCloud,
  FileCode,
  ExternalLink,
  Loader2,
  AlertCircle,
  Eye,
  Edit3,
  Layers,
  Star,
  GitFork,
  CheckCircle2,
} from "lucide-react";
import { Github } from "../components/icons/Github.jsx";
import { useAuth } from "../hooks/useAuth";
import {
  generateRepoReadme,
  commitRepoReadme,
  getGithubRepos,
  getGithubStatus,
} from "../api";

const SAMPLE_REPOS = [
  { name: "expressjs/express", url: "https://github.com/expressjs/express" },
  { name: "fastapi/fastapi", url: "https://github.com/fastapi/fastapi" },
  { name: "shadcn/ui", url: "https://github.com/shadcn-ui/ui" },
];

export function RepoDocsPage() {
  const { auth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const outlet = useOutletContext();

  // Input states
  const [repoUrl, setRepoUrl] = useState("");
  const [tone, setTone] = useState("professional");
  const [customInstructions, setCustomInstructions] = useState("");

  // GitHub user repo picker
  const [userRepos, setUserRepos] = useState([]);
  const [loadingUserRepos, setLoadingUserRepos] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [error, setError] = useState(null);
  const [markdown, setMarkdown] = useState("");
  const [repoMeta, setRepoMeta] = useState(null);

  // Editor mode: "preview" | "raw"
  const [activeTab, setActiveTab] = useState("preview");
  const [copied, setCopied] = useState(false);

  // Commit to GitHub modal/state
  const [isCommitting, setIsCommitting] = useState(false);
  const [commitSuccess, setCommitSuccess] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      getGithubStatus(auth)
        .then((st) => {
          setGithubConnected(st.connected);
          if (st.connected) {
            setLoadingUserRepos(true);
            getGithubRepos(auth)
              .then((repos) => setUserRepos(repos || []))
              .catch(() => {})
              .finally(() => setLoadingUserRepos(false));
          }
        })
        .catch(() => {});
    }
  }, [auth, isAuthenticated]);

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/dashboard/repo-docs");
      return;
    }

    if (!repoUrl.trim()) {
      setError("Please provide a GitHub repository URL or owner/repo identifier.");
      return;
    }

    setError(null);
    setCommitSuccess(null);
    setIsGenerating(true);
    setStepMessage("Connecting to GitHub API & inspecting repository...");

    const t1 = setTimeout(() => setStepMessage("Analyzing file tree, manifest & tech dependencies..."), 1200);
    const t2 = setTimeout(() => setStepMessage("Architecting system overview & Mermaid diagram..."), 2600);
    const t3 = setTimeout(() => setStepMessage("Generating installation, API usage & shields..."), 4500);

    try {
      const res = await generateRepoReadme(auth, {
        repoUrl: repoUrl.trim(),
        customInstructions: customInstructions.trim(),
        tone,
      });

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (res.markdown) {
        setMarkdown(res.markdown);
        setRepoMeta(res.repoMeta || null);
        setActiveTab("preview");
        if (outlet?.refreshCredits) outlet.refreshCredits();
      } else {
        throw new Error("No markdown content returned");
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (err.status === 402 && outlet?.openPricingModal) {
        outlet.openPricingModal();
      } else {
        setError(err.message || "Failed to generate repository README. Please verify the URL and retry.");
      }
    } finally {
      setIsGenerating(false);
      setStepMessage("");
    }
  };

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!markdown) return;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = repoMeta ? `${repoMeta.name}-README.md` : "README.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCommitToGithub = async () => {
    if (!githubConnected) {
      navigate("/dashboard/settings");
      return;
    }
    if (!repoMeta) return;

    setError(null);
    setIsCommitting(true);
    try {
      const [owner, name] = repoMeta.fullName.split("/");
      const res = await commitRepoReadme(auth, {
        repoOwner: owner,
        repoName: name,
        branch: repoMeta.defaultBranch || "main",
        markdownContent: markdown,
        commitMessage: "docs: update README.md via DevSuite AI",
      });

      setCommitSuccess(`Successfully pushed commit ${res.commitSha?.slice(0, 7)} to GitHub!`);
      setTimeout(() => setCommitSuccess(null), 5000);
    } catch (err) {
      setError(err.message || "Failed to push README to GitHub.");
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-100 overflow-y-auto lg:overflow-hidden lg:h-full">
      {/* Header */}
      <header className="min-h-14 py-2.5 px-3 sm:px-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/20 shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                GitHub Repo to README Studio
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-semibold shrink-0">
                Architecture & Docs
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">
              Inspect any repository file tree, auto-detect dependencies, and generate complete production documentation
            </p>
          </div>
        </div>

        {markdown && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copied ? "Copied" : "Copy Markdown"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" />
              Download .md
            </button>
            {githubConnected && repoMeta && (
              <button
                type="button"
                onClick={handleCommitToGithub}
                disabled={isCommitting}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50 cursor-pointer"
              >
                {isCommitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Github className="w-3.5 h-3.5" />}
                Push to Repo
              </button>
            )}
          </div>
        )}
      </header>

      {/* Main Dual-Pane Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-w-0">
        {/* Left Pane: Config & Generator Controls */}
        <div className="w-full lg:w-[460px] xl:w-[500px] border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col bg-slate-900/40 shrink-0 overflow-y-visible lg:overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {commitSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              <div className="flex-1">{commitSuccess}</div>
            </div>
          )}

          {/* Repo Input */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Github className="w-3.5 h-3.5 text-cyan-400" /> Target GitHub Repository
              </span>
            </label>

            {/* User Repos Select if connected */}
            {githubConnected && userRepos.length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Pick from your linked repositories:</label>
                <select
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="">-- Or choose one of your repos --</option>
                  {userRepos.map((r) => (
                    <option key={r.id} value={r.htmlUrl}>
                      {r.fullName} ({r.language || "code"} • ⭐ {r.stars})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <input
              type="text"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repository or owner/repo"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
            />

            {/* Quick Sample Repos */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-medium">Try Sample:</span>
              {SAMPLE_REPOS.map((sample) => (
                <button
                  key={sample.name}
                  type="button"
                  onClick={() => setRepoUrl(sample.url)}
                  className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-300 font-medium transition-colors"
                >
                  {sample.name}
                </button>
              ))}
            </div>
          </div>

          {/* Documentation Tone & Style */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Documentation Tone</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "professional", label: "Professional & Enterprise" },
                { id: "open_source", label: "Open Source Viral" },
                { id: "minimalist", label: "Minimalist & Clean" },
                { id: "tutorial", label: "Developer Tutorial" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    tone === t.id
                      ? "border-cyan-500 bg-cyan-500/10 text-cyan-300 shadow-sm"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Prompt / Special Instructions */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Special Instructions (Optional)</label>
              <span className="text-[10px] text-slate-400">Customize focus</span>
            </div>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g. Include a Docker deployment guide, highlight our microservices architecture, emphasize Redis caching, or detail the GraphQL mutations..."
              rows={4}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-cyan-500 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-600 hover:via-blue-700 hover:to-indigo-700 text-white font-bold text-xs tracking-wide shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{stepMessage || "Inspecting & Architecting..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Repository README (1 Credit)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Free with Pro Plan • Consumes 1 Credit for Standard Accounts
            </p>
          </div>
        </div>

        {/* Right Pane: Live Render / Markdown Editor */}
        <div className="flex-1 flex flex-col bg-slate-950 min-w-0 overflow-y-auto lg:overflow-hidden">
          {/* Subheader Toolbar */}
          <div className="min-h-11 py-1.5 px-3 sm:px-4 border-b border-slate-800/80 bg-slate-900/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "preview"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Eye className="w-3.5 h-3.5" /> Live Preview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("raw")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "raw"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" /> Markdown Source
              </button>
            </div>

            {repoMeta && (
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <Github className="w-3 h-3 text-slate-400" /> {repoMeta.fullName}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-amber-400" /> {repoMeta.stars}
                </span>
                {repoMeta.language && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                    {repoMeta.language}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {!markdown && !isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-16">
                <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 shadow-inner">
                  <BookOpen className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white">Generate Production-Grade Documentation</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Enter any public repository link or choose one of your own. DevSuite AI will inspect the manifests, generate architecture flowcharts, and format step-by-step setup guides.
                  </p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Synthesizing Documentation</h3>
                  <p className="text-xs text-slate-400 max-w-sm">{stepMessage}</p>
                </div>
              </div>
            )}

            {markdown && !isGenerating && (
              <>
                {activeTab === "preview" ? (
                  <div className="prose prose-invert prose-indigo max-w-none text-slate-200 text-sm leading-relaxed space-y-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                      {markdown}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={markdown}
                    onChange={(e) => setMarkdown(e.target.value)}
                    className="w-full h-full min-h-[500px] bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-xl p-4 focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default RepoDocsPage;
