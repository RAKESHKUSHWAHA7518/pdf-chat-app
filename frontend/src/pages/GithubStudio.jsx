// src/pages/GithubStudio.jsx — Interactive GitHub Profile README Studio with live preview & 1-click publish.
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Sparkles,
  Send,
  Copy,
  Check,
  Eye,
  Code,
  Plus,
  Trash2,
  ExternalLink,
  Loader2,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Github } from "../components/icons/Github";
import { useAuth } from "../hooks/useAuth";
import { useGithubIntegration } from "../hooks/useGithubIntegration";

const TECH_BADGES = [
  // Frontend
  { name: "React", category: "Frontend", slug: "react-20232A?logo=react&logoColor=61DAFB" },
  { name: "Next.js", category: "Frontend", slug: "next.js-000000?logo=nextdotjs&logoColor=white" },
  { name: "TypeScript", category: "Languages", slug: "typescript-3178C6?logo=typescript&logoColor=white" },
  { name: "JavaScript", category: "Languages", slug: "javascript-F7DF1E?logo=javascript&logoColor=black" },
  { name: "TailwindCSS", category: "Frontend", slug: "tailwindcss-0F172A?logo=tailwindcss&logoColor=06B6D4" },
  { name: "HTML5", category: "Frontend", slug: "html5-E34F26?logo=html5&logoColor=white" },
  { name: "CSS3", category: "Frontend", slug: "css3-1572B6?logo=css3&logoColor=white" },

  // Backend
  { name: "Node.js", category: "Backend", slug: "node.js-339933?logo=nodedotjs&logoColor=white" },
  { name: "Express", category: "Backend", slug: "express-000000?logo=express&logoColor=white" },
  { name: "Python", category: "Languages", slug: "python-3776AB?logo=python&logoColor=white" },
  { name: "FastAPI", category: "Backend", slug: "fastapi-009688?logo=fastapi&logoColor=white" },
  { name: "Go", category: "Languages", slug: "go-00ADD8?logo=go&logoColor=white" },
  { name: "Rust", category: "Languages", slug: "rust-000000?logo=rust&logoColor=white" },

  // Databases & Cloud
  { name: "MongoDB", category: "Database", slug: "mongodb-47A248?logo=mongodb&logoColor=white" },
  { name: "PostgreSQL", category: "Database", slug: "postgresql-4169E1?logo=postgresql&logoColor=white" },
  { name: "Redis", category: "Database", slug: "redis-DC382D?logo=redis&logoColor=white" },
  { name: "Docker", category: "DevOps", slug: "docker-2496ED?logo=docker&logoColor=white" },
  { name: "AWS", category: "DevOps", slug: "aws-232F3E?logo=amazon-aws&logoColor=white" },
  { name: "Git", category: "Tools", slug: "git-F05032?logo=git&logoColor=white" },
];

export function GithubStudio({ initialData = null }) {
  const routerLocation = useLocation();
  const navData = routerLocation?.state?.initialData;
  const activeData = initialData || navData || null;

  const { auth } = useAuth();
  const { status, connectWithToken, commitReadme } = useGithubIntegration(auth);

  // Form builder state
  const [name, setName] = useState(activeData?.name || "Rakesh Kushwaha");
  const [title, setTitle] = useState(activeData?.title || "Full-Stack AI Software Engineer");
  const [bio, setBio] = useState(
    activeData?.bio ||
      "Passionate about building scalable AI-powered web applications, RAG pipelines, and intuitive user experiences."
  );
  const [location, setLocation] = useState(activeData?.location || "India");
  const [selectedTech, setSelectedTech] = useState(
    activeData?.tech || ["React", "TypeScript", "Node.js", "MongoDB", "TailwindCSS", "Docker"]
  );
  const [socials, setSocials] = useState({
    github: status?.githubUsername || activeData?.socials?.github || activeData?.github || "",
    linkedin: activeData?.socials?.linkedin || activeData?.linkedin || "rakesh-kushwaha",
    twitter: activeData?.socials?.twitter || activeData?.twitter || "rakesh_dev",
    portfolio: activeData?.socials?.portfolio || activeData?.portfolio || "https://github.com",
    email: auth?.email || activeData?.socials?.email || activeData?.email || "",
  });

  const [stats, setStats] = useState({
    showStats: true,
    showTopLangs: true,
    showStreak: true,
    theme: "tokyonight",
  });

  const [projects, setProjects] = useState(
    activeData?.projects || [
      {
        title: "PDFChat AI Platform",
        desc: "Full-stack AI document intelligence suite with RAG, vector embeddings, and real-time streaming citations.",
        link: "https://github.com",
      },
    ]
  );

  // When activeData updates (e.g. navigation from resume-to-readme)
  useEffect(() => {
    if (activeData) {
      if (activeData.name) setName(activeData.name);
      if (activeData.title) setTitle(activeData.title);
      if (activeData.bio) setBio(activeData.bio);
      if (activeData.location) setLocation(activeData.location);
      if (activeData.tech && activeData.tech.length > 0) setSelectedTech(activeData.tech);
      if (activeData.projects && activeData.projects.length > 0) setProjects(activeData.projects);
      if (activeData.socials) {
        setSocials((prev) => ({
          ...prev,
          ...activeData.socials,
          github: status?.githubUsername || activeData.socials.github || prev.github,
        }));
      }
    }
  }, [activeData, status?.githubUsername]);

  // Sync GitHub username once connected
  useEffect(() => {
    if (status?.githubUsername && !socials.github) {
      setSocials((prev) => ({ ...prev, github: status.githubUsername }));
    }
  }, [status?.githubUsername]);

  // Tab & Modal State
  const [previewTab, setPreviewTab] = useState("rendered"); // "rendered" | "raw"
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [patInput, setPatInput] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState("");

  // Synthesize Markdown Content
  const markdownOutput = useMemo(() => {
    const ghUser = status?.githubUsername || socials.github || "username";

    let md = `<h1 align="center">Hi 👋, I'm ${name}</h1>\n`;
    md += `<h3 align="center">${title}</h3>\n\n`;

    if (location) {
      md += `<p align="center">📍 Based in <b>${location}</b></p>\n\n`;
    }

    md += `<p align="center">\n  ${bio}\n</p>\n\n`;

    // Social Links Badges
    const activeSocials = Object.entries(socials).filter(([, val]) => val?.trim());
    if (activeSocials.length > 0) {
      md += `<p align="center">\n`;
      if (socials.linkedin) {
        md += `  <a href="https://linkedin.com/in/${socials.linkedin}"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>\n`;
      }
      if (socials.twitter) {
        md += `  <a href="https://twitter.com/${socials.twitter}"><img src="https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white" alt="Twitter" /></a>\n`;
      }
      if (socials.portfolio) {
        md += `  <a href="${socials.portfolio}"><img src="https://img.shields.io/badge/Portfolio-6366F1?style=for-the-badge&logo=google-chrome&logoColor=white" alt="Portfolio" /></a>\n`;
      }
      if (socials.email) {
        md += `  <a href="mailto:${socials.email}"><img src="https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white" alt="Email" /></a>\n`;
      }
      md += `</p>\n\n---\n\n`;
    }

    // Languages & Technologies
    if (selectedTech.length > 0) {
      md += `### 🛠️ Languages & Technologies\n\n<p align="left">\n`;
      selectedTech.forEach((tech) => {
        const item = TECH_BADGES.find((t) => t.name === tech);
        if (item) {
          md += `  <img src="https://img.shields.io/badge/-${item.slug}&style=flat-square" alt="${tech}" />\n`;
        }
      });
      md += `</p>\n\n`;
    }

    // Featured Projects
    if (projects.length > 0) {
      md += `### 🚀 Featured Projects\n\n`;
      projects.forEach((p) => {
        md += `- **[${p.title}](${p.link || "#"})** — ${p.desc}\n`;
      });
      md += `\n`;
    }

    // GitHub Analytics Widgets (only render if a valid username is provided)
    if (ghUser && ghUser !== "username" && (stats.showStats || stats.showTopLangs || stats.showStreak)) {
      md += `### 📊 GitHub Activity & Metrics\n\n<p align="center">\n`;
      if (stats.showStats) {
        md += `  <img src="https://github-readme-stats.vercel.app/api?username=${ghUser}&show_icons=true&theme=${stats.theme}&hide_border=true" alt="GitHub Stats" />\n`;
      }
      if (stats.showTopLangs) {
        md += `  <img src="https://github-readme-stats.vercel.app/api/top-langs/?username=${ghUser}&layout=compact&theme=${stats.theme}&hide_border=true" alt="Top Languages" />\n`;
      }
      if (stats.showStreak) {
        md += `  <img src="https://github-readme-streak-stats.herokuapp.com/?user=${ghUser}&theme=${stats.theme}&hide_border=true" alt="GitHub Streak" />\n`;
      }
      md += `</p>\n\n`;
    }

    // Branding viral footer
    md += `---\n<p align="center"><sub>Crafted with <a href="https://github.com">DevSuite AI Studio</a> ⚡</sub></p>\n`;
    return md;
  }, [name, title, bio, location, selectedTech, socials, stats, projects, status?.githubUsername]);

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePublish = async () => {
    if (!status?.connected) {
      setShowConnectModal(true);
      return;
    }

    setIsPublishing(true);
    try {
      const res = await commitReadme(markdownOutput);
      setPublishSuccess(res);
    } catch (err) {
      alert(`Publish Failed: ${err.message}`);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleConnectToken = async (e) => {
    e.preventDefault();
    setConnectError("");
    setConnectLoading(true);
    try {
      await connectWithToken(patInput);
      setShowConnectModal(false);
      setPatInput("");
    } catch (err) {
      setConnectError(err.message);
    } finally {
      setConnectLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Action Header */}
      <header className="h-14 px-6 border-b border-slate-800/80 flex items-center justify-between shrink-0 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Github className="w-5 h-5 text-indigo-400" />
          <h1 className="text-sm font-bold text-white tracking-tight">GitHub Profile README Studio</h1>
          {status?.connected && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
              <CheckCircle2 size={10} /> @{status.githubUsername}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-all active:scale-95"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : "Copy Markdown"}</span>
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50"
          >
            {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>{isPublishing ? "Pushing..." : "Publish to GitHub"}</span>
          </button>
        </div>
      </header>

      {/* Dual Pane Layout */}
      <div className="flex-1 grid lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 overflow-hidden">
        {/* Left Pane: Interactive Builder Form */}
        <div className="overflow-y-auto p-6 space-y-6">
          {/* Section 1: Personal Info */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Sparkles size={13} /> 1. Profile Information
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Display Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">Location / Base</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. San Francisco, CA"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Professional Title / Headline</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="text-[11px] font-semibold text-slate-400 block mb-1">Short Bio</label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none"
              />
            </div>
          </div>

          {/* Section 2: Tech Badges */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
              2. Tech Stack Badges ({selectedTech.length} selected)
            </h2>
            <div className="flex flex-wrap gap-1.5">
              {TECH_BADGES.map((tech) => {
                const isSelected = selectedTech.includes(tech.name);
                return (
                  <button
                    key={tech.name}
                    type="button"
                    onClick={() => {
                      setSelectedTech((prev) =>
                        isSelected ? prev.filter((t) => t !== tech.name) : [...prev, tech.name]
                      );
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                        : "bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800"
                    }`}
                  >
                    {tech.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Social Links */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">3. Social Links & Profiles</h2>
            <div className="grid sm:grid-cols-2 gap-2.5">
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">GitHub Username</label>
                <input
                  type="text"
                  value={socials.github}
                  onChange={(e) => setSocials({ ...socials, github: e.target.value })}
                  placeholder="e.g. torvalds"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">LinkedIn Handle</label>
                <input
                  type="text"
                  value={socials.linkedin}
                  onChange={(e) => setSocials({ ...socials, linkedin: e.target.value })}
                  placeholder="username"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Twitter / X Handle</label>
                <input
                  type="text"
                  value={socials.twitter}
                  onChange={(e) => setSocials({ ...socials, twitter: e.target.value })}
                  placeholder="handle"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Portfolio Website URL</label>
                <input
                  type="text"
                  value={socials.portfolio}
                  onChange={(e) => setSocials({ ...socials, portfolio: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">Public Email</label>
                <input
                  type="email"
                  value={socials.email}
                  onChange={(e) => setSocials({ ...socials, email: e.target.value })}
                  placeholder="you@domain.com"
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Featured Projects */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">4. Featured Projects</h2>
              <button
                type="button"
                onClick={() => setProjects([...projects, { title: "New Project", desc: "Short description", link: "" }])}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <Plus size={12} /> Add Project
              </button>
            </div>
            {projects.map((proj, idx) => (
              <div key={idx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <input
                    type="text"
                    value={proj.title}
                    onChange={(e) => {
                      const updated = [...projects];
                      updated[idx].title = e.target.value;
                      setProjects(updated);
                    }}
                    placeholder="Project Name"
                    className="bg-transparent text-xs font-bold text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-red-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <input
                  type="text"
                  value={proj.desc}
                  onChange={(e) => {
                    const updated = [...projects];
                    updated[idx].desc = e.target.value;
                    setProjects(updated);
                  }}
                  placeholder="Short description"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
                />
                <input
                  type="text"
                  value={proj.link}
                  onChange={(e) => {
                    const updated = [...projects];
                    updated[idx].link = e.target.value;
                    setProjects(updated);
                  }}
                  placeholder="Repo / Demo URL"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 focus:outline-none font-mono"
                />
              </div>
            ))}
          </div>

          {/* Section 5: Stats Widgets */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">5. GitHub Stats Cards</h2>
            <div className="space-y-2 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stats.showStats}
                  onChange={(e) => setStats({ ...stats, showStats: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Overall GitHub Stats Card</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stats.showTopLangs}
                  onChange={(e) => setStats({ ...stats, showTopLangs: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Top Languages Card</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stats.showStreak}
                  onChange={(e) => setStats({ ...stats, showStreak: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Streak Analytics Card</span>
              </label>
            </div>
          </div>
        </div>

        {/* Right Pane: Live Markdown Preview */}
        <div className="flex flex-col h-full bg-slate-900/20 overflow-hidden">
          <div className="h-10 px-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 shrink-0">
            <span className="text-xs font-semibold text-slate-400">Live Preview (`README.md`)</span>
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={() => setPreviewTab("rendered")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  previewTab === "rendered" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Eye size={12} /> Rendered
              </button>
              <button
                type="button"
                onClick={() => setPreviewTab("raw")}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  previewTab === "raw" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                <Code size={12} /> Raw Markdown
              </button>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            {previewTab === "rendered" ? (
              <div className="prose prose-invert prose-sm max-w-none prose-headings:font-bold prose-a:text-indigo-400">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
                  {markdownOutput}
                </ReactMarkdown>
              </div>
            ) : (
              <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed select-all bg-slate-950/70 p-4 rounded-xl border border-slate-800/80">
                {markdownOutput}
              </pre>
            )}
          </div>
        </div>
      </div>

      {/* GitHub Connect Modal */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl animate-scale-in">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mb-4 text-indigo-400">
              <Key size={20} />
            </div>
            <h3 className="text-base font-bold text-white mb-1">Connect Your GitHub Account</h3>
            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              To publish directly to your special GitHub Profile repository, enter your GitHub Personal Access Token (PAT) with <code className="bg-slate-800 text-indigo-300 px-1 py-0.5 rounded">repo</code> permissions.
            </p>

            {connectError && (
              <div className="mb-4 p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{connectError}</span>
              </div>
            )}

            <form onSubmit={handleConnectToken} className="space-y-4">
              <div>
                <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                  GitHub Personal Access Token (Classic or Fine-Grained)
                </label>
                <input
                  type="password"
                  value={patInput}
                  onChange={(e) => setPatInput(e.target.value)}
                  placeholder="ghp_... or github_pat_..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800/70 rounded-xl text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                <span>Tokens are stored encrypted with AES-256 on our servers and are never shared or leaked.</span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectLoading}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-500/30 flex items-center gap-1.5"
                >
                  {connectLoading && <Loader2 size={12} className="animate-spin" />}
                  <span>{connectLoading ? "Verifying..." : "Verify & Connect"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {publishSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <Check size={24} />
            </div>
            <h3 className="text-base font-bold text-white">Published Successfully!</h3>
            <p className="text-xs text-slate-400">
              Your Profile README has been committed and is now live on your GitHub profile.
            </p>
            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setPublishSuccess(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white"
              >
                Close
              </button>
              <a
                href={publishSuccess.profileUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
              >
                <span>View GitHub Profile</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default GithubStudio;
