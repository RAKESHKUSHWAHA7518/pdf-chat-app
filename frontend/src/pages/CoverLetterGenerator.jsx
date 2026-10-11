// src/pages/CoverLetterGenerator.jsx — AI Tailored Cover Letter Studio.
import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Mail,
  Sparkles,
  FileText,
  UploadCloud,
  Copy,
  Check,
  Download,
  Printer,
  Loader2,
  AlertCircle,
  Briefcase,
  Building,
  User,
  CheckCircle2,
  FileCheck,
  Eye,
  Edit3,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { listDocuments, generateCoverLetter } from "../api";

const SAMPLE_ROLES = [
  {
    company: "Stripe",
    title: "Senior Full-Stack Engineer",
    text: `Stripe is looking for a Senior Full-Stack Engineer to scale our Global Payments infrastructure.
You will architect high-throughput APIs, build intuitive merchant dashboards with React/TypeScript, and lead cross-functional architecture reviews.
Requirements: 4+ years experience with distributed systems, React, Node.js/Ruby, strong API design mindset, and passion for developer developer tooling.`,
  },
  {
    company: "Anthropic",
    title: "AI Systems Engineer",
    text: `Anthropic is seeking an AI Applications Engineer to deploy frontier safety and developer tooling.
You will work on low-latency LLM streaming, Python FastAPI backends, vector search pipelines, and evaluation harnesses.
Requirements: Deep familiarity with generative AI APIs, Python, distributed event systems, and modern web application frontends.`,
  },
  {
    company: "Datadog",
    title: "Cloud Infrastructure Engineer",
    text: `Datadog is hiring a Cloud Infrastructure Engineer to manage multi-region Kubernetes clusters and high-volume observability ingestion pipelines.
Requirements: Deep hands-on experience with AWS, Terraform, Docker/Kubernetes, Linux systems, and automated CI/CD at enterprise scale.`,
  },
];

export function CoverLetterGenerator() {
  const { auth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const outlet = useOutletContext();

  // Resume source state: "upload" | "library" | "paste"
  const [inputMode, setInputMode] = useState("upload");
  const [documents, setDocuments] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  // File & text state
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Job & metadata state
  const [companyName, setCompanyName] = useState("");
  const [candidateName, setCandidateName] = useState(auth?.user?.name || "");
  const [jobDescription, setJobDescription] = useState("");
  const [tone, setTone] = useState("confident");

  // Output & UI state
  const [isGenerating, setIsGenerating] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [error, setError] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [activeTab, setActiveTab] = useState("preview"); // "preview" | "raw"
  const [copied, setCopied] = useState(false);

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

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/dashboard/cover-letter");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Please paste the target Job Description.");
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
    setIsGenerating(true);
    setStepMessage("Extracting candidate achievements & technical credentials...");

    const t1 = setTimeout(() => setStepMessage("Analyzing target role requirements & company context..."), 1200);
    const t2 = setTimeout(() => setStepMessage("Synthesizing magnetic hook & metric-backed proof points..."), 2800);
    const t3 = setTimeout(() => setStepMessage("Polishing tone, cadence & professional formatting..."), 4500);

    try {
      const payload = {
        jobDescription: jobDescription.trim(),
        companyName: companyName.trim() || "Hiring Team",
        candidateName: candidateName.trim() || "Candidate",
        tone,
      };

      if (inputMode === "upload") payload.file = file;
      else if (inputMode === "library") payload.sessionId = selectedSessionId;
      else if (inputMode === "paste") payload.resumeText = resumeText.trim();

      const res = await generateCoverLetter(auth, payload);

      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);

      if (res.coverLetter) {
        setCoverLetter(res.coverLetter);
        setActiveTab("preview");
        if (outlet?.refreshCredits) outlet.refreshCredits();
      } else {
        throw new Error("No cover letter generated");
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (err.status === 402 && outlet?.openPricingModal) {
        outlet.openPricingModal();
      } else {
        setError(err.message || "Failed to generate cover letter. Please verify inputs and retry.");
      }
    } finally {
      setIsGenerating(false);
      setStepMessage("");
    }
  };

  const handleCopy = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!coverLetter) return;
    const blob = new Blob([coverLetter], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${companyName ? companyName.toLowerCase().replace(/\s+/g, "-") : "cover-letter"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-100 overflow-y-auto lg:overflow-hidden lg:h-full">
      {/* Top Header */}
      <header className="min-h-14 py-2.5 px-3 sm:px-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 text-white shadow-md shadow-pink-500/20 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                AI Tailored Cover Letter Generator
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 font-semibold shrink-0">
                Executive Hook
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">
              Transform your resume into a personalized, high-conversion cover letter aligned with any job description
            </p>
          </div>
        </div>

        {coverLetter && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copied ? "Copied" : "Copy Text"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-400" /> Download .md
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-pink-600 hover:bg-pink-500 text-white shadow-md shadow-pink-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
          </div>
        )}
      </header>

      {/* Main Dual-Pane Studio */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-w-0">
        {/* Left Pane: Inputs & Configuration */}
        <div className="w-full lg:w-[480px] xl:w-[520px] border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col bg-slate-900/40 shrink-0 overflow-y-visible lg:overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* 1. Resume Source */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5 shrink-0">
                <FileText className="w-3.5 h-3.5 text-pink-400" /> 1. Candidate Resume Source
              </label>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  type="button"
                  onClick={() => setInputMode("upload")}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    inputMode === "upload" ? "bg-pink-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Upload PDF
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("library")}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    inputMode === "library" ? "bg-pink-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Vault
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode("paste")}
                  className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                    inputMode === "paste" ? "bg-pink-600 text-white" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Paste
                </button>
              </div>
            </div>

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
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                    isDragOver
                      ? "border-pink-500 bg-pink-500/10"
                      : file
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-slate-800 hover:border-slate-700 bg-slate-950/60"
                  }`}
                >
                  {file ? (
                    <div className="flex items-center justify-center gap-3">
                      <FileCheck className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div className="text-left truncate">
                        <p className="text-xs font-semibold text-white truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-400">Ready to synthesize</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <UploadCloud className="w-6 h-6 mx-auto text-slate-400" />
                      <p className="text-xs font-semibold text-slate-200">Upload PDF Resume</p>
                      <p className="text-[10px] text-slate-500">or click to browse local files</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {inputMode === "library" && (
              <div className="space-y-2">
                {loadingDocs ? (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-pink-400" /> Loading vault...
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                    No documents found. Please upload a PDF above.
                  </div>
                ) : (
                  <select
                    value={selectedSessionId}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    {documents.map((doc) => (
                      <option key={doc.sessionId} value={doc.sessionId}>
                        {doc.title || doc.fileName || `Session ${doc.sessionId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {inputMode === "paste" && (
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste key resume highlights, work experience & skills..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 font-mono resize-none"
              />
            )}
          </div>

          {/* 2. Target Company & Candidate Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <Building className="w-3 h-3 text-pink-400" /> Target Company
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g. Stripe, OpenAI, Apple"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1">
                <User className="w-3 h-3 text-pink-400" /> Candidate Name
              </label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                placeholder="Your Full Name"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-pink-500"
              />
            </div>
          </div>

          {/* 3. Target Job Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-pink-400" /> Target Job Description
              </label>
            </div>

            {/* Quick Sample Roles */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400">Samples:</span>
              {SAMPLE_ROLES.map((sample) => (
                <button
                  key={sample.company}
                  type="button"
                  onClick={() => {
                    setCompanyName(sample.company);
                    setJobDescription(sample.text);
                  }}
                  className="px-2 py-0.5 rounded-md bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10px] text-slate-300 font-medium transition-colors"
                >
                  {sample.company} ({sample.title})
                </button>
              ))}
            </div>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the target job description or requirements here..."
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-pink-500 resize-none font-sans leading-relaxed"
            />
          </div>

          {/* 4. Letter Tone */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Letter Tone & Cadence</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "confident", label: "Confident & Impactful" },
                { id: "executive", label: "Executive Leadership" },
                { id: "passionate", label: "Passionate & Creative" },
                { id: "technical", label: "Technical Deep-Dive" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTone(t.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    tone === t.id
                      ? "border-pink-500 bg-pink-500/10 text-pink-300 shadow-sm"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-500 via-pink-600 to-purple-600 hover:from-rose-600 hover:via-pink-700 hover:to-purple-700 text-white font-bold text-xs tracking-wide shadow-lg shadow-pink-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{stepMessage || "Synthesizing Letter..."}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Tailored Cover Letter (1 Credit)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Free with Pro Plan • Consumes 1 Credit for Standard Accounts
            </p>
          </div>
        </div>

        {/* Right Pane: Generated Cover Letter */}
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
                <Eye className="w-3.5 h-3.5" /> Letter Preview
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
                <Edit3 className="w-3.5 h-3.5" /> Edit Markdown
              </button>
            </div>

            {companyName && (
              <span className="text-xs font-bold text-slate-300">
                Application for {companyName}
              </span>
            )}
          </div>

          {/* Letter Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8">
            {!coverLetter && !isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-16">
                <div className="w-16 h-16 rounded-2xl bg-pink-500/10 border border-pink-500/20 flex items-center justify-center text-pink-400 shadow-inner">
                  <Mail className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white">Generate High-Impact Cover Letters</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Upload your resume, paste the target job description on the left, and let DevSuite AI engineer a compelling, metric-backed letter tailored specifically for the hiring manager.
                  </p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-pink-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-pink-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Engineering Your Letter</h3>
                  <p className="text-xs text-slate-400 max-w-sm">{stepMessage}</p>
                </div>
              </div>
            )}

            {coverLetter && !isGenerating && (
              <div className="max-w-2xl mx-auto bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-8 shadow-2xl">
                {activeTab === "preview" ? (
                  <div className="prose prose-invert prose-pink max-w-none text-slate-200 text-sm leading-relaxed space-y-4 font-serif">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {coverLetter}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    className="w-full h-full min-h-[500px] bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded-xl p-4 focus:outline-none focus:border-pink-500 resize-none leading-relaxed"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default CoverLetterGenerator;
