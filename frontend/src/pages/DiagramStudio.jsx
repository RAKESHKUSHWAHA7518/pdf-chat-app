// src/pages/DiagramStudio.jsx — Architecture Diagram Studio (Prompt to Mermaid.js).
import { useState, useEffect, useRef } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import DOMPurify from "dompurify";
import {
  Network,
  Sparkles,
  Copy,
  Check,
  Download,
  Loader2,
  AlertCircle,
  Code,
  Eye,
  RefreshCw,
  Layers,
  Cpu,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useAuth } from "../hooks/authContext.js";
import { generateArchitectureDiagram } from "../api";

const mermaidConfig = {
  startOnLoad: false,
  theme: "dark",
  securityLevel: "strict",
  fontFamily: "Inter, sans-serif",
};

const TEMPLATES = [
  {
    name: "E-Commerce Microservices",
    prompt: "Architecture diagram for an e-commerce platform with Next.js frontend, API Gateway, Auth service, Product Catalog with MongoDB, Orders service with PostgreSQL, Stripe payment processing, and Kafka event streaming.",
    type: "architecture",
  },
  {
    name: "RAG Pipeline (Vector Search)",
    prompt: "Data flow diagram for a production Retrieval-Augmented Generation (RAG) system with PDF ingestion, semantic chunking, Gemini embeddings, Pinecone vector search, re-ranking, and streaming LLM chat response.",
    type: "architecture",
  },
  {
    name: "OAuth 2.0 PKCE Auth Flow",
    prompt: "Sequence diagram for OAuth 2.0 Authorization Code flow with PKCE between Single Page Application, Authorization Server, and Resource API Server.",
    type: "sequence",
  },
  {
    name: "Event-Driven Realtime Chat",
    prompt: "System architecture for real-time WebSocket chat app with React client, Socket.io cluster, Redis pub/sub adapter, and message history database.",
    type: "architecture",
  },
];

export function DiagramStudio() {
  const { auth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const outlet = useOutletContext();

  const [prompt, setPrompt] = useState("");
  const [diagramType, setDiagramType] = useState("architecture");
  const [theme] = useState("dark");

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Result state
  const [diagramTitle, setDiagramTitle] = useState("");
  const [mermaidCode, setMermaidCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [components, setComponents] = useState([]);
  const [recommendations, setRecommendations] = useState([]);

  // Rendered SVG
  const [svgHtml, setSvgHtml] = useState("");
  const [renderError, setRenderError] = useState(null);

  const [activeTab, setActiveTab] = useState("preview"); // "preview" | "code"
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  const containerRef = useRef(null);

  // Render Mermaid code to SVG whenever mermaidCode changes
  useEffect(() => {
    let isCancelled = false;

    async function renderDiagram() {
      if (!mermaidCode || !mermaidCode.trim()) {
        setSvgHtml("");
        setRenderError(null);
        return;
      }

      try {
        const { default: mermaid } = await import("mermaid");
        mermaid.initialize(mermaidConfig);
        const id = `mermaid-canvas-${Date.now()}`;
        const { svg } = await mermaid.render(id, mermaidCode.trim());
        if (!isCancelled) {
          setSvgHtml(DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true, svgFilters: true } }));
          setRenderError(null);
        }
      } catch (err) {
        if (!isCancelled) {
          setRenderError("Syntax error in Mermaid code: " + (err.message || "Invalid syntax"));
        }
      }
    }

    renderDiagram();

    return () => {
      isCancelled = true;
    };
  }, [mermaidCode]);

  const handleGenerate = async () => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/dashboard/diagrams");
      return;
    }

    if (!prompt.trim()) {
      setError("Please describe the system architecture or workflow you want to diagram.");
      return;
    }

    setError(null);
    setRenderError(null);
    setIsGenerating(true);

    try {
      const res = await generateArchitectureDiagram(auth, {
        prompt: prompt.trim(),
        diagramType,
        theme,
      });

      if (res.mermaidCode) {
        setDiagramTitle(res.title || "Architecture Diagram");
        setMermaidCode(res.mermaidCode);
        setExplanation(res.explanation || "");
        setComponents(res.components || []);
        setRecommendations(res.recommendations || []);
        setActiveTab("preview");
        if (outlet?.refreshCredits) outlet.refreshCredits();
      } else {
        throw new Error("No diagram definition returned");
      }
    } catch (err) {
      if (err.status === 402 && outlet?.openPricingModal) {
        outlet.openPricingModal();
      } else {
        setError(err.message || "Failed to generate diagram. Please retry.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!mermaidCode) return;
    navigator.clipboard.writeText(mermaidCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyMarkdown = () => {
    if (!mermaidCode) return;
    const md = `\`\`\`mermaid\n${mermaidCode}\n\`\`\``;
    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2000);
  };

  const handleDownloadSvg = () => {
    if (!svgHtml) return;
    const blob = new Blob([svgHtml], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${diagramTitle ? diagramTitle.toLowerCase().replace(/\s+/g, "-") : "architecture"}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPng = () => {
    if (!svgHtml) return;
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgHtml, "image/svg+xml");
    const svgElement = doc.querySelector("svg");
    if (!svgElement) return;

    const bbox = svgElement.viewBox?.baseVal;
    const width = bbox?.width || parseInt(svgElement.getAttribute("width") || "1200", 10);
    const height = bbox?.height || parseInt(svgElement.getAttribute("height") || "800", 10);

    const canvas = document.createElement("canvas");
    canvas.width = Math.max(Number(width), 800) * 2;
    canvas.height = Math.max(Number(height), 600) * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(2, 2);

    const svgString = new XMLSerializer().serializeToString(svgElement);
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const blobURL = URL.createObjectURL(svgBlob);

    const image = new Image();
    image.onload = () => {
      ctx.fillStyle = "#090d16";
      ctx.fillRect(0, 0, Math.max(Number(width), 800), Math.max(Number(height), 600));
      ctx.drawImage(image, 0, 0, Math.max(Number(width), 800), Math.max(Number(height), 600));

      const pngUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngUrl;
      a.download = `${diagramTitle ? diagramTitle.toLowerCase().replace(/\s+/g, "-") : "architecture"}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobURL);
    };
    image.src = blobURL;
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-950 text-slate-100 overflow-y-auto lg:overflow-hidden lg:h-full">
      {/* Header */}
      <header className="min-h-14 py-2.5 px-3 sm:px-6 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 text-white shadow-md shadow-indigo-500/20 shrink-0">
            <Network className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate">
                Architecture Diagram Studio
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold shrink-0">
                Text to Mermaid.js
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 line-clamp-1 sm:line-clamp-none">
              Generate interactive software architecture flowcharts, microservice topologies, and sequence diagrams
            </p>
          </div>
        </div>

        {mermaidCode && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              {copiedCode ? "Copied" : "Copy Mermaid"}
            </button>
            <button
              type="button"
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
            >
              {copiedMarkdown ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Code className="w-3.5 h-3.5 text-slate-400" />}
              {copiedMarkdown ? "Copied Snippet" : "Markdown Snippet"}
            </button>
            {svgHtml && (
              <>
                <button
                  type="button"
                  onClick={handleDownloadSvg}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-slate-400" /> Export SVG
                </button>
                <button
                  type="button"
                  onClick={handleDownloadPng}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export PNG
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Dual-Pane Studio */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden min-w-0">
        {/* Left Pane: Prompt Controls & Code */}
        <div className="w-full lg:w-[460px] xl:w-[500px] border-b lg:border-b-0 lg:border-r border-slate-800/80 flex flex-col bg-slate-900/40 shrink-0 overflow-y-visible lg:overflow-y-auto p-4 sm:p-5 space-y-4 sm:space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <div className="flex-1">{error}</div>
            </div>
          )}

          {/* Prompt Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Describe Your System
              </label>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Architect a multi-tenant SaaS platform with Next.js frontend, Go microservices, PostgreSQL with read replicas, Redis caching, and Stripe billing..."
              rows={5}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-purple-500 resize-none font-sans leading-relaxed"
            />

            {/* Quick Templates */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Templates:</span>
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.name}
                    type="button"
                    onClick={() => {
                      setPrompt(tmpl.prompt);
                      setDiagramType(tmpl.type);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[11px] text-slate-300 font-medium transition-colors"
                  >
                    {tmpl.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Diagram Type & Options */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300">Diagram Type</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { id: "architecture", label: "Cloud Architecture" },
                { id: "sequence", label: "Sequence / Protocol" },
                { id: "flowchart", label: "Process Flowchart" },
                { id: "erDiagram", label: "Database Schema (ER)" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDiagramType(t.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold text-left transition-all ${
                    diagramType === t.id
                      ? "border-purple-500 bg-purple-500/10 text-purple-300 shadow-sm"
                      : "border-slate-800 bg-slate-950/60 text-slate-400 hover:text-slate-200 hover:border-slate-700"
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
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-500 hover:from-purple-700 hover:via-indigo-700 hover:to-cyan-600 text-white font-bold text-xs tracking-wide shadow-lg shadow-indigo-500/20 disabled:opacity-50 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Synthesizing Architecture...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Diagram & Analysis (1 Credit)</span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Free with Pro Plan • Consumes 1 Credit for Standard Accounts
            </p>
          </div>

          {/* Editable Mermaid Code Block */}
          {mermaidCode && (
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Code className="w-3.5 h-3.5 text-indigo-400" /> Mermaid Definition
                </label>
                <span className="text-[10px] text-slate-400">Live re-render on edit</span>
              </div>
              <textarea
                value={mermaidCode}
                onChange={(e) => setMermaidCode(e.target.value)}
                rows={8}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 font-mono text-xs text-indigo-200 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>
          )}
        </div>

        {/* Right Pane: Visual Canvas & Explanation */}
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
                <Eye className="w-3.5 h-3.5" /> Visual Canvas
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("code")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === "code"
                    ? "bg-slate-800 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <Layers className="w-3.5 h-3.5" /> Architecture Breakdown
              </button>
            </div>

            {diagramTitle && (
              <span className="text-xs font-bold text-slate-300 truncate max-w-sm">
                {diagramTitle}
              </span>
            )}
          </div>

          {/* Canvas Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6">
            {!mermaidCode && !isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto space-y-4 py-16">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-inner">
                  <Network className="w-8 h-8" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-base font-bold text-white">Generate Architecture Diagrams</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Describe your software architecture, microservices, database relationships, or API flows on the left to render live Mermaid.js canvas diagrams.
                  </p>
                </div>
              </div>
            )}

            {isGenerating && (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-16">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-purple-500 animate-spin" />
                  <Sparkles className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-white">Architecting Diagram</h3>
                  <p className="text-xs text-slate-400">Designing components, connections & topology...</p>
                </div>
              </div>
            )}

            {mermaidCode && !isGenerating && (
              <>
                {activeTab === "preview" ? (
                  <div className="space-y-6">
                    {renderError && (
                      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div>{renderError}</div>
                      </div>
                    )}

                    {/* SVG Canvas Container */}
                    <div
                      ref={containerRef}
                      className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-center min-h-[420px] overflow-x-auto shadow-inner"
                      dangerouslySetInnerHTML={{ __html: svgHtml }}
                    />

                    {/* Quick Explanation */}
                    {explanation && (
                      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-indigo-400" /> Architecture Overview
                        </h4>
                        <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                          {explanation}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6 max-w-3xl">
                    {/* Components List */}
                    {components && components.length > 0 && (
                      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-400" /> Core Architectural Components
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {components.map((comp, i) => (
                            <div key={i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                              <span className="text-xs font-bold text-indigo-300">{comp.name}</span>
                              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{comp.role}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {recommendations && recommendations.length > 0 && (
                      <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" /> System Design & Scalability Recommendations
                        </h4>
                        <ul className="space-y-2">
                          {recommendations.map((rec, i) => (
                            <li key={i} className="text-xs text-slate-300 flex items-start gap-2 leading-relaxed">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
export default DiagramStudio;
