# Commit flow

This is a monorepo with independent `server/` and `client/` projects. When committing a piece of work that touches both, split commits along two axes:

1. **By feature** — each top-level feature/capability gets its own set of commits, not one giant commit for everything built in a session.
2. **By server vs. client** — within a feature, the server-side change and the client-side change are separate commits, never mixed in one commit.

So a feature that touches both sides produces at least two commits: `feat(server): ...` then `feat(client): ...` (server first, since the client usually depends on the API existing). A feature with no client surface (e.g. a backend-only migration) is just a server commit; likewise a client-only change (styling, copy, a page reshuffle) is just a client commit.

Unrelated fixes discovered along the way (e.g. a pre-existing typo/bug unblocking a build) get their own small standalone commit — don't fold them into a feature commit.

## Practical notes

- Prefer `git add <specific files>` over `git add -A`/`.` so each commit's diff matches its stated scope.
- If a single shared file (e.g. `App.tsx`, `server.ts`, a router-mount file) accumulates changes for multiple features in one working session, split its diff across the corresponding commits by editing it incrementally to the state needed for each commit, rather than dumping the whole diff into one commit. Verify each intermediate state builds/typechecks before committing it.
- A schema migration is atomic and generally shouldn't be split across commits/migration files just to satisfy the feature boundary — bundle it with the first feature commit that needs it and say so in the commit message.
- Typecheck (and build, where applicable) each commit's state before moving to the next — every commit in the history should be in a working state, not just the final one.
- Commit message format: `<type>(<scope>): <summary>` where `<scope>` is `server` or `client` (or omitted for repo-wide changes like this file), body explains the *why* when non-obvious.
- Only commit when explicitly asked. Never `git push` unless explicitly asked.
