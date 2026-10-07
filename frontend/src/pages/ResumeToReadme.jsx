// src/pages/ResumeToReadme.jsx — Cross-tool resume to GitHub Profile README generator.
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FileText,
  UploadCloud,
  FileCode,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Library,
  Copy,
  Check,
  Zap,
  ExternalLink,
  ChevronRight,
  Code
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { listDocuments, synthesizeResumeToReadme, getCreditBalance } from "../api";
import { Button, InteractiveCard, Badge } from "../components/ui";

export function ResumeToReadme() {
  const { auth, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Mode: "library" | "upload" | "paste"
  const [inputMode, setInputMode] = useState("upload");
  const [documents, setDocuments] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  // File upload state
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  // Credit & synthesis state
  const [credits, setCredits] = useState(null);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [stepMessage, setStepMessage] = useState("");
  const [error, setError] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [copiedJson, setCopiedJson] = useState(false);

  // Load user documents if authenticated
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

      getCreditBalance(auth)
        .then((bal) => setCredits(bal?.credits ?? 0))
        .catch(() => {});
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

  const handleSynthesize = async () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/dashboard/resume-to-readme");
      return;
    }

    setError(null);
    setIsSynthesizing(true);
    setStepMessage("1/3 Extracting resume content & structure...");

    try {
      const timer1 = setTimeout(() => {
        setStepMessage("2/3 Analyzing technical skills, stack & projects with Gemini AI...");
      }, 1200);

      const timer2 = setTimeout(() => {
        setStepMessage("3/3 Formatting developer profile & badges schema...");
      }, 2400);

      const payload = {};
      if (inputMode === "upload") {
        if (!file) throw new Error("Please select a resume PDF file to upload.");
        payload.file = file;
      } else if (inputMode === "library") {
        if (!selectedSessionId) throw new Error("Please pick a document from your library.");
        payload.sessionId = selectedSessionId;
      } else {
        if (!pastedText.trim() || pastedText.length < 50) {
          throw new Error("Please paste at least 50 characters of resume text.");
        }
        payload.resumeText = pastedText.trim();
      }

      const res = await synthesizeResumeToReadme(auth, payload);
      clearTimeout(timer1);
      clearTimeout(timer2);

      if (res.profileData) {
        setExtractedData(res.profileData);
        if (res.creditsRemaining !== undefined) {
          setCredits(res.creditsRemaining);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to synthesize resume. Please check your document and try again.");
    } finally {
      setIsSynthesizing(false);
      setStepMessage("");
    }
  };

  const handleOpenInStudio = () => {
    if (!extractedData) return;
    navigate("/dashboard/github-studio", { state: { initialData: extractedData } });
  };

  const handleCopyJson = () => {
    if (!extractedData) return;
    navigator.clipboard.writeText(JSON.stringify(extractedData, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="flex-1 h-full overflow-y-auto py-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold mb-2">
            <Sparkles size={12} className="text-purple-400" />
            <span>AI Career Transformer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Resume to GitHub Profile README
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl mt-1">
            Turn your traditional resume PDF into a high-converting, interactive GitHub Profile README in seconds.
          </p>
        </div>

        {isAuthenticated && (
          <div className="flex items-center gap-3">
            <div className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
              <Zap size={14} className="text-indigo-400" />
              <span className="text-slate-400">Available Credits:</span>
              <span className="font-bold text-white">{credits ?? 0}</span>
            </div>
            <Link to="/pricing">
              <Button size="sm" variant="outline">Get More</Button>
            </Link>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-3">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block">Synthesis Issue</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Grid: Input Pane & Extracted Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Source Selection */}
        <div className="lg:col-span-5 space-y-6">
          <InteractiveCard className="p-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <FileText size={16} className="text-indigo-400" />
              <span>1. Choose Resume Source</span>
            </h2>

            {/* Source Mode Switcher */}
            <div className="grid grid-cols-3 gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 text-xs font-semibold mb-5">
              <button
                type="button"
                onClick={() => setInputMode("upload")}
                className={`py-2 px-2 rounded-lg transition-colors truncate ${
                  inputMode === "upload"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Upload PDF
              </button>
              <button
                type="button"
                onClick={() => setInputMode("library")}
                className={`py-2 px-2 rounded-lg transition-colors truncate ${
                  inputMode === "library"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Vault Library
              </button>
              <button
                type="button"
                onClick={() => setInputMode("paste")}
                className={`py-2 px-2 rounded-lg transition-colors truncate ${
                  inputMode === "paste"
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Paste Text
              </button>
            </div>

            {/* Mode: Upload PDF */}
            {inputMode === "upload" && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  isDragOver
                    ? "border-indigo-500 bg-indigo-500/10"
                    : file
                    ? "border-emerald-500/50 bg-emerald-500/5"
                    : "border-slate-800 hover:border-slate-700 bg-slate-900/40"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3">
                  <UploadCloud size={24} />
                </div>
                {file ? (
                  <div>
                    <span className="text-xs font-bold text-white block truncate mb-1">{file.name}</span>
                    <span className="text-[11px] text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <CheckCircle2 size={12} /> Ready for analysis ({(file.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-xs font-bold text-slate-200 block mb-1">
                      Drop resume PDF here, or click to browse
                    </span>
                    <span className="text-[11px] text-slate-500">Supports standard single or multi-page resumes (up to 10MB)</span>
                  </div>
                )}
              </div>
            )}

            {/* Mode: Vault Library */}
            {inputMode === "library" && (
              <div>
                {!isAuthenticated ? (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <p className="text-xs text-slate-400 mb-3">Sign in to choose from your saved PDF vault.</p>
                    <Link to="/login?redirect=/dashboard/resume-to-readme">
                      <Button size="sm" variant="primary">Sign In</Button>
                    </Link>
                  </div>
                ) : loadingDocs ? (
                  <div className="flex items-center justify-center py-8 text-xs text-slate-400 gap-2">
                    <Loader2 size={16} className="animate-spin text-indigo-400" />
                    <span>Loading saved PDFs...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                    <p className="text-xs text-slate-400 mb-2">No documents saved in your vault yet.</p>
                    <button
                      type="button"
                      onClick={() => setInputMode("upload")}
                      className="text-xs text-indigo-400 hover:underline font-semibold"
                    >
                      Upload a resume now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {documents.map((doc) => (
                      <div
                        key={doc.sessionId}
                        onClick={() => setSelectedSessionId(doc.sessionId)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                          selectedSessionId === doc.sessionId
                            ? "border-indigo-500 bg-indigo-500/15 text-white"
                            : "border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <FileText size={16} className={selectedSessionId === doc.sessionId ? "text-indigo-400" : "text-slate-500"} />
                          <span className="truncate font-medium">{doc.fileName}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0">{doc.pageCount} pages</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mode: Paste Text */}
            {inputMode === "paste" && (
              <div>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder="Paste your raw resume text or LinkedIn profile summary here..."
                  rows={7}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none font-mono"
                />
                <span className="text-[10px] text-slate-500 block text-right mt-1">
                  {pastedText.length} characters
                </span>
              </div>
            )}

            {/* Action Button */}
            <div className="pt-6 border-t border-slate-800/80 mt-6 space-y-3">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center shadow-lg shadow-indigo-600/25"
                disabled={isSynthesizing}
                onClick={handleSynthesize}
              >
                {isSynthesizing ? (
                  <>
                    <Loader2 size={16} className="animate-spin mr-2" />
                    <span>Analyzing Resume...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={16} className="mr-2 text-amber-300" />
                    <span>Synthesize GitHub README (1 Credit)</span>
                  </>
                )}
              </Button>

              {isSynthesizing && stepMessage && (
                <div className="text-center text-[11px] text-indigo-300 font-medium animate-pulse">
                  {stepMessage}
                </div>
              )}
            </div>
          </InteractiveCard>
        </div>

        {/* Right Column: Extracted Profile Result */}
        <div className="lg:col-span-7 space-y-6">
          {extractedData ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <InteractiveCard className="p-6 border-indigo-500/30 bg-gradient-to-br from-slate-900 to-indigo-950/20">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-white text-base shadow-md shadow-indigo-500/30">
                      {extractedData.name ? extractedData.name[0] : "D"}
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-white">{extractedData.name}</h3>
                      <p className="text-xs text-indigo-400 font-medium">{extractedData.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyJson}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
                      title="Copy raw JSON"
                    >
                      {copiedJson ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                    <Button variant="primary" size="sm" onClick={handleOpenInStudio} className="shadow-md shadow-indigo-500/30">
                      <span>Open in Studio</span>
                      <ArrowRight size={14} className="ml-1.5" />
                    </Button>
                  </div>
                </div>

                {/* Bio */}
                <div className="pt-4 pb-2">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                    AI-Synthesized Bio
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    {extractedData.bio}
                  </p>
                </div>

                {/* Extracted Tech Stack Badges */}
                <div className="pt-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                    Detected Tech Stack ({extractedData.tech?.length || 0})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.tech?.map((t, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/15 border border-indigo-500/25 text-indigo-300 text-[11px] font-semibold"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Featured Projects */}
                {extractedData.projects && extractedData.projects.length > 0 && (
                  <div className="pt-4">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">
                      Extracted Featured Projects
                    </span>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {extractedData.projects.map((proj, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-1">
                          <span className="text-xs font-bold text-white block truncate">{proj.title}</span>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{proj.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Callout */}
                <div className="mt-6 p-4 rounded-2xl bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Next: Customize & 1-Click Publish</span>
                    <span className="text-[11px] text-purple-200">
                      Live preview your README, tweak badges, and publish to your GitHub profile repository.
                    </span>
                  </div>
                  <Button variant="primary" size="sm" onClick={handleOpenInStudio} className="shrink-0 ml-4">
                    Continue to Studio
                  </Button>
                </div>
              </InteractiveCard>
            </div>
          ) : (
            <div className="border border-slate-800/80 rounded-3xl p-10 text-center bg-slate-900/20 backdrop-blur-sm space-y-4">
              <div className="h-14 w-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center mx-auto text-slate-500">
                <FileCode size={28} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white mb-1">Your Developer Profile Blueprint</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Upload or select a resume on the left to extract your skills, achievements, and projects into a customized GitHub README format.
                </p>
              </div>
              <div className="pt-2 flex justify-center gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-indigo-400" /> Shields.io Badges
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-indigo-400" /> Stats Cards
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CheckCircle2 size={12} className="text-indigo-400" /> 1-Click Commit
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ResumeToReadme;
