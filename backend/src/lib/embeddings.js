import { abortable, throwIfAborted } from "./deadline.js";
import { Embeddings } from "@langchain/core/embeddings";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../config/env.js";

// Fail the whole operation on a failed batch; never persist empty placeholder vectors.
export class GeminiEmbeddings extends Embeddings {
  constructor() {
    super({ maxRetries: 2, maxConcurrency: 2 });
    this.model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
  }
  async embedQuery(text, options = {}) {
    return abortable(() => this.caller.call(async () => {
      const result = await this.model.embedContent(text, { timeout: Math.max(1, Math.min(env.AI_TIMEOUT_MS, (options.deadline || Date.now() + env.AI_TIMEOUT_MS) - Date.now())), signal: options.signal });
      return result.embedding.values;
    }), options.signal);
  }
  async embedDocuments(texts, options = {}) {
    const vectors = [];
    const deadline = Math.min(options.deadline || Infinity, Date.now() + env.AI_TIMEOUT_MS);
    for (let offset = 0; offset < texts.length; offset += 100) {
      throwIfAborted(options.signal);
      if (Date.now() >= deadline) throw new Error("Embedding deadline exceeded");
      const result = await abortable(() => this.caller.call(() => this.model.batchEmbedContents({ requests: texts.slice(offset, offset + 100).map(text => ({ content: { role: "user", parts: [{ text }] } })) }, { timeout: Math.max(1, deadline - Date.now()), signal: options.signal })), options.signal);
      vectors.push(...result.embeddings.map(item => item.values));
    }
    return vectors;
  }
}
