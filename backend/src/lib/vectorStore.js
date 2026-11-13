import { abortable, throwIfAborted, databaseOptions } from "./deadline.js";
// src/lib/vectorStore.js — MongoDB Atlas Vector Search store.
// One shared `documents` collection; each query is scoped to a sessionId
// via the vector-search pre-filter (defined in the search index).
// Falls back to in-process cosine similarity if $vectorSearch is unavailable
// (e.g. embedded dev MongoDB, or Atlas still building the index).
import crypto from "node:crypto";
import { fuseRanks } from "./retrieval.js";
import { Document } from "@langchain/core/documents";

import { env } from "../config/env.js";
import { collections } from "../db/database.js";
import { logger } from "./logger.js";

const NUM_CANDIDATES_MULTIPLIER = 20;

export class MongoVectorStore {
  /**
   * @param {GoogleGenerativeAIEmbeddings} embeddingsModel
   * @param {string} sessionId — document chunks are stored/searchable per session
   */
  constructor(embeddingsModel, sessionId) {
    this.embeddingsModel = embeddingsModel;
    this.sessionId = sessionId;
    this.indexName = env.VECTOR_SEARCH_INDEX;
  }

  collection() { return collections.documents(); }

  async addDocuments(docs, options = {}) {
    const texts = docs.map((d) => d.pageContent);
    const vectors = await this.embeddingsModel.embedDocuments(texts, options);

    if (vectors.length !== docs.length || vectors.some(vector => !vector.length || vector.some(value => !Number.isFinite(value)))) throw new Error("Embedding provider returned incomplete vectors");
    const records = vectors.map((vector, i) => ({
      sessionId: this.sessionId,
      text: docs[i].pageContent,
      metadata: { ...docs[i].metadata, chunkId: crypto.randomUUID(), chunkIndex: i },
      embedding: vector,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
    }));

    await this.collection().insertMany(records);
    return records.length;
  }

  async similaritySearch(query, k = 4, options = {}) {
    const queryVector = await abortable(() => this.embeddingsModel.embedQuery(query, options), options.signal);
    if (!queryVector.length || queryVector.some(value => !Number.isFinite(value))) throw new Error("Embedding provider returned an invalid query vector");
    try {
      return await this.atlasVectorSearch(queryVector, k, options);
    } catch (err) {
      throwIfAborted(options.signal);
      if (env.NODE_ENV === "production") throw err;
      logger.warn(
        { err: err.message, sessionId: this.sessionId },
        "$vectorSearch unavailable — falling back to in-process cosine similarity"
      );
      return this.cosineFallback(queryVector, k, options);
    }
  }

  async atlasVectorSearch(queryVector, k, options = {}) {
    const results = await this
      .collection()
      .aggregate([
        {
          $vectorSearch: {
            index: this.indexName,
            path: "embedding",
            queryVector,
            numCandidates: k * NUM_CANDIDATES_MULTIPLIER,
            limit: k,
            // only search within this session's document
            filter: { sessionId: { $eq: this.sessionId } },
          },
        },
        {
          $project: {
            _id: 0,
            text: 1,
            metadata: 1,
            score: { $meta: "vectorSearchScore" },
          },
        },
      ], databaseOptions(options))
      .toArray();

    return results.map((r) => new Document({ pageContent: r.text, metadata: r.metadata }));
  }

  // Local cosine search over this session's chunks (works on any MongoDB).
  async cosineFallback(queryVector, k, options = {}) {
    const docs = await this
      .collection()
      .find({ sessionId: this.sessionId }, databaseOptions(options))
      .project({ text: 1, metadata: 1, embedding: 1 })
      .toArray();

    const scored = docs.map((doc) => ({
      doc,
      score: cosineSimilarity(queryVector, doc.embedding),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored
      .slice(0, k)
      .map((r) => new Document({ pageContent: r.doc.text, metadata: r.doc.metadata }));
  }

  async lexicalSearch(query, k = 20, options = {}) {
    const records = await this.collection().find({ sessionId: this.sessionId, $text: { $search: query.slice(0, 2000) } }, { ...databaseOptions(options), projection: { text: 1, metadata: 1, score: { $meta: "textScore" } } }).sort({ score: { $meta: "textScore" }, _id: 1 }).limit(k).toArray();
    return records.map(record => new Document({ pageContent: record.text, metadata: record.metadata }));
  }

  async hybridSearch(query, k = 20, lexicalQuery = query, options = {}) {
    const results = await Promise.allSettled([
      abortable(() => this.similaritySearch(query, k, options), options.signal),
      abortable(() => this.lexicalSearch(lexicalQuery, k, options), options.signal),
    ]);
    throwIfAborted(options.signal);
    if (results.every(result => result.status === "rejected")) throw new AggregateError(results.map(result => result.reason), "Document retrieval unavailable");
    const failures = results.flatMap((result, i) => result.status === "rejected" ? [i === 0 ? "vector" : "keyword"] : []);
    if (failures.length) logger.warn({ failures }, "Retrieval running with one search branch");
    const docs = fuseRanks(results.filter(result => result.status === "fulfilled").map(result => result.value), k);
    return Object.assign(docs, { diagnostics: { degraded: failures.length > 0, failedBranches: failures } });
  }

  asRetriever(k = 4) {
    return { invoke: (query) => this.similaritySearch(query, k) };
  }
}

function cosineSimilarity(a, b) {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/** Deletes all embedded chunks belonging to a session (on delete/expiry). */
export async function deleteSessionVectors(sessionId) {
  const result = await collections.documents().deleteMany({ sessionId });
  return result.deletedCount;
}
