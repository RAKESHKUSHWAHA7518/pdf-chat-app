import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Search, Zap, Code, Shield, FileQuestion, ArrowRight } from "lucide-react";
import { Button, InteractiveCard } from "../components/ui";

const DOC_SECTIONS = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: Zap,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <h3 className="text-xl font-bold text-white tracking-tight">Quickstart Guide</h3>
        <p>
          PDFChat is an AI-powered conversational document analysis workspace. To start asking questions about any PDF:
        </p>
        <ol className="list-decimal pl-5 space-y-2 text-slate-400">
          <li>Navigate to the <Link to="/app" className="text-indigo-400 hover:underline">Chat Workspace</Link>.</li>
          <li>Drag and drop your PDF (contracts, textbooks, financial statements) into the upload box.</li>
          <li>Once processed, our vector pipeline indexes the document in seconds.</li>
          <li>Type any question in natural language. The AI responds with verified page citations!</li>
        </ol>
      </div>
    ),
  },
  {
    id: "citations",
    title: "Citations & Verification",
    icon: BookOpen,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <h3 className="text-xl font-bold text-white tracking-tight">How Citations Work</h3>
        <p>
          Unlike generic ChatGPT prompts that can hallucinate facts, PDFChat uses <strong>Retrieval-Augmented Generation (RAG)</strong>.
        </p>
        <p>
          Every response identifies the exact semantic text chunks retrieved from your document and specifies the page numbers where the claim was found.
        </p>
      </div>
    ),
  },
  {
    id: "privacy",
    title: "Privacy & Data Security",
    icon: Shield,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <h3 className="text-xl font-bold text-white tracking-tight">Confidentiality Safeguards</h3>
        <p>
          Security is built into the architecture:
        </p>
        <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
          <li>Zero data retention agreements with foundation model APIs.</li>
          <li>Data encrypted in transit via TLS 1.3 and encrypted at rest via AES-256.</li>
          <li>Signed-in users can permanently delete any document and its vector embeddings at any time.</li>
        </ul>
      </div>
    ),
  },
  {
    id: "api",
    title: "API & Vector Search",
    icon: Code,
    content: (
      <div className="space-y-4 text-sm text-slate-300 leading-relaxed">
        <h3 className="text-xl font-bold text-white tracking-tight">Under the Hood: The RAG Pipeline</h3>
        <p>
          PDFChat runs a multi-stage ingestion pipeline:
        </p>
        <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto">
{`1. PDF Parsing (pdf-parse / OCR layout analysis)
2. Recursive Chunking (chunkSize: 1000, overlap: 200)
3. Embedding Generation (Google Gemini text-embedding-004)
4. Vector Storage (MongoDB Atlas Vector Search)
5. Semantic Retrieval + Answer Generation (Gemini 2.5 Flash)`}
        </pre>
      </div>
    ),
  },
];

export function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = DOC_SECTIONS.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentSection = DOC_SECTIONS.find((s) => s.id === activeSection) || DOC_SECTIONS[0];

  return (
    <div className="py-12 md:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-2xl mb-12">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">
          Documentation & Guides
        </h1>
        <p className="text-slate-400 text-sm">
          Everything you need to know about uploading, vector searching, and querying PDFs.
        </p>
      </div>

      <div className="grid md:grid-cols-12 gap-8 items-start">
        {/* Sidebar Navigation */}
        <aside className="md:col-span-4 lg:col-span-3 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <nav className="space-y-1">
            {filteredSections.map((sec) => {
              const Icon = sec.icon;
              const isActive = sec.id === activeSection;
              return (
                <button
                  key={sec.id}
                  onClick={() => setActiveSection(sec.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition-colors ${
                    isActive
                      ? "bg-indigo-600/20 text-indigo-300 border border-indigo-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-900"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{sec.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content Area */}
        <main className="md:col-span-8 lg:col-span-9">
          <InteractiveCard className="p-8 border-slate-800 bg-slate-900/60 backdrop-blur-xl">
            {currentSection.content}
          </InteractiveCard>
        </main>
      </div>
    </div>
  );
}
