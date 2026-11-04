// src/routes/health.routes.js — Liveness endpoint for load balancers / dashboards.
import { Router } from "express";
import { sessionService } from "../services/sessionService.js";
import { env } from "../config/env.js";
import { pingDatabase, collections } from "../db/database.js";

export const healthRouter = Router();

healthRouter.get("/health", async (req, res) => {
  let mongo = "down";
  try {
    await pingDatabase();
    mongo = "up";
  } catch {
    // keep "down"
  }
  res.status(mongo === "up" ? 200 : 503).json({
    status: mongo === "up" ? "ok" : "degraded",
    mongo,
    uptime: Math.round(process.uptime()),
    activeSessions: sessionService.size,
    timestamp: new Date().toISOString(),
  });
});

// Readiness is separate from database liveness: missing search indexes must be visible.
healthRouter.get("/ready", async (req, res) => {
  try {
    await pingDatabase();
    const indexes = await collections.documents().listSearchIndexes(env.VECTOR_SEARCH_INDEX, { maxTimeMS: 5000 }).toArray();
    const vector = indexes.some(index => index.queryable === true && index.status === "READY");
    const regular = await collections.documents().listIndexes({ maxTimeMS: 5000 }).toArray();
    const keyword = regular.some(index => index.name === "session_lexical");
    res.status(vector && keyword ? 200 : 503).json({ status: vector && keyword ? "ready" : "not_ready", vector, keyword });
  } catch { res.status(503).json({ status: "not_ready", message: "Search readiness could not be verified" }); }
});
