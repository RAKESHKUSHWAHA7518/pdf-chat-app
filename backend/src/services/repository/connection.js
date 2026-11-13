import { Octokit } from "@octokit/rest";
import { collections } from "../../db/database.js";
import { env } from "../../config/env.js";
import { encryptToken, decryptToken } from "../githubService.js";
import { ApiError } from "../../middleware/errorHandler.js";
export const workspaceConfigured = () => Boolean(env.GITHUB_WORKSPACE_APP_ID && env.GITHUB_WORKSPACE_CLIENT_ID && env.GITHUB_WORKSPACE_CLIENT_SECRET && env.GITHUB_TOKEN_KEY);
export function userClient(token) { return new Octokit({ auth: token, request: { timeout: 15000 } }); }
export async function installations(client) {
  const result = await client.paginate("GET /user/installations", { per_page: 100 });
  const rows = Array.isArray(result) ? result : result.installations;
  return rows.filter(item => String(item.app_id) === env.GITHUB_WORKSPACE_APP_ID && !item.suspended_at && item.permissions?.contents === "read" && Object.values(item.permissions || {}).every(value => value !== "write" && value !== "admin"));
}
export async function connectWorkspace(userId, token) {
  if (!workspaceConfigured()) throw new ApiError(503, "WORKSPACE_NOT_CONFIGURED", "GitHub Workspace App is not configured");
  const client = userClient(token);
  const account = (await client.rest.users.getAuthenticated()).data;
  await installations(client); // A legacy OAuth/PAT token cannot silently substitute for an App user token.
  await collections.users().updateOne({ _id: userId }, { $set: { workspaceGithub: { token: encryptToken(token), login: account.login } } });
}
export async function workspaceClient(userId) {
  const user = await collections.users().findOne({ _id: userId }, { projection: { workspaceGithub: 1 } });
  if (!user?.workspaceGithub?.token) throw new ApiError(401, "WORKSPACE_CONNECT_REQUIRED", "Connect the read-only GitHub App first");
  return userClient(decryptToken(user.workspaceGithub.token));
}
export async function allowedRepository(client, installationId, repositoryId) {
  if (!(await installations(client)).some(item => item.id === installationId)) throw new ApiError(403, "REPOSITORY_FORBIDDEN", "GitHub installation access is unavailable");
  const repositories = await client.paginate("GET /user/installations/{installation_id}/repositories", { installation_id: installationId, per_page: 100 });
  const repo = repositories.find(item => item.id === repositoryId);
  if (!repo) throw new ApiError(403, "REPOSITORY_FORBIDDEN", "Repository access is unavailable");
  return repo;
}
