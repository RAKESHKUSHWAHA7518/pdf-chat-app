// src/pages/GithubStudio.jsx — Interactive GitHub Profile README Studio with AI generation, live preview & 1-click publish.
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
  AlertCircle,
  Wand2,
  Columns3,
  Rows3,
  Table as TableIcon,
  Layers,
  Bot,
  User,
  Zap,
  RotateCcw
} from "lucide-react";
import { Github } from "../components/icons/Github";
import { useAuth } from "../hooks/useAuth";
import { useGithubIntegration } from "../hooks/useGithubIntegration";
import { generateProfileAi, enhanceBioAi } from "../api";

const TECH_BADGES = [
  // Languages
  { name: "TypeScript", category: "Languages", slug: "typescript-3178C6?logo=typescript&logoColor=white" },
  { name: "JavaScript", category: "Languages", slug: "javascript-F7DF1E?logo=javascript&logoColor=black" },
  { name: "Python", category: "Languages", slug: "python-3776AB?logo=python&logoColor=white" },
  { name: "Go", category: "Languages", slug: "go-00ADD8?logo=go&logoColor=white" },
  { name: "Rust", category: "Languages", slug: "rust-000000?logo=rust&logoColor=white" },
  { name: "Java", category: "Languages", slug: "java-ED8B00?logo=openjdk&logoColor=white" },
  { name: "C++", category: "Languages", slug: "c++-00599C?logo=c%2B%2B&logoColor=white" },

  // Frontend
  { name: "React", category: "Frontend", slug: "react-20232A?logo=react&logoColor=61DAFB" },
  { name: "Next.js", category: "Frontend", slug: "next.js-000000?logo=nextdotjs&logoColor=white" },
  { name: "Vue.js", category: "Frontend", slug: "vue.js-35495E?logo=vuedotjs&logoColor=4FC08D" },
  { name: "TailwindCSS", category: "Frontend", slug: "tailwindcss-0F172A?logo=tailwindcss&logoColor=06B6D4" },
  { name: "HTML5", category: "Frontend", slug: "html5-E34F26?logo=html5&logoColor=white" },
  { name: "CSS3", category: "Frontend", slug: "css3-1572B6?logo=css3&logoColor=white" },
  { name: "Redux", category: "Frontend", slug: "redux-593D88?logo=redux&logoColor=white" },

  // Backend
  { name: "Node.js", category: "Backend", slug: "node.js-339933?logo=nodedotjs&logoColor=white" },
  { name: "Express", category: "Backend", slug: "express-000000?logo=express&logoColor=white" },
  { name: "FastAPI", category: "Backend", slug: "fastapi-009688?logo=fastapi&logoColor=white" },
  { name: "Django", category: "Backend", slug: "django-092E20?logo=django&logoColor=white" },
  { name: "Spring Boot", category: "Backend", slug: "spring_boot-6DB33F?logo=springboot&logoColor=white" },
  { name: "NestJS", category: "Backend", slug: "nestjs-E0234E?logo=nestjs&logoColor=white" },
  { name: "GraphQL", category: "Backend", slug: "graphql-E10098?logo=graphql&logoColor=white" },

  // Databases
  { name: "MongoDB", category: "Database", slug: "mongodb-47A248?logo=mongodb&logoColor=white" },
  { name: "PostgreSQL", category: "Database", slug: "postgresql-4169E1?logo=postgresql&logoColor=white" },
  { name: "Redis", category: "Database", slug: "redis-DC382D?logo=redis&logoColor=white" },
  { name: "MySQL", category: "Database", slug: "mysql-4479A1?logo=mysql&logoColor=white" },
  { name: "Firebase", category: "Database", slug: "firebase-FFCA28?logo=firebase&logoColor=black" },
  { name: "Supabase", category: "Database", slug: "supabase-3ECF8E?logo=supabase&logoColor=white" },

  // Cloud & DevOps & Tools
  { name: "Docker", category: "DevOps", slug: "docker-2496ED?logo=docker&logoColor=white" },
  { name: "Kubernetes", category: "DevOps", slug: "kubernetes-326CE5?logo=kubernetes&logoColor=white" },
  { name: "AWS", category: "DevOps", slug: "aws-232F3E?logo=amazon-aws&logoColor=white" },
  { name: "Git", category: "Tools", slug: "git-F05032?logo=git&logoColor=white" },
  { name: "GitHub Actions", category: "DevOps", slug: "github_actions-2088FF?logo=githubactions&logoColor=white" },
  { name: "Linux", category: "Tools", slug: "linux-FCC624?logo=linux&logoColor=black" },
  { name: "Vercel", category: "DevOps", slug: "vercel-000000?logo=vercel&logoColor=white" },
];

const AI_ROLE_PRESETS = [
  "⚡ Full-Stack AI Engineer",
  "🌐 Frontend & UI Specialist",
  "⚙️ Backend & Cloud Architect",
  "🤖 Machine Learning Engineer",
  "☁️ DevOps & SRE Specialist",
  "📱 Mobile Application Developer",
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
    activeData?.tech || ["React", "TypeScript", "Node.js", "MongoDB", "TailwindCSS", "Docker", "Python", "AWS"]
  );

  // Skills layout presentation state
  const [skillLayout, setSkillLayout] = useState("horizontal"); // "horizontal" | "categorized" | "table"
  const [badgeStyle, setBadgeStyle] = useState("flat-square"); // "flat-square" | "for-the-badge" | "plastic" | "flat"

  // About Me section state
  const [aboutMe, setAboutMe] = useState({
    showAboutMe: true,
    workingOn: "Scalable AI Document Assistant with streaming RAG architecture",
    learning: "Next.js 15, Vector Embeddings, and Agentic AI Workflows",
    collaborating: "Impactful open-source developer platforms and tools",
    askMeAbout: "Full-Stack Development, React, Node.js, and GenAI",
    funFact: "I write clean code and obsess over smooth micro-interactions",
  });

  const [socials, setSocials] = useState({
    github: status?.githubUsername || activeData?.socials?.github || activeData?.github || "rakeshkushwahadev",
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
    activeData?.projects?.map((p) => ({
      title: p.title || "Project",
      desc: p.desc || "",
      link: p.link || "",
      liveUrl: p.liveUrl || "",
    })) || [
      {
        title: "PDFChat AI Platform",
        desc: "Full-stack AI document intelligence suite with RAG, vector embeddings, and real-time streaming citations.",
        link: "https://github.com",
        liveUrl: "https://pdfchat.ai",
      },
      {
        title: "DevSuite AI Developer Studio",
        desc: "Multi-tool developer workspace featuring GitHub Profile README Studio and automated resume transformer.",
        link: "https://github.com",
        liveUrl: "https://devsuite.ai",
      },
    ]
  );

  // AI Generation State
  const [aiRole, setAiRole] = useState("Full-Stack AI Software Engineer");
  const [aiTone, setAiTone] = useState("impactful"); // "impactful" | "technical" | "creative" | "minimalist" | "playful"
  const [customPrompt, setCustomPrompt] = useState("");
  const [promptMode, setPromptMode] = useState("prompt"); // "prompt" | "role"
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isEnhancingBio, setIsEnhancingBio] = useState(false);
  const [isEnhancingTitle, setIsEnhancingTitle] = useState(false);
  const [aiSuccessMsg, setAiSuccessMsg] = useState("");

  // Animation Effects State
  const [animations, setAnimations] = useState({
    enableTyping: true,
    typingColor: "6366F1",
    typingLines: [
      "Full-Stack AI Software Engineer",
      "Building Scalable Cloud Platforms & RAG",
      "Open Source Contributor & DevSuite Creator",
    ],
    enableWaveHeader: false,
    waveTheme: "waving",
    enableSnake: false,
  });

  // Tab & Modal State
  const [previewTab, setPreviewTab] = useState("rendered"); // "rendered" | "raw"
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccess, setPublishSuccess] = useState(null);
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [patInput, setPatInput] = useState("");
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState("");

  // Sync activeData updates
  useEffect(() => {
    if (activeData) {
      if (activeData.name) setName(activeData.name);
      if (activeData.title) setTitle(activeData.title);
      if (activeData.bio) setBio(activeData.bio);
      if (activeData.location) setLocation(activeData.location);
      if (activeData.tech && activeData.tech.length > 0) setSelectedTech(activeData.tech);
      if (activeData.projects && activeData.projects.length > 0) {
        setProjects(
          activeData.projects.map((p) => ({
            title: p.title || "Project",
            desc: p.desc || "",
            link: p.link || "",
            liveUrl: p.liveUrl || "",
          }))
        );
      }
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
    if (status?.githubUsername && (!socials.github || socials.github === "rakeshkushwahadev")) {
      setSocials((prev) => ({ ...prev, github: status.githubUsername }));
    }
  }, [status?.githubUsername]);

  // --- AI Handlers ---
  const handleGenerateProfileWithAi = async (roleOverride) => {
    setIsGeneratingAi(true);
    setAiSuccessMsg("");
    try {
      const selectedRole = roleOverride || aiRole;
      const profile = await generateProfileAi(auth, {
        role: selectedRole,
        tone: aiTone,
        name: name || "Developer",
        currentBio: bio,
        customPrompt: customPrompt.trim(),
      });

      if (profile.title) {
        setTitle(profile.title);
        setAnimations((prev) => ({
          ...prev,
          typingLines: (Array.isArray(profile.typingLines) && profile.typingLines.length > 0)
            ? profile.typingLines
            : [
                profile.title,
                `Specializing in ${profile.suggestedTech?.slice(0, 3).join(", ") || "Full-Stack Development"}`,
                "Building Scalable Open Source Software",
              ],
        }));
      }
      if (profile.bio) setBio(profile.bio);
      if (profile.suggestedTech && Array.isArray(profile.suggestedTech) && profile.suggestedTech.length > 0) {
        setSelectedTech(profile.suggestedTech);
      }
      if (profile.aboutMe) {
        const toCleanStr = (val) => {
          if (!val) return "";
          if (Array.isArray(val)) return val.join(", ");
          return typeof val === "string" ? val : String(val);
        };
        setAboutMe((prev) => ({
          ...prev,
          workingOn: toCleanStr(profile.aboutMe.workingOn) || prev.workingOn,
          learning: toCleanStr(profile.aboutMe.learning) || prev.learning,
          collaborating: toCleanStr(profile.aboutMe.collaborating) || prev.collaborating,
          askMeAbout: toCleanStr(profile.aboutMe.askMeAbout) || prev.askMeAbout,
          funFact: toCleanStr(profile.aboutMe.funFact) || prev.funFact,
          showAboutMe: true,
        }));
      }
      if (profile.suggestedProjects && Array.isArray(profile.suggestedProjects) && profile.suggestedProjects.length > 0) {
        setProjects(
          profile.suggestedProjects.map((p) => ({
            title: p.title || "Featured Project",
            desc: p.desc || "",
            link: p.link || "https://github.com",
            liveUrl: p.liveUrl || "",
          }))
        );
      }

      setAiSuccessMsg(
        customPrompt.trim()
          ? "✨ Profile README customized according to your prompt!"
          : `✨ Profile generated for "${selectedRole}"!`
      );
      setTimeout(() => setAiSuccessMsg(""), 5000);
    } catch (err) {
      alert("AI Generation failed: " + err.message);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  const handleEnhanceBio = async () => {
    if (!bio.trim()) return;
    setIsEnhancingBio(true);
    try {
      const res = await enhanceBioAi(auth, {
        text: bio,
        role: title || "Software Engineer",
        mode: "bio",
      });
      if (res?.enhanced) setBio(res.enhanced);
    } catch (err) {
      alert("AI Bio enhance failed: " + err.message);
    } finally {
      setIsEnhancingBio(false);
    }
  };

  const handleEnhanceTitle = async () => {
    if (!title.trim()) return;
    setIsEnhancingTitle(true);
    try {
      const res = await enhanceBioAi(auth, {
        text: title,
        role: "Software Engineer",
        mode: "title",
      });
      if (res?.enhanced) setTitle(res.enhanced);
    } catch (err) {
      alert("AI Title enhance failed: " + err.message);
    } finally {
      setIsEnhancingTitle(false);
    }
  };

  // --- Synthesize Markdown Content ---
  const markdownOutput = useMemo(() => {
    const ghUser = status?.githubUsername || socials.github || "";

    let md = "";

    // 1. Optional Animated Wave Banner or Clean Title
    if (animations.enableWaveHeader) {
      md += `<p align="center">\n  <img src="https://capsule-render.vercel.app/api?type=${animations.waveTheme}&color=auto&height=180&section=header&text=${encodeURIComponent(name || "Developer")}&fontSize=42&fontColor=ffffff&animation=twinkling" alt="Header" />\n</p>\n\n`;
    } else {
      md += `<h1 align="center">Hi 👋, I'm ${name}</h1>\n`;
    }

    // 2. Animated Typing or Headline Subtitle
    if (animations.enableTyping && animations.typingLines.filter(Boolean).length > 0) {
      const validLines = animations.typingLines.filter(Boolean).map((l) => encodeURIComponent(l.trim())).join(";");
      md += `<p align="center">\n  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&pause=1000&color=${animations.typingColor}&center=true&vCenter=true&width=450&lines=${validLines}" alt="Typing SVG" />\n</p>\n\n`;
    } else {
      md += `<h3 align="center">${title}</h3>\n\n`;
    }

    if (location) {
      md += `<p align="center">📍 Based in <b>${location}</b></p>\n\n`;
    }

    md += `<p align="center">\n  ${bio}\n</p>\n\n`;

    // Social Badges (Space-separated on a single line so they render horizontally side-by-side)
    const socialBadges = [];
    if (socials.github && socials.github.trim()) {
      socialBadges.push(
        `<a href="https://github.com/${socials.github}"><img src="https://img.shields.io/badge/GitHub-181717?style=${badgeStyle}&logo=github&logoColor=white" alt="GitHub" /></a>`
      );
    }
    if (socials.linkedin && socials.linkedin.trim()) {
      socialBadges.push(
        `<a href="https://linkedin.com/in/${socials.linkedin}"><img src="https://img.shields.io/badge/LinkedIn-0A66C2?style=${badgeStyle}&logo=linkedin&logoColor=white" alt="LinkedIn" /></a>`
      );
    }
    if (socials.twitter && socials.twitter.trim()) {
      socialBadges.push(
        `<a href="https://twitter.com/${socials.twitter}"><img src="https://img.shields.io/badge/Twitter-1DA1F2?style=${badgeStyle}&logo=twitter&logoColor=white" alt="Twitter" /></a>`
      );
    }
    if (socials.portfolio && socials.portfolio.trim()) {
      socialBadges.push(
        `<a href="${socials.portfolio}"><img src="https://img.shields.io/badge/Portfolio-6366F1?style=${badgeStyle}&logo=google-chrome&logoColor=white" alt="Portfolio" /></a>`
      );
    }
    if (socials.email && socials.email.trim()) {
      socialBadges.push(
        `<a href="mailto:${socials.email}"><img src="https://img.shields.io/badge/Email-D14836?style=${badgeStyle}&logo=gmail&logoColor=white" alt="Email" /></a>`
      );
    }

    if (socialBadges.length > 0) {
      md += `<p align="center">\n  ${socialBadges.join(" ")}\n</p>\n\n---\n\n`;
    }

    // About Me Section
    if (aboutMe.showAboutMe) {
      const safeFact = (val) => {
        if (!val) return "";
        if (Array.isArray(val)) return val.join(", ").trim();
        return typeof val === "string" ? val.trim() : String(val).trim();
      };
      const facts = [];
      const wo = safeFact(aboutMe.workingOn);
      const ln = safeFact(aboutMe.learning);
      const cl = safeFact(aboutMe.collaborating);
      const am = safeFact(aboutMe.askMeAbout);
      const ff = safeFact(aboutMe.funFact);

      if (wo) facts.push(`- 🔭 I'm currently working on **${wo}**`);
      if (ln) facts.push(`- 🌱 I'm currently learning **${ln}**`);
      if (cl) facts.push(`- 👯 I'm looking to collaborate on **${cl}**`);
      if (am) facts.push(`- 💬 Ask me about **${am}**`);
      if (ff) facts.push(`- ⚡ Fun fact: **${ff}**`);

      if (facts.length > 0) {
        md += `### 👨‍💻 About Me\n\n${facts.join("\n")}\n\n`;
      }
    }

    // Skills & Technologies based on skillLayout (Horizontal, Categorized, or Table)
    if (selectedTech.length > 0) {
      if (skillLayout === "horizontal") {
        md += `### 🛠️ Languages & Technologies\n\n<p align="left">\n`;
        const techBadges = selectedTech.map((tech) => {
          const item = TECH_BADGES.find((t) => t.name === tech);
          const slug = item ? item.slug : `${encodeURIComponent(tech)}-6366F1`;
          return `<img src="https://img.shields.io/badge/-${slug}&style=${badgeStyle}" alt="${tech}" />`;
        });
        md += `  ${techBadges.join(" ")}\n</p>\n\n`;
      } else if (skillLayout === "categorized") {
        md += `### 🛠️ Skills & Technologies\n\n`;
        const categories = [
          { key: "Languages", title: "💻 Languages" },
          { key: "Frontend", title: "🌐 Frontend & UI" },
          { key: "Backend", title: "⚙️ Backend & Frameworks" },
          { key: "Database", title: "🗄️ Databases & Storage" },
          { key: "DevOps", title: "☁️ Cloud & DevOps" },
          { key: "Tools", title: "🔧 Tools & Utilities" },
        ];

        categories.forEach(({ key, title }) => {
          const inCat = selectedTech.filter((t) => {
            const item = TECH_BADGES.find((b) => b.name === t);
            return item ? item.category === key : key === "Tools";
          });
          if (inCat.length > 0) {
            md += `#### ${title}\n<p align="left">\n`;
            const badges = inCat.map((tech) => {
              const item = TECH_BADGES.find((t) => t.name === tech);
              const slug = item ? item.slug : `${encodeURIComponent(tech)}-6366F1`;
              return `<img src="https://img.shields.io/badge/-${slug}&style=${badgeStyle}" alt="${tech}" />`;
            });
            md += `  ${badges.join(" ")}\n</p>\n\n`;
          }
        });
      } else if (skillLayout === "table") {
        md += `### 🛠️ Technical Competencies\n\n`;
        md += `| Domain | Technologies & Tools |\n| :--- | :--- |\n`;
        const categories = [
          { key: "Languages", title: "💻 Languages" },
          { key: "Frontend", title: "🌐 Frontend" },
          { key: "Backend", title: "⚙️ Backend" },
          { key: "Database", title: "🗄️ Databases" },
          { key: "DevOps", title: "☁️ Cloud & DevOps" },
          { key: "Tools", title: "🔧 Tools" },
        ];

        categories.forEach(({ key, title }) => {
          const inCat = selectedTech.filter((t) => {
            const item = TECH_BADGES.find((b) => b.name === t);
            return item ? item.category === key : key === "Tools";
          });
          if (inCat.length > 0) {
            const badges = inCat
              .map((tech) => {
                const item = TECH_BADGES.find((t) => t.name === tech);
                const slug = item ? item.slug : `${encodeURIComponent(tech)}-6366F1`;
                return `<img src="https://img.shields.io/badge/-${slug}&style=${badgeStyle}" alt="${tech}" />`;
              })
              .join(" ");
            md += `| **${title}** | ${badges} |\n`;
          }
        });
        md += `\n`;
      }
    }

    // Featured Projects
    if (projects.length > 0) {
      md += `### 🚀 Featured Projects\n\n`;
      projects.forEach((p) => {
        if (!p.title?.trim()) return;
        const repoLink = p.link?.trim();
        const liveLink = p.liveUrl?.trim();
        const primaryUrl = liveLink || repoLink || "#";

        const links = [];
        if (liveLink) links.push(`[🌐 Live Demo](${liveLink})`);
        if (repoLink) links.push(`[💻 GitHub Repo](${repoLink})`);

        const linksSuffix = links.length > 0 ? ` &nbsp;•&nbsp; ${links.join(" &nbsp;•&nbsp; ")}` : "";
        md += `- **[${p.title}](${primaryUrl})** — ${p.desc || "Full-stack software application"}${linksSuffix}\n`;
      });
      md += `\n`;
    }

    // GitHub Analytics Widgets (only render if username provided)
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

    // Snake Activity Animation
    if (animations.enableSnake && ghUser && ghUser !== "username") {
      md += `### 🐍 Contribution Activity\n\n<p align="center">\n  <picture>\n    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/${ghUser}/${ghUser}/output/github-contribution-grid-snake-dark.svg">\n    <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/${ghUser}/${ghUser}/output/github-contribution-grid-snake.svg">\n    <img alt="github-snake" src="https://raw.githubusercontent.com/${ghUser}/${ghUser}/output/github-contribution-grid-snake.svg" />\n  </picture>\n</p>\n\n`;
    }

    // Branding viral footer
    md += `---\n<p align="center"><sub>Crafted with <a href="https://github.com">DevSuite AI Studio</a> ⚡</sub></p>\n`;
    return md;
  }, [name, title, bio, location, selectedTech, socials, stats, projects, aboutMe, skillLayout, badgeStyle, status?.githubUsername, animations]);

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
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-100 overflow-y-auto lg:overflow-hidden lg:h-full">
      {/* Action Header */}
      <header className="min-h-14 py-2 px-3 sm:px-6 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 shrink-0 bg-slate-900/60 backdrop-blur-md">
        <div className="flex items-center gap-2.5 min-w-0">
          <Github className="w-5 h-5 text-indigo-400 shrink-0" />
          <h1 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate">
            GitHub Profile README Studio
          </h1>
          {status?.connected && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold shrink-0">
              <CheckCircle2 size={10} /> @{status.githubUsername}
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition-all active:scale-95 cursor-pointer"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? "Copied!" : "Copy Markdown"}</span>
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isPublishing ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>{isPublishing ? "Pushing..." : "Publish to GitHub"}</span>
          </button>
        </div>
      </header>

      {/* Dual Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-slate-800/80 overflow-y-auto lg:overflow-hidden min-w-0">
        {/* Left Pane: Interactive Builder Form */}
        <div className="w-full lg:w-1/2 overflow-y-visible lg:overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 shrink-0 lg:shrink min-w-0">
          
          {/* ── AI Profile README Architect Box ── */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900 border border-indigo-500/30 space-y-3.5 relative shadow-lg shadow-indigo-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white tracking-wide flex items-center gap-1.5">
                    AI Profile README Architect
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-normal">Gemini 2.5</span>
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Generate an instant, high-converting bio, title, tech stack, and about-me facts.
                  </p>
                </div>
              </div>
            </div>

            {/* Mode Switcher: Custom Prompt vs Role Presets */}
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setPromptMode("prompt")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    promptMode === "prompt"
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles size={12} className="text-amber-300" />
                  <span>Custom Prompt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPromptMode("role")}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all ${
                    promptMode === "role"
                      ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Bot size={12} />
                  <span>Role Presets</span>
                </button>
              </div>

              {/* Tone Dropdown */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-[10px] text-slate-400 hidden sm:inline font-medium">Tone:</span>
                <select
                  value={aiTone}
                  onChange={(e) => setAiTone(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-1 text-[11px] text-slate-200 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="impactful">Impactful</option>
                  <option value="technical">Technical</option>
                  <option value="creative">Creative</option>
                  <option value="minimalist">Minimalist</option>
                  <option value="playful">Playful & Emojis</option>
                </select>
              </div>
            </div>

            {/* Mode 1: Custom Prompt Input */}
            {promptMode === "prompt" && (
              <div className="space-y-2">
                <div className="relative">
                  <textarea
                    rows={3}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Describe your background or instructions in natural language...
e.g. 'I am an AI engineer building LLM agents with LangChain, Next.js, and Python. Highlight my hackathon wins, make the tone energetic and futuristic, and feature my vector database project with live demo link.'"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none leading-relaxed font-sans"
                  />
                  {customPrompt && (
                    <button
                      type="button"
                      onClick={() => setCustomPrompt("")}
                      className="absolute top-2.5 right-2.5 text-slate-500 hover:text-slate-300 text-[10px] bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800"
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Quick Inspiration Chips */}
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                    Quick Prompt Inspiration:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: "🤖 AI & Agents Specialist",
                        prompt: "AI Engineer specializing in LangChain, RAG pipelines, Python & Next.js. Highlight autonomous agents and vector databases.",
                      },
                      {
                        label: "☁️ Cloud & DevOps Architect",
                        prompt: "Senior Cloud & DevOps Architect with deep expertise in Kubernetes, Terraform, Docker, AWS, and CI/CD automation.",
                      },
                      {
                        label: "🎨 Creative Frontend & UI",
                        prompt: "Frontend Craftsperson obsessed with micro-interactions, Tailwind, Framer Motion, TypeScript, and aesthetic design.",
                      },
                      {
                        label: "🎓 Student & Hackathon Winner",
                        prompt: "Computer Science student passionate about competitive programming, building full-stack MVPs, and hackathon projects.",
                      },
                      {
                        label: "🛡️ Cybersecurity & Zero Trust",
                        prompt: "Cybersecurity Analyst and ethical hacker with focus on network penetration testing, Linux, and cloud security compliance.",
                      },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => setCustomPrompt(item.prompt)}
                        className="px-2 py-0.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-indigo-300 text-[10px] transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Mode 2: Role Presets & Custom Role */}
            {promptMode === "role" && (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Target Specialization</span>
                  <div className="flex flex-wrap gap-1.5">
                    {AI_ROLE_PRESETS.map((preset) => {
                      const rawName = preset.replace(/^[^\s]+\s*/, "");
                      const isSelected = aiRole.includes(rawName);
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            setAiRole(rawName);
                            handleGenerateProfileWithAi(rawName);
                          }}
                          disabled={isGeneratingAi}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            isSelected
                              ? "bg-indigo-600 text-white shadow-sm shadow-indigo-500/30"
                              : "bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                          }`}
                        >
                          {preset}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <input
                  type="text"
                  value={aiRole}
                  onChange={(e) => setAiRole(e.target.value)}
                  placeholder="Or enter custom role (e.g. Web3 / Solana Engineer)..."
                  className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            )}

            {/* Primary Action Button */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => handleGenerateProfileWithAi()}
                disabled={isGeneratingAi}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white text-xs font-bold shadow-lg shadow-indigo-500/20 active:scale-98 transition-all disabled:opacity-50"
              >
                {isGeneratingAi ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>Architecting Profile with Gemini 2.5...</span>
                  </>
                ) : (
                  <>
                    <Wand2 size={14} />
                    <span>
                      {promptMode === "prompt" && customPrompt.trim()
                        ? "✨ Architect Profile from Prompt"
                        : "✨ Generate AI Profile Blueprint"}
                    </span>
                  </>
                )}
              </button>
            </div>

            {aiSuccessMsg && (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-400 font-medium flex items-center gap-2">
                <CheckCircle2 size={13} />
                <span>{aiSuccessMsg}</span>
              </div>
            )}
          </div>

          {/* Section 1: Personal Info */}
          <div className="space-y-3.5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <User size={13} /> 1. Profile Information
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
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">Professional Title / Headline</label>
                <button
                  type="button"
                  onClick={handleEnhanceTitle}
                  disabled={isEnhancingTitle}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  {isEnhancingTitle ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                  <span>AI Polish Title</span>
                </button>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-400">Short Bio</label>
                <button
                  type="button"
                  onClick={handleEnhanceBio}
                  disabled={isEnhancingBio}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
                >
                  {isEnhancingBio ? <Loader2 size={11} className="animate-spin" /> : <Wand2 size={11} />}
                  <span>AI Polish Bio</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>
          </div>

          {/* Section: Animated Effects */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Sparkles size={13} className="text-amber-400" /> 2. Animated Effects & Typing Banner
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-semibold">
                Live SVG
              </span>
            </div>

            {/* Typewriter Typing Animation */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={animations.enableTyping}
                    onChange={(e) => setAnimations({ ...animations, enableTyping: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Typewriter Typing Animation</span>
                </label>
                {animations.enableTyping && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-500">Color:</span>
                    {[
                      { hex: "6366F1", label: "Indigo" },
                      { hex: "38BDF8", label: "Sky" },
                      { hex: "10B981", label: "Emerald" },
                      { hex: "F59E0B", label: "Amber" },
                      { hex: "EC4899", label: "Pink" },
                    ].map(({ hex, label }) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setAnimations({ ...animations, typingColor: hex })}
                        title={label}
                        style={{ backgroundColor: `#${hex}` }}
                        className={`w-3.5 h-3.5 rounded-full transition-transform ${
                          animations.typingColor === hex ? "scale-125 ring-2 ring-white/50" : "opacity-70 hover:opacity-100"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {animations.enableTyping && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 font-medium block">
                    Typing Lines (cycles dynamically in animated SVG):
                  </span>
                  {animations.typingLines.map((line, idx) => (
                    <input
                      key={idx}
                      type="text"
                      value={line}
                      onChange={(e) => {
                        const next = [...animations.typingLines];
                        next[idx] = e.target.value;
                        setAnimations({ ...animations, typingLines: next });
                      }}
                      placeholder={`Line ${idx + 1}`}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-mono"
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Header Wave Banner & Snake Grid */}
            <div className="grid sm:grid-cols-2 gap-2">
              <label className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={animations.enableWaveHeader}
                    onChange={(e) => setAnimations({ ...animations, enableWaveHeader: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Wave Header Banner</span>
                </div>
              </label>

              <label className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between cursor-pointer hover:bg-slate-900/80">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={animations.enableSnake}
                    onChange={(e) => setAnimations({ ...animations, enableSnake: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Contribution Snake 🐍</span>
                </div>
              </label>
            </div>
          </div>

          {/* Section 2: Tech Badges & Layout Controls */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Layers size={13} /> 3. Tech Stack & Badge Layout ({selectedTech.length} selected)
              </h2>
            </div>

            {/* Presentation Format Switchers */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-2xl">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                  Alignment & Format
                </span>
                <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setSkillLayout("horizontal")}
                    className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 truncate ${
                      skillLayout === "horizontal"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Horizontal Flow (Inline badges)"
                  >
                    <Columns3 size={12} />
                    <span>Horizontal</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillLayout("categorized")}
                    className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 truncate ${
                      skillLayout === "categorized"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Categorized Vertical Groups"
                  >
                    <Rows3 size={12} />
                    <span>Vertical</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSkillLayout("table")}
                    className={`py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1 truncate ${
                      skillLayout === "table"
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white"
                    }`}
                    title="Structured Matrix Table"
                  >
                    <TableIcon size={12} />
                    <span>Table</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                  Shield Badge Style
                </span>
                <div className="grid grid-cols-4 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setBadgeStyle("flat-square")}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                      badgeStyle === "flat-square" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Square
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadgeStyle("for-the-badge")}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                      badgeStyle === "for-the-badge" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Badge
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadgeStyle("plastic")}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                      badgeStyle === "plastic" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Plastic
                  </button>
                  <button
                    type="button"
                    onClick={() => setBadgeStyle("flat")}
                    className={`py-1.5 px-1 rounded-lg transition-all text-center truncate ${
                      badgeStyle === "flat" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Flat
                  </button>
                </div>
              </div>
            </div>

            {/* Badges Picker Grid */}
            <div className="flex flex-wrap gap-1.5 pt-1">
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

          {/* Section 2.5: About Me & Quick Facts */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <Bot size={13} /> 4. About Me & Developer Facts
              </h2>
              <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aboutMe.showAboutMe}
                  onChange={(e) => setAboutMe({ ...aboutMe, showAboutMe: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Include in README</span>
              </label>
            </div>

            {aboutMe.showAboutMe && (
              <div className="space-y-2.5 p-3.5 bg-slate-900/60 border border-slate-800 rounded-2xl">
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">🔭 Currently working on...</label>
                  <input
                    type="text"
                    value={aboutMe.workingOn || ""}
                    onChange={(e) => setAboutMe({ ...aboutMe, workingOn: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">🌱 Currently learning...</label>
                  <input
                    type="text"
                    value={aboutMe.learning || ""}
                    onChange={(e) => setAboutMe({ ...aboutMe, learning: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">👯 Looking to collaborate on...</label>
                  <input
                    type="text"
                    value={aboutMe.collaborating || ""}
                    onChange={(e) => setAboutMe({ ...aboutMe, collaborating: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">💬 Ask me about...</label>
                  <input
                    type="text"
                    value={aboutMe.askMeAbout || ""}
                    onChange={(e) => setAboutMe({ ...aboutMe, askMeAbout: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-400 font-semibold block mb-0.5">⚡ Fun fact...</label>
                  <input
                    type="text"
                    value={aboutMe.funFact || ""}
                    onChange={(e) => setAboutMe({ ...aboutMe, funFact: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 5: Social Links */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">5. Social Links & Profiles</h2>
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

          {/* Section 6: Featured Projects */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">6. Featured Projects</h2>
              <button
                type="button"
                onClick={() =>
                  setProjects([
                    ...projects,
                    {
                      title: "New Project",
                      desc: "Brief description of technologies and purpose",
                      link: "https://github.com/username/project",
                      liveUrl: "https://project-demo.com",
                    },
                  ])
                }
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
                    className="bg-transparent text-xs font-bold text-white focus:outline-none flex-1 mr-2"
                  />
                  <button
                    type="button"
                    onClick={() => setProjects(projects.filter((_, i) => i !== idx))}
                    className="text-slate-500 hover:text-red-400 p-1"
                    title="Remove project"
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

                {/* URLs: GitHub Repository & Live Demo Link */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-slate-500 pointer-events-none flex items-center">
                      <Github className="w-3.5 h-3.5 text-slate-400" />
                    </span>
                    <input
                      type="text"
                      value={proj.link || ""}
                      onChange={(e) => {
                        const updated = [...projects];
                        updated[idx].link = e.target.value;
                        setProjects(updated);
                      }}
                      placeholder="GitHub Repo URL"
                      title="GitHub Repository URL"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-indigo-500/50 focus:outline-none font-mono"
                    />
                  </div>

                  <div className="relative flex items-center">
                    <span className="absolute left-2.5 text-slate-500 pointer-events-none flex items-center">
                      <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                    <input
                      type="text"
                      value={proj.liveUrl || ""}
                      onChange={(e) => {
                        const updated = [...projects];
                        updated[idx].liveUrl = e.target.value;
                        setProjects(updated);
                      }}
                      placeholder="Live Demo / Website URL"
                      title="Live Demo or Deployed Application URL"
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2.5 py-1.5 text-xs text-slate-300 placeholder:text-slate-600 focus:border-emerald-500/50 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Section 7: GitHub Stats & Themes */}
          <div className="space-y-3 pt-4 border-t border-slate-800/80">
            <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-400">7. GitHub Analytics Badges</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stats.showStats}
                  onChange={(e) => setStats({ ...stats, showStats: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>General Stats Card</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={stats.showTopLangs}
                  onChange={(e) => setStats({ ...stats, showTopLangs: e.target.checked })}
                  className="rounded bg-slate-900 border-slate-700 text-indigo-600 focus:ring-0"
                />
                <span>Top Languages Card</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
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
        <div className="w-full lg:w-1/2 flex flex-col min-h-[500px] lg:min-h-0 lg:h-full bg-slate-900/20 overflow-hidden min-w-0">
          <div className="min-h-10 py-1.5 px-3 sm:px-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2 bg-slate-950/80 shrink-0">
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

          <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
            {previewTab === "rendered" ? (
              <div className="readme-markdown-preview prose-headings:font-bold prose-a:text-indigo-400">
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
              <input
                type="password"
                value={patInput}
                onChange={(e) => setPatInput(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={connectLoading}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all disabled:opacity-50"
                >
                  {connectLoading ? "Verifying..." : "Save & Connect"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Publish Success Modal */}
      {publishSuccess && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Published to GitHub!</h3>
              <p className="text-xs text-slate-400 mt-1">
                Your new README has been successfully committed to <code className="text-indigo-400">{publishSuccess.repo}</code> on branch <code className="text-slate-300">{publishSuccess.branch}</code>.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <a
                href={publishSuccess.commitUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all"
              >
                <span>View Repository</span>
                <ExternalLink size={13} />
              </a>
              <button
                type="button"
                onClick={() => setPublishSuccess(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GithubStudio;
