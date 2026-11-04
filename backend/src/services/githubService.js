import { Octokit } from "@octokit/rest";
import crypto from "node:crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { collections } from "../db/database.js";
import { env } from "../config/env.js";
import { ApiError } from "../middleware/errorHandler.js";
import { logger } from "../lib/logger.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

// Derive 32-byte encryption key from JWT_SECRET for AES-256-CBC
const ENCRYPTION_KEY = env.GITHUB_TOKEN_KEY ? Buffer.from(env.GITHUB_TOKEN_KEY, "hex") : null;


function encryptToken(plainText) {
  if (!ENCRYPTION_KEY) throw new ApiError(503, "GITHUB_NOT_CONFIGURED", "GitHub encryption key is not configured");
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainText, "utf8", "hex");
  encrypted += cipher.final("hex");
  return `v2:${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted}`;
}

function decryptToken(encryptedText) {
  if (!encryptedText) return null;
  if (!ENCRYPTION_KEY || !encryptedText.startsWith("v2:")) throw new ApiError(409, "GITHUB_RECONNECT_REQUIRED", "Please reconnect GitHub after the security update");
  const [, ivHex, tagHex, cipherHex] = encryptedText.split(":");
  if (!ivHex || !cipherHex) return null;
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", ENCRYPTION_KEY, iv);
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let decrypted = decipher.update(cipherHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/** Check GitHub connection status for a user */
export async function getGithubStatus(userId) {
  const user = await collections.users().findOne(
    { _id: userId },
    { projection: { githubUsername: 1, githubAvatar: 1, githubConnectedAt: 1, githubToken: 1 } }
  );

  return {
    connected: Boolean(user?.githubUsername && user?.githubToken?.startsWith("v2:") && env.GITHUB_TOKEN_KEY),
    reconnectRequired: Boolean(user?.githubToken && !user.githubToken.startsWith("v2:")),
    githubUsername: user?.githubUsername || null,
    avatarUrl: user?.githubAvatar || null,
    connectedAt: user?.githubConnectedAt || null,
  };
}

/** Link GitHub account using a Personal Access Token (PAT) */
export async function linkGithubWithToken(userId, token) {
  if (!ENCRYPTION_KEY) throw new ApiError(503, "GITHUB_NOT_CONFIGURED", "GitHub encryption key is not configured");
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


/** Parses GitHub URL into owner and repository name */
export function parseGithubUrl(raw) {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.trim().replace(/\.git$/, "").replace(/\/$/, "");
  const match = cleaned.match(/(?:github\.com\/)?([^/\s]+)\/([^/\s]+)/);
  if (match) {
    return { owner: match[1], repo: match[2] };
  }
  return null;
}

/** List user's linked GitHub repositories */
export async function listUserRepositories(userId) {
  const user = await collections.users().findOne({ _id: userId });
  if (!user || !user.githubToken) {
    return [];
  }
  const token = decryptToken(user.githubToken);
  if (!token) return [];

  const octokit = new Octokit({ auth: token });
  try {
    const res = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "updated",
      per_page: 30,
      direction: "desc",
    });
    return res.data.map((r) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      htmlUrl: r.html_url,
      description: r.description,
      language: r.language,
      stars: r.stargazers_count,
      forks: r.forks_count,
      updatedAt: r.updated_at,
      defaultBranch: r.default_branch,
    }));
  } catch (err) {
    logger.warn({ err: err.message }, "Could not list user repositories from GitHub");
    return [];
  }
}

/**
 * Inspects a GitHub repository and generates a comprehensive, production-grade README.md via Gemini.
 */
export async function generateRepoReadme({ userId, repoUrl, customInstructions = "", tone = "professional" }) {
  const parsed = parseGithubUrl(repoUrl);
  if (!parsed) {
    throw new ApiError(400, "INVALID_REPO_URL", "Please provide a valid GitHub repository URL (e.g. https://github.com/owner/repo or owner/repo)");
  }

  const { owner, repo } = parsed;

  let octokit;
  if (userId) {
    const user = await collections.users().findOne({ _id: userId });
    if (user?.githubToken) {
      const token = decryptToken(user.githubToken);
      if (token) octokit = new Octokit({ auth: token });
    }
  }
  if (!octokit) {
    octokit = new Octokit({ userAgent: "DevSuite-AI/1.0.0" });
  }

  // 1. Fetch Repository Metadata
  let repoData;
  try {
    const metaRes = await octokit.rest.repos.get({ owner, repo });
    repoData = metaRes.data;
  } catch (err) {
    logger.error({ err: err.message, owner, repo }, "Failed to fetch repository metadata from GitHub");
    if (err.status === 404) {
      throw new ApiError(404, "REPO_NOT_FOUND", `GitHub repository '${owner}/${repo}' not found or is private.`);
    }
    throw new ApiError(err.status || 500, "GITHUB_API_ERROR", err.message || "Failed to inspect repository.");
  }

  // 2. Fetch Root Directory Structure
  let fileTree = [];
  try {
    const contentsRes = await octokit.rest.repos.getContent({ owner, repo, path: "" });
    if (Array.isArray(contentsRes.data)) {
      fileTree = contentsRes.data.map((item) => `${item.type === "dir" ? "📁 " : "📄 "}${item.name}`);
    }
  } catch (err) {
    logger.warn({ err: err.message }, "Could not fetch repo root directory tree");
  }

  // 3. Inspect Manifest / Config files (e.g. package.json, requirements.txt)
  let packageJsonSummary = "";
  try {
    const pkgRes = await octokit.rest.repos.getContent({ owner, repo, path: "package.json" });
    if (pkgRes.data?.content) {
      const decoded = Buffer.from(pkgRes.data.content, "base64").toString("utf-8");
      const parsedPkg = JSON.parse(decoded);
      packageJsonSummary = `Package Name: ${parsedPkg.name || ""}
Description: ${parsedPkg.description || ""}
Scripts: ${Object.keys(parsedPkg.scripts || {}).join(", ")}
Main Dependencies: ${Object.keys(parsedPkg.dependencies || {}).slice(0, 15).join(", ")}
Dev Dependencies: ${Object.keys(parsedPkg.devDependencies || {}).slice(0, 10).join(", ")}`;
    }
  } catch {}

  let existingReadmeSnippet = "";
  try {
    const rmRes = await octokit.rest.repos.getContent({ owner, repo, path: "README.md" });
    if (rmRes.data?.content) {
      existingReadmeSnippet = Buffer.from(rmRes.data.content, "base64").toString("utf-8").slice(0, 2500);
    }
  } catch {}

  // 4. Generate README via Gemini 2.5 Flash
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_CHAT_MODEL,
    generationConfig: {
      temperature: 0.3,
    },
  });

  const prompt = `You are a Principal Software Architect and Technical Writer at a top-tier tech company.
Generate an extraordinary, comprehensive, production-grade GitHub \`README.md\` for the following repository.

REPOSITORY CONTEXT:
- Name: ${repoData.name}
- Full Name: ${repoData.full_name}
- Description: ${repoData.description || "Open source software project"}
- Primary Language: ${repoData.language || "Not specified"}
- Topics/Tags: ${(repoData.topics || []).join(", ") || "None"}
- Default Branch: ${repoData.default_branch || "main"}
- License: ${repoData.license?.spdx_id || "MIT"}
- Stars: ${repoData.stargazers_count} | Forks: ${repoData.forks_count}

REPOSITORY FILE STRUCTURE:
${fileTree.length > 0 ? fileTree.join("\n") : "Standard repository layout"}

${packageJsonSummary ? `MANIFEST (package.json):\n${packageJsonSummary}\n` : ""}
${existingReadmeSnippet ? `EXISTING NOTES / README SNIPPET:\n"""\n${existingReadmeSnippet}\n"""\n` : ""}
${customInstructions ? `USER'S SPECIAL INSTRUCTIONS:\n"""\n${customInstructions}\n"""\n` : ""}

REQUIREMENTS FOR THE GENERATED README:
1. Header with sleek Badges (using shields.io for build, license, stars, tech stack).
2. Catchy Project Title and an inspiring 1-2 paragraph Executive Summary explaining the exact problem it solves and its target audience.
3. ✨ Key Features (bulleted with expressive emojis and bold titles).
4. 🏗️ Architecture & Data Flow Diagram (clean Mermaid.js flowchart or sequence block).
5. 🛠️ Tech Stack Table or Categorized List (Frontend, Backend, Database, Cloud/DevOps, Tools).
6. 🚀 Getting Started Guide:
   - Prerequisites (Node.js/Python/Docker versions)
   - Step-by-step Installation commands
   - Environment Variables configuration table with sample defaults
   - How to Run in Development and Production
7. 📁 Project Structure (ASCII directory tree showing purpose of main folders).
8. 🔌 API Endpoints or Usage Examples (code blocks demonstrating usage).
9. 🤝 Contributing Guidelines & Code of Conduct note.
10. 📄 License section.
11. Footer viral badge:
\`\`\`markdown
[![Powered by DevSuite AI](https://img.shields.io/badge/Documented%20with-DevSuite%20AI-6366f1?style=for-the-badge&logo=sparkles)](https://devsuite.ai)
\`\`\`

Tone: ${tone}.
IMPORTANT: Output ONLY the complete raw Markdown for README.md. Do not include markdown code block backticks (\`\`\`markdown) wrapping the entire response. Start directly with the title / shields.`;

  try {
    const result = await model.generateContent(prompt, { timeout: env.AI_TIMEOUT_MS });
    let markdown = result.response.text();
    // Clean up if model wrapped with ```markdown ... ```
    if (markdown.startsWith("```markdown")) {
      markdown = markdown.replace(/^```markdown\n?/, "").replace(/\n?```$/, "");
    } else if (markdown.startsWith("```md")) {
      markdown = markdown.replace(/^```md\n?/, "").replace(/\n?```$/, "");
    }

    return {
      success: true,
      markdown,
      repoMeta: {
        name: repoData.name,
        fullName: repoData.full_name,
        description: repoData.description,
        stars: repoData.stargazers_count,
        language: repoData.language,
        htmlUrl: repoData.html_url,
        defaultBranch: repoData.default_branch,
      },
    };
  } catch (err) {
    logger.error({ err: err.message }, "Gemini repo README generation failed");
    throw new ApiError(500, "GENERATION_FAILED", "Failed to generate repository README: " + err.message);
  }
}

/** Commit README.md to any specified repository (if user has permissions) */
export async function commitRepoReadme(userId, { repoOwner, repoName, branch = "main", markdownContent, commitMessage = "docs: update README.md via DevSuite AI" }) {
  if (!markdownContent || typeof markdownContent !== "string") {
    throw new ApiError(400, "INVALID_CONTENT", "Markdown content is required");
  }

  const user = await collections.users().findOne({ _id: userId });
  if (!user || !user.githubToken) {
    throw new ApiError(400, "GITHUB_NOT_CONNECTED", "Please connect your GitHub account with repository write permissions.");
  }

  const token = decryptToken(user.githubToken);
  if (!token) {
    throw new ApiError(500, "TOKEN_DECRYPTION_FAILED", "Could not decrypt GitHub token. Please reconnect.");
  }

  const octokit = new Octokit({ auth: token });
  const path = "README.md";

  // Check if file exists to get SHA
  let sha;
  try {
    const existingFile = await octokit.rest.repos.getContent({
      owner: repoOwner,
      repo: repoName,
      path,
      ref: branch,
    });
    sha = existingFile.data?.sha;
  } catch (err) {
    if (err.status !== 404) {
      logger.warn({ err: err.message }, "Error checking existing repo README SHA");
    }
  }

  try {
    const contentEncoded = Buffer.from(markdownContent, "utf-8").toString("base64");
    const commitResult = await octokit.rest.repos.createOrUpdateFileContents({
      owner: repoOwner,
      repo: repoName,
      path,
      branch,
      message: commitMessage,
      content: contentEncoded,
      sha,
      committer: {
        name: "DevSuite Studio",
        email: "studio@devsuite.ai",
      },
    });

    return {
      success: true,
      commitSha: commitResult.data.commit.sha,
      rawUrl: commitResult.data.content?.html_url || `https://github.com/${repoOwner}/${repoName}/blob/${branch}/README.md`,
    };
  } catch (err) {
    logger.error({ err: err.message }, "Failed to commit README to repository");
    throw new ApiError(err.status || 500, "COMMIT_FAILED", err.message || "Failed to commit README to repository.");
  }
}

