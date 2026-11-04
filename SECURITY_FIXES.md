# Security and reliability repair record

## Implemented

- Removed hard-coded test login and invalidated legacy JWTs through a new issuer/audience boundary.
- Centralized document authorization; protected chat, resume extraction, session deletion, and restoration.
- Signed guest cookie, atomic trial reservation, and additional daily IP quota.
- Browser-bound, expiring, one-time GitHub OAuth state and independent AES-GCM token encryption.
- Transactional payment grants, amount/currency validation, duplicate detection, raw webhook verification, retryable failures, and refund deduplication.
- Reserved/refunded AI credits with crash-recovery reconciliation.
- Persistent chat history, concurrent-chat lease, upload validation, and generation deadlines.
- Compiled Tailwind, route lazy loading, strict/sanitized generated content, CSP, and explicit CORS.
- Fixed lint errors, isolated regression tests, CI checks, and patched dependencies.

## Deployment actions

See README.md for required configuration and staging checks. Login sessions and old GitHub connections must be renewed. These edits do not deploy the app or alter external provider settings.

## Scope

The earlier review's roadmap items (large component refactoring, background PDF workers, OCR, full RAG benchmark datasets, distributed rate limits, and production monitoring dashboards) are future engineering work rather than claims made by this repair. Real-provider integration and browser verification remain separate acceptance checks.

## Verification completed

- Backend: 22 regression tests passed against an isolated MongoDB replica set.
- Frontend: 4 sanitization/citation tests passed.
- Frontend lint passed with no reported errors or warnings.
- Production frontend build passed. Optional Mermaid layout bundles still trigger large-chunk warnings; they are loaded on demand.
- Both dependency audits reported zero known vulnerabilities at verification time.
- Browser preview timed out in the available browser environment; visual acceptance is not claimed.
- No live AI calls, real payments, GitHub writes, or production deployment were performed.
