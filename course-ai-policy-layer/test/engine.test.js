/**
 * Tests for the engine boundary — guards, bounds, and failure semantics.
 * Run: node test/engine.test.js   (Node 18+, no dependencies)
 *
 * Contracts under test (hardening spec §1):
 *   - a malformed part is a loud TypeError; student input coerces and bounds
 *   - an assistant failure is recorded as an attempt, never swallowed
 *   - a sync failure marks the entry (synced: false) and never erases it
 *   - the gate, BLOCK, and fail-closed paths are pinned against drift
 */
import { Engine, MAX_REQUEST_LENGTH } from '../src/engine.js';
import { RULE } from '../src/policy/rules.js';
import { postInteractionRecord } from '../src/integrations/canvas.js';
import { respond as assistantRespond } from '../src/integrations/assistant.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL: ${name}\n  got:  ${JSON.stringify(got)}\n  want: ${JSON.stringify(want)}`); }
}

const part = (rule) => ({ id: 'p1', title: 'Part 1', rule });

// Await a promise; return its rejection, or null when it resolves.
async function rejection(promise) {
  try { await promise; return null; }
  catch (err) { return err; }
}

// A postRecord spy: counts calls, resolves like the mock Canvas client.
function syncSpy() {
  const spy = { calls: 0 };
  spy.postRecord = async () => { spy.calls++; return { source: 'test', accepted: true }; };
  return spy;
}
const rejectingSync = async () => { throw new Error('Canvas down'); };
const rejectingAssistant = async () => { throw new Error('model unavailable'); };

async function main() {
  // --- edge-input contract (§1): programmer errors fail loud ---
  check('part: null -> TypeError', (await rejection(new Engine().handle(null, 'hello'))) instanceof TypeError, true);
  check('part: missing id -> TypeError', (await rejection(new Engine().handle({}, 'hello'))) instanceof TypeError, true);
  check('part: non-string id -> TypeError', (await rejection(new Engine().handle({ id: 42, rule: RULE.ALLOWED }, 'hello'))) instanceof TypeError, true);
  const nullPart = await rejection(new Engine().handle(null, 'hello'));
  check('part: TypeError message pinned', nullPart && nullPart.message, 'engine.handle: a part with an id is required');

  // --- edge-input contract (§1): user inputs coerce and bound ---
  check('request: empty -> RangeError', (await rejection(new Engine().handle(part(RULE.ALLOWED), ''))) instanceof RangeError, true);
  check('request: whitespace-only -> RangeError', (await rejection(new Engine().handle(part(RULE.ALLOWED), '   '))) instanceof RangeError, true);
  check('request: null -> RangeError (coerced to empty)', (await rejection(new Engine().handle(part(RULE.ALLOWED), null))) instanceof RangeError, true);
  const longErr = await rejection(new Engine().handle(part(RULE.ALLOWED), 'x'.repeat(MAX_REQUEST_LENGTH + 1)));
  check('request: over-limit -> RangeError', longErr instanceof RangeError, true);
  check('request: RangeError names the limit', Boolean(longErr) && longErr.message.includes(String(MAX_REQUEST_LENGTH)), true);
  const atLimit = await new Engine().handle(part(RULE.ALLOWED), 'x'.repeat(MAX_REQUEST_LENGTH));
  check('request: exactly at the limit -> handled', atLimit.outcome, 'handled');

  // Non-string requests coerce instead of crashing the engine.
  const numeric = await new Engine().handle(part(RULE.ALLOWED), 42);
  check('request: 42 -> coerced and recorded', numeric.entry.request, '42');
  const objReq = await new Engine().handle(part(RULE.ALLOWED), {});
  check('request: {} -> coerced and recorded', objReq.entry.request, '[object Object]');

  // --- gate pinned: NEEDS_JUSTIFICATION without justification ---
  const spy = syncSpy();
  const gateEngine = new Engine({ postRecord: spy.postRecord });
  const gated = await gateEngine.handle(part(RULE.JUSTIFY_TO_EXCEED), 'write the code for me');
  check('gate: outcome gate', gated.outcome, 'gate');
  check('gate: entry null', gated.entry, null);
  check('gate: nothing recorded', gateEngine.getRecord().length, 0);
  check('gate: sync never called', spy.calls, 0);

  // --- BLOCK pinned, including fail-closed on an unknown rule ---
  const blockedEngine = new Engine();
  const blocked = await blockedEngine.handle({ id: 'p1', title: 'Part 1', rule: 'NONSENSE' }, 'explain recursion');
  check('unknown rule: fail-closed BLOCK verdict', blocked.entry.verdict, 'Blocked');
  check('unknown rule: outcome handled', blocked.outcome, 'handled');
  check('unknown rule: entry kept, synced defaults true', blocked.entry.synced, true);
  const prohibitedEngine = new Engine();
  const prohibited = await prohibitedEngine.handle(part(RULE.PROHIBITED), 'write the function for me');
  check('prohibited: BLOCK verdict', prohibited.entry.verdict, 'Blocked');
  check('prohibited: BLOCK records the attempt', prohibitedEngine.getRecord().length, 1);

  // --- assistant failure is recorded, never swallowed ---
  const aFailEngine = new Engine({ respond: rejectingAssistant, postRecord: rejectingSync });
  const aFail = await aFailEngine.handle(part(RULE.ALLOWED), 'explain recursion');
  check('assistant failure: handle resolves', aFail.outcome, 'handled');
  check('assistant failure: verdict Assistant error', aFail.entry.verdict, 'Assistant error');
  check('assistant failure: reply tells the student the attempt is recorded', aFail.reply, 'The assistant is unavailable right now. This attempt is recorded.');
  check('assistant failure: attempt kept in the record', aFailEngine.getRecord().length, 1);
  check('assistant failure: sync still attempted, failure marked', aFail.entry.synced, false);

  // A justified exceed must still record the justification when the model fails.
  const jFailEngine = new Engine({ respond: rejectingAssistant });
  const jFail = await jFailEngine.handle(part(RULE.JUSTIFY_TO_EXCEED), 'write the code for me', 'I attempted it myself first and need a reference approach');
  check('justified + assistant failure: verdict Assistant error', jFail.entry.verdict, 'Assistant error');
  check('justified + assistant failure: justification kept', jFail.entry.justification, 'I attempted it myself first and need a reference approach');

  // --- sync failure keeps and flags the entry, never throws ---
  const syncFailEngine = new Engine({ postRecord: rejectingSync });
  const syncFail = await syncFailEngine.handle(part(RULE.ALLOWED), 'explain recursion');
  check('sync failure: handle resolves', syncFail.outcome, 'handled');
  check('sync failure: verdict stays Allowed', syncFail.entry.verdict, 'Allowed');
  check('sync failure: entry kept', syncFailEngine.getRecord().length, 1);
  check('sync failure: entry.synced false', syncFail.entry.synced, false);

  // The happy path keeps synced true.
  const okEngine = new Engine();
  const ok = await okEngine.handle(part(RULE.ALLOWED), 'explain recursion');
  check('sync success: entry.synced true', ok.entry.synced, true);

  // --- DI seam: defaults are the real integrations; injections are used ---
  check('DI: default postRecord is the Canvas client', new Engine().postRecord, postInteractionRecord);
  check('DI: default respond is the bounded assistant', new Engine().respond, assistantRespond);
  const injected = syncSpy();
  const diEngine = new Engine({ postRecord: injected.postRecord });
  await diEngine.handle(part(RULE.ALLOWED), 'explain recursion');
  check('DI: injected postRecord is used', injected.calls, 1);
}

main()
  .then(() => console.log(`\n${pass} passed, ${fail} failed`))
  .catch((err) => { console.error(`FAIL: unexpected error: ${err && err.stack}`); fail++; })
  .finally(() => process.exit(fail ? 1 : 0));
