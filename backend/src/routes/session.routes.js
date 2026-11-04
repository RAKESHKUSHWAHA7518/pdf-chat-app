import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { HumanMessage, AIMessage } from "@langchain/core/messages";
import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";
import { collections } from "../db/database.js";
import { sessionService } from "../services/sessionService.js";
import { processPdf, rebuildRagChain } from "../services/ragService.js";
import { deleteSessionVectors } from "../lib/vectorStore.js";
import { saveUserDocument } from "../services/documentService.js";
import { authorizeDocument } from "../services/documentAccess.js";
import { reserveGuestUpload, refundGuestUpload, getGuestQuota } from "../services/guestService.js";
import { deductCredit, completeOperation, refundOperation } from "../services/paymentService.js";
import { validate } from "../middleware/validate.js";
import { uploadLimiter, aiLimiter } from "../middleware/rateLimiter.js";
import { ApiError } from "../middleware/errorHandler.js";
const uploadsDir = fileURLToPath(new URL("../../uploads/", import.meta.url));
fs.mkdirSync(uploadsDir, { recursive: true });
const upload = multer({ dest: uploadsDir, limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024, files: 1, fields: 2 }, fileFilter: (req, file, cb) => cb(file.mimetype === "application/pdf" ? null : new ApiError(400, "INVALID_FILE_TYPE", "Only PDFs are supported"), file.mimetype === "application/pdf") });
export const sessionRouter = Router();
sessionRouter.post("/upload", uploadLimiter, upload.single("pdf"), async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, "NO_FILE", "Upload a PDF"));
  const sessionId = sessionService.generateId();
  let deduction, reservation;
  try {
    const handle = await fs.promises.open(req.file.path, "r");
    const magic = Buffer.alloc(5);
    try { await handle.read(magic, 0, 5, 0); } finally { await handle.close(); }
    if (magic.toString() !== "%PDF-") throw new ApiError(400, "INVALID_PDF", "Invalid PDF file");
    if (req.userId) deduction = await deductCredit(req.userId, sessionId, "PDF upload");
    else reservation = await reserveGuestUpload(req.guestId, req.ip);
    const result = await processPdf(sessionId, req.file.path);
    const fileName = path.basename(req.file.originalname).slice(0, 255);
    if (req.userId) {
      await saveUserDocument(req.userId, { sessionId, fileName, pageCount: result.pageCount, chunkCount: result.chunkCount });
      await collections.documents().updateMany({ sessionId }, { $unset: { expiresAt: "" } });
    }
    else await collections.documents().updateMany({ sessionId }, { $set: { expiresAt: new Date(Date.now() + env.SESSION_TTL_MINUTES * 60000) } });
    await completeOperation(deduction?.operationId);
    sessionService.create(sessionId, { ...result, fileName, userId: req.userId || null, guestId: req.guestId, history: [] });
    res.status(201).json({ sessionId, fileName, pageCount: result.pageCount, chunkCount: result.chunkCount, ...(deduction ? { creditsRemaining: deduction.creditsRemaining } : { guestQuota: await getGuestQuota(req.guestId) }) });
  } catch (err) {
    await deleteSessionVectors(sessionId).catch(error => logger.error({ error }, "Vector cleanup pending"));
    await collections.userDocuments().deleteOne({ sessionId, userId: req.userId }).catch(() => {});
    await refundOperation(deduction?.operationId).catch(error => logger.error({ error }, "Credit refund pending recovery"));
    await refundGuestUpload(reservation).catch(error => logger.error({ error }, "Guest refund failed"));
    next(err);
  } finally { await fs.promises.unlink(req.file.path).catch(() => {}); }
});

const chatSchema = z.object({ sessionId: z.string().uuid(), question: z.string().trim().min(1).max(2000) });
sessionRouter.post("/chat", aiLimiter, validate(chatSchema), async (req, res, next) => {
  const { sessionId, question } = req.body;
  let session, lease = false, acquired = false;
  const leaseId = sessionService.generateId();
  const controller = new AbortController();
  const deadline = Date.now() + env.AI_TIMEOUT_MS;
  const onClose = () => { if (!res.writableEnded) controller.abort(); };
  res.on("close", onClose);
  const timer = setTimeout(() => controller.abort(), env.AI_TIMEOUT_MS);
  try {
    const doc = await authorizeDocument(req, sessionId);
    if (doc.userId) {
      const lock = await collections.userDocuments().findOneAndUpdate({ sessionId, userId: req.userId, $or: [{ busyUntil: { $exists: false } }, { busyUntil: { $lt: new Date() } }] }, { $set: { busyUntil: new Date(Date.now() + env.AI_TIMEOUT_MS + 10000), leaseId } }, { returnDocument: "after" });
      if (!lock) throw new ApiError(409, "CHAT_BUSY", "Wait for the current answer to finish");
      lease = true;
    }
    session = sessionService.get(sessionId);
    if (!session) {
      sessionService.create(sessionId, { ...doc, ragChain: rebuildRagChain(sessionId), history: [] });
      session = sessionService.get(sessionId);
    }
    if (session.busy) throw new ApiError(409, "CHAT_BUSY", "Wait for the current answer to finish");
    session.busy = true;
    acquired = true;
    if (doc.userId) session.history = (doc.history || []).map(m => m.role === "user" ? new HumanMessage(m.content) : new AIMessage({ content: m.content, additional_kwargs: { sources: m.sources || [] } }));
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();
    let answer = "";
    const prepared = session.ragChain.prepare ? await session.ragChain.prepare({ question, history: session.history }, { signal: controller.signal, deadline }) : {};
    res.write("data: " + JSON.stringify({ sources: prepared.sources || [], retrieval: prepared.retrieval }) + "\n\n");
    const stream = prepared.insufficientEvidence ? [prepared.evidenceStatus === "verification_unavailable" ? "I could not verify supporting passages right now. Please retry." : "I couldn't find enough supporting information in the document to answer that question."] : await session.ragChain.stream({ question, history: session.history, ...prepared }, { signal: controller.signal });
    for await (const chunk of stream) {
      if (controller.signal.aborted) throw new Error("Generation cancelled");
      answer += chunk;
      res.write("data: " + JSON.stringify({ chunk }) + "\n\n");
    }
    controller.signal.throwIfAborted();
    logger.info({ sessionId, retrieval: prepared.retrieval ? { ...prepared.retrieval, query: undefined } : undefined, answerLength: answer.length }, "RAG response completed");
    session.history.push(new HumanMessage(question), new AIMessage({ content: answer, additional_kwargs: { sources: prepared.sources || [] } }));
    session.history = session.history.slice(-env.MAX_HISTORY_MESSAGES);
    if (doc.userId) await collections.userDocuments().updateOne({ sessionId, userId: req.userId }, { $set: { history: session.history.map(m => ({ role: m._getType() === "human" ? "user" : "assistant", content: m.content, sources: m.additional_kwargs?.sources || [] })) } });
    res.write("data: " + JSON.stringify({ done: true }) + "\n\n");
    res.end();
  } catch (err) {
    if (!res.headersSent) next(err);
    else if (!res.destroyed && !res.writableEnded) { res.write("data: " + JSON.stringify({ error: "Answer interrupted. Please retry." }) + "\n\n"); res.end(); }
    logger.warn({ message: err.message, sessionId }, "Chat failed");
  } finally {
    clearTimeout(timer);
    res.off("close", onClose);
    if (acquired) session.busy = false;
    if (lease) await collections.userDocuments().updateOne({ sessionId, userId: req.userId, leaseId }, { $unset: { busyUntil: "", leaseId: "" } }).catch(err => logger.error({ err }, "Chat lease release failed"));
  }
});
sessionRouter.delete("/session/:id", async (req, res, next) => {
  try {
    await authorizeDocument(req, req.params.id);
    sessionService.delete(req.params.id);
    res.json({ message: "Session cleared" });
  } catch (err) { next(err); }
});
