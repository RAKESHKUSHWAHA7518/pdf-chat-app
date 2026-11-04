import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { aiLimiter } from "../middleware/rateLimiter.js";
import { ApiError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { runBillable } from "../services/operationService.js";
import { extractTextFromPdfBuffer, extractTextFromSession, analyzeAtsMatch, generateDiagramAi } from "../services/careerService.js";

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1, fields: 12, fieldSize: 50000 }, fileFilter: (req, file, cb) => cb(file.mimetype === "application/pdf" ? null : new ApiError(400, "INVALID_FILE_TYPE", "Only PDFs are supported"), file.mimetype === "application/pdf") });
export const careerRouter = Router();
careerRouter.use(requireAuth, aiLimiter);
const text = z.string().trim().max(30000);
const schema = z.object({ sessionId: z.string().uuid().optional(), resumeText: text.optional(), jobDescription: text.optional(), role: text.optional(), tone: text.optional(), currentBio: text.optional(), name: text.optional(), targetFocus: text.optional(), customPrompt: text.optional(), text: text.optional(), mode: text.optional(), prompt: text.optional(), diagramType: text.optional(), theme: text.optional(), companyName: text.optional(), candidateName: text.optional() });
async function resume(req, data) {
  let value;
  if (req.file) {
    if (req.file.buffer.subarray(0, 5).toString() !== "%PDF-") throw new ApiError(400, "INVALID_PDF", "Invalid PDF file");
    value = await extractTextFromPdfBuffer(req.file.buffer);
  } else if (data.sessionId) value = await extractTextFromSession(data.sessionId, req.userId);
  else value = data.resumeText;
  if (!value || value.trim().length < 50) throw new ApiError(400, "RESUME_TOO_SHORT", "Provide at least 50 characters of readable resume text");
  return value.slice(0, 30000);
}
function endpoint(path, description, prepare) {
  careerRouter.post(path, upload.single("resume"), async (req, res, next) => {
    try {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) throw new ApiError(400, "INVALID_INPUT", "Invalid input or text exceeds 30,000 characters");
      const action = await prepare(req, parsed.data);
      const { result, deduction } = await runBillable(req.userId, description, action);
      res.json({ success: true, ...result, creditsRemaining: deduction.creditsRemaining, subscription: deduction.subscription });
    } catch (err) { next(err); }
  });
}

endpoint("/ats-scan", "ATS scan", async (req, data) => {
  if (!data.jobDescription || data.jobDescription.length < 30) throw new ApiError(400, "MISSING_JD", "Job description is required");
  const value = await resume(req, data);
  return async () => ({ analysis: await analyzeAtsMatch(value, data.jobDescription) });
});



endpoint("/generate-diagram", "Diagram generation", async (req, data) => {
  if (!data.prompt) throw new ApiError(400, "MISSING_PROMPT", "Describe the diagram to generate");
  return () => generateDiagramAi(data);
});
