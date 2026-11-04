# Advanced RAG implementation and product focus

## Implemented pipeline

PDF extraction -> page/paragraph preserving splitting -> embeddings -> parallel vector and lexical candidate retrieval -> reciprocal rank fusion -> model-based passage selection -> bounded source context -> cited streaming answer.

Follow-up questions are rewritten into standalone search queries. Both retrievers filter by the authorized document session. Original wording is retained for lexical retrieval to preserve identifiers. Model-generated source IDs are validated against candidates. Empty passage selection returns an insufficient-evidence response. A failed vector or keyword branch can use the other branch with explicit degraded diagnostics. Both failing produces an error. Reranker failure withholds evidence and returns an insufficient-evidence answer instead of generating from unverified fused results.

Sources retain chunk IDs, pages, and excerpts. SSE source events include query strategy, rewrite/rerank status, candidate counts and retrieval latency. These are diagnostic metadata, not confidence scores or proof of answer correctness.

New uploads use paragraph-aware splitting within pages, with character limits and overlap for long paragraphs. This is not a layout/table parser or hierarchical heading detector. Existing uploads remain searchable; re-upload to get new chunk boundaries.

## Deployment

Startup creates a session-prefixed MongoDB text index named session_lexical. Atlas vector indexing remains required in production. Restart the backend to create the lexical index before testing. Configure RAG_CANDIDATES (default 20) and RAG_CONTEXT_CHARS (default 12000). Query rewriting and reranking add Gemini requests and latency; measure their cost before choosing pricing.

## Validation and honest claims

Automated tests cover rank fusion, context limits, invalid reranker outputs, and document-scoped exact keyword retrieval, alongside the existing security and PDF tests. No live model benchmark has been run. These tests do not establish recall, answer correctness, prompt-injection immunity, or citation entailment. A retrieved page containing a relevant term does not prove every claim in an answer.

Before advertising accuracy improvements, label at least 30 real questions across technical manuals, project documents and resumes. Include exact identifiers, paraphrases, follow-ups, missing answers, and conflicting passages. Compare vector-only and hybrid retrieval on the same sources. Report recall@6, reciprocal rank, answer correctness, claim/source agreement, refusal correctness, p50/p95 latency and cost. Keep a held-out question set. Record model versions and settings. Do not invent benchmark numbers.

## Focused product recommendation

Primary workflow: investigate a technical PDF or project document, inspect evidence, ask follow-up questions, save the conversation. Keep repository documentation as the adjacent tool. Keep other existing tools accessible during user validation; do not delete users' workflows before learning what they use.

Consider de-emphasizing generic bio/profile generation, cover letters, resume-to-README and standalone diagrams. The next powerful workflow to validate is an evidence-backed project interview coach that asks about a user's actual project and retrieves supporting documentation. It should identify missing information rather than invent achievements. Multi-document workspaces require authorization per document and are not implemented in this increment.

Recruit 8–10 users with real documents. Observe successful tasks and voluntary returns. Choose the next feature from repeated obstacles, not tool count.

## Reliability update

Chat cancellation is propagated to query rewriting, Gemini embeddings, MongoDB queries and passage reranking. MongoDB retrieval has bounded execution time. /api/ready checks vector-index queryability and the lexical index separately from /api/health. A failure in readiness does not establish a provider outage; inspect configuration. No live Atlas index has been verified in this change.

Use backend/evaluation for the 30-case synthetic starter dataset and metrics runner. This is evaluation infrastructure, not a completed live-model benchmark. Claim-level entailment checking, real-document adversarial evaluation, OCR and multi-document workspaces remain pending.
