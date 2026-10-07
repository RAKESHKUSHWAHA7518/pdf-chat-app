// src/services/githubService.js — GitHub integration: token encryption, profile repo management, Octokit commits.
import { Octokit } from "@octokit/rest";
import crypto from "node:crypto";
import { collections } from "../db/database.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
import { logger } from "../lib/logger.js";

// Derive 32-byte encryption key from JWT_SECRET for AES-256-CBC
const ENCRYPTION_KEY = crypto.createHash("sha256").update(env.JWT_SECRET).digest();
const IV_LENGTH = 16;

function encryptToken(plainText) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `${iv.toString("hex")}:${encrypted}`;
}

function decryptToken(encryptedText) {
  if (!encryptedText) return null;
  const [ivHex, cipherHex] = encryptedText.split(":");
  if (!ivHex || !cipherHex) return null;
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/** Check GitHub connection status for a user */
export async function getGithubStatus(userId) {
  const user = await collections.users().findOne(
    { _id: userId },
    { projection: { githubUsername: 1, githubAvatar: 1, githubConnectedAt: 1 } }
  );

  return {
    connected: Boolean(user?.githubUsername),
    githubUsername: user?.githubUsername || null,
    avatarUrl: user?.githubAvatar || null,
    connectedAt: user?.githubConnectedAt || null,
  };
}

/** Link GitHub account using a Personal Access Token (PAT) */
export async function linkGithubWithToken(userId, token) {
  const cleanToken = token.trim();
  const octokit = new Octokit({ auth: cleanToken });

  let githubUser;
  try {
    const res = await octokit.rest.users.getAuthenticated();
    githubUser = res.data;
  } catch (err) {
    logger.warn({ err: err.message }, "Invalid GitHub token provided");
    throw new ApiError(400, "INVALID_GITHUB_TOKEN", "Invalid GitHub Personal Access Token or insufficient permissions.");
  }

  const encrypted = encryptToken(cleanToken);

  await collections.users().updateOne(
    { _id: userId },
    {
      $set: {
        githubToken: encrypted,
        githubUsername: githubUser.login,
        githubAvatar: githubUser.avatar_url,
        githubConnectedAt: new Date(),
      },
    }
  );

  logger.info({ userId, githubUsername: githubUser.login }, "GitHub account linked");

  return {
    success: true,
    githubUsername: githubUser.login,
    avatarUrl: githubUser.avatar_url,
  };
}

/** Unlink GitHub account */
export async function unlinkGithub(userId) {
  await collections.users().updateOne(
    { _id: userId },
    {
      $unset: { githubToken: "", githubUsername: "", githubAvatar: "", githubConnectedAt: "" },
    }
  );
  logger.info({ userId }, "GitHub account unlinked");
  return { success: true };
}

/** Publish/Commit README.md to username/username special repository */
export async function commitProfileReadme(userId, markdownContent) {
  if (!markdownContent || typeof markdownContent !== "string") {
    throw new ApiError(400, "INVALID_CONTENT", "Markdown content is required");
  }

  const user = await collections.users().findOne({ _id: userId });
  if (!user || !user.githubToken || !user.githubUsername) {
    throw new ApiError(400, "GITHUB_NOT_CONNECTED", "GitHub account is not connected. Please connect your GitHub account first.");
  }

  const token = decryptToken(user.githubToken);
  if (!token) {
    throw new ApiError(500, "TOKEN_DECRYPTION_FAILED", "Failed to retrieve GitHub credentials. Please reconnect your account.");
  }

  const octokit = new Octokit({ auth: token });
  const username = user.githubUsername;
  const repoName = username; // GitHub special profile repository name is identical to username
  const path = "README.md";

  // 1. Verify if username/username repository exists; if not, create it as public
  let repoExists = true;
  try {
    await octokit.rest.repos.get({ owner: username, repo: repoName });
  } catch (err) {
    if (err.status === 404) {
      repoExists = false;
    } else {
      throw new ApiError(err.status || 500, "GITHUB_API_ERROR", err.message);
    }
  }

  if (!repoExists) {
    try {
      logger.info({ username, repoName }, "Creating special profile repository");
      await octokit.rest.repos.createForAuthenticatedUser({
        name: repoName,
        description: `${username}'s GitHub Profile README`,
        auto_init: true,
        private: false, // Profile repos MUST be public to display on GitHub profile
      });
      // Short delay for GitHub repository provisioning
      await new Promise((resolve) => setTimeout(resolve, 2000));
    } catch (err) {
      logger.error({ err: err.message }, "Failed to create profile repository");
      throw new ApiError(500, "REPO_CREATION_FAILED", `Could not initialize repository '${repoName}': ${err.message}`);
    }
  }

  // 2. Fetch existing README.md SHA if it exists
  let sha;
  try {
    const existingFile = await octokit.rest.repos.getContent({
      owner: username,
      repo: repoName,
      path,
    });
    sha = existingFile.data?.sha;
  } catch (err) {
    if (err.status !== 404) {
      logger.warn({ err: err.message }, "Error inspecting existing README.md SHA");
    }
  }

  // 3. Commit README.md (Base64 encoded)
  try {
    const contentEncoded = Buffer.from(markdownContent, "utf-8").toString("base64");
    const commitResult = await octokit.rest.repos.createOrUpdateFileContents({
      owner: username,
      repo: repoName,
      path,
      message: "✨ Update GitHub Profile README via DevSuite Studio",
      content: contentEncoded,
      sha, // If defined, updates; if undefined, creates
      committer: {
        name: "DevSuite Studio",
        email: "studio@devsuite.ai",
      },
    });

    logger.info({ username, commitSha: commitResult.data.commit.sha }, "Profile README committed successfully");

    return {
      success: true,
      commitSha: commitResult.data.commit.sha,
      profileUrl: `https://github.com/${username}`,
      rawUrl: commitResult.data.content?.html_url || `https://github.com/${username}/${repoName}/blob/main/README.md`,
    };
  } catch (err) {
    logger.error({ err: err.message }, "Failed to commit README to GitHub");
    if (err.status === 409) {
      throw new ApiError(409, "GITHUB_CONFLICT", "Conflict detected. The README was modified elsewhere on GitHub. Please retry.");
    }
    throw new ApiError(err.status || 500, "GITHUB_COMMIT_FAILED", err.message || "Failed to commit README to GitHub.");
  }
}
