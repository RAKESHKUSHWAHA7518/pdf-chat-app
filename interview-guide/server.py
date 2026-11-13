import re
from mcp.server import MCPServer

mcp = MCPServer("Interview Knowledge Demo")

DOCUMENTS = [
    {"id": "rag-1", "title": "RAG overview", "page": 1,
     "text": "RAG retrieves evidence before generating an answer."},
    {"id": "mcp-1", "title": "MCP overview", "page": 2,
     "text": "MCP servers expose tools and context to clients."},
]

def words(text: str) -> set[str]:
    return set(re.findall(r"\w+", text.casefold()))

def rank_documents(query: str, limit: int = 3) -> list[dict]:
    if not query.strip() or len(query) > 1000:
        raise ValueError("Query must contain 1 to 1000 characters")
    if not 1 <= limit <= 5:
        raise ValueError("Limit must be between 1 and 5")
    terms = words(query)
    ranked = []
    for doc in DOCUMENTS:
        score = len(terms & words(doc["title"] + " " + doc["text"]))
        if score:
            ranked.append({**doc, "score": score})
    return sorted(ranked, key=lambda d: (-d["score"], d["id"]))[:limit]

@mcp.tool()
def search_documents(query: str, limit: int = 3) -> list[dict]:
    """Search public demo notes and return source IDs and excerpts."""
    return rank_documents(query, limit)

if __name__ == "__main__":
    mcp.run(transport="stdio")
