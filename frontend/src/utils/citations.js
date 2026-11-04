export function extractCitations(content, sources = []) {
  const allowed = new Set(sources.map(source => source.page).filter(Number.isInteger));
  return [...new Set([...String(content || "").matchAll(/(?:\[|\(|\b)(?:Page|page|p\.)\s*(\d+)/g)].map(match => Number(match[1])).filter(page => allowed.has(page)))].sort((a, b) => a - b);
}
export function formatAssistantCitations(content, sources = []) {
  const allowed = new Set(sources.map(source => source.page).filter(Number.isInteger));
  return String(content || "").replace(/\[(?:Page|page|p\.)\s*(\d+)\]|\((?:Page|page|p\.)\s*(\d+)\)/g, (match, a, b) => allowed.has(Number(a || b)) ? "[Page " + (a || b) + "](#page-" + (a || b) + ")" : match);
}
