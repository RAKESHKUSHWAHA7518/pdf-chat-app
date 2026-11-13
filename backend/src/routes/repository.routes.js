import { Router } from "express";
import { z } from "zod";
import { env } from "../config/env.js";
import { collections, withTransaction } from "../db/database.js";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { ApiError } from "../middleware/errorHandler.js";
import { createOAuthState, consumeOAuthState } from "../services/oauthService.js";
import { workspaceConfigured, connectWorkspace, workspaceClient, installations } from "../services/repository/connection.js";
import { authorizeWorkspace, publicWorkspace, queueImport, refreshWorkspace, reserveRepositoryBudget } from "../services/repository/workspace.js";
import { answerRepositoryQuestion } from "../services/repository/chat.js";

export const repositoryRouter = Router();
const route = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(err => {
  if (err instanceof z.ZodError) return next(new ApiError(400,"VALIDATION_ERROR","Invalid request parameters"));
  if (err.name === "HttpError") return next(new ApiError(err.status === 401 ? 401 : 503,"GITHUB_UNAVAILABLE","GitHub access is unavailable. Reconnect or try again later."));
  next(err);
});
const cookieOptions = { httpOnly: true, secure: env.NODE_ENV === "production", sameSite: "lax", maxAge: 600000, path: "/api/repositories/oauth" };
repositoryRouter.get("/oauth/callback", route(async (req, res) => {
  try {
    const cookie = (req.headers.cookie || "").split(";").map(v => v.trim()).find(v => v.startsWith("workspace_oauth="))?.slice("workspace_oauth=".length);
    const userId = await consumeOAuthState(req.query.state, cookie, "workspace");
    if (typeof req.query.code !== "string") throw new Error("Missing code");
    const response = await fetch("https://github.com/login/oauth/access_token", { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json" }, body: JSON.stringify({ client_id: env.GITHUB_WORKSPACE_CLIENT_ID, client_secret: env.GITHUB_WORKSPACE_CLIENT_SECRET, code: req.query.code, redirect_uri: env.PUBLIC_URL + "/api/repositories/oauth/callback" }), signal: AbortSignal.timeout(15000) });
    const data = await response.json();
    if (!response.ok || !data.access_token) throw new Error("Exchange failed");
    await connectWorkspace(userId, data.access_token);
    res.clearCookie("workspace_oauth", cookieOptions);
    res.redirect(env.PUBLIC_URL + "/dashboard/github-workspace?connection=success");
  } catch { res.clearCookie("workspace_oauth", cookieOptions); res.redirect(env.PUBLIC_URL + "/dashboard/github-workspace?connection=failed"); }
}));
repositoryRouter.use(requireAuth);
repositoryRouter.get("/connection", route(async (req, res) => {
  const user = await collections.users().findOne({ _id: req.userId }, { projection: { "workspaceGithub.login": 1 } });
  res.json({ configured: workspaceConfigured(), login: user?.workspaceGithub?.login || null, installUrl: env.GITHUB_WORKSPACE_INSTALL_URL || null });
}));
repositoryRouter.get("/oauth/url", route(async (req, res) => {
  if (!workspaceConfigured()) throw new ApiError(503, "NOT_CONFIGURED", "The administrator must configure the read-only GitHub App first");
  const { state, browserSecret } = await createOAuthState(req.userId, "workspace");
  res.cookie("workspace_oauth", browserSecret, cookieOptions);
  const url = new URL("https://github.com/login/oauth/authorize");
  url.search = new URLSearchParams({ client_id: env.GITHUB_WORKSPACE_CLIENT_ID, redirect_uri: env.PUBLIC_URL + "/api/repositories/oauth/callback", state }).toString();
  res.json({ url: url.toString() });
}));
repositoryRouter.delete("/connection", route(async (req, res) => {
  await collections.users().updateOne({ _id: req.userId }, { $unset: { workspaceGithub: "" } }); res.json({ disconnected: true });
}));
repositoryRouter.get("/repositories", route(async (req, res) => {
  const client = await workspaceClient(req.userId); const available = [];
  for (const installation of await installations(client)) {
    const repos = await client.paginate("GET /user/installations/{installation_id}/repositories", { installation_id: installation.id, per_page: 100 });
    available.push(...repos.map(repo => ({ installationId: installation.id, repositoryId: repo.id, name: repo.full_name, branch: repo.default_branch })));
  }
  res.json({ repositories: available });
}));
repositoryRouter.get("/workspaces", route(async (req, res) => {
  const rows = await collections.repoWorkspaces().find({ userId: req.userId }).sort({ createdAt: -1 }).limit(20).toArray();
  res.json({ workspaces: rows.map(publicWorkspace) });
}));
repositoryRouter.post("/workspaces", aiLimiter, route(async (req, res) => {
  const selection = z.object({ installationId: z.number().int().positive(), repositoryId: z.number().int().positive(), branch: z.string().trim().min(1).max(200).optional(), consent: z.literal(true) }).parse(req.body);
  if (await collections.repoWorkspaces().countDocuments({ userId: req.userId }) >= 3) throw new ApiError(409, "WORKSPACE_LIMIT", "Keep up to three workspaces; delete one before importing another");
  res.status(202).json(await queueImport(req.userId, selection));
}));
repositoryRouter.get("/workspaces/:id", route(async (req, res) => {
  const { workspace } = await authorizeWorkspace(req.userId, req.params.id);
  const snapshot = workspace.activeSnapshotId ? await collections.repoSnapshots().findOne({ _id: workspace.activeSnapshotId, workspaceId: workspace._id, status: "completed" }, { projection: { coverage: 1, commitSha: 1, completedAt: 1, coverageTruncated: 1 } }) : null;
  res.json({ ...publicWorkspace(workspace), snapshot });
}));
repositoryRouter.post("/workspaces/:id/refresh", aiLimiter, route(async (req, res) => { await refreshWorkspace(req.userId, req.params.id); res.status(202).json({ queued: true }); }));
repositoryRouter.get("/workspaces/:id/file", route(async (req,res) => {
  const path = z.string().min(1).max(1000).parse(req.query.path);
  const {workspace} = await authorizeWorkspace(req.userId,req.params.id);
  if(!workspace.activeSnapshotId) throw new ApiError(409,"NOT_READY","No completed snapshot");
  const chunks = await collections.repoChunks().find({sessionId:workspace.activeSnapshotId,"metadata.path":path},{projection:{text:1,metadata:1}}).sort({"metadata.startLine":1}).limit(4000).toArray();
  res.json({commitSha:workspace.indexedSha,path,chunks:chunks.map(chunk=>({text:chunk.text,startLine:chunk.metadata.startLine,endLine:chunk.metadata.endLine}))});
}));
repositoryRouter.delete("/workspaces/:id", route(async (req, res) => {
  // Local deletion remains available after GitHub access is revoked.
  await withTransaction(async session => {
    const workspace = await collections.repoWorkspaces().findOneAndDelete({ _id: req.params.id, userId: req.userId }, { session });
    if (!workspace) throw new ApiError(404, "NOT_FOUND", "Workspace not found");
    const snapshots = await collections.repoSnapshots().find({ workspaceId: workspace._id }, { session, projection: { _id: 1 } }).toArray();
    await collections.repoChunks().deleteMany({ sessionId: { $in: snapshots.map(s => s._id) } }, { session });
    await collections.repoSnapshots().deleteMany({ workspaceId: workspace._id }, { session });
  }); res.json({ deleted: true });
}));
repositoryRouter.post("/workspaces/:id/chat", aiLimiter, route(async (req, res) => {
  const { question } = z.object({ question: z.string().trim().min(1).max(2000) }).parse(req.body);
  const { workspace } = await authorizeWorkspace(req.userId, req.params.id);
  if (!workspace.activeSnapshotId) throw new ApiError(409, "NOT_READY", "Wait for a completed import");
  await reserveRepositoryBudget(req.userId,"questions",100);
  const answer = await answerRepositoryQuestion(workspace, question);
  await authorizeWorkspace(req.userId, req.params.id); // Recheck access before returning private evidence.
  res.json(answer);
}));
