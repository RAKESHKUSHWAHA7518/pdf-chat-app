import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { deductCredit } from "../services/paymentService.js";
import {
  getGithubStatus,
  linkGithubWithToken,
  unlinkGithub,
  commitProfileReadme,
  listUserRepositories,
  generateRepoReadme,
  commitRepoReadme,
} from "../services/githubService.js";

export const githubRouter = Router();

const tokenSchema = z.object({
  token: z.string().trim().min(10, "Personal Access Token is required"),
});

const commitSchema = z.object({
  markdownContent: z.string().min(1, "Markdown content cannot be empty"),
});

const generateRepoSchema = z.object({
  repoUrl: z.string().min(3, "Repository URL or owner/repo is required"),
  customInstructions: z.string().optional(),
  tone: z.string().optional(),
});

const commitRepoSchema = z.object({
  repoOwner: z.string().min(1, "Repository owner is required"),
  repoName: z.string().min(1, "Repository name is required"),
  branch: z.string().optional(),
  markdownContent: z.string().min(1, "Markdown content cannot be empty"),
  commitMessage: z.string().optional(),
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
githubRouter.get("/oauth/url", requireAuth, (req, res) => {
  if (!env.GITHUB_CLIENT_ID) {
    return res.json({
      available: false,
      message: "GitHub OAuth client ID is not configured. Connect with Personal Access Token instead.",
    });
  }
  const redirectUri = `${req.protocol}://${req.get("host")}/api/github/oauth/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=repo,user:email&state=${req.userId}`;
  res.json({ available: true, url });
});

// GET /api/github/oauth/callback — Handles GitHub OAuth redirect and exchanges code for access token
githubRouter.get("/oauth/callback", async (req, res) => {
  const { code, state: userId } = req.query;
  if (!code || !userId) {
    return res.redirect("/dashboard/settings?github=error&message=Missing+authorization+code");
  }
  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        client_id: env.GITHUB_CLIENT_ID,
        client_secret: env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });
    const tokenData = await tokenRes.json();
    if (tokenData.access_token) {
      await linkGithubWithToken(userId, tokenData.access_token);
      return res.redirect("/dashboard/settings?github=connected");
    }
    return res.redirect(
      "/dashboard/settings?github=error&message=" +
        encodeURIComponent(tokenData.error_description || "OAuth failed")
    );
  } catch (err) {
    return res.redirect(
      "/dashboard/settings?github=error&message=" + encodeURIComponent(err.message)
    );
  }
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
githubRouter.post("/commit-readme", requireAuth, validate(commitSchema), async (req, res, next) => {
  try {
    const { markdownContent } = req.body;
    const result = await commitProfileReadme(req.userId, markdownContent);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// POST /api/github/generate-repo-readme — Inspects repo & generates full README.md
githubRouter.post("/generate-repo-readme", requireAuth, validate(generateRepoSchema), async (req, res, next) => {
  try {
    const { repoUrl, customInstructions, tone } = req.body;

    const deduction = await deductCredit(
      req.userId,
      "repo_readme",
      `Generate Repository README for ${repoUrl}`
    );

    const result = await generateRepoReadme({
      userId: req.userId,
      repoUrl,
      customInstructions,
      tone,
    });

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

