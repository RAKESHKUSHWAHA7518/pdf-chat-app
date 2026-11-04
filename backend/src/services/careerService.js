import { atsSchema, diagramSchema } from "./aiSchemas.js";
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
export async function extractTextFromSession(sessionId, userId) {
  if (typeof sessionId !== "string" || !userId || !(await collections.userDocuments().findOne({ sessionId, userId }))) {
    throw new ApiError(404, "DOCUMENT_NOT_FOUND", "Document not found");
  }
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
      maxOutputTokens: 4096,
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
    const result = await model.generateContent(prompt, { timeout: env.AI_TIMEOUT_MS });
    const text = result.response.text();
    return atsSchema.parse(JSON.parse(text));
  } catch (err) {
    logger.error({ err: err.message }, "ATS match analysis error");
    throw new ApiError(500, "ATS_SCAN_FAILED", "Failed to run ATS match scan");
  }
}


/**
 * Uses Gemini to generate Mermaid.js architecture diagrams and explanations from natural language prompts.
 * @param {object} params
 * @returns {Promise<object>}
 */
export async function generateDiagramAi({ prompt, diagramType = "architecture", theme = "dark" }) {
  if (!prompt || prompt.trim().length === 0) {
    throw new ApiError(400, "PROMPT_REQUIRED", "Please describe the system architecture or flow you want to diagram");
  }

  const model = genAI.getGenerativeModel({
    model: env.GEMINI_CHAT_MODEL,
    generationConfig: {
      maxOutputTokens: 4096,
      responseMimeType: "application/json",
      temperature: 0.2,
    },
  });

  const aiPrompt = `You are a Principal Cloud & Software Systems Architect.
Generate a high-clarity, syntactically correct Mermaid.js diagram and detailed architecture explanation based on the user's prompt.

USER REQUEST:
"${prompt.slice(0, 4000)}"

DIAGRAM TYPE: ${diagramType} (options: architecture, flowchart, sequence, cloud, microservices, auth, erDiagram)
DESIRED THEME: ${theme}

STRICT MERMAID RULES:
1. Always start with a valid Mermaid directive: e.g. \`flowchart TD\`, \`flowchart LR\`, or \`sequenceDiagram\`.
2. Wrap all node titles/labels containing spaces, parentheses, brackets, or punctuation in DOUBLE QUOTES! Example:
   A["Client Browser (React SPA)"] --> B["API Gateway (Express / Rate Limiter)"]
3. Never use raw parentheses or brackets inside unquoted labels (e.g. A[Client (React)] will crash Mermaid; MUST BE A["Client (React)"]).
4. Organize complex systems into logical \`subgraph\` containers (e.g. subgraph "Frontend Layer", subgraph "Microservices Cluster", subgraph "Data Persistence").
5. Use directional arrows with semantic protocol labels: e.g. -->|"HTTPS / JWT"|, -->|"gRPC"|, -->|"SQL Query"|, -->|"Pub/Sub Event"|.
6. Include subtle modern styling classes (classDef) if applicable.

Return ONLY a JSON object matching this schema:
{
  "title": "Clear Diagram Title",
  "mermaidCode": "Valid multi-line Mermaid diagram definition string",
  "explanation": "Executive 2-3 paragraph breakdown of the architecture, data flow, and components",
  "components": [
    {
      "name": "Component Name (e.g. API Gateway)",
      "role": "Brief description of its role in this architecture"
    }
  ],
  "recommendations": [
    "High availability or scalability recommendation 1",
    "Security or caching recommendation 2"
  ]
}`;

  try {
    const result = await model.generateContent(aiPrompt, { timeout: env.AI_TIMEOUT_MS });
    const parsed = diagramSchema.parse(JSON.parse(result.response.text()));
    return parsed;
  } catch (err) {
    logger.error({ err: err.message }, "Gemini generateDiagramAi error");
    throw new ApiError(500, "DIAGRAM_FAILED", "Failed to generate architecture diagram");
  }
}
