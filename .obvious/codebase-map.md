# Codebase map — Ohkay15/course-ai-policy-layer

Folder-level overview, depth 2. The repo is tiny (one top-level tracked directory, no sub-apps),
so this map is also inlined in `obvious.md`; this file is the standalone copy.

| Path | What lives there |
|---|---|
| `course-ai-policy-layer/` | the entire application, nested one level below the git root |
| `course-ai-policy-layer/src/policy/` | `rules.js` — RULE / INTENT / DECISION vocabularies, `classifyIntent`, `evaluate` (the core decision boundary); `assignment.js` — the real LIS 875 final project scoped into 5 parts |
| `course-ai-policy-layer/src/integrations/` | `canvas.js` — Canvas LTI 1.3 client (real interface, mock impl, `LIVE` flag); `assistant.js` — bounded-assistant client (same seam) |
| `course-ai-policy-layer/src/` | `engine.js` — orchestration: classify -> decide -> (only if allowed) answer -> record |
| `course-ai-policy-layer/public/` | `index.html` + `app.js` — instructor/student UI, wired to the real engine via ES-module imports |
| `course-ai-policy-layer/test/` | `rules.test.js` — the decision-boundary test suite |
| `course-ai-policy-layer/docs/` | `ARCHITECTURE.md` — how the pieces fit, what "going live" takes; `POLICY_BASIS.md` — the real course policy this models |
| `course-ai-policy-layer/` (files) | `package.json` (npm scripts, zero deps), `README.md`, `OBVIOUS_EDUCATION_STRATEGY.md` (product/GTM strategy), `LICENSE` (MIT) |

Totals: 14 tracked files, ~675 lines of source, zero runtime dependencies.
