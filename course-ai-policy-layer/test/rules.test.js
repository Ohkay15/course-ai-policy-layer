/**
 * Tests for the policy engine — the part that actually matters.
 * Run: node test/rules.test.js   (Node 18+, no dependencies)
 *
 * These assert the decision boundary directly: given a rule and a student
 * intent, the engine must return the right decision. If someone changes the
 * scoping logic, these catch it.
 */
import { RULE, INTENT, DECISION, classifyIntent, evaluate } from '../src/policy/rules.js';

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

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
