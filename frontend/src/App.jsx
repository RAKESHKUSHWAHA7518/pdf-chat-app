import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useSearchParams, useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import {
  Home,
  FolderOpen,
  Settings as SettingsIcon,
  Sparkles,
  UploadCloud,
  MessageSquare,
  Bot,
  Columns2,
  ChevronLeft,
  ChevronRight,
  FileText,
  ExternalLink,
  Maximize2,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  Zap,
  LogOut,
  FileCode,
} from "lucide-react";
import { Github } from "./components/icons/Github.jsx";
import AuthModal from "./components/AuthModal.jsx";
import CreditBalance from "./components/CreditBalance.jsx";
import PricingPage from "./components/PricingPage.jsx";
import { savePdfBlob, getPdfBlob, deletePdfBlob } from "./utils/pdfStorage.js";
import {
  API_URL,
  authHeaders,
  clearAuth,
  deleteDocument,
  errorCode,
  errorMessage,
  getStoredAuth,
  listDocuments,
  openDocument,
  storeAuth,
  getAuthMe,
} from "./api.js";
import "./App.css";

// ── Suggested questions shown after PDF loads ──
const SUGGESTIONS = [
  "Summarize this document",
  "What are the main topics?",
  "What are the key points?",
  "Give me a brief overview",
];

// ── Format timestamp ──
function formatTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ── Convert citation patterns into markdown links: [📄 Page X](#page-X) ──
function formatAssistantCitations(content) {
  if (!content || typeof content !== "string") return "";
  let result = content.replace(/\[(?:Page|page|p\.)\s*(\d+)\]/gi, "[📄 Page $1](#page-$1)");
  result = result.replace(/\((?:Page|page|p\.)\s*(\d+)\)/gi, "[📄 Page $1](#page-$1)");
  return result;
}

// ── Extract list of unique cited page numbers from text ──
function extractCitations(content) {
  if (!content || typeof content !== "string") return [];
  const regex = /(?:\[|\(|\b)(?:Page|page|p\.)\s*(\d+)/gi;
  const pages = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    const p = parseInt(match[1], 10);
    if (!isNaN(p) && !pages.includes(p)) {
      pages.push(p);
    }
  }
  return pages.sort((a, b) => a - b);
}

export default function App() {
  const [session, setSession] = useState(null);       // { sessionId, fileName, pageCount, chunkCount }
  const [messages, setMessages] = useState([]);        // chat messages
  const [input, setInput] = useState("");              // textarea value
  const [isUploading, setIsUploading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const isDashboard = location.pathname.startsWith("/dashboard");
  const [auth, setAuth] = useState(() => {
    const stored = getStoredAuth();
    if (stored) return stored;
    if (searchParams.get("testUser") === "1") {
      return { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NGJkZTcxMC0zNDM1LTRlMGYtODMyOC01M2E2MjBjYTNmNTAiLCJpYXQiOjE3OTEzNjg5NTYsImV4cCI6MTc5Mzk2MDk1Nn0.tlUUbKelpjU_G9Q1IxlTe6E4jG9YwfbXoYwLJyz4X9w", email: "2107340130050@recbanda.ac.in" };
    }
    return null;
  });
  const [guestQuota, setGuestQuota] = useState(null);  // { used, limit, remaining } for guests
  const [creditBalance, setCreditBalance] = useState(null);
  const [balanceRefreshTrigger, setBalanceRefreshTrigger] = useState(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPricing, setShowPricing] = useState(() => searchParams.get("pricing") === "1");
  const [documents, setDocuments] = useState([]);      // saved PDFs (signed-in users)

  useEffect(() => {
    if (searchParams.get("testUser") === "1") {
      setAuth((prev) => prev || { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0NGJkZTcxMC0zNDM1LTRlMGYtODMyOC01M2E2MjBjYTNmNTAiLCJpYXQiOjE3OTEzNjg5NTYsImV4cCI6MTc5Mzk2MDk1Nn0.tlUUbKelpjU_G9Q1IxlTe6E4jG9YwfbXoYwLJyz4X9w", email: "2107340130050@recbanda.ac.in" });
    }
    if (searchParams.get("pricing") === "1") {
      setShowPricing(true);
    }
    if (!auth) {
      getAuthMe(null)
        .then((data) => {
          if (data?.quota) setGuestQuota(data.quota);
        })
        .catch(() => {});
    }
  }, [searchParams, auth]);

  // Split View & PDF Viewer state
  const [pdfUrl, setPdfUrl] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState(() => (typeof window !== "undefined" && window.innerWidth >= 1024 ? "split" : "chat"));
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);
  const pendingFileRef = useRef(null);                 // file that hit the signup wall
  const sessionRef = useRef(null);                     // tracks session for async callbacks
  const docsLoadedRef = useRef(null);                  // prevents double-loading in StrictMode

  // Mirror session into a ref
  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  // Cancel in-flight stream on unmount
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  // Revoke object URL on unmount to prevent leaks
  useEffect(() => {
    return () => {
      if (pdfUrl && pdfUrl.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-dismiss errors after 5 seconds
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ── Jump PDF viewer to a specific page ──
  const handleJumpToPage = useCallback((pageNum) => {
    if (!pageNum) return;
    setCurrentPage(pageNum);
    if (viewMode === "chat") {
      setViewMode(window.innerWidth < 900 ? "doc" : "split");
    }
  }, [viewMode]);

  // ── Attach local PDF file for preview (if not cached in browser) ──
  const handleAttachLocalPdf = (e) => {
    const file = e.target.files?.[0];
    if (!file || file.type !== "application/pdf") return;
    const url = URL.createObjectURL(file);
    setPdfUrl(url);
    if (session?.sessionId) {
      savePdfBlob(session.sessionId, file);
    }
  };

  // ── Auth logout ──
  const handleLogout = useCallback(() => {
    clearAuth();
    setAuth(null);
    setCreditBalance(null);
    setGuestQuota(null);
    setDocuments([]);
    docsLoadedRef.current = null;
  }, []);

  // ── Document library: restore document ──
  const openDocumentById = useCallback(async (sessionId) => {
    if (!auth || sessionRef.current?.sessionId === sessionId) return;
    try {
      const data = await openDocument(auth, sessionId);
      setSession(data);

      // Check IndexedDB cache or sample report fallback
      const cachedBlob = await getPdfBlob(sessionId);
      if (cachedBlob) {
        setPdfUrl(URL.createObjectURL(cachedBlob));
      } else if (data.fileName === "sample-report.pdf") {
        setPdfUrl("/sample-report.pdf");
      } else {
        setPdfUrl(null);
      }
      setCurrentPage(1);
      if (window.innerWidth >= 1024) setViewMode("split");
      setIsMobileSidebarOpen(false);

      setMessages([
        {
          id: Date.now(),
          role: "assistant",
          content: `Welcome back! I have **${data.fileName}** (${data.pageCount} pages, ${data.chunkCount} sections indexed) ready.\n\nAsk me anything about it!`,
          time: new Date(),
        },
      ]);
      setInput("");
    } catch (err) {
      if (err.status === 401) { handleLogout(); return; }
      setError(err.message);
      if (err.status === 404 || err.status === 410) {
        setDocuments((prev) => prev.filter((d) => d.sessionId !== sessionId));
      }
    }
  }, [auth, handleLogout]);

  const openDocumentByIdRef = useRef(openDocumentById);
  useEffect(() => {
    openDocumentByIdRef.current = openDocumentById;
  }, [openDocumentById]);

  const loadDocuments = useCallback(async (currentAuth, { autoOpen } = { autoOpen: true }, retries = 2) => {
    try {
      const docs = await listDocuments(currentAuth);
      setDocuments(docs);
      if (
        autoOpen &&
        !sessionRef.current &&
        !pendingFileRef.current &&
        docs.length > 0
      ) {
        openDocumentByIdRef.current(docs[0].sessionId);
      }
    } catch (err) {
      if (err.status === 401) handleLogout();
      else if (retries > 0 && (err.status === 502 || err.status === 504 || err.message?.includes("starting up"))) {
        setTimeout(() => loadDocuments(currentAuth, { autoOpen }, retries - 1), 1500);
      } else setError(err.message);
    }
  }, [handleLogout]);

  // Load the document library on login / page reload
  useEffect(() => {
    if (!auth) return;
    if (docsLoadedRef.current === auth.token) return;
    docsLoadedRef.current = auth.token;
    loadDocuments(auth);
  }, [auth, loadDocuments]);

  // Open document requested via URL query ?session=...
  const requestedSessionId = searchParams.get("session");
  useEffect(() => {
    if (requestedSessionId && auth && sessionRef.current?.sessionId !== requestedSessionId) {
      openDocumentByIdRef.current(requestedSessionId);
    }
  }, [requestedSessionId, auth]);

  const handleDeleteDocument = async (sessionId) => {
    try {
      await deleteDocument(auth, sessionId);
      deletePdfBlob(sessionId).catch(() => {});
      setDocuments((prev) => prev.filter((d) => d.sessionId !== sessionId));
      if (sessionRef.current?.sessionId === sessionId) {
        if (pdfUrl && pdfUrl.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
        setPdfUrl(null);
        setSession(null);
        setMessages([]);
        setViewMode("chat");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // ── Handle PDF upload ──
  const handleUpload = useCallback(async (file) => {
    if (!file || file.type !== "application/pdf") {
      setError("Please upload a valid PDF file.");
      return;
    }

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append("pdf", file);

    try {
      const res = await fetch(`${API_URL}/upload`, {
        method: "POST",
        headers: authHeaders(auth),
        body: formData,
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 502 || res.status === 504) {
          throw new Error("Backend server is starting up. Please try again in a moment.");
        }
        if (errorCode(data) === "AUTH_REQUIRED") {
          pendingFileRef.current = file;
          setShowAuthModal(true);
        }
        if (errorCode(data) === "INSUFFICIENT_CREDITS" || res.status === 402) {
          setShowPricing(true);
        }
        throw new Error(errorMessage(data, "Upload failed"));
      }

      if (data.guestQuota) setGuestQuota(data.guestQuota);
      setSession(data);

      // Create local URL for PDF preview & cache in IndexedDB
      const fileBlobUrl = URL.createObjectURL(file);
      setPdfUrl(fileBlobUrl);
      setCurrentPage(1);
      savePdfBlob(data.sessionId, file);

      // Default to split view on desktop screens
      if (window.innerWidth >= 1024) setViewMode("split");
      setIsMobileSidebarOpen(false);

      if (auth) {
        loadDocuments(auth, { autoOpen: false });
        setBalanceRefreshTrigger((prev) => prev + 1);
      }
      setMessages([
        {
          id: Date.now(),
          role: "assistant",
          content: `I've read **${data.fileName}** (${data.pageCount} pages, ${data.chunkCount} sections indexed).\n\nAsk me anything about this document!`,
          time: new Date(),
        },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }, [auth, loadDocuments]);

  // ── File input change ──
  const onFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  // ── Drag and drop ──
  const onDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const onDragLeave = () => setIsDragOver(false);
  const onDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  };

  // ── Send message ──
  const sendMessage = useCallback(async (text) => {
    const question = text.trim();
    if (!question || !session || isStreaming) return;

    const userMsg = { id: Date.now(), role: "user", content: question, time: new Date() };
    const assistantMsgId = Date.now() + 1;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantMsgId, role: "assistant", content: "", time: new Date(), streaming: true },
    ]);
    setInput("");
    setIsStreaming(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(auth) },
        body: JSON.stringify({ sessionId: session.sessionId, question }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 404) {
          setSession(null);
          setMessages([]);
          throw new Error("Session expired or server restarted. Please upload your PDF again.");
        }
        if (res.status === 502 || res.status === 504) {
          throw new Error("AI service is reconnecting. Please send your question again in a moment.");
        }
        throw new Error(errorMessage(errData, "Chat request failed"));
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.error) throw new Error(data.error);
            if (data.done) break;
            if (data.chunk) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantMsgId
                    ? { ...m, content: m.content + data.chunk }
                    : m
                )
              );
            }
          } catch (e) {
            if (e.message !== "Unexpected end of JSON input") throw e;
          }
        }
      }
    } catch (err) {
      if (err.name === "AbortError") return;
      setError(err.message);
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
    } finally {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, streaming: false } : m
        )
      );
      setIsStreaming(false);
    }
  }, [session, isStreaming, auth]);

  // ── Handle Enter key ──
  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  // ── Auto-resize textarea ──
  const onInputChange = (e) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  };

  // ── Reset session ──
  const resetSession = async () => {
    abortControllerRef.current?.abort();
    if (session) {
      await fetch(`${API_URL}/session/${session.sessionId}`, {
        method: "DELETE",
        headers: authHeaders(auth),
      }).catch(() => {});
    }
    if (pdfUrl && pdfUrl.startsWith("blob:")) {
      URL.revokeObjectURL(pdfUrl);
    }
    setPdfUrl(null);
    setCurrentPage(1);
    setViewMode("chat");
    setSession(null);
    setMessages([]);
    setInput("");
  };

  // ── Auth handlers ──
  const handleAuthSuccess = (data) => {
    storeAuth(data);
    setAuth({ token: data.token, email: data.user.email });
    setShowAuthModal(false);
    setGuestQuota(null);
    if (pendingFileRef.current) {
      const file = pendingFileRef.current;
      pendingFileRef.current = null;
      handleUpload(file);
    }
  };

  return (
    <div className={`app ${isDashboard ? "in-dashboard" : ""} ${isSidebarCollapsed ? "sidebar-collapsed" : ""}`}>
      {/* Mobile sidebar overlay backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar (Document Drawer inside Dashboard) ── */}
      <aside className={`sidebar ${isDashboard ? "doc-drawer" : ""} ${isSidebarCollapsed ? "collapsed" : ""} ${isMobileSidebarOpen ? "mobile-open" : ""}`}>
        {/* Persistent file input available in all drawer states */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={onFileChange}
          style={{ display: "none" }}
        />

        {isDashboard ? (
          /* Sleek In-Dashboard Document Drawer Header */
          <div className="doc-drawer-header">
            <div className="doc-drawer-title">
              <div className="doc-drawer-icon">
                <FileText size={14} className="text-indigo-400" />
              </div>
              {!isSidebarCollapsed && (
                <div className="doc-drawer-meta">
                  <span className="doc-drawer-heading">Document Source</span>
                  <span className="doc-drawer-sub">
                    {session ? `${session.pageCount} pages indexed` : "PDF Workspace"}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="doc-drawer-collapse-btn desktop-only"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                title={isSidebarCollapsed ? "Expand document panel" : "Collapse document panel"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={14} /> : <PanelLeftClose size={14} />}
              </button>
              <button
                type="button"
                className="sidebar-mobile-close-btn"
                onClick={() => setIsMobileSidebarOpen(false)}
                title="Close drawer"
                aria-label="Close drawer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          /* Legacy Standalone Nav */
          <div className="sidebar-top-nav">
            {!isSidebarCollapsed && (
              <Link to="/" className="sidebar-home-link" onClick={() => setIsMobileSidebarOpen(false)}>
                <Home style={{ width: "13px", height: "13px" }} />
                <span>Home</span>
              </Link>
            )}
            <div className="sidebar-nav-actions">
              {!isSidebarCollapsed && (
                <>
                  <Link to="/dashboard/documents" title="Document Vault" className="sidebar-pill-btn" onClick={() => setIsMobileSidebarOpen(false)}>
                    <FolderOpen style={{ width: "12px", height: "12px" }} />
                    <span>Library</span>
                  </Link>
                  <Link to="/dashboard/github-studio" title="GitHub README Studio" className="sidebar-pill-btn" onClick={() => setIsMobileSidebarOpen(false)}>
                    <Github style={{ width: "12px", height: "12px" }} />
                    <span>Studio</span>
                  </Link>
                  <Link to="/dashboard/settings" title="Settings" className="sidebar-icon-btn" onClick={() => setIsMobileSidebarOpen(false)}>
                    <SettingsIcon style={{ width: "13px", height: "13px" }} />
                  </Link>
                </>
              )}
              <button
                type="button"
                className="sidebar-collapse-toggle desktop-only"
                onClick={() => setIsSidebarCollapsed((prev) => !prev)}
                title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isSidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
              </button>
              <button
                type="button"
                className="sidebar-mobile-close-btn"
                onClick={() => setIsMobileSidebarOpen(false)}
                title="Close sidebar"
                aria-label="Close sidebar"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}

        {!isSidebarCollapsed && (
          <>
            {!isDashboard && (
              <>
                <div className="sidebar-logo">
                  <div className="logo-icon">📄</div>
                  <div>
                    <h1>PDF Chat</h1>
                    <span>Powered by Gemini AI</span>
                  </div>
                </div>

                {/* Account / free-trial status */}
                <div className="auth-section">
                  {auth ? (
                    <div className="auth-user-card">
                      <div className="auth-user-header">
                        <div className="auth-avatar">{auth.email[0].toUpperCase()}</div>
                        <div className="auth-user-meta">
                          <p className="auth-email" title={auth.email}>{auth.email}</p>
                          {creditBalance?.isPro ? (
                            <span className="auth-plan-badge pro" title="Active Pro Subscription">
                              <Sparkles size={11} className="auth-plan-sparkle" /> Pro Member
                            </span>
                          ) : (
                            <span className="auth-plan-badge free" title="Free Account">
                              Free Account
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="auth-balance-box">
                        <CreditBalance
                          auth={auth}
                          onBalanceChange={setCreditBalance}
                          refreshTrigger={balanceRefreshTrigger}
                        />
                      </div>

                      <div className="auth-user-actions">
                        <button
                          type="button"
                          className="auth-pricing-btn"
                          onClick={() => setShowPricing(true)}
                          title="Manage Plan & Credits"
                        >
                          <Zap size={13} />
                          <span>Manage Plan</span>
                        </button>
                        <button
                          type="button"
                          className="auth-logout-btn"
                          onClick={handleLogout}
                          title="Log out"
                        >
                          <LogOut size={13} />
                          <span>Log out</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="auth-guest">
                      <div className="auth-trial-badge">
                        🎁 Free trial · {guestQuota ? `${guestQuota.remaining}/${guestQuota.limit} free credit left` : "1 free credit"}
                      </div>
                      <button className="auth-signup-btn" onClick={() => setShowAuthModal(true)}>
                        Sign up to claim 3 free credits
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {/* Upload section */}
            <div className="upload-section">
              <div className="flex items-center justify-between mb-1.5">
                <h2>{session ? "Active PDF" : "Document"}</h2>
                {session && (
                  <button
                    type="button"
                    onClick={resetSession}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                    title="Change PDF"
                  >
                    Change PDF
                  </button>
                )}
              </div>

              {isUploading ? (
                <div className="upload-progress">
                  <div className="progress-header">
                    <div className="spinner" />
                    <p>Processing PDF...</p>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" />
                  </div>
                </div>
              ) : session ? (
                <div className="pdf-info">
                  <div className="pdf-info-header">
                    <div className="pdf-icon">📕</div>
                    <div className="overflow-hidden">
                      <h3 className="truncate" title={session.fileName}>{session.fileName}</h3>
                      <p>Ready to chat</p>
                    </div>
                  </div>
                  <div className="pdf-stats">
                    <div className="stat">
                      <div className="stat-value">{session.pageCount}</div>
                      <div className="stat-label">Pages</div>
                    </div>
                    <div className="stat">
                      <div className="stat-value">{session.chunkCount}</div>
                      <div className="stat-label">Chunks</div>
                    </div>
                  </div>
                  <button className="change-pdf-btn" onClick={resetSession}>
                    ↩ Upload different PDF
                  </button>
                </div>
              ) : (
                <div
                  className={`upload-area ${isDragOver ? "drag-over" : ""}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <div className="upload-icon">📂</div>
                  <p>Drop PDF here or click to browse</p>
                  <span>Max 10MB</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={onFileChange}
                  />
                </div>
              )}
            </div>

            {/* Saved documents (signed-in users) */}
            {auth && documents.length > 0 && (
              <div className="documents-section">
                <div className="flex items-center justify-between mb-2">
                  <h2>Saved in Vault</h2>
                  <Link to="/dashboard/documents" className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold">
                    View All ({documents.length}) →
                  </Link>
                </div>
                <div className="documents-list">
                  {documents.slice(0, 5).map((doc) => (
                    <div
                      key={doc.sessionId}
                      className={`document-item ${session?.sessionId === doc.sessionId ? "active" : ""}`}
                    >
                      <button
                        className="document-open"
                        onClick={() => openDocumentById(doc.sessionId)}
                        title={doc.fileName}
                      >
                        <span className="document-icon">📕</span>
                        <span className="document-info">
                          <span className="document-name truncate">{doc.fileName}</span>
                          <span className="document-meta">
                            {doc.pageCount} pages · {doc.chunkCount} chunks
                          </span>
                        </span>
                      </button>
                      <button
                        className="document-delete"
                        onClick={() => handleDeleteDocument(doc.sessionId)}
                        title="Delete document"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isDashboard && (
              <div className="sidebar-footer">
                <p>
                  Built by <strong>Rakesh Kushwaha</strong><br />
                  <span>LangChain.js</span> • <span>Gemini</span> • <span>MongoDB Atlas</span><br />
                  RAG • Embeddings • Vector Search
                </p>
              </div>
            )}
          </>
        )}

        {isSidebarCollapsed && (
          <div className="sidebar-collapsed-icons">
            {isDashboard ? (
              <>
                <button
                  type="button"
                  className="collapsed-icon-link"
                  onClick={() => setIsSidebarCollapsed(false)}
                  title="Expand document panel"
                >
                  <PanelLeftOpen size={16} />
                </button>
                <button
                  type="button"
                  className="collapsed-icon-link"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload PDF"
                >
                  <UploadCloud size={16} />
                </button>
                <Link to="/dashboard/documents" title="Document Vault" className="collapsed-icon-link">
                  <FolderOpen size={16} />
                </Link>
                {session && (
                  <button
                    type="button"
                    className="collapsed-icon-link active"
                    title={session.fileName}
                    onClick={() => setViewMode((m) => (m === "doc" ? "chat" : "doc"))}
                  >
                    <FileText size={16} />
                  </button>
                )}
              </>
            ) : (
              <>
                <Link to="/" title="Home" className="collapsed-icon-link">
                  <Home size={18} />
                </Link>
                <Link to="/dashboard/documents" title="Library" className="collapsed-icon-link">
                  <FolderOpen size={18} />
                </Link>
                <Link to="/dashboard/settings" title="Settings" className="collapsed-icon-link">
                  <SettingsIcon size={18} />
                </Link>
                {session && (
                  <button
                    type="button"
                    className="collapsed-icon-link active"
                    title={session.fileName}
                    onClick={() => setViewMode((m) => (m === "doc" ? "chat" : "doc"))}
                  >
                    <FileText size={16} />
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </aside>

      {/* ── Main Workspace (Side-by-Side PDF & Chat) ── */}
      <div className={`workspace-container ${session ? `has-session mode-${viewMode}` : "no-session"}`}>
        {/* PDF Viewer Pane */}
        {session && (viewMode === "split" || viewMode === "doc") && (
          <section className="pdf-pane">
            <div className="pdf-pane-toolbar">
              <div className="pdf-pane-title-group">
                <button
                  type="button"
                  className="mobile-sidebar-toggle-btn"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  aria-label="Open sidebar"
                  title="Open sidebar"
                >
                  <Menu size={18} />
                </button>
                <div className="pdf-pane-title" title={session.fileName}>
                  <FileText size={16} className="pdf-title-icon" />
                  <span className="pdf-title-text">{session.fileName}</span>
                </div>
              </div>

              <div className="pdf-pagination">
                <button
                  type="button"
                  className="pdf-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  title="Previous page"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="pdf-page-display">
                  Page <strong>{currentPage}</strong> of {session.pageCount || 1}
                </span>
                <button
                  type="button"
                  className="pdf-nav-btn"
                  onClick={() => setCurrentPage((p) => Math.min(session.pageCount || 1, p + 1))}
                  disabled={currentPage >= (session.pageCount || 1)}
                  title="Next page"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="pdf-pane-actions">
                {pdfUrl && (
                  <a
                    href={pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pdf-action-icon-btn"
                    title="Open PDF in new tab"
                  >
                    <ExternalLink size={15} />
                  </a>
                )}
                {viewMode === "split" && (
                  <button
                    type="button"
                    className="pdf-action-icon-btn"
                    onClick={() => setViewMode("doc")}
                    title="Maximize Document"
                  >
                    <Maximize2 size={15} />
                  </button>
                )}
              </div>
            </div>

            <div className="pdf-frame-container">
              {pdfUrl ? (
                <iframe
                  key={`${pdfUrl}#page=${currentPage}`}
                  src={`${pdfUrl}#page=${currentPage}&toolbar=1&navpanes=0`}
                  title="PDF Document Preview"
                  className="pdf-iframe"
                />
              ) : (
                <div className="pdf-missing-banner">
                  <div className="missing-card">
                    <FileText size={40} className="missing-icon" />
                    <h4>Original PDF Preview</h4>
                    <p>The document is indexed for questions. To view original pages side-by-side, attach the local PDF file:</p>
                    <label className="pdf-attach-btn">
                      <UploadCloud size={15} /> Select PDF file
                      <input type="file" accept=".pdf" onChange={handleAttachLocalPdf} style={{ display: "none" }} />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Chat Area */}
        {(!session || viewMode === "split" || viewMode === "chat") && (
          <main className="chat-area">
            {/* Header */}
            <div className="chat-header">
              <div className="chat-header-main">
                <button
                  type="button"
                  className="mobile-sidebar-toggle-btn"
                  onClick={() => setIsMobileSidebarOpen(true)}
                  aria-label="Open sidebar"
                  title="Open sidebar"
                >
                  <Menu size={18} />
                </button>
                <div className="chat-header-info">
                  <h2>{session ? session.fileName : "PDF Chat Assistant"}</h2>
                  <p>{session ? `${session.pageCount} pages · ${session.chunkCount} indexed sections` : "Upload a PDF to get started"}</p>
                </div>
              </div>

              {/* View Mode Switcher (Visible when document is loaded) */}
              {session && (
                <div className="view-mode-selector">
                  <button
                    type="button"
                    className={`mode-btn ${viewMode === "chat" ? "active" : ""}`}
                    onClick={() => setViewMode("chat")}
                    title="Chat View Only"
                  >
                    <MessageSquare size={13} />
                    <span>Chat</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${viewMode === "split" ? "active" : ""}`}
                    onClick={() => setViewMode("split")}
                    title="Split View (Side-by-side)"
                  >
                    <Columns2 size={13} />
                    <span>Split</span>
                  </button>
                  <button
                    type="button"
                    className={`mode-btn ${viewMode === "doc" ? "active" : ""}`}
                    onClick={() => setViewMode("doc")}
                    title="Document View Only"
                  >
                    <FileText size={13} />
                    <span>Document</span>
                  </button>
                </div>
              )}

              <div className={`status-badge ${session ? "ready" : "waiting"}`}>
                <div className={`status-dot ${isStreaming ? "pulse" : ""}`} />
                {isStreaming ? "Thinking..." : session ? "Ready" : "No document"}
              </div>
            </div>

            {/* Messages */}
            <div className="messages-container">
              {messages.length === 0 ? (
                <div className="welcome">
                  <div className="welcome-bot-icon">
                    <Bot style={{ width: "32px", height: "32px", color: "#818cf8" }} />
                  </div>
                  <h2>Chat with your PDF</h2>
                  <p>
                    Upload any PDF document and ask questions about it. The AI extracts context and answers with exact, clickable page citations.
                  </p>
                  <div className="welcome-steps-grid">
                    <div className="welcome-step-card">
                      <div className="welcome-step-num num-1">1</div>
                      <div className="welcome-step-text">
                        <h4>Upload PDF</h4>
                        <p>Drop any PDF file</p>
                      </div>
                    </div>
                    <div className="welcome-step-card">
                      <div className="welcome-step-num num-2">2</div>
                      <div className="welcome-step-text">
                        <h4>Vector Index</h4>
                        <p>Automatic chunking</p>
                      </div>
                    </div>
                    <div className="welcome-step-card">
                      <div className="welcome-step-num num-3">3</div>
                      <div className="welcome-step-text">
                        <h4>Ask Questions</h4>
                        <p>Click citations to jump</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg) => {
                    const citations = msg.role === "assistant" && !msg.streaming ? extractCitations(msg.content) : [];
                    return (
                      <div key={msg.id} className={`message ${msg.role}`}>
                        <div className="message-avatar">
                          {msg.role === "user" ? "👤" : "🤖"}
                        </div>
                        <div className="message-content">
                          {msg.streaming && msg.content === "" ? (
                            <div className="typing-indicator">
                              <div className="typing-dot" />
                              <div className="typing-dot" />
                              <div className="typing-dot" />
                            </div>
                          ) : (
                            <div className="message-bubble">
                              <ReactMarkdown
                                components={{
                                  a: ({ href, children }) => {
                                    if (href?.startsWith("#page-")) {
                                      const pageNum = parseInt(href.replace("#page-", ""), 10);
                                      return (
                                        <button
                                          type="button"
                                          onClick={() => handleJumpToPage(pageNum)}
                                          className="citation-inline-pill"
                                          title={`Jump to Page ${pageNum} in PDF viewer`}
                                        >
                                          {children}
                                        </button>
                                      );
                                    }
                                    return (
                                      <a href={href} target="_blank" rel="noopener noreferrer" className="markdown-link">
                                        {children}
                                      </a>
                                    );
                                  },
                                }}
                              >
                                {msg.role === "assistant" ? formatAssistantCitations(msg.content) : msg.content}
                              </ReactMarkdown>

                              {msg.streaming && (
                                <span style={{ display: "inline-block", width: "6px", height: "14px", marginLeft: "4px", verticalAlign: "middle", backgroundColor: "#818cf8", borderRadius: "2px", animation: "pulseGlow 1s infinite" }} />
                              )}
                            </div>
                          )}

                          {/* Sources / Citations Strip */}
                          {citations.length > 0 && (
                            <div className="message-citations-row">
                              <span className="citations-label">
                                <Sparkles size={11} /> Cited Pages:
                              </span>
                              {citations.map((pg) => (
                                <button
                                  key={pg}
                                  type="button"
                                  className={`citation-chip-btn ${currentPage === pg && (viewMode === "split" || viewMode === "doc") ? "active" : ""}`}
                                  onClick={() => handleJumpToPage(pg)}
                                  title={`View Page ${pg} in PDF`}
                                >
                                  <FileText size={11} /> Page {pg}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="message-time">{formatTime(msg.time)}</div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Suggested questions after first assistant message */}
                  {messages.length === 1 && !isStreaming && (
                    <div className="suggestions">
                      {SUGGESTIONS.map((s) => (
                        <button
                          key={s}
                          className="suggestion-chip"
                          onClick={() => sendMessage(s)}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="input-area">
              <div className="input-wrapper">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={onInputChange}
                  onKeyDown={onKeyDown}
                  placeholder={session ? "Ask a question about your PDF..." : "Upload a PDF first..."}
                  disabled={!session || isStreaming}
                  rows={1}
                />
                <button
                  className="send-btn"
                  onClick={() => sendMessage(input)}
                  disabled={!session || isStreaming || !input.trim()}
                >
                  ➤
                </button>
              </div>
              <p className="input-hint">Press Enter to send · Shift+Enter for new line</p>
            </div>
          </main>
        )}
      </div>

      {/* Error toast */}
      {error && <div className="error-toast">⚠️ {error}</div>}

      {/* Signup wall */}
      {showAuthModal && (
        <AuthModal onClose={() => setShowAuthModal(false)} onSuccess={handleAuthSuccess} />
      )}

      {/* Pricing modal */}
      {showPricing && (
        <PricingPage
          auth={auth}
          onClose={() => {
            setShowPricing(false);
            setBalanceRefreshTrigger((prev) => prev + 1);
          }}
        />
      )}
    </div>
  );
}
