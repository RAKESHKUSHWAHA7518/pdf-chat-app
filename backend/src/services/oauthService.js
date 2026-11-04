import crypto from "node:crypto";
import { collections } from "../db/database.js";
import { ApiError } from "../middleware/errorHandler.js";
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
export async function createOAuthState(userId) {
  const state = crypto.randomBytes(32).toString("hex");
  const browserSecret = crypto.randomBytes(32).toString("hex");
  await collections.oauthStates().insertOne({ _id: hash(state), userId, browserHash: hash(browserSecret), expiresAt: new Date(Date.now() + 600000) });
  return { state, browserSecret };
}
export async function consumeOAuthState(state, browserSecret) {
  if (typeof state !== "string" || typeof browserSecret !== "string") throw new ApiError(400, "INVALID_OAUTH_STATE", "Restart GitHub connection");
  const record = await collections.oauthStates().findOneAndDelete({ _id: hash(state), browserHash: hash(browserSecret), expiresAt: { $gt: new Date() } });
  if (!record) throw new ApiError(400, "INVALID_OAUTH_STATE", "GitHub connection expired or was already used");
  return record.userId;
}
