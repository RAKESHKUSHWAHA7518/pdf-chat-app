import { LandingPage, LoginPage, SignupPage, PricingPage, DocsPage, DocumentsPage, SettingsPage, AtsMatcher, RepoDocsPage, DiagramStudio, App } from "./lazyPages.jsx";
import { Suspense } from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthProvider } from "../hooks/useAuth.jsx";
import { PublicLayout, AuthLayout, AppLayout } from "../components/layout/PageLayout";
import { DashboardLayout } from "../components/layout/DashboardLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <AuthProvider><Suspense fallback={<div role="status" className="p-8 text-slate-300">Loading…</div>}>
        <LandingPage />
      </Suspense></AuthProvider>
    ),
  },
  {
    element: (
      <AuthProvider><Suspense fallback={<div role="status" className="p-8 text-slate-300">Loading…</div>}>
        <PublicLayout />
      </Suspense></AuthProvider>
    ),
    children: [
      { path: "pricing", element: <PricingPage /> },
      { path: "docs", element: <DocsPage /> },
      {
        path: "privacy",
        element: (
          <div className="max-w-3xl mx-auto py-16 px-4 space-y-6 text-slate-300">
            <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
            <p className="text-sm leading-relaxed">
              Your document privacy is fundamental to our service. When you upload a PDF for analysis, the contents are processed solely to generate semantic chunks and vector embeddings to answer your questions.
            </p>
            <p className="text-sm leading-relaxed">
              We never sell your data or use your confidential documents to train public AI foundation models.
            </p>
          </div>
        ),
      },
      {
        path: "terms",
        element: (
          <div className="max-w-3xl mx-auto py-16 px-4 space-y-6 text-slate-300">
            <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
            <p className="text-sm leading-relaxed">
              By using PDFChat, you agree not to upload copyrighted content you do not have permission to analyze, malicious scripts, or restricted classified documents.
            </p>
            <p className="text-sm leading-relaxed">
              Service is provided as-is with 99.9% uptime target for paid subscribers.
            </p>
          </div>
        ),
      },
    ],
  },
  {
    element: (
      <AuthProvider><Suspense fallback={<div role="status" className="p-8 text-slate-300">Loading…</div>}>
        <AuthLayout />
      </Suspense></AuthProvider>
    ),
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "signup", element: <SignupPage /> },
    ],
  },
  {
    path: "/app",
    element: <Navigate to="/dashboard/chat-pdf" replace />,
  },
  {
    path: "/app/documents",
    element: <Navigate to="/dashboard/documents" replace />,
  },
  {
    path: "/app/settings",
    element: <Navigate to="/dashboard/settings" replace />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthProvider><Suspense fallback={<div role="status" className="p-8 text-slate-300">Loading…</div>}>
        <DashboardLayout />
      </Suspense></AuthProvider>
    ),
    children: [
      { index: true, element: <Navigate to="/dashboard/chat-pdf" replace /> },
      { path: "github-studio", element: <Navigate to="/dashboard/chat-pdf" replace /> },
      { path: "resume-to-readme", element: <Navigate to="/dashboard/chat-pdf" replace /> },
      { path: "cover-letter", element: <Navigate to="/dashboard/chat-pdf" replace /> },
      { path: "ats-matcher", element: <AtsMatcher /> },
      { path: "repo-docs", element: <RepoDocsPage /> },
      { path: "diagrams", element: <DiagramStudio /> },
      { path: "chat-pdf", element: <App /> },
      { path: "documents", element: <DocumentsPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  {
    path: "/settings",
    element: (
      <AuthProvider><Suspense fallback={<div role="status" className="p-8 text-slate-300">Loading…</div>}>
        <PublicLayout />
      </Suspense></AuthProvider>
    ),
    children: [
      { index: true, element: <SettingsPage /> },
    ],
  },
]);
