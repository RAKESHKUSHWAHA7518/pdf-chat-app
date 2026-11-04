import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FileText, Search, Trash2, ArrowRight, Upload, Calendar, Clock, ArrowLeft } from "lucide-react";
import { useAuth } from "../hooks/authContext.js";
import { listDocuments, deleteDocument } from "../api";
import { Button, InteractiveCard, Input, Badge } from "../components/ui";

export function DocumentsPage() {
  const { auth, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    let cancelled = false;
    listDocuments(auth).then(docs => { if (!cancelled) setDocuments(docs || []); })
      .catch(err => console.error("Failed to load documents:", err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [auth, isAuthenticated, navigate]);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to permanently delete this document and its vector embeddings?")) return;
    setDeletingId(sessionId);
    try {
      await deleteDocument(auth, sessionId);
      setDocuments((prev) => prev.filter((d) => d.sessionId !== sessionId));
    } catch (err) {
      alert("Failed to delete document: " + err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = documents.filter((d) =>
    d.fileName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 h-full overflow-y-auto py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <Link to="/dashboard/chat-pdf" className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Chat Workspace
          </Link>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Document Library
          </h1>
          <p className="text-xs text-slate-400">
            Saved documents and semantic indexes in your account.
          </p>
        </div>

        <Link to="/dashboard/chat-pdf">
          <Button size="md" variant="primary">
            <Upload className="w-4 h-4 mr-2" /> Upload New PDF
          </Button>
        </Link>
      </div>

      {/* Filter / Search Bar */}
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search documents by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-mono">
          {filteredDocs.length} {filteredDocs.length === 1 ? "document" : "documents"}
        </span>
      </div>

      {/* Document Grid */}
      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading library...</div>
      ) : filteredDocs.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 p-8">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No documents found</h3>
          <p className="text-xs text-slate-400 mb-5">
            {search ? "No documents match your search query." : "Upload your first PDF to begin chatting."}
          </p>
          <Link to="/dashboard/chat-pdf">
            <Button size="sm" variant="primary">
              Open Chat Workspace
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocs.map((doc) => (
            <InteractiveCard
              key={doc.sessionId}
              onClick={() => navigate(`/dashboard/chat-pdf?session=${doc.sessionId}`)}
              className="p-5 flex flex-col justify-between hover:border-indigo-500/50"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, doc.sessionId)}
                    disabled={deletingId === doc.sessionId}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="Delete document"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white tracking-tight truncate mb-1" title={doc.fileName}>
                  {doc.fileName}
                </h3>

                <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                  <span>{doc.pageCount || 1} pages</span>
                  <span>·</span>
                  <span>{doc.chunkCount || 0} chunks</span>
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800 flex items-center justify-between text-xs text-indigo-400 font-medium">
                <span>Resume Chat</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </InteractiveCard>
          ))}
        </div>
      )}
    </div>
  );
}
