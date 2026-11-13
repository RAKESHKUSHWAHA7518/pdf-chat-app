# GitHub Workspace: implementation and setup

The first implementation is available at `/dashboard/github-workspace`. PDF Chat remains separate.

## Setup

1. Register a **GitHub App**, with repository permissions **Contents: Read-only** and Metadata read-only. Do not grant write permissions. No webhook subscriptions are needed for this milestone.
2. Set its user authorization callback to `<PUBLIC_URL>/api/repositories/oauth/callback`. Use the App client ID and client secret, not an OAuth App or a personal access token.
3. Configure `GITHUB_WORKSPACE_APP_ID`, `GITHUB_WORKSPACE_CLIENT_ID`, `GITHUB_WORKSPACE_CLIENT_SECRET`, and `GITHUB_WORKSPACE_INSTALL_URL` (the App installation page). Set `GITHUB_TOKEN_KEY` to a securely generated 32-byte hex key. Keep secrets outside source control.
4. Use the existing MongoDB replica-set configuration. Production requires Atlas Vector Search and permission to create `repo_vector_index`. The import worker starts with the backend server; no separate process is required.
5. Install the App for selected repositories. Sign in to this application, open GitHub Workspace, authorize the App, select a repository/branch and acknowledge AI processing before import.
6. Test with a small repository containing no confidential data. Verify the selected commit and file/line citations against GitHub before enabling private repositories for other users.

## Implemented behavior

- Separate App connection and encrypted token; no workspace write or publishing endpoint.
- Server-side ownership checks and GitHub installation/repository access checks before private content is served.
- Persistent queued jobs with bounded leases and crash recovery. Ten-minute import timeout. Failed refresh retains the previous completed snapshot.
- Each import pins the branch to a commit. It never reads moving-branch file contents during indexing. Publication of snapshot and active pointer is transactional.
- Dedicated `repo_workspaces`, `repo_snapshots`, `repo_chunks` collections in MongoDB, not Pinecone. Production uses Atlas vector search plus MongoDB text search with reciprocal-rank fusion; nonproduction supports cosine fallback. If one retrieval branch fails, diagnostics identify degraded retrieval.
- Babel parsing for JS/TS/JSX/TSX with a labelled text fallback; bounded chunks retain paths and original line numbers.
- Supported files: JS, TS, JSX, TSX, MJS, CJS, JSON, Markdown. Dependency/generated directories, sensitive filenames, binary content and recognized credential patterns are skipped. Secret detection is heuristic and cannot guarantee removal of all secrets.
- Limits per import: 256 KiB/file, 1,000 indexed files, 4,000 chunks, 10 MiB source, and lines no longer than 12,000 characters. A truncated GitHub tree fails rather than claiming full coverage. Coverage manifests explain skipped files and label truncated listings.
- Up to three workspaces/account, three import attempts/day and 100 questions/day (UTC reset). Quotas reserve attempts and are not credit charges or refunded on failure.
- Questions retrieve only the active snapshot. Answers include validated source IDs and immutable GitHub file/line links. Citation validation checks IDs, not semantic correctness of every claim. Model output cannot execute tools or code.
- Source preview, explicit refresh, disconnect and local data deletion. Successful refresh replaces the prior snapshot; failed snapshot chunks are removed. Crash debris has a 24-hour TTL.

## Deliberate limitations

This is the first milestone, not a production-readiness certification. Live GitHub authorization, Gemini responses and Atlas index readiness must be verified in the deployment environment. An Atlas index may still be building after creation; search can temporarily use only keyword retrieval and reports degradation.

Questions are independent, and the on-screen answer history lasts for the current page session. Follow-up rewriting, repository reranking, saved conversations, generated architecture diagrams, PR review, webhook updates and incremental re-embedding are not implemented. Refresh is manual; “current” means current at the displayed last check, not continuously synchronized.

Expiring or revoked GitHub user tokens require reconnection; automatic refresh-token rotation is not yet implemented. Disconnect removes the local token and blocks content access; use GitHub settings to revoke the App authorization/installation itself. Local workspaces remain until deleted. Large repositories and unsupported languages need further ingestion work. Do not market the code as a complete repository audit or a guarantee that generated explanations match runtime behavior.

## Validation

Backend regression tests use an isolated MongoDB replica set and fake GitHub/embedding responses. They exercise commit pinning, secret-file skipping, collection separation, ownership, failure preservation, OAuth purpose isolation and atomic quotas. Frontend lint and production build are also checked. Live provider behavior and browser end-to-end authorization are separate deployment checks.
