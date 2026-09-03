# Ohkay15/course-ai-policy-layer — agent guide

Instructors scope AI use part-by-part on an assignment; students work inside the scope; every
interaction is recorded for the LMS. A vanilla-JS demo of a per-part AI policy engine modeled on
the real UW-Madison LIS 875 final-project policy. Zero dependencies, no build step, no keys.

> **Repo quirk:** the git root contains a single nested app directory. All application code,
> commands, and paths below live inside `course-ai-policy-layer/` — run commands from there.

## Stack

| Layer | Choice |
|---|---|
| Language | JavaScript, ES modules (`"type": "module"`) — Node 18+ (sandbox has v20.20.2) |
| UI | Static HTML/CSS/vanilla JS (`public/`), Canvas-styled demo |
| Server | `python3 -m http.server` via `npm start` (ES-module imports need http://, not file://) |
| Tests | Plain Node script, no framework, no dependencies (`npm test`) |
| External services | None required — Canvas LTI 1.3 and the bounded assistant are mocked behind real interfaces (`LIVE = false` in `src/integrations/`) |
| Build / lint / typecheck | None configured |

## Commands

Run from `course-ai-policy-layer/`:

| Command | What it does | Verified |
|---|---|---|
| `npm start` | `python3 -m http.server 8000` → app at http://localhost:8000/public/index.html | 2026-09-03 |
| `npm test` | `node test/rules.test.js` — 12 decision-boundary checks | 12/12 pass |

No `npm install` needed — the package has zero dependencies (and no lockfile; avoid creating one).

Env vars: none required for the demo. Optional, read only when `LIVE = true` is flipped in
`src/integrations/`: `ASSISTANT_ENDPOINT`, `ASSISTANT_API_KEY`, `CANVAS_LTI_ISSUER`,
`CANVAS_LTI_CLIENT_ID`, `CANVAS_LTI_DEPLOYMENT_ID`, `CANVAS_LTI_KEYSET_URL`, `CANVAS_LTI_TOKEN_URL`.

## Codebase map

Folder-level, depth 2 (standalone copy in `.obvious/codebase-map.md`):

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

The invariant to preserve in any change: **the policy decides, the model produces.** `src/engine.js`
classifies and rules on every request *before* the assistant is ever called; the assistant never
sees the rule. Keep that ordering.

## Local Verification Summary

- **dev_stack_healthy: true** — verified 2026-09-03 (UTC)
- Dev server: `npm start` in `course-ai-policy-layer/` -> `python3 -m http.server` on port **8000** (parsed from startup output; app served at `/public/index.html`)
- HTTP smoke: 9/9 paths return 200 (`/`, `/public/index.html`, `/public/app.js`, `/src/engine.js`, `/src/policy/rules.js`, `/src/policy/assignment.js`, `/src/integrations/assistant.js`, `/src/integrations/canvas.js`, `/test/rules.test.js`)
- Unit tests: `npm test` -> **12 passed, 0 failed** (exit 0)
- Browser E2E (headless Chromium 151 via Playwright): **15/15 checks passed** — exercised all four rule types end-to-end (ALLOWED reply, LOGIC_ONLY produce-request blocked, JUSTIFY_TO_EXCEED gate -> justification -> "Exceeded (justified)", PROHIBITED hard block), verified the interaction record (5 entries, verdicts newest-first: Blocked, Allowed, Exceeded (justified), Blocked, Allowed), the justification text visible in the instructor record, and a clean browser console (0 errors)
- Screenshots: 5 captures on the sandbox under `/tmp/onboarding-evidence/` (`01-initial-load.png` ... `05-final-interaction-record.png`)
- Lint/typecheck: none configured in the repo; module-load smoke is covered by the browser run (all source modules import cleanly)

## Sandbox snapshot

- **snapshotId:** `6zcj2trabcynchtir76k:default` (E2B template baked from this live session)
- sandbox: `iq58k5dnq831eiruu80m4` (computer `cmp_idIzzNj9`)
- **snapshotBuiltAt:** 2026-09-03T15:26:38.032Z
- Captured with the dev server running on port 8000, Playwright + headless Chromium installed
  (system deps included), and evidence screenshots in place.

## Gotchas

- The app is one directory below the git root — `cd course-ai-policy-layer` before any command.
- `public/index.html` will not run from `file://` (ES-module imports); serve it over http.
- Assistant replies and Canvas sync are stubbed by design; the enforcement logic and record are real.
- Live-mode env vars (`ASSISTANT_*`, `CANVAS_LTI_*`) are never set in dev. TODO(confirm) with the
  repo owner before any live LTI/assistant integration.
