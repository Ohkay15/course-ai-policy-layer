---
name: local-dev
description: Durable record of the LOCAL-DEV onboarding run (2026-09-03) — how to bring this repo's dev stack up and verify it end-to-end.
---

# Local dev — how this sandbox was set up and verified

Recorded during autobuild onboarding, 2026-09-03 (UTC). Result: **dev_stack_healthy: true**.

## Environment facts

- Repo `Ohkay15/course-ai-policy-layer`, default branch `main`. **Everything lives in the nested
  `course-ai-policy-layer/` directory** — run all commands from there.
- Runtime: Node v20.20.2, npm 10.8.2, Python 3.13.14 (project needs Node 18+ only).
- Zero npm dependencies -> no `npm install` required; no lockfile exists (do not create one).
- No external services: Canvas LTI 1.3 and the bounded assistant are mocked (`LIVE = false` in
  `src/integrations/canvas.js` and `assistant.js`). No env vars or secrets needed.

## Bring-up (verified steps)

1. `cd course-ai-policy-layer`
2. `nohup npm start > /tmp/dev-server.log 2>&1 &` — runs `python3 -m http.server 8000`;
   the startup log / `ss -ltn` confirm port **8000** (do not assume — parse the log).
3. App URL: `http://localhost:8000/public/index.html` (not `/` — the server root is the app
   dir, so `/` is only a directory listing).
4. `npm test` -> 12 passed, 0 failed.

## End-to-end verification (browser)

Playwright + headless Chromium are installed in the sandbox snapshot:

- Verification script kept at `/tmp/pw/verify.mjs` — run `node /tmp/pw/verify.mjs` (dev server
  must be up). It exercises all four rules (ALLOWED, LOGIC_ONLY, JUSTIFY_TO_EXCEED including the
  justification gate, PROHIBITED), checks the interaction record table (5 entries, newest
  first), asserts a clean console, and writes 5 screenshots to `/tmp/onboarding-evidence/`.
  15/15 checks passed on 2026-09-03.
- Rebuild from scratch if ever missing:
  `mkdir -p /tmp/pw && cd /tmp/pw && npm init -y && npm i playwright && npx playwright install chromium && sudo npx playwright install-deps chromium`
  (passwordless sudo is available; the deps step is required — headless shell fails on
  `libnspr4.so` without it).
- UI mechanics worth knowing (`public/app.js`): the chat resets when switching part tabs, the
  interaction record does not. The justification gate renders as `.bubble.gate` with
  `#justifyBtn`; after clicking it, the *next* sent message is the justification text.

## Evidence (2026-09-03)

- HTTP: 9/9 served paths -> 200
- Unit tests: 12/12 passed (exit 0)
- Browser: 15/15 checks, 0 console errors
- Screenshots: `/tmp/onboarding-evidence/01-initial-load.png`, `02-part1-allowed.png`,
  `03-part3-justification-gate.png`, `04-part3-justified-exceed.png`, `05-final-interaction-record.png`

## Not present / TODO(confirm)

- No lint, typecheck, formatter, or CI configured in the repo (nothing to run).
- No Dockerfile / Compose / Makefile — the "server" is `python3 -m http.server`.
- Live-mode env vars (`ASSISTANT_*`, `CANVAS_LTI_*`) are read only when `LIVE = true`; values
  were never needed. TODO(confirm) with the repo owner before any live integration.
