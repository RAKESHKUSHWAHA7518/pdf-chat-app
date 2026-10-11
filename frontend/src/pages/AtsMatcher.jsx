// src/pages/AtsMatcher.jsx — AI ATS Resume Optimizer & Job Matcher.
import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
  FileText,
  UploadCloud,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Library,
  Copy,
  Check,
  Zap,
  ArrowRight,
  TrendingUp,
  FileCheck,
  AlertCircle,
  Briefcase,
  Layers,
  ChevronRight,
  Download,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { listDocuments, scanResumeAts, getCreditBalance } from "../api";
import { Button, InteractiveCard, Badge } from "../components/ui";

const SAMPLE_JDS = {
  fullstack: {
    title: "Senior Full-Stack Engineer",
    text: `Job Title: Senior Full-Stack Engineer (React, Node.js, Cloud)
We are seeking a Senior Full-Stack Engineer to lead development of our core web platform.
Responsibilities:
- Architect and build high-performance React and Next.js user interfaces.
- Design resilient REST and GraphQL APIs using Node.js, Express, and PostgreSQL/MongoDB.
- Implement distributed caching with Redis and containerized deployments with Docker & Kubernetes on AWS.
- Drive automated CI/CD pipelines, unit testing with Jest/Vitest, and maintain 99.9% uptime.
Requirements:
- 4+ years of professional experience with TypeScript, React, and Node.js.
- Strong knowledge of database schema design, index optimization, and state management.
- Experience with AWS (ECS, Lambda, S3), Docker, microservices, and API security (JWT, OAuth2).
- Strong communication, system design, and mentoring skills.`,
  },
  ai_engineer: {
    title: "AI / LLM Software Engineer",
    text: `Job Title: AI Applications Software Engineer
We are building cutting-edge generative AI developer workflows and seeking an AI Engineer.
Responsibilities:
- Build production-ready LLM pipelines with LangChain, LlamaIndex, and OpenAI/Gemini APIs.
- Implement scalable Retrieval-Augmented Generation (RAG) using Pinecone, Chroma, or vector databases.
- Integrate Python FastAPI backends with asynchronous job queues (Celery, Redis).
- Optimize token usage, latency, prompt engineering, and model evaluation metrics.
Requirements:
- Proficiency in Python, FastAPI, and TypeScript/React for AI product interfaces.
- Hands-on experience deploying embedding models, semantic search, and RAG architectures.
- Familiarity with PyTorch, Hugging Face, fine-tuning, and Docker containerization.`,
  },
  devops: {
    title: "DevOps & Cloud Systems Engineer",
    text: `Job Title: DevOps & Cloud Infrastructure Engineer
Join our platform engineering team to scale multi-region infrastructure.
Responsibilities:
- Build and maintain Terraform and Kubernetes (EKS/GKE) infrastructure as code.
- Manage observability stack (Prometheus, Grafana, Datadog) and incident response.
- Enhance GitHub Actions CI/CD pipelines for zero-downtime blue/green deployments.
Requirements:
- 3+ years experience with AWS or GCP, Kubernetes, Helm, and Terraform.
- Proficiency in Linux administration, networking (VPC, DNS, TLS), and Bash/Python scripting.`,
  },
};

export function AtsMatcher() {
  const { auth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const outlet = useOutletContext();

  // Mode: "upload" | "library" | "paste"
  const [inputMode, setInputMode] = useState("upload");
  const [documents, setDocuments] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  // Resume file / text state
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Job description state
  const [jobDescription, setJobDescription] = useState("");

  // Scan state
  const [isScanning, setIsScanning] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [error, setError] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [copiedReport, setCopiedReport] = useState(false);

  // Load user docs
  useEffect(() => {
    if (isAuthenticated) {
      setLoadingDocs(true);
      listDocuments(auth)
        .then((docs) => {
          setDocuments(docs || []);
          if (docs && docs.length > 0) {
            setSelectedSessionId(docs[0].sessionId);
          }
        })
        .catch(() => {})
        .finally(() => setLoadingDocs(false));
    }
  }, [auth, isAuthenticated]);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === "application/pdf" || droppedFile.name.endsWith(".pdf")) {
        setFile(droppedFile);
        setError(null);
      } else {
        setError("Please upload a PDF document.");
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleScan = async () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/dashboard/ats-matcher");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the target Job Description to compare against.");
      return;
    }

    if (inputMode === "upload" && !file) {
      setError("Please select or upload a PDF resume.");
      return;
    }
    if (inputMode === "library" && !selectedSessionId) {
      setError("Please select an existing document from your vault.");
      return;
    }
    if (inputMode === "paste" && !resumeText.trim()) {
      setError("Please paste your resume text.");
      return;
    }

    setError(null);
    setIsScanning(true);
    setStepMessage("Extracting candidate profile & technical keywords...");

    const t1 = setTimeout(() => setStepMessage("Running ATS parsing algorithm against job description..."), 1200);
    const t2 = setTimeout(() => setStepMessage("Calculating keyword weights & skill gap breakdown..."), 2600);
    const t3 = setTimeout(() => setStepMessage("Synthesizing Google STAR-method bullet rewrites..."), 4200);

    try {
      const payload = {
        jobDescription: jobDescription.trim(),
      };

      if (inputMode === "upload") payload.file = file;
      else if (inputMode === "library") payload.sessionId = selectedSessionId;
      else if (inputMode === "paste") payload.resumeText = resumeText.trim();

      const res = await scanResumeAts(auth, payload);

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (res.analysis) {
        setScanResult(res.analysis);
        if (outlet?.refreshCredits) outlet.refreshCredits();
      } else {
        throw new Error("No analysis data returned");
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (err.status === 402 && outlet?.openPricingModal) {
        outlet.openPricingModal();
      } else {
        setError(err.message || "Failed to complete ATS scan. Please verify inputs and retry.");
      }
    } finally {
      setIsScanning(false);
      setStepMessage("");
    }
  };

  const handleCopyRewrite = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCopyFullReport = () => {
    if (!scanResult) return;
    const reportText = `# ATS Resume Analysis Report
Match Score: ${scanResult.matchScore}%

## Executive Summary
${scanResult.summary}

## Matched Skills
${(scanResult.matchedSkills || []).map((s) => `- ${s}`).join("\n")}

## Missing Keywords (Critical Gaps)
${(scanResult.missingKeywords || []).map((s) => `- ${s}`).join("\n")}

## Strengths
${(scanResult.strengths || []).map((s) => `- ${s}`).join("\n")}

## Recommendations
${(scanResult.recommendations || []).map((r) => `- **${r.area}**: ${r.advice}`).join("\n")}

## STAR Bullet Point Rewrites
${(scanResult.starRewrites || [])
  .map((sr, i) => `### Bullet ${i + 1}\n**Original**: ${sr.original}\n**STAR Optimized**: ${sr.improved}`)
  .join("\n\n")}
`;
    navigator.clipboard.writeText(reportText);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  // Color helper for match score
  const getScoreColor = (score) => {
    if (score >= 80) return "text-emerald-400 border-emerald-500/40 bg-emerald-500/10";
    if (score >= 60) return "text-amber-400 border-amber-500/40 bg-amber-500/10";
    return "text-rose-400 border-rose-500/40 bg-rose-500/10";
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Top Header */}
      <header className="h-16 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-rose-500 text-white shadow-md shadow-orange-500/20">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white flex items-center gap-2">
              AI ATS Resume & Job Matcher
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30 font-semibold">
                STAR Optimizer
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Benchmark your resume against job descriptions, reveal missing keywords, and generate Google STAR rewrites
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {scanResult && (
            <button
              type="button"
              onClick={handleCopyFullReport}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedReport ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copiedReport ? "Report Copied" : "Copy Report"}
            </button>
          )}
        </div>
      </header>

      {/* Main Dual-Pane Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Pane: Inputs & Controls */}
        <div className="w-full lg:w-[480px] xl:w-[540px] border-r border-slate-800/80 flex flex-col bg-slate-900/40 shrink-0 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Step 1: Resume Source */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                1. Select Resume Source
              </label>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    inputMode === "upload" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("library")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    inputMode === "library" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Document Vault
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                    inputMode === "paste" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Paste Text
                </button>
              </div>
            </div>

            {/* Upload PDF Box */}
            {inputMode === "upload" && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,application/pdf"
                  className="hidden"
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? "border-indigo-500 bg-indigo-500/10"
                      : file
                      ? "border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-500/60"
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileCheck className="w-6 h-6 text-emerald-400 shrink-0" />
                      <div className="text-left truncate">
                        <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB • Ready to scan</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <UploadCloud className="w-7 h-7 mx-auto text-slate-400" />
                      <p className="text-xs font-semibold text-slate-200">Drag & drop your PDF resume here</p>
                      <p className="text-[11px] text-slate-500">or click to browse your local files (PDF up to 10MB)</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Document Vault Selector */}
            {inputMode === "library" && (
              <div className="space-y-2">
                {loadingDocs ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-400" /> Loading saved documents...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 space-y-2">
                    <p>No documents found in your library.</p>
                    <button
                      type="button"
                      onClick={() => setInputMode("upload")}
                      className="text-indigo-400 hover:text-indigo-300 font-semibold text-xs"
                    >
                      Upload a PDF instead
                    </button>
                  </div>
                ) : (
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    {documents.map((doc) => (
                      <option key={doc.sessionId} value={doc.sessionId}>
                        {doc.title || doc.fileName || `Session ${doc.sessionId.slice(0, 8)}`} ({doc.pageCount ?? "?"} pages)
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Paste Text */}
            {inputMode === "paste" && (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste the text of your resume here (experience, skills, projects, achievements)..."
                rows={4}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono resize-none"
              />
            )}
          </div>

          {/* Step 2: Target Job Description */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                2. Target Job Description (JD)
              </label>
              <span className="text-[10px] text-slate-400 font-mono">
                {jobDescription.length > 0 ? `${jobDescription.length} chars` : "Paste or choose sample"}
              </span>
            </div>

            {/* Quick Sample JD Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-medium">Quick Fill:</span>
              {Object.entries(SAMPLE_JDS).map(([key, sample]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setJobDescription(sample.text)}
                  className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-300 font-medium transition-colors"
                >
                  {sample.title}
                </button>
              ))}
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description here (requirements, qualifications, tech stack, responsibilities)..."
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* Scan Action Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleScan}
              disabled={isScanning}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-600 hover:from-amber-600 hover:via-orange-600 hover:to-rose-700 text-white font-bold text-xs tracking-wide shadow-lg shadow-orange-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isScanning ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{stepMessage || "Analyzing..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Run ATS Match & STAR Optimizer (1 Credit)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Free with Pro Plan • Consumes 1 Credit for Standard Accounts
            </p>
          </div>
        </div>

        {/* Right Pane: Analysis Results & Recommendations */}
        <div className="flex-1 bg-slate-950 overflow-y-auto p-6">
          {!scanResult && !isScanning && (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-4 py-12">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-inner">
                <Target className="w-8 h-8" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-base font-bold text-white">Ready to Benchmark Your Resume</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Select your resume on the left, paste the job description you're applying for, and click Analyze to reveal your ATS match score, keyword gaps, and STAR rewrites.
                </p>
              </div>

              {/* Information Cards */}
              <div className="grid grid-cols-2 gap-3 w-full text-left pt-4">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> ATS Compatibility
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Scans exact keyword density and tech stack coverage expected by modern automated hiring engines.
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1">
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Google STAR Method
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Converts weak bullets into high-signal Situation, Task, Action, and Result achievements with metrics.
                  </p>
                </div>
              </div>
            </div>
          )}

          {isScanning && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-orange-500 animate-spin" />
                <Sparkles className="w-6 h-6 text-orange-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">AI ATS Engine Working</h3>
                <p className="text-xs text-slate-400 max-w-sm">{stepMessage}</p>
              </div>
            </div>
          )}

          {scanResult && !isScanning && (
            <div className="max-w-4xl mx-auto space-y-6 pb-12">
              {/* Score Header Card */}
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row items-center gap-6 shadow-xl relative overflow-hidden">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

                {/* Score Gauge Circle */}
                <div
                  className={`w-28 h-28 rounded-2xl border-2 flex flex-col items-center justify-center shrink-0 shadow-lg ${getScoreColor(
                    scanResult.matchScore
                  )}`}
                >
                  <span className="text-3xl font-extrabold tracking-tight">{scanResult.matchScore}%</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider mt-0.5">
                    {scanResult.matchScore >= 80 ? "Strong Match" : scanResult.matchScore >= 60 ? "Moderate Match" : "Low Match"}
                  </span>
                </div>

                {/* Executive Summary */}
                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <div className="flex items-center justify-center sm:justify-between flex-wrap gap-2">
                    <h2 className="text-lg font-bold text-white">ATS Compatibility Assessment</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      Rigor: Senior Engineering Bar
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{scanResult.summary}</p>
                </div>
              </div>

              {/* Skills Breakdown Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Matched Skills */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Matched Skills & Technologies
                    </h3>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                      {scanResult.matchedSkills?.length || 0} found
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.matchedSkills?.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                      >
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords (Critical) */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Missing Keywords & Gaps
                    </h3>
                    <span className="text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                      {scanResult.missingKeywords?.length || 0} missing
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.missingKeywords?.map((kw, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20"
                      >
                        + {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Strengths & Recommendations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Strengths */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Key Candidate Strengths
                  </h3>
                  <ul className="space-y-2">
                    {scanResult.strengths?.map((str, i) => (
                      <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Recommendations */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-3">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Actionable Improvement Areas
                  </h3>
                  <div className="space-y-2.5">
                    {scanResult.recommendations?.map((rec, i) => (
                      <div key={i} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs">
                        <div className="font-bold text-cyan-300 mb-0.5">{rec.area}</div>
                        <div className="text-slate-400 text-[11px] leading-relaxed">{rec.advice}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Google STAR Method Rewrites Section */}
              {scanResult.starRewrites && scanResult.starRewrites.length > 0 && (
                <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-400" />
                        Google STAR Method Bullet Rewrites
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Replace vague bullets with Situation, Task, Action, and Quantifiable Results
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {scanResult.starRewrites.map((rewrite, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2.5 hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400/80 flex items-center gap-1">
                            Before (Generic Bullet):
                          </span>
                          <p className="text-xs text-slate-400 italic bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                            "{rewrite.original}"
                          </p>
                        </div>

                        <div className="space-y-1.5 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                              After (STAR Optimized with Metrics):
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyRewrite(rewrite.improved, idx)}
                              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                            >
                              {copiedIndex === idx ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy Bullet</span>
                                </>
                              )}
                            </button>
                          </div>
                          <p className="text-xs text-white font-medium bg-emerald-500/10 p-2.5 rounded-lg border border-emerald-500/20 leading-relaxed">
                            {rewrite.improved}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default AtsMatcher;
