// src/routes/github.routes.js — GitHub status, token connection, and README commit endpoints.
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  getGithubStatus,
  linkGithubWithToken,
  unlinkGithub,
  commitProfileReadme,
} from "../services/githubService.js";

export const githubRouter = Router();

const tokenSchema = z.object({
  token: z.string().trim().min(10, "Personal Access Token is required"),
});

const commitSchema = z.object({
  markdownContent: z.string().min(1, "Markdown content cannot be empty"),
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
