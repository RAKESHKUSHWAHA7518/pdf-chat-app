// src/routes/career.routes.js — Resume-to-README and ATS Matching endpoints.
import { Router } from "express";
import multer from "multer";
import { z } from "zod";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errorHandler.js";
import { deductCredit } from "../services/paymentService.js";
import {
  extractTextFromPdfBuffer,
  extractTextFromSession,
  synthesizeResumeToProfile,
  analyzeAtsMatch,
} from "../services/careerService.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new ApiError(400, "INVALID_FILE_TYPE", "Only PDF resumes are supported"));
  },
});

export const careerRouter = Router();

/**
 * POST /api/career/resume-to-readme
 * Synthesizes a resume into structured GitHub profile data.
 * Consumes 1 credit (or free for Pro members).
 */
careerRouter.post("/resume-to-readme", requireAuth, upload.single("resume"), async (req, res, next) => {
  try {
    let resumeText = "";

    if (req.file) {
      resumeText = await extractTextFromPdfBuffer(req.file.buffer);
    } else if (req.body.sessionId) {
      resumeText = await extractTextFromSession(req.body.sessionId);
    } else if (req.body.resumeText) {
      resumeText = String(req.body.resumeText).trim();
    } else {
      throw new ApiError(400, "MISSING_INPUT", "Please upload a resume PDF, select an existing document, or paste resume text");
    }

    // Deduct 1 credit (or check Pro subscription)
    const deduction = await deductCredit(
      req.userId,
      "resume_to_readme",
      "Resume to GitHub README Synthesis"
    );

    const profileData = await synthesizeResumeToProfile(resumeText);

    res.json({
      success: true,
      profileData,
      creditsRemaining: deduction.creditsRemaining,
      subscription: deduction.subscription,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/career/ats-scan
 * Matches resume against a job description with ATS score and STAR recommendations.
 * Consumes 1 credit (or free for Pro members).
 */
careerRouter.post("/ats-scan", requireAuth, upload.single("resume"), async (req, res, next) => {
  try {
    let resumeText = "";
    const jobDescription = String(req.body.jobDescription || "").trim();

    if (!jobDescription) {
      throw new ApiError(400, "MISSING_JD", "Job description is required for ATS comparison");
    }

    if (req.file) {
      resumeText = await extractTextFromPdfBuffer(req.file.buffer);
    } else if (req.body.sessionId) {
      resumeText = await extractTextFromSession(req.body.sessionId);
    } else if (req.body.resumeText) {
      resumeText = String(req.body.resumeText).trim();
    } else {
      throw new ApiError(400, "MISSING_INPUT", "Please upload a resume PDF, select an existing document, or paste resume text");
    }

    const deduction = await deductCredit(
      req.userId,
      "ats_scan",
      "ATS Resume Matcher Scan"
    );

    const analysis = await analyzeAtsMatch(resumeText, jobDescription);

    res.json({
      success: true,
      analysis,
      creditsRemaining: deduction.creditsRemaining,
      subscription: deduction.subscription,
    });
  } catch (err) {
    next(err);
  }
});
