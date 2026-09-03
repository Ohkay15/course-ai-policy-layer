/**
 * Tests for the assistant integration's config preflight (spec §4).
 * Run: node test/assistant-config.test.js   (Node 18+, no dependencies)
 *
 * validateConfig() is a pure read of the environment, so the suite pins the
 * required keys explicitly — set or deleted — before each case, then restores
 * whatever it changed. Assertions hold no matter what the surrounding shell
 * exports. Style follows test/rules.test.js: plain asserts, no framework.
 */
import { respond, validateConfig } from '../src/integrations/assistant.js';

const REQUIRED = ['ASSISTANT_ENDPOINT', 'ASSISTANT_API_KEY'];

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL: ${name}\n  got:  ${got}\n  want: ${want}`); }
}

const saved = new Map(REQUIRED.map((k) => [k, process.env[k]]));
const unsetAll = () => { for (const k of REQUIRED) delete process.env[k]; };

// --- one required key missing -> not ok, naming exactly that key ---
for (const missing of REQUIRED) {
  unsetAll();
  for (const k of REQUIRED) if (k !== missing) process.env[k] = 'test-value';
  const v = validateConfig();
  check(`missing ${missing} -> ok=false`, v.ok, false);
  check(`missing ${missing} -> missing names only it`, v.missing.join(','), missing);
}

// --- all present -> ok with an empty missing list ---
unsetAll();
for (const k of REQUIRED) process.env[k] = 'test-value';
const v = validateConfig();
check('all present -> ok=true', v.ok, true);
check('all present -> missing is empty', v.missing.join(','), '');

// --- mock return shape is frozen: {source, text} in every mode ---
for (const mode of ['concept', 'review', 'assist']) {
  const r = await respond({ request: 'explain recursion', part: {}, mode });
  check(`respond(${mode}) mock keys unchanged`, Object.keys(r).sort().join(','), 'source,text');
  check(`respond(${mode}) source stays 'mock'`, r.source, 'mock');
}

for (const [k, val] of saved) {
  if (val === undefined) delete process.env[k];
  else process.env[k] = val;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
