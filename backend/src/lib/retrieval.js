import crypto from "node:crypto";
export function chunkKey(doc) { return doc.metadata?.chunkId || crypto.createHash("sha256").update(JSON.stringify([doc.metadata?.loc?.pageNumber, doc.pageContent])).digest("hex"); }
export function fuseRanks(lists, limit = 20) {
  const scores = new Map();
  for (const list of lists) {
    const seen = new Set();
    list.forEach((doc, index) => {
      const id = chunkKey(doc); if (seen.has(id)) return; seen.add(id);
      const entry = scores.get(id) || { doc, score: 0 };
      entry.score += 1 / (60 + index + 1); scores.set(id, entry);
    });
  }
  return [...scores.values()].sort((a,b) => b.score - a.score).slice(0,limit).map(({doc,score}) => ({ ...doc, metadata: { ...doc.metadata, fusionScore: score } }));
}
export function budgetContext(docs, maxChars = 12000) {
  let used = 0; const result = [];
  for (const doc of docs) {
    if (result.some(item => chunkKey(item) === chunkKey(doc))) continue;
    const text = doc.pageContent.slice(0, Math.max(0, maxChars - used));
    if (!text) break;
    result.push({ ...doc, pageContent: text }); used += text.length;
  }
  return result;
}
export function validateRanking(value, candidates) {
  if (!Array.isArray(value) || value.some(id => typeof id !== "string") || new Set(value).size !== value.length) throw new Error("Invalid reranker response");
  const byId = new Map(candidates.map(doc => [chunkKey(doc), doc]));
  if (value.some(id => !byId.has(id))) throw new Error("Reranker returned an unknown source");
  return value.map(id => byId.get(id));
}
