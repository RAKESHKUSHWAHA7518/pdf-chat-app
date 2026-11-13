import { MongoVectorStore } from "../../lib/vectorStore.js";
import { collections } from "../../db/database.js";
export class RepositoryStore extends MongoVectorStore {
  constructor(embeddings, snapshotId) { super(embeddings, snapshotId); this.indexName = "repo_vector_index"; }
  collection() { return collections.repoChunks(); }
  async ensureIndex(dimensions) {
    const indexes = await this.collection().listSearchIndexes(this.indexName).toArray().catch(() => []);
    if (indexes.length && indexes[0].latestDefinition?.fields?.some(field => field.type === "vector" && field.numDimensions !== dimensions)) throw new Error("Repository vector dimensions changed; rebuild the repository index");
    if (!indexes.length) await this.collection().createSearchIndex({ name: this.indexName, type: "vectorSearch", definition: { fields: [{type:"vector",path:"embedding",numDimensions:dimensions,similarity:"cosine"},{type:"filter",path:"sessionId"}] } });
  }
}
