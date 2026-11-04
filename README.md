# DevSuite AI

A React and Node.js application for PDF question answering, resume matching, repository documentation, and Mermaid diagrams. Gemini supplies generation and embeddings; MongoDB stores documents, accounts, billing records, and chat history.

This repository is a portfolio application under active hardening. Automated regression checks do not replace staging verification with real providers or establish an uptime or latency guarantee.

## Run locally

Use Node.js 22.19 or later. Copy backend/.env.example to backend/.env and set GEMINI_API_KEY and a random JWT_SECRET of at least 32 characters.

Run:

    npm run install:all
    npm run dev:backend
    npm run dev:frontend

Open http://localhost:5173. The development proxy routes /api to port 3001. Configuration loads from backend/.env regardless of the current directory.

MongoDB must support transactions: use Atlas, an existing replica set, or MONGODB_URI=memory for a development replica set. Memory mode downloads a MongoDB binary on first use and persists local data under backend/data/mongodb. Do not use that mode for production.

## Checks

    npm --prefix backend test
    npm --prefix frontend test
    npm --prefix frontend run lint
    npm --prefix frontend run build
    npm --prefix backend audit
    npm --prefix frontend audit

The default test suite uses a disposable replica set, a local HTTP server, and fake credentials. It never calls paid AI or payment services. MongoDB binaries may be downloaded on first run; set MONGOMS_SYSTEM_BINARY and MONGOMS_VERSION to use an installed binary. The separate test:live script calls real configured providers and must only run against a dedicated staging database.

GitHub Actions runs regression tests, lint, the production build, and dependency checks.

## Deployment

The root Dockerfile builds the frontend and serves it through Express. npm run build and npm start support the same unified deployment. Keep the browser and API on the same origin so signed guest cookies work consistently.

Required settings:

- NODE_ENV=production
- PUBLIC_URL: exact public HTTPS origin, without a trailing slash
- CORS_ORIGIN: comma-separated explicit allowed browser origins; wildcard origins are not accepted
- JWT_SECRET: random secret, at least 32 characters
- GEMINI_API_KEY and the desired chat/embedding model identifiers
- MONGODB_URI: Atlas or another replica set; configure backups separately
- TRUST_PROXY_HOPS: number of trusted reverse-proxy hops (usually 1 on a managed host); leave 0 for direct connections

Optional integrations:

- GitHub: GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, and GITHUB_TOKEN_KEY (64 random hexadecimal characters). Register PUBLIC_URL/api/github/oauth/callback as the callback URL.
- Razorpay: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, RAZORPAY_WEBHOOK_SECRET, and your own RAZORPAY_PLAN_PRO_MONTHLY / RAZORPAY_PLAN_PRO_YEARLY. Configure /api/payments/webhook. Unconfigured payment creation fails explicitly instead of crashing app startup.

Generate a separate GitHub encryption key with:

    node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

Never reuse the JWT signing secret as the GitHub encryption key.

## Security-update rollout

1. Back up the database and deploy to staging first.
2. Configure PUBLIC_URL and explicit allowed origins. Add the separate GitHub encryption key and provider plan IDs if those integrations are enabled.
3. Deploy the updated server and frontend together. Existing login tokens are intentionally rejected by the new issuer/audience boundary, including the formerly embedded test token. Users must sign in again.
4. Previously encrypted GitHub tokens must be reconnected; the new format uses authenticated AES-256-GCM encryption with a separate key. Do not rotate JWT_SECRET expecting it to rotate GitHub credentials.
5. Register the webhook with the original raw-body signature flow. Verify captured, duplicate, failed, renewal, cancellation, and partial/full refund events in Razorpay test mode.
6. Confirm Atlas vector indexing is ready, try a real PDF and follow-up question, check cited pages, and check restoration after a server restart.
7. Check logs, backup restoration, resource limits, and the host's streaming/proxy settings before accepting real customers.

No external deployment or account setting is changed by these code edits.

## Engineering behavior

- Every document read, chat, extraction, and deletion checks its owner. Guest documents require a signed HttpOnly cookie.
- Guest upload quotas are reserved atomically. An additional daily IP budget limits cookie-reset abuse; shared networks can therefore reach the guest limit and require sign-in.
- AI tools authenticate and validate input, reserve credits, finalize successful operations, and refund failures. A periodic recovery task refunds abandoned reservations after a grace period.
- Payment state and balances change in MongoDB transactions. Provider payment IDs and refund IDs deduplicate delivery. Webhook processing errors return a retryable response.
- GitHub OAuth state is random, browser-bound, expires after ten minutes, and can be consumed only once.
- Markdown is sanitized and Mermaid uses strict rendering with SVG sanitization. CSP restricts scripts; Tailwind is compiled at build time.
- Signed-in chat history persists in MongoDB. A document lease prevents concurrent answers overwriting history. Requests have generation deadlines.
- Retrieval includes recent user questions for follow-ups and returns source page/excerpt metadata. Document text is treated as untrusted evidence. These safeguards do not guarantee model accuracy.
- PDFs have byte, page, and chunk limits. Scanned PDFs without readable text require OCR before upload.
- In production, vector-search failures are surfaced rather than silently scanning all vectors in memory.

## Remaining operational verification

The repository cannot establish provider availability, real checkout success, model answer quality, mobile usability, or capacity without staging exercises. Measure latency, citation accuracy, cost per request, and concurrency before making performance claims. The app has process-local rate limiting; scale-out requires a shared limiter and an agreed usage budget. Large optional Mermaid layout chunks load only when needed.

## Advanced retrieval

The document chat pipeline now combines vector and lexical retrieval using reciprocal rank fusion, standalone follow-up query rewriting, validated model reranking and bounded evidence context. See [implementation and validation limits](ADVANCED_RAG.md). Live-model quality improvements have not yet been benchmarked.

Retired tools: profile/bio generation, resume-to-README and cover-letter generation. Their old dashboard URLs redirect to document chat. Account, document and billing data are retained.

### RAG reliability and evaluation

Hybrid retrieval can continue with one search branch and reports degraded status. Both branches failing returns an error. Failed reranking requests a retry instead of generating an answer from unverified passages. Chat cancellation propagates to embedding requests and database queries with execution limits. /api/ready checks search-index readiness separately from /api/health. See backend/evaluation/README.md for the synthetic starter dataset and offline metrics runner. No live-model accuracy result is claimed.
