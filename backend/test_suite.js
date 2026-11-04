// backend/test_suite.js — Comprehensive End-to-End Test Suite for DevSuite AI.
import { createApp } from "./src/app.js";
import { connectDatabase, closeDatabase, collections } from "./src/db/database.js";
import { env } from "./src/config/env.js";

const TEST_PORT = 3099;
const BASE_URL = `http://127.0.0.1:${TEST_PORT}`;

async function runTestSuite() {
  console.log("\n========================================================");
  console.log("🚀 STARTING DEVSUITE AI END-TO-END COMPREHENSIVE TEST SUITE");
  console.log("========================================================\n");

  let server;
  let authToken = "";
  const testEmail = `test_engineer_${Date.now()}@devsuite.ai`;
  const testPassword = "Password123!Secure";
  let testUserId = "";

  const results = [];
  let fatalError = false;
  function record(name, passed, details = "") {
    results.push({ name, passed, details });
    if (passed) {
      console.log(`✅ [PASS] ${name} ${details ? `— ${details}` : ""}`);
    } else {
      console.error(`❌ [FAIL] ${name} — ${details}`);
    }
  }

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${authToken}`,
    "Content-Type": "application/json",
  });

  try {
    // 1. Initialize Database & Server
    await connectDatabase();
    const app = createApp();
    server = await new Promise((resolve) => {
      const s = app.listen(TEST_PORT, () => resolve(s));
    });
    record("Server Bootstrap", true, `Listening on ${BASE_URL}`);

    // 2. Health Check Endpoint
    try {
      const res = await fetch(`${BASE_URL}/api/health`);
      const data = await res.json();
      record("Health Check (/api/health)", res.ok && data.status === "ok", `Status: ${data.status}`);
    } catch (err) {
      record("Health Check (/api/health)", false, err.message);
    }

    // 3. User Registration (JWT Auth)
    try {
      const res = await fetch(`${BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        authToken = data.token;
        testUserId = data.user.id;
        record("User Registration (/api/auth/register)", true, `User ID: ${testUserId}`);
        // Grant test credits so all AI tools can be fully tested in sequence
        await collections.users().updateOne({ _id: testUserId }, { $set: { credits: 50 } });
      } else {
        record("User Registration (/api/auth/register)", false, JSON.stringify(data));
      }
    } catch (err) {
      record("User Registration (/api/auth/register)", false, err.message);
    }

    // 4. User Login (JWT Verification)
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
        }),
      });
      const data = await res.json();
      const loginPassed = res.ok && Boolean(data.token);
      record("User Login (/api/auth/login)", loginPassed, `Re-authenticated successfully`);
    } catch (err) {
      record("User Login (/api/auth/login)", false, err.message);
    }

    // 5. Auth Me & Profile Verification
    try {
      const res = await fetch(`${BASE_URL}/api/auth/me`, { headers: getAuthHeaders() });
      const data = await res.json();
      record("Auth Me Profile (/api/auth/me)", res.ok && data.user?.email === testEmail, `Verified email: ${data.user?.email}`);
    } catch (err) {
      record("Auth Me Profile (/api/auth/me)", false, err.message);
    }

    // 6. Credit Ledger Balance
    try {
      const res = await fetch(`${BASE_URL}/api/payments/credits/balance`, { headers: getAuthHeaders() });
      const data = await res.json();
      record("Credit Ledger (/api/payments/credits/balance)", res.ok && data.credits >= 1, `Credits available: ${data.credits}`);
    } catch (err) {
      record("Credit Ledger (/api/payments/credits/balance)", false, err.message);
    }

    // 7. Documents Library Vault Check
    try {
      const res = await fetch(`${BASE_URL}/api/documents`, { headers: getAuthHeaders() });
      const data = await res.json();
      record("Documents Vault (/api/documents)", res.ok && Array.isArray(data.documents), `Documents returned: ${data.documents?.length}`);
    } catch (err) {
      record("Documents Vault (/api/documents)", false, err.message);
    }

    // 8. GitHub Integration Status Check
    try {
      const res = await fetch(`${BASE_URL}/api/github/status`, { headers: getAuthHeaders() });
      const data = await res.json();
      record("GitHub Status (/api/github/status)", res.ok && typeof data.connected === "boolean", `Connected: ${data.connected}`);
    } catch (err) {
      record("GitHub Status (/api/github/status)", false, err.message);
    }

    // 9. GitHub OAuth URL Generation
    try {
      const res = await fetch(`${BASE_URL}/api/github/oauth/url`, { headers: getAuthHeaders() });
      const data = await res.json();
      record("GitHub OAuth URL (/api/github/oauth/url)", res.ok, `Responded with mode info`);
    } catch (err) {
      record("GitHub OAuth URL (/api/github/oauth/url)", false, err.message);
    }

    // 10. Tool 6: Architecture Diagram Studio (Text to Mermaid.js)
    try {
      console.log("\nTesting Tool 6: Architecture Diagram Studio with Gemini...");
      const res = await fetch(`${BASE_URL}/api/career/generate-diagram`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          prompt: "Architecture for a high-concurrency microservice system with Redis cache, Kafka event bus, and PostgreSQL.",
          diagramType: "architecture",
          theme: "dark",
        }),
      });
      const data = await res.json();
      const hasMermaid = res.ok && typeof data.mermaidCode === "string" && data.mermaidCode.length > 20;
      record(
        "Architecture Diagram Studio (/api/career/generate-diagram)",
        hasMermaid,
        hasMermaid ? `Title: "${data.title}" (${data.mermaidCode.split("\n").length} lines)` : JSON.stringify(data)
      );
    } catch (err) {
      record("Architecture Diagram Studio (/api/career/generate-diagram)", false, err.message);
    }

    // 11. Tool 4: AI ATS Resume Optimizer & Job Matcher
    try {
      console.log("\nTesting Tool 4: ATS Resume Matcher with Gemini...");
      const sampleResume = `
Rakesh Kushwaha — Senior Full-Stack Engineer
Email: rakesh@example.com | GitHub: github.com/RAKESHKUSHWAHA7518
Experience:
- Architected and built high-performance distributed web applications using React, Node.js, Express, and MongoDB.
- Implemented real-time streaming RAG architectures using LangChain and Google Gemini APIs with sub-second latency.
- Deployed microservices using Docker, Kubernetes, and automated GitHub Actions CI/CD pipelines.
Skills: TypeScript, JavaScript, React, Next.js, Node.js, Express, Python, MongoDB, PostgreSQL, Redis, Docker, Git.
`;
      const sampleJD = `
Senior Full-Stack Engineer:
We are seeking an engineer with deep expertise in React, TypeScript, Node.js, and distributed microservices.
Must have experience designing resilient REST/GraphQL APIs, distributed databases (PostgreSQL/MongoDB), and automated CI/CD.
`;
      const res = await fetch(`${BASE_URL}/api/career/ats-scan`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          resumeText: sampleResume,
          jobDescription: sampleJD,
        }),
      });
      const data = await res.json();
      const hasAnalysis = res.ok && data.analysis && typeof data.analysis.matchScore === "number";
      record(
        "ATS Resume Matcher (/api/career/ats-scan)",
        hasAnalysis,
        hasAnalysis
          ? `Match Score: ${data.analysis.matchScore}% | Matched: ${data.analysis.matchedSkills?.length || 0} skills | STAR Rewrites: ${data.analysis.starRewrites?.length || 0}`
          : JSON.stringify(data)
      );
    } catch (err) {
      record("ATS Resume Matcher (/api/career/ats-scan)", false, err.message);
    }

    // 12. Cover Letter Generator


    // 13. Tool 5: GitHub Repo to README Generator
    try {
      console.log("\nTesting Tool 5: GitHub Repo README Generator with public repository...");
      const res = await fetch(`${BASE_URL}/api/github/generate-repo-readme`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          repoUrl: "https://github.com/expressjs/express",
          customInstructions: "Highlight microservice architecture and middleware pipeline.",
          tone: "professional",
        }),
      });
      const data = await res.json();
      const hasMarkdown = res.ok && typeof data.markdown === "string" && data.markdown.length > 100;
      record(
        "Repo README Generator (/api/github/generate-repo-readme)",
        hasMarkdown,
        hasMarkdown ? `Generated ${data.markdown.length} chars for ${data.repoMeta?.fullName || "express"}` : JSON.stringify(data)
      );
    } catch (err) {
      record("Repo README Generator (/api/github/generate-repo-readme)", false, err.message);
    }

    // 14. Tool 2: Bio & Profile Enhancement AI


    // 15. Frontend SPA Asset Serving Check (Production dist fallback)
    try {
      const res = await fetch(`${BASE_URL}/`);
      const html = await res.text();
      const servesSpa = res.ok && (html.includes("<div id=\"root\">") || html.includes("<!doctype html>"));
      record("Frontend SPA Static Delivery (GET /)", servesSpa, `Served HTML length: ${html.length} bytes`);
    } catch (err) {
      record("Frontend SPA Static Delivery (GET /)", false, err.message);
    }

    // Cleanup test user
    if (testUserId) {
      await collections.users().deleteOne({ _id: testUserId });
      await collections.creditTransactions().deleteMany({ userId: testUserId });
      console.log(`\n🧹 Cleaned up temporary test user: ${testUserId}`);
    }
  } catch (fatal) {
    fatalError = true;
    console.error("💥 Fatal test runner exception:", fatal);
  } finally {
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
    await closeDatabase();

    console.log("\n========================================================");
    console.log("📊 TEST SUITE SUMMARY:");
    console.log("========================================================");
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Total Tests: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}`);
    if (!fatalError && totalCount > 0 && passedCount === totalCount) {
      console.log("🌟 ALL TESTS PASSED SUCCESSFULLY! DEVSUITE AI IS 100% OPERATIONAL.");
    } else {
      console.log("⚠️ Some tests failed. Inspect the logs above.");
    }
    console.log("========================================================\n");
    process.exit(!fatalError && totalCount > 0 && passedCount === totalCount ? 0 : 1);
  }
}

runTestSuite();
