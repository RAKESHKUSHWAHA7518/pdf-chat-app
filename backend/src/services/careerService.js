// src/services/careerService.js — Resume intelligence, ATS job matching, and GitHub README data extraction.
import pdf from "pdf-parse";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";
import { collections } from "../db/database.js";
import { ApiError } from "../middleware/errorHandler.js";
import { logger } from "../lib/logger.js";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);

/**
 * Extracts plain text from a PDF Buffer.
 * @param {Buffer} buffer
 * @returns {Promise<string>}
 */
export async function extractTextFromPdfBuffer(buffer) {
  try {
    const data = await pdf(buffer);
    return data.text ? data.text.trim() : "";
  } catch (err) {
    logger.error({ err: err.message }, "Failed to parse PDF buffer with pdf-parse");
    throw new ApiError(400, "PDF_PARSE_FAILED", "Could not extract readable text from the uploaded PDF");
  }
}

/**
 * Extracts text from an existing document session stored in MongoDB.
 * @param {string} sessionId
 * @returns {Promise<string>}
 */
export async function extractTextFromSession(sessionId) {
  const chunks = await collections
    .documents()
    .find({ sessionId })
    .project({ text: 1 })
    .toArray();

  if (!chunks || chunks.length === 0) {
    throw new ApiError(404, "SESSION_NOT_FOUND", "Document chunks not found for this session");
  }

  return chunks.map((c) => c.text).join("\n\n");
}

/**
 * Uses Gemini to parse a resume into structured profile data suitable for GitHub README Studio.
 * @param {string} resumeText
 * @returns {Promise<object>}
 */
export async function synthesizeResumeToProfile(resumeText) {
  if (!resumeText || resumeText.length < 50) {
    throw new ApiError(400, "RESUME_TOO_SHORT", "The resume content contains too little text to analyze");
  }

  const model = genAI.getGenerativeModel({
    model: env.GEMINI_CHAT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const prompt = `You are a high-level technical recruiter, career coach, and open-source branding architect.
Analyze the following resume and extract comprehensive details into a structured JSON schema suitable for generating an outstanding GitHub Profile README.

RESUME CONTENT:
"""
${resumeText.slice(0, 30000)}
"""

Extract and return ONLY a JSON object with this exact shape:
{
  "name": "Full Name of Candidate",
  "title": "Professional Title / Headline (e.g. Senior Full-Stack Engineer | AI & Cloud Systems)",
  "bio": "Engaging 2-3 sentence technical bio highlighting core specializations, engineering philosophy, and passions",
  "location": "City, Country (or Remote)",
  "tech": [
    // Array of string tech badges/skills extracted (e.g. ["React", "TypeScript", "Node.js", "Python", "Docker", "MongoDB", "PostgreSQL", "AWS", "Git", "FastAPI", "Go", "Rust"])
  ],
  "projects": [
    // Array of up to 4 significant projects mentioned in the resume
    {
      "title": "Project Name",
      "desc": "1-2 impactful sentences describing what it is, technologies used, and key outcomes or scale",
      "link": "GitHub repo URL if present (or github.com placeholder)",
      "liveUrl": "Live demo, hosted website, or deployment URL if mentioned (or empty string)"
    }
  ],
  "socials": {
    "github": "Extracted GitHub username (or empty string)",
    "linkedin": "Extracted LinkedIn handle/url (or empty string)",
    "twitter": "Extracted Twitter/X handle (or empty string)",
    "portfolio": "Personal portfolio/website URL (or empty string)",
    "email": "Contact email address (or empty string)"
  }
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return parsed;
  } catch (err) {
    logger.error({ err: err.message }, "Gemini synthesis error");
    throw new ApiError(500, "SYNTHESIS_FAILED", "Failed to synthesize resume into profile data");
  }
}

/**
 * Analyzes resume against a target job description (ATS matching + STAR method recommendations).
 * @param {string} resumeText
 * @param {string} jobDescription
 * @returns {Promise<object>}
 */
export async function analyzeAtsMatch(resumeText, jobDescription) {
  if (!resumeText || resumeText.length < 50) {
    throw new ApiError(400, "RESUME_TOO_SHORT", "Resume text is too short");
  }
  if (!jobDescription || jobDescription.length < 30) {
    throw new ApiError(400, "JD_TOO_SHORT", "Job description is too short");
  }

  const model = genAI.getGenerativeModel({
    model: env.GEMINI_CHAT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const prompt = `You are an executive ATS (Applicant Tracking System) algorithm and senior engineering hiring manager.
Compare the candidate's resume with the target job description and provide a realistic, rigorous evaluation.

RESUME:
"""
${resumeText.slice(0, 25000)}
"""

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 15000)}
"""

Return ONLY a JSON object with this exact shape:
{
  "matchScore": 82, // integer between 0 and 100
  "summary": "Brief 2-3 sentence executive assessment of candidate fit",
  "matchedSkills": ["list", "of", "matching", "hard", "skills"],
  "missingKeywords": ["critical", "tools", "or", "skills", "mentioned in JD but missing in resume"],
  "strengths": ["Key strength 1", "Key strength 2", "Key strength 3"],
  "recommendations": [
    {
      "area": "Area of improvement",
      "advice": "Specific actionable suggestion"
    }
  ],
  "starRewrites": [
    // Up to 3 bullet rewrites following the Google STAR method (Situation, Task, Action, Result)
    {
      "original": "Weak/generic bullet point from resume",
      "improved": "Rewritten impactful STAR bullet point with quantifiable metrics"
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (err) {
    logger.error({ err: err.message }, "ATS match analysis error");
    throw new ApiError(500, "ATS_SCAN_FAILED", "Failed to run ATS match scan");
  }
}

/**
 * Uses Gemini to generate a complete high-impact GitHub profile based on target role, tone, and skills.
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function generateGithubProfileAi({ role, tone = "impactful", currentBio = "", name = "Developer", targetFocus = "", customPrompt = "" }) {
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_CHAT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const prompt = `You are a world-class tech career strategist, senior developer advocate, and GitHub profile branding expert.
Generate a compelling, modern, and viral GitHub Profile README content blueprint for a software engineer.

TARGET DETAILS:
- Candidate Name: ${name || "Developer"}
- Target Role / Specialization: ${role || "Full-Stack AI Software Engineer"}
- Tone: ${tone} (impactful, creative, technical, minimalist, or playful)
- Existing Bio / Notes (if any): ${currentBio || "None"}
- Additional Focus / Skills: ${targetFocus || "Modern full-stack, cloud & AI"}

USER'S CUSTOM INSTRUCTIONS / PROMPT:
${customPrompt ? `"""${customPrompt}"""\nCRITICAL INSTRUCTION: Strictly prioritize and tailor the profile to the user's specific prompt above! Reflect their stated background, achievements, niche technologies, and creative requests.` : "No custom prompt provided — generate based on role and tone defaults."}

Return ONLY a JSON object matching this schema:
{
  "title": "A punchy, professional title/headline with high-signal keywords (e.g. 'Senior Full-Stack Engineer | AI Agents & Distributed Cloud')",
  "bio": "An engaging 2-3 sentence technical bio that showcases engineering mindset, current passions, and impact. Avoid generic cliches.",
  "typingLines": [
    "Line 1 for dynamic typewriter typing SVG animation (e.g. 'Full-Stack AI Software Engineer')",
    "Line 2 (e.g. 'Building Autonomous Agents & Next.js Platforms')",
    "Line 3 (e.g. 'Open Source Contributor & Lifelong Learner')"
  ],
  "aboutMe": {
    "workingOn": "Specific project or architecture being built right now",
    "learning": "Cutting-edge tool, framework, or paradigm currently exploring",
    "collaborating": "Kinds of open-source or product initiatives looking to join",
    "askMeAbout": "3-4 technical specialties or domains",
    "funFact": "A witty, interesting developer-related fun fact"
  },
  "suggestedTech": [
    // Array of 6-12 relevant technologies from the prompt or specialization matching:
    // "React", "Next.js", "TypeScript", "JavaScript", "TailwindCSS", "Node.js", "Express",
    // "Python", "FastAPI", "Go", "Rust", "MongoDB", "PostgreSQL", "Docker", "AWS", "Git"
  ],
  "suggestedProjects": [
    {
      "title": "High-impact Project Name matching the prompt",
      "desc": "1-2 sentence description highlighting problem solved, tech stack, and key architecture",
      "link": "https://github.com",
      "liveUrl": "https://demo.app"
    },
    {
      "title": "Second Impressive Project",
      "desc": "1-2 sentence description",
      "link": "https://github.com",
      "liveUrl": "https://demo.app"
    }
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return JSON.parse(text);
  } catch (err) {
    logger.error({ err: err.message }, "Gemini generate profile AI error");
    throw new ApiError(500, "GENERATION_FAILED", "Failed to generate profile with AI");
  }
}

/**
 * Polishes or enhances an individual bio or title with Gemini.
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function enhanceBioAi({ text, role = "Developer", mode = "bio" }) {
  if (!text || text.trim().length === 0) {
    throw new ApiError(400, "TEXT_REQUIRED", "Please provide text to enhance");
  }

  const model = genAI.getGenerativeModel({
    model: env.GEMINI_CHAT_MODEL,
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.6,
    },
  });

  const prompt = `You are a top tech recruiter and GitHub branding specialist.
Rewrite and elevate the following ${mode === "title" ? "developer headline/title" : "short developer bio"} into a high-impact, professional, and engaging version.
Context Role: ${role}

ORIGINAL TEXT:
"${text}"

Return JSON:
{
  "enhanced": "The polished, modern, high-impact text",
  "alternatives": [
    "Alternative 1 with a different punchy tone",
    "Alternative 2 with a more technical tone"
  ]
}`;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (err) {
    logger.error({ err: err.message }, "Gemini enhance bio AI error");
    throw new ApiError(500, "ENHANCE_FAILED", "Failed to enhance text with AI");
  }
}

