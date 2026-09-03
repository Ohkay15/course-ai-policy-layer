/**
 * Tests for the policy engine — the part that actually matters.
 * Run: node test/rules.test.js   (Node 18+, no dependencies)
 *
 * These assert the decision boundary directly: given a rule and a student
 * intent, the engine must return the right decision. If someone changes the
 * scoping logic, these catch it.
 */
import { RULE, INTENT, DECISION, classifyIntent, evaluate, briefMode } from '../src/policy/rules.js';

let pass = 0, fail = 0;
function check(name, got, want) {
  if (got === want) { pass++; }
  else { fail++; console.error(`FAIL: ${name}\n  got:  ${got}\n  want: ${want}`); }
}

// --- intent classification ---
check('classify: explain -> concept', classifyIntent('explain how recursion works'), INTENT.CONCEPT);
check('classify: write for me -> produce', classifyIntent('write the classifier for me'), INTENT.PRODUCE);
check('classify: debug -> review', classifyIntent('why is this function failing'), INTENT.REVIEW);

// --- the decision boundary, rule by rule ---
check('prohibited blocks concept', evaluate(RULE.PROHIBITED, INTENT.CONCEPT).decision, DECISION.BLOCK);
check('prohibited blocks produce', evaluate(RULE.PROHIBITED, INTENT.PRODUCE).decision, DECISION.BLOCK);

check('allowed allows produce', evaluate(RULE.ALLOWED, INTENT.PRODUCE).decision, DECISION.ALLOW);
check('allowed allows concept', evaluate(RULE.ALLOWED, INTENT.CONCEPT).decision, DECISION.ALLOW);

check('logic-only blocks produce', evaluate(RULE.LOGIC_ONLY, INTENT.PRODUCE).decision, DECISION.BLOCK);
check('logic-only flags concept', evaluate(RULE.LOGIC_ONLY, INTENT.CONCEPT).decision, DECISION.ALLOW_FLAGGED);

check('justify: concept is in-bounds', evaluate(RULE.JUSTIFY_TO_EXCEED, INTENT.CONCEPT).decision, DECISION.ALLOW_FLAGGED);
check('justify: produce needs justification', evaluate(RULE.JUSTIFY_TO_EXCEED, INTENT.PRODUCE).decision, DECISION.NEEDS_JUSTIFICATION);

// --- fail closed on an unknown rule ---
check('unknown rule fails closed', evaluate('NONSENSE', INTENT.CONCEPT).decision, DECISION.BLOCK);

// --- assistant brief mode: the full rule × intent grid ---
// Concept and review keep their briefs on any rule. Every other intent is
// 'assist' — except on a LOGIC_ONLY part, where an unclassified request must
// stay scoped to reasoning and never brief the model as unscoped 'assist'.
const BRIEF_GRID = [
  // [rule, intent, expected brief]
  [RULE.ALLOWED, INTENT.CONCEPT, 'concept'],
  [RULE.ALLOWED, INTENT.REVIEW, 'review'],
  [RULE.ALLOWED, INTENT.PRODUCE, 'assist'],
  [RULE.ALLOWED, INTENT.OTHER, 'assist'],
  [RULE.LOGIC_ONLY, INTENT.CONCEPT, 'concept'],
  [RULE.LOGIC_ONLY, INTENT.REVIEW, 'review'],
  [RULE.LOGIC_ONLY, INTENT.PRODUCE, 'concept'],
  [RULE.LOGIC_ONLY, INTENT.OTHER, 'concept'],   // the fixed row: was briefed 'assist'
  [RULE.JUSTIFY_TO_EXCEED, INTENT.CONCEPT, 'concept'],
  [RULE.JUSTIFY_TO_EXCEED, INTENT.REVIEW, 'review'],
  [RULE.JUSTIFY_TO_EXCEED, INTENT.PRODUCE, 'assist'],
  [RULE.JUSTIFY_TO_EXCEED, INTENT.OTHER, 'assist'],
  [RULE.PROHIBITED, INTENT.CONCEPT, 'concept'],
  [RULE.PROHIBITED, INTENT.REVIEW, 'review'],
  [RULE.PROHIBITED, INTENT.PRODUCE, 'assist'],
  [RULE.PROHIBITED, INTENT.OTHER, 'assist'],
];
for (const [rule, intent, want] of BRIEF_GRID) {
  check(`brief: ${rule} x ${intent}`, briefMode(intent, rule), want);
}

// --- edge-input contract (hardening spec §1): coercion, never a crash ---
// Any input classifies without throwing; empty/whitespace is OTHER.
const EDGE_INPUTS = [
  // [input, expected intent]
  ['', INTENT.OTHER],
  ['   ', INTENT.OTHER],
  [null, INTENT.OTHER],
  [undefined, INTENT.OTHER],
  [42, INTENT.OTHER],   // coerced, not a trim crash
  [{}, INTENT.OTHER],   // coerced, not a trim crash
];
for (const [input, want] of EDGE_INPUTS) {
  check(`edge input: ${String(input)} classifies without throwing`, classifyIntent(input), want);
}

// --- utterance contract (hardening spec §2): fixes and pins ---
// The pinned table is the classifier's contract: a negated produce clause
// ("don't write it for me") must not classify PRODUCE, while an unconditional
// produce clause keeps classifying PRODUCE even in a mixed request.
const UTTERANCES = [
  // [utterance, expected intent, note]
  ["don't write it for me — explain the approach", INTENT.CONCEPT,
    'fix: negated produce clause, concept requested'],
  ['no need to write the code, walk me through the approach', INTENT.CONCEPT,
    'fix: negated produce clause, walkthrough requested'],
  ["I'm stuck — please write the function for me", INTENT.PRODUCE,
    'pin: unconditional produce clause'],
  ['why is my function failing?', INTENT.REVIEW,
    'pin: debugging question about own work'],
  ['explain the difference between bias and variance', INTENT.CONCEPT,
    'pin: concept question'],
  ['check my summary and fix it for me', INTENT.PRODUCE,
    'pin: mixed request, unconditional produce clause wins (fail-closed to the stricter rule)'],
  ["please don't write it for me", INTENT.OTHER,
    'drift guard: negated clause to end of input is not a produce request'],
  ['never write my essay. explain photosynthesis instead', INTENT.CONCEPT,
    'drift guard: negation stops at sentence punctuation; concept matches original'],
  ["don't fix it for me, just check my summary", INTENT.REVIEW,
    'drift guard: REVIEW still matches the original text'],
];
for (const [utterance, want, note] of UTTERANCES) {
  check(`utterance: ${note}`, classifyIntent(utterance), want);
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
