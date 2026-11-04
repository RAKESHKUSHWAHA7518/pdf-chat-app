// src/db/database.js — MongoDB connection, collections, and index management.
//
// Data model:
//   users               — { _id, email (unique), passwordHash, createdAt, credits, subscription }
//   guest_usage         — { _id: guestId, uploadsUsed, createdAt, updatedAt }
//   documents           — { sessionId, text, metadata, embedding: [float], createdAt }
//                         + Atlas Vector Search index on `embedding` (sessionId as filter)
//   user_documents      — { _id, userId, sessionId, fileName, pageCount, chunkCount, createdAt }
//   payments            — { _id, userId, razorpayOrderId, razorpayPaymentId, razorpaySignature, amount, currency, type, creditsGranted, planId, status, createdAt, paidAt }
//   credit_transactions — { _id, userId, amount, type, referenceId, description, balanceAfter, createdAt }
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { MongoClient } from "mongodb";

import { env } from "../config/env.js";
import { logger } from "../lib/logger.js";

let client;
let db;
let memoryServer;

export async function connectDatabase() {
  let uri = env.MONGODB_URI;

  // Zero-setup dev mode: spin up an in-process MongoDB with data persisted
  // to backend/data/mongodb (survives restarts). No Docker/Atlas needed.
  if (uri === "memory") {
    if (env.NODE_ENV === "production") throw new Error("Use Atlas or a managed replica set in production");
    const { MongoMemoryReplSet } = await import("mongodb-memory-server");
    const dbPath = fileURLToPath(new URL("../../data/mongodb", import.meta.url));
    fs.mkdirSync(dbPath, { recursive: true });
    memoryServer = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: "wiredTiger" },
      instanceOpts: [{
        dbName: env.MONGODB_DB,
        storageEngine: "wiredTiger",
        dbPath,
      }],
    });
    uri = memoryServer.getUri();
    logger.info({ dbPath: "data/mongodb" }, "Started embedded MongoDB (dev mode)");
  }

  client = new MongoClient(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  });
  await client.connect();
  db = client.db(env.MONGODB_DB);
  const topology = await db.command({ hello: 1 });
  if (!topology.setName && topology.msg !== "isdbgrid") {
    await client.close();
    throw new Error("MongoDB transactions require Atlas or a replica set. Use MONGODB_URI=memory for development.");
  }
  logger.info({ uri: uri.replace(/\/\/.*@/, "//***@"), db: env.MONGODB_DB }, "Connected to MongoDB");
}

export async function closeDatabase() {
  await client?.close();
  await memoryServer?.stop();
}

function getDb() {
  if (!db) throw new Error("Database not connected. Call connectDatabase() first.");
  return db;
}

export const collections = {
  users: () => getDb().collection("users"),
  guestUsage: () => getDb().collection("guest_usage"),
  documents: () => getDb().collection("documents"),
  // signed-in user's current document (one per user) — enables restore-after-close
  userDocuments: () => getDb().collection("user_documents"),
  // Payments & credits
  payments: () => getDb().collection("payments"),
  oauthStates: () => getDb().collection("oauth_states"),
  webhookEvents: () => getDb().collection("webhook_events"),
  operations: () => getDb().collection("operations"),
  creditTransactions: () => getDb().collection("credit_transactions"),
};

export async function withTransaction(work) {
  if (!client) throw new Error("Database not connected");
  const session = client.startSession();
  try {
    for (let attempt = 0; ; attempt++) {
      try { return await session.withTransaction(() => work(session)); }
      catch (err) { if (err.code !== 11000 || attempt >= 2) throw err; }
    }
  }
  finally { await session.endSession(); }
}

export function pingDatabase() {
  return getDb().command({ ping: 1 });
}

/** Regular indexes (unique email, fast session lookups). */
export async function ensureIndexes() {
  await collections.users().createIndex({ email: 1 }, { unique: true });
  await collections.documents().createIndex({ sessionId: 1 });
  await collections.documents().createIndex({ sessionId: 1, text: "text" }, { name: "session_lexical", default_language: "english" });
  await collections.userDocuments().createIndex({ sessionId: 1 });
  await collections.userDocuments().createIndex({ userId: 1, createdAt: -1 });
  await collections.oauthStates().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  await collections.documents().createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
  // Payment indexes
  await collections.payments().createIndex({ userId: 1, createdAt: -1 });
  await collections.payments().createIndex({ razorpayOrderId: 1 }, { unique: true, sparse: true });
  await collections.payments().createIndex({ razorpayPaymentId: 1 }, { unique: true, sparse: true });
  await collections.payments().createIndex({ razorpaySubscriptionId: 1 }, { sparse: true });
  // Credit transaction indexes
  await collections.creditTransactions().createIndex({ userId: 1, createdAt: -1 });
  await collections.creditTransactions().createIndex({ referenceId: 1 }, { sparse: true });
  // User subscription/customer indexes
  await collections.users().createIndex({ "subscription.razorpayCustomerId": 1 }, { unique: true, sparse: true });
  await collections.users().createIndex({ "subscription.razorpaySubscriptionId": 1 }, { unique: true, sparse: true });
  logger.info("MongoDB indexes ensured");
}

/**
 * Creates the Atlas Vector Search index if missing.
 * `sessionId` is a filter field so searches are scoped per uploaded document.
 * Dimensions are auto-detected from the embedding model at startup.
 */
export async function ensureVectorSearchIndex(numDimensions) {
  const documents = collections.documents();
  const definition = {
    fields: [
      { type: "vector", path: "embedding", numDimensions, similarity: "cosine" },
      { type: "filter", path: "sessionId" },
    ],
  };

  let existing = [];
  try {
    existing = await documents.listSearchIndexes(env.VECTOR_SEARCH_INDEX).toArray();
  } catch {
    // listSearchIndexes unsupported (e.g. very old server) — try creating below
  }

  if (existing.length > 0) {
    logger.info({ index: env.VECTOR_SEARCH_INDEX }, "Vector search index already exists");
    return;
  }

  try {
    const name = await documents.createSearchIndex({
      name: env.VECTOR_SEARCH_INDEX,
      type: "vectorSearch",
      definition,
    });
    logger.warn(
      { index: name, numDimensions },
      "Vector search index created — Atlas may take a few minutes to build it before searches work"
    );
  } catch (err) {
    logger.error(
      { err },
      "Could not create the vector search index automatically. " +
        `Create it manually in Atlas UI (name: "${env.VECTOR_SEARCH_INDEX}", collection: "documents") ` +
        `with definition: ${JSON.stringify(definition)}`
    );
  }
}
