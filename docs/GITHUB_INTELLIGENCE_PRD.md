# GitHub Intelligence — Product Requirements and Build Plan

Status: First workspace implementation available; live integration verification pending. See [implementation and setup](GITHUB_WORKSPACE_SETUP.md) for delivered behavior and limitations. The requirements below retain the full phased product scope.
Date: 2026-11-04
Purpose: Preserve the agreed direction and define a small, testable first release.

## 1. Product decision

Keep PDF Chat and add a separate GitHub Workspace. Users connect GitHub with read-only access, select a repository and branch, then ask grounded questions about the imported code. Later releases add evidence-linked diagrams, incremental synchronization and PR analysis.

This is a credible engineering direction, not evidence of customer demand or superiority over existing tools. Repository chat and AI PR review already exist elsewhere. The proposed value is a coherent project-understanding workflow with simple explanations, inspectable code evidence, diagram relationships and explicit freshness/coverage.

Example user: a manager or reviewer who needs to understand a project or change without opening an IDE. Developers use the same workspace with deeper evidence views. These are initial use-case assumptions, not validated personas.

## 2. Current implementation versus proposed work

Already available:
- PDF RAG with hybrid retrieval, query rewriting, passage reranking and source excerpts.
- MongoDB application storage and vector search integration.
- Signed-in document ownership checks and saved conversations.
- Limited GitHub connection, repository listing and README/manifest inspection.
- Mermaid diagram rendering and sanitization.
- Regression tests and a synthetic starter evaluation dataset.

Not yet implemented:
- Read-only GitHub App installation flow for this workspace.
- Recursive source ingestion, code-aware indexing and commit-specific code citations.
- Repository-wide grounded chat.
- Structural dependency graph and evidence-linked architecture diagrams.
- GitHub webhook synchronization and incremental embeddings.
- PR diff review with base/head snapshots.
- Uploaded architecture/API specification verification.

The existing GitHub integration supports writing README files and requests broader access than this proposed read-only workflow needs. It must not be treated as satisfying the new permission requirement. Keep workspace read access separate from any optional legacy publishing action.

## 3. Main user journey

1. Open GitHub Workspace next to PDF Chat.
2. Connect a GitHub App installed on explicitly selected repositories.
3. See the permission scope and whether permitted private source code will be sent to the configured model provider.
4. Select one repository and branch.
5. Resolve the branch to a commit SHA and import a bounded snapshot in a background job.
6. See indexing progress, analysed/skipped files and reasons, latest known commit, indexed commit and last successful sync.
7. Ask a question, inspect file/line citations, and follow up in plain language.
8. Generate a supported diagram for a selected behaviour.
9. Later: select a PR, inspect change impact and ask follow-up questions.

Suggested actions: Explain this project; Explain login; Trace a request; Where is data stored?; Explain this file; Show supporting code. Do not imply the entire repository was read when coverage is partial.

## 4. First release: bounded read-only repository chat

Scope:
- One repository and branch per workspace.
- JavaScript/TypeScript source, JSON manifests and Markdown documentation first.
- Read-only source import; no code execution or dependency installation.
- Explicit import/refresh button before automatic sync is added.
- File tree with readable file preview.
- Repository summary and question answering with commit-pinned citations.
- Saved conversations bound to the snapshot used for each answer.
- Coverage, freshness and failure states visible to the user.

Proposed initial limits (configurable; tune after profiling):
- 1,000 eligible files and 10 MiB total decoded text per snapshot.
- 256 KiB per file; explicit skip reason beyond the limit.
- Bounded worker concurrency, model calls and tokens per job.
- Paginate provider responses; detect truncated trees and report incomplete coverage.

Exclude by default: .env variants, private keys, credentials, dependency directories, build outputs, minified bundles, binaries and generated files. A filename denylist is insufficient: scan eligible text for likely secrets, avoid sending suspected credentials to the model and report redacted/skipped files without revealing secret values. Do not follow symlinks or fetch submodules in v1.

An embeddings operation stores vectors for eligible chunks; it does not send every file to every answer. Retrieve only relevant chunks plus necessary definitions and callers.

## 5. Indexing and retrieval design

Reuse MongoDB; do not add a second vector database merely for branding.

Separate repository code collections/indexes from PDF sessions to avoid weakening existing authorization:
- repo_workspaces: owner/access principal, installation ID, repository ID, branch, latest known SHA, active snapshot ID, sync state.
- repo_snapshots: immutable commit SHA, import state, coverage manifest, parser/embedding versions and completion time.
- repo_files: snapshot ID, path, Git blob SHA, language, redaction state and bounded content.
- repo_chunks: snapshot ID, path, symbol, start/end lines, chunk ID, content hash, embedding model/version and vector.
- repo_edges: snapshot ID, source/target symbol or file, relationship type, supporting ranges, resolution status.
- ingestion_jobs: durable state, attempt count, idempotency key, progress, safe error and cancellation state.
- repo_conversations: workspace ID, snapshot ID and messages/source references.
- webhook_deliveries and pr_reviews: introduced in later milestones.

Indexes must support workspace/snapshot filtering and lexical plus vector retrieval. Verify the MongoDB text-index design against the chosen compound filters before implementation.

Authorization must be resolved server-side before constructing filters. A client-provided repository ID or snapshot ID is never sufficient authorization. Start with per-user workspaces; organization/team sharing needs a separate membership model later.

Chunk by functions/classes/modules using a parser where supported; record parser failures and use a clearly labelled bounded text fallback. Preserve line ranges, imports and nearby definitions. Do not label imports as runtime call relationships.

Retriever: authorized snapshot filter -> semantic + keyword candidates -> rank fusion -> relevant graph neighbours -> bounded reranking -> cited answer or insufficient evidence.

Citations link to immutable commit/path/line ranges. Excerpts must match stored content. Distinguish observed code facts, model inferences and unknowns. Avoid claims of complete security or runtime correctness.

Publish a snapshot atomically only after indexing is complete. Failed imports retain the last completed snapshot with a stale indicator. Do not mix files from different commits in one answer. Reuse unchanged embeddings using content hash plus embedding/parser configuration while retaining snapshot-specific references.

## 6. Diagrams: second milestone

Start with file/module dependencies and a selected request flow for supported Express-style routes. Avoid promising arbitrary framework or language coverage.

Pipeline:
1. Extract supported structural facts from parsers and framework adapters.
2. Retrieve relevant code for the user's behaviour question.
3. Produce structured nodes/edges with evidence references.
4. Validate IDs, references, line ranges and allowed relationship types.
5. Render validated graph data using Mermaid and existing SVG sanitization.
6. Let the user click a relationship to inspect evidence.

Every inferred relationship is visibly labelled. Dynamic dispatch, reflection, external services and deployment details may remain unresolved. Syntax validation does not prove the architecture is correct. Never display an unsupported arrow as verified.

Provide a simple explanation view for managers and an evidence view for developers. Export should include the analysed commit, coverage and uncertainty notes.

## 7. Automatic synchronization: third milestone

Subscribe to selected GitHub App repository/installation and push events. Verify raw-body signatures, identify the installation/repository, deduplicate delivery IDs, and persist work before acknowledging accepted events.

On a branch update:
- Record the latest known SHA and mark the active snapshot stale.
- Resolve authoritative branch state; do not trust delivery order.
- Diff against the indexed snapshot, including deleted and renamed files.
- Reuse unchanged blobs/embeddings; index changed content and rebuild affected relationships.
- Publish the completed snapshot atomically.
- Cancel or supersede obsolete jobs safely; avoid duplicate ingestion and model charges.

Add retries with backoff, rate-limit handling and dead-letter visibility. Periodically reconcile selected branches to recover missed events. Handle force pushes, branch deletion, repository deletion/transfer and installation revocation.

States: not imported, queued, indexing, current, outdated, failed, disconnected. Display latest known commit and indexed commit separately. Near-real-time processing is the goal; no guarantee of instant synchronization. A missed event means latest known may itself be old until reconciliation; show last checked time.

## 8. PR review and change impact: fourth milestone

Allow explicit PR URL/number selection. 'Latest PR' means most recently updated open PR, with the selected number/title shown before starting.

Bind review identity to repository ID + PR number + base SHA + head SHA + reviewer configuration. Fetch authoritative revisions and changed files with pagination. Read both old/new code and relevant dependencies from their matching snapshots. PR description is untrusted context, not proof of behaviour.

Outputs:
- Plain-language summary and behaviour changes.
- Evidence-backed potential bugs with trigger, impact and suggested validation.
- Missing-test suggestions, clearly separated from confirmed failures.
- Changed components and supported before/after flow diagrams.
- Analysed/skipped files, incomplete diff warnings and CI status when available.

A new PR commit or base change makes older reviews outdated. Recheck current SHAs before presenting a review as current. Automatic PR re-review follows manual review validation. Read-only v1 displays findings inside our app; posting GitHub comments requires separately authorized write access. Never approve or merge automatically. No findings does not mean no bugs.

## 9. Architecture/API verification: later research milestone

Compare a user-supplied intended architecture or API specification against the analysed code snapshot. Begin with structured input such as Mermaid, a node/edge specification or OpenAPI, not arbitrary image interpretation.

Output evidence-backed matches, mismatches and unverifiable items. Code alone cannot prove deployed traffic follows the intended path. Runtime verification would require separately authorized telemetry or contract/integration tests. Never describe a code/document comparison as proof of production architecture compliance.

## 10. Security and tool policy

- Prefer selected-repository GitHub App access with minimum read permissions; no broad write scope for the new workspace.
- Check app installation scope and user authorization. Removing app/repository access immediately blocks serving affected indexed content; define asynchronous deletion and retention policy.
- Keep tokens encrypted, redact logs and exclude source bodies/secrets from diagnostics.
- Treat repository files, PR descriptions and comments as untrusted data; they cannot grant permissions or issue tool instructions.
- Backend-enforced tool allowlist: list files, read bounded files, search authorized code, resolve supported relationships, fetch selected PR metadata/diff, render a validated diagram.
- No arbitrary URL fetch, shell, install scripts, code execution, outbound writes or unbounded agent loops.
- Per-user/repository cost budgets, queue limits, timeouts, cancellation and audit events.
- Parse source as data. Run any future tests only in a separately designed isolated execution environment, never directly on the application host.
- A remote diagram/MCP service would receive private code-derived data; evaluate its access and data handling before adding it. MCP is optional plumbing, not a correctness/security guarantee. Existing local rendering is sufficient initially.

## 11. Evaluation and acceptance

Use public/licensed fixtures or explicitly permitted private repositories. Keep synthetic smoke tests separate from real code benchmarks. Have a developer label expected supporting files/lines, known flows and seeded PR bugs. Include absent answers, dynamic/unresolved relationships and malicious repository instructions.

First-release acceptance:
- Only selected, authorized repository content can be retrieved; cross-user attempts fail.
- Every citation resolves to the analysed SHA, existing path and valid lines matching the excerpt.
- Import limits/skips are visible; no false 'complete repository' label.
- A failed refresh preserves the previous completed snapshot with an outdated indicator.
- Revocation blocks old workspace content and saved-source access.
- Representative real repository questions are manually reviewed against code before making quality claims.

Later acceptance:
- Every diagram relationship has a valid source or visible inferred/unresolved label.
- Changed/deleted files cannot survive as current after a successful sync.
- Repeated/out-of-order events create one authoritative job/result.
- Reviews cannot appear current after base/head changes.
- Rate-limit failures and cancellation do not leave permanently running jobs.

Measure supported-citation rate, human-rated answer correctness, diagram relationship correctness, refusal correctness, PR finding precision/false positives, seeded-bug recall, sync lag, latency and model cost. Set release thresholds before evaluating a held-out set; do not invent success percentages.

## 12. Implementation sequence and stop points

M0 — Agree the read-only scope and obtain GitHub App configuration. Define fixtures and permission/secret tests. Deliver a short technical design for new collections, jobs and authorization.

M1 — GitHub Workspace v1: connect -> select -> bounded import -> snapshot-specific grounded chat -> coverage/freshness. First demo uses this project's supported JS/TS code and traces login or PDF upload. Developer verifies cited lines. No automatic sync required yet.

M2 — Add evidence-linked module/request-flow diagrams for the supported framework. Compare outputs with a manually checked graph.

M3 — Add signed webhook ingestion, incremental refresh, revocation and missed-event reconciliation. Test force-push/delete scenarios.

M4 — Add manual PR review and impact explanation. Only after quality checks add opt-in automatic re-review.

M5 — Investigate structured intended-diagram/OpenAPI comparison, based on actual demand.

Do not add all milestones in one change. Each must be reviewable and independently tested. Existing PDF Chat continues working throughout.

## 13. First concrete task

Build M1 as the next implementation increment. Before coding, settle the GitHub App installation callback/webhook configuration and source-data disclosure, choose worker storage/lease behaviour, and define the snapshot authorization contract. Use existing MongoDB and Gemini/LangChain adapters where suitable, but do not route repository chunks through the PDF session collection or reuse its ownership model unchanged.

Open decisions: supported repository size after profiling; source retention/deletion window; model-provider data handling suitable for intended repositories; GitHub App ownership/configuration; latency/cost budget. These need explicit defaults or user input before the dependent behaviour ships.
