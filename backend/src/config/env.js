// src/config/env.js — Centralized, validated environment configuration.
// The app fails fast at startup if required config is missing or invalid.
import dotenv from "dotenv";
import { z } from "zod";

if (process.env.NODE_ENV !== "test") dotenv.config({ path: new URL("../../.env", import.meta.url) });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  CORS_ORIGIN: z.string().default("http://localhost:5173"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  PUBLIC_URL: z.string().url().default("http://localhost:3001"),
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(5).default(0),
  GITHUB_TOKEN_KEY: z.preprocess(v => v === "" ? undefined : v, z.string().regex(/^[a-fA-F0-9]{64}$/).optional()),
  MAX_PDF_PAGES: z.coerce.number().int().positive().default(200),
  MAX_PDF_CHUNKS: z.coerce.number().int().positive().default(2000),
  AI_TIMEOUT_MS: z.coerce.number().int().positive().default(120000),
  RAG_CANDIDATES: z.coerce.number().int().min(4).max(40).default(20),
  RAG_CONTEXT_CHARS: z.coerce.number().int().min(1000).max(30000).default(12000),
  // Auth
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  GUEST_FREE_UPLOADS: z.coerce.number().int().positive().default(1),

  // MongoDB (Atlas cloud, or local Atlas deployment via docker compose)
  MONGODB_URI: z.string().default("mongodb://localhost:27017"),
  MONGODB_DB: z.string().default("pdf_chat"),
  VECTOR_SEARCH_INDEX: z.string().default("vector_index"),

  // Gemini / models
  GEMINI_API_KEY: z.string().min(1, "GEMINI_API_KEY is required"),
  GEMINI_CHAT_MODEL: z.string().default("gemini-2.5-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-2"),

  // Uploads
  MAX_FILE_SIZE_MB: z.coerce.number().int().positive().default(10),

  // Sessions
  SESSION_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  MAX_HISTORY_MESSAGES: z.coerce.number().int().positive().default(20),

  // Rate limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
  UPLOAD_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(10),

  // Razorpay Payments
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  RAZORPAY_PLAN_PRO_MONTHLY: z.string().optional(),
  RAZORPAY_PLAN_PRO_YEARLY: z.string().optional(),
  RAZORPAY_CREDITS_PACK_10_AMOUNT: z.coerce.number().int().positive().default(29900),
  RAZORPAY_CREDITS_PACK_50_AMOUNT: z.coerce.number().int().positive().default(129900),
  RAZORPAY_CREDITS_PACK_100_AMOUNT: z.coerce.number().int().positive().default(229900),
  RAZORPAY_PRO_MONTHLY_AMOUNT: z.coerce.number().int().positive().default(29900),
  RAZORPAY_PRO_YEARLY_AMOUNT: z.coerce.number().int().positive().default(299900),

  // GitHub OAuth (optional)
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment configuration:");
  console.error(JSON.stringify(parsed.error.flatten().fieldErrors, null, 2));
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
