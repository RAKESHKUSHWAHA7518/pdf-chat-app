// src/server.js — Process bootstrap + database init + graceful shutdown.
import { recoverAbandonedOperations } from "./services/paymentService.js";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { connectDatabase, ensureIndexes, ensureVectorSearchIndex, closeDatabase } from "./db/database.js";
import { probeEmbeddingDimensions } from "./services/ragService.js";
import { sessionService } from "./services/sessionService.js";
import { startRepositoryWorker } from "./services/repository/workspace.js";

const app = createApp();
let server;
let stopRepositoryWorker = () => {};

async function main() {
  // 1. Database must be up before we accept traffic (fail fast otherwise)
  await connectDatabase();
  await ensureIndexes();
  stopRepositoryWorker = startRepositoryWorker();
  await recoverAbandonedOperations();
  setInterval(() => recoverAbandonedOperations().catch(err => logger.error({ err }, "Operation recovery failed")), 60000).unref();

  // 2. Vector search index (auto-detect embedding size, create if missing)
  try {
    const dimensions = await probeEmbeddingDimensions();
    logger.info({ model: env.GEMINI_EMBEDDING_MODEL, dimensions }, "Embedding model ready");
    await ensureVectorSearchIndex(dimensions);
  } catch (err) {
    logger.warn({ err }, "Could not verify embedding model / vector index — chat retrieval may fail until fixed");
  }

  // 3. Start accepting traffic
  server = app.listen(env.PORT, () => {
    logger.info(
      { port: env.PORT, nodeEnv: env.NODE_ENV, healthCheck: `http://localhost:${env.PORT}/api/health` },
      "PDF Chat API started"
    );
  });
}

// ─────────────────────────────────────────────
// Graceful shutdown — finish in-flight requests, then exit
// ─────────────────────────────────────────────
function shutdown(signal) {
  stopRepositoryWorker();
  logger.info({ signal }, "Shutdown signal received, draining connections");
  const close = server ? new Promise((resolve) => server.close(resolve)) : Promise.resolve();
  close.then(async () => {
    sessionService.shutdown();
    await closeDatabase();
    logger.info("Shutdown complete");
    process.exit(0);
  });
  // Force exit if connections linger
  setTimeout(() => {
    logger.warn("Forcing shutdown after timeout");
    process.exit(1);
  }, 10_000).unref();
}

process.on("unhandledRejection", (reason) => {
  logger.fatal({ reason }, "Unhandled rejection; restarting");
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  logger.fatal({ err }, "Uncaught exception; restarting");
  shutdown("uncaughtException");
});

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

main().catch((err) => {
  logger.fatal({ err }, "Fatal error during startup");
  process.exit(1);
});
