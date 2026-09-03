/**
 * Tests for the Canvas integration's config preflight (spec §4).
 * Run: node test/canvas-config.test.js   (Node 18+, no dependencies)
 *
 * validateConfig() must cover exactly the CANVAS_LTI_* keys the module
 * actually reads — one case per key, plus the all-present case. The mock
 * return shape of postInteractionRecord stays frozen at
 * {source, accepted, entries}. Style follows test/rules.test.js.
 */
import { postInteractionRecord, validateConfig } from '../src/integrations/canvas.js';

const REQUIRED = [
  'CANVAS_LTI_ISSUER',
  'CANVAS_LTI_CLIENT_ID',
  'CANVAS_LTI_DEPLOYMENT_ID',
  'CANVAS_LTI_KEYSET_URL',
  'CANVAS_LTI_TOKEN_URL',
];

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

// --- mock return shape is frozen: {source, accepted, entries} ---
const result = await postInteractionRecord([{ intent: 'x' }, { intent: 'y' }]);
check('postInteractionRecord mock keys unchanged', Object.keys(result).sort().join(','), 'accepted,entries,source');
check("postInteractionRecord source stays 'mock'", result.source, 'mock');
check('postInteractionRecord still accepts', result.accepted, true);
check('postInteractionRecord still counts entries', result.entries, 2);

for (const [k, val] of saved) {
  if (val === undefined) delete process.env[k];
  else process.env[k] = val;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
