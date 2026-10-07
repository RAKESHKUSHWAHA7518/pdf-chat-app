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
      "link": "URL or github placeholder"
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
