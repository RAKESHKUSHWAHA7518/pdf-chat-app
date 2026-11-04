// src/app.js — Express application assembly (kept separate for testability).
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { sessionRouter } from "./routes/session.routes.js";
import { documentRouter } from "./routes/document.routes.js";
import { paymentRouter } from "./routes/payment.routes.js";
import { githubRouter } from "./routes/github.routes.js";
import { careerRouter } from "./routes/career.routes.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { optionalAuth, guestIdentity } from "./middleware/auth.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, "../../frontend/dist");

export function createApp() {
  const app = express();
  app.set("trust proxy", env.TRUST_PROXY_HOPS);

  // Security headers — relax CSP to allow React client assets & fonts
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://checkout.razorpay.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "blob:", "https:"],
          connectSrc: ["'self'", "https://api.razorpay.com", new URL(env.PUBLIC_URL).origin],
          frameSrc: ["'self'", "blob:", "https://api.razorpay.com", "https://checkout.razorpay.com"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: env.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
    })
  );

  // CORS — allow configured origins and same-origin requests
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        const allowedOrigins = (env.CORS_ORIGIN || "*").split(",").map((o) => o.trim());
        if (allowedOrigins.includes(origin) || origin === new URL(env.PUBLIC_URL).origin) {
          return callback(null, true);
        }
        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use(express.json({ limit: "1mb", verify: (req, res, buffer) => { if (req.path === "/api/payments/webhook") req.rawBody = buffer; } }));

  // Structured request logging
  app.use(
    pinoHttp({
      logger,
      autoLogging: { ignore: (req) => req.url === "/api/health" },
    })
  );

  // Rate limiting on all API routes
  app.use("/api", apiLimiter);

  // Attach req.userId when a valid JWT is present (all /api routes)
  app.use("/api", optionalAuth);
  app.use("/api", guestIdentity);

// API Routes
  app.use("/api", healthRouter);
  app.use("/api/auth", authRouter);
  app.use("/api", documentRouter);
  app.use("/api", sessionRouter);
  app.use("/api/payments", paymentRouter);
  app.use("/api/github", githubRouter);
  app.use("/api/career", careerRouter);

  // Serve React Frontend static assets if dist exists
  if (fs.existsSync(frontendDist)) {
    app.use(express.static(frontendDist));

    // Wildcard fallback for Single Page Application client routing
    app.get("*", (req, res, next) => {
      if (req.path.startsWith("/api")) {
        return next();
      }
      res.sendFile(path.join(frontendDist, "index.html"), (err) => {
        if (err) next();
      });
    });
  }

  // 404 + centralized error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
