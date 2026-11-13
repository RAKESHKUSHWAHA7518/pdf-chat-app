import { parse } from "@babel/parser";
import crypto from "node:crypto";
const hash = value => crypto.createHash("sha256").update(value).digest("hex");
export function skipReason(path, size = 0) {
  if (/(^|\/)(node_modules|vendor|dist|build|coverage|\.git)(\/|$)/i.test(path)) return "generated or dependency directory";
  if (/(^|\/)(\.env[^/]*|[^/]*\.(pem|key|p12|pfx)|id_rsa|credentials[^/]*|secrets?[^/]*)$/i.test(path)) return "sensitive filename";
  if (!/\.(js|jsx|ts|tsx|mjs|cjs|json|md)$/i.test(path) || /(?:lock|\.min)\.(?:json|js)$/.test(path)) return "unsupported or generated file";
  if (size > 256 * 1024) return "file exceeds 256 KiB";
  return null;
}
export function containsSecret(text) {
  return /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|(?:gh[pousr]_[a-zA-Z0-9]{20,})|(?:AIza[\w-]{30,})|(?:AKIA[A-Z0-9]{16})|(?:mongodb(?:\+srv)?:\/\/[^\s:]+:[^\s@]+@)|(?:["']?(?:api[_-]?key|password|secret|access[_-]?token)["']?\s*[:=]\s*["'][^"'\s]{8,}["'])/i.test(text);
}
export function codeChunks(path, text, commitSha) {
  const lines = text.split(/\r?\n/); const spans = []; let parser = "text";
  if (/\.[cm]?[jt]sx?$/.test(path)) {
    try {
      const ast = parse(text, { sourceType: "unambiguous", plugins: [...(/\.tsx?$/.test(path) ? ["typescript"] : []), "jsx"], errorRecovery: false });
      parser = "babel";
      for (const node of ast.program.body) spans.push({ start: node.loc.start.line, end: node.loc.end.line, symbol: node.id?.name || node.declaration?.id?.name || node.type });
    } catch { parser = "text-fallback"; }
  }
  // Cover every line, including comments and imports, without crossing large declarations unboundedly.
  const result = []; let start = 1;
  while (start <= lines.length) {
    const span = spans.find(item => item.start <= start && item.end >= start);
    const end = Math.min(lines.length, start + 79, span?.end || start + 79);
    const content = lines.slice(start - 1, end).join("\n");
    if (content.trim()) result.push({ pageContent: content, metadata: { chunkId: hash(path + ":" + start + ":" + commitSha), path, startLine: start, endLine: end, symbol: span?.symbol || "file", parser, commitSha } });
    start = end + 1;
  }
  return result;
}
export function codeCitation(owner, repo, sha, metadata) {
  if (!/^[a-f0-9]{40}$/i.test(sha) || !Number.isInteger(metadata.startLine) || metadata.startLine < 1 || metadata.endLine < metadata.startLine) throw new Error("Invalid code citation");
  return "https://github.com/" + encodeURIComponent(owner) + "/" + encodeURIComponent(repo) + "/blob/" + sha + "/" + metadata.path.split("/").map(encodeURIComponent).join("/") + "#L" + metadata.startLine + "-L" + metadata.endLine;
}
