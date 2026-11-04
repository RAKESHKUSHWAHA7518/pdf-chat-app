import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { runBillable } from "../services/operationService.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { createOAuthState, consumeOAuthState } from "../services/oauthService.js";
import {
  getGithubStatus,
  linkGithubWithToken,
  unlinkGithub,
  listUserRepositories,
  generateRepoReadme,
  commitRepoReadme,
} from "../services/githubService.js";

export const githubRouter = Router();

const tokenSchema = z.object({
  token: z.string().trim().min(10, "Personal Access Token is required"),
});


const generateRepoSchema = z.object({
  repoUrl: z.string().min(3, "Repository URL or owner/repo is required").max(300),
  customInstructions: z.string().max(30000).optional(),
  tone: z.string().max(30000).optional(),
});

const commitRepoSchema = z.object({
  repoOwner: z.string().min(1, "Repository owner is required"),
  repoName: z.string().min(1, "Repository name is required"),
  branch: z.string().max(30000).optional(),
  markdownContent: z.string().min(1, "Markdown content cannot be empty"),
  commitMessage: z.string().max(30000).optional(),
});

// GET /api/github/status — Check if user has linked GitHub
githubRouter.get("/status", requireAuth, async (req, res, next) => {
  try {
    const status = await getGithubStatus(req.userId);
    res.json(status);
  } catch (err) {
    next(err);
  }
});

// GET /api/github/oauth/url — Returns GitHub OAuth authorize URL if configured
githubRouter.get("/oauth/url", requireAuth, async (req, res, next) => {
  try {
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET || !env.GITHUB_TOKEN_KEY) return res.json({ available: false, message: "GitHub OAuth is not configured" });
    const { state, browserSecret } = await createOAuthState(req.userId);
    res.cookie("github_oauth", browserSecret, { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", maxAge: 600000, path: "/api/github/oauth" });
    const url = new URL("https://github.com/login/oauth/authorize");
    url.search = new URLSearchParams({ client_id: env.GITHUB_CLIENT_ID, redirect_uri: env.PUBLIC_URL + "/api/github/oauth/callback", scope: "repo,user:email", state }).toString();
    res.json({ available: true, url: url.toString() });
  } catch (err) { next(err); }
});
githubRouter.get("/oauth/callback", async (req, res) => {
  try {
    const cookie = (req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith("github_oauth="))?.slice(13);
    if (typeof req.query.code !== "string") throw new Error("Missing code");
    const userId = await consumeOAuthState(req.query.state, cookie);
    res.clearCookie("github_oauth", { path: "/api/github/oauth" });
    const response = await fetch("https://github.com/login/oauth/access_token", { method: "POST", signal: AbortSignal.timeout(15000), headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ client_id: env.GITHUB_CLIENT_ID, client_secret: env.GITHUB_CLIENT_SECRET, code: req.query.code, redirect_uri: env.PUBLIC_URL + "/api/github/oauth/callback" }) });
    const token = await response.json();
    if (!response.ok || !token.access_token) throw new Error("OAuth exchange failed");
    await linkGithubWithToken(userId, token.access_token);
    res.redirect("/dashboard/settings?github=connected");
  } catch { res.redirect("/dashboard/settings?github=error&message=Please+restart+GitHub+connection"); }
});

// GET /api/github/repos — Get user's repositories if GitHub connected
githubRouter.get("/repos", requireAuth, async (req, res, next) => {
  try {
    const repos = await listUserRepositories(req.userId);
    res.json({ success: true, repos });
  } catch (err) {
    next(err);
  }
});

// POST /api/github/connect-token — Connect via GitHub Personal Access Token (PAT)
githubRouter.post("/connect-token", requireAuth, validate(tokenSchema), async (req, res, next) => {
  try {
    const { token } = req.body;
    const result = await linkGithubWithToken(req.userId, token);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/github/disconnect — Unlink GitHub account
githubRouter.post("/disconnect", requireAuth, async (req, res, next) => {
  try {
    const result = await unlinkGithub(req.userId);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/github/commit-readme — 1-Click push to user's profile repository


// POST /api/github/generate-repo-readme — Inspects repo & generates full README.md
githubRouter.post("/generate-repo-readme", requireAuth, aiLimiter, validate(generateRepoSchema), async (req, res, next) => {
  try {
    const { repoUrl, customInstructions, tone } = req.body;

    const { result, deduction } = await runBillable(req.userId, "Repository README", () => generateRepoReadme({ userId: req.userId, repoUrl, customInstructions, tone }));

    res.json({
      success: true,
      ...result,
      creditsRemaining: deduction.creditsRemaining,
      subscription: deduction.subscription,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/github/commit-repo-readme — Commits README to specified repository
githubRouter.post("/commit-repo-readme", requireAuth, validate(commitRepoSchema), async (req, res, next) => {
  try {
    const result = await commitRepoReadme(req.userId, req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});
