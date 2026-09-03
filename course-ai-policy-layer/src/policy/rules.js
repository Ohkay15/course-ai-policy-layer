/**
 * Policy rules — the core scoping model.
 *
 * A course assignment is broken into parts. Each part carries its own AI rule.
 * The instructor authors these in plain terms (the way a syllabus already does);
 * this module turns that intent into something enforceable at the moment a
 * student asks for help, rather than something checked after submission.
 *
 * The four rule types below are the vocabulary an instructor scopes with. They
 * map directly onto how real course policies already read — see the LIS 875
 * policy this is modeled on (docs/POLICY_BASIS.md).
 */

export const RULE = Object.freeze({
  // Assistance is allowed. Use is still recorded.
  ALLOWED: 'ALLOWED',
  // Assistance is allowed for reasoning/approach, but not for producing the
  // artifact itself (e.g. explain the algorithm, don't write the code).
  LOGIC_ONLY: 'LOGIC_ONLY',
  // Assistance is not permitted. A student may still proceed, but doing so
  // requires a written justification that is flagged in the record.
  JUSTIFY_TO_EXCEED: 'JUSTIFY_TO_EXCEED',
  // Assistance is hard-blocked. The point of the work is defeated by AI use
  // (e.g. a reflection whose purpose is to load ideas into the student's head).
  PROHIBITED: 'PROHIBITED',
});

/**
 * What a student is asking for. The engine classifies each request into one of
 * these intents, then checks it against the active part's rule.
 *
 * This classifier is intentionally simple and transparent here. In a live
 * deployment the classification is delegated to the bounded assistant
 * (see src/integrations/assistant.js) which is far more capable — but the
 * decision boundary stays in this module, under the instructor's rule, not
 * inside the model. The model advises; the policy decides.
 */
export const INTENT = Object.freeze({
  CONCEPT: 'CONCEPT',     // "explain X", "what does Y mean" — understanding
  PRODUCE: 'PRODUCE',     // "write my X", "generate the code" — producing the artifact
  REVIEW: 'REVIEW',       // "check my work", "why is this wrong" — feedback on own work
  OTHER: 'OTHER',
});

const PRODUCE_PATTERNS = [
  /\b(write|draft|compose|generate|produce|create|build|code|implement)\b.*\b(my|the|this|a)\b.*\b(summary|question|thesis|code|function|model|classifier|answer|response|paragraph|section|part)\b/i,
  /\b(write|do|finish|complete)\b\s+(my|this|the)\b/i,
  /\bfor me\b/i,
  /\bdo (my|the) (assignment|work|part)\b/i,
];

const CONCEPT_PATTERNS = [
  /\b(explain|clarify|define|what (is|are|does)|how (do|does|can)|why (is|does|do)|meaning of|difference between|help me understand|walk me through)\b/i,
];

const REVIEW_PATTERNS = [
  /\b(check|review|debug|fix|why (is|isn't|does).*(wrong|failing|broken|not working)|what('?s| is) wrong|is this (right|correct))\b/i,
];

export function classifyIntent(text) {
  const t = (text || '').trim();
  if (!t) return INTENT.OTHER;
  // Order matters. Producing the artifact is what rules most often gate, so
  // check it first. Review is checked before concept because debugging
  // questions ("why is this failing") often open like concept questions
  // ("why does...") but are really about the student's own work.
  if (PRODUCE_PATTERNS.some((re) => re.test(t))) return INTENT.PRODUCE;
  if (REVIEW_PATTERNS.some((re) => re.test(t))) return INTENT.REVIEW;
  if (CONCEPT_PATTERNS.some((re) => re.test(t))) return INTENT.CONCEPT;
  return INTENT.OTHER;
}

export const DECISION = Object.freeze({
  ALLOW: 'ALLOW',                     // proceed, record it
  ALLOW_FLAGGED: 'ALLOW_FLAGGED',     // proceed, record it, flag for instructor attention
  NEEDS_JUSTIFICATION: 'NEEDS_JUSTIFICATION', // student may exceed only with a written reason
  BLOCK: 'BLOCK',                     // refuse, record the attempt
});

/**
 * The heart of the system: given a part's rule and a student's request,
 * decide what happens. Pure function, no side effects, easy to test and to read.
 *
 * @param {string} rule    one of RULE
 * @param {string} intent  one of INTENT
 * @returns {{decision: string, reason: string}}
 */
export function evaluate(rule, intent) {
  switch (rule) {
    case RULE.ALLOWED:
      return { decision: DECISION.ALLOW, reason: 'Assistance allowed on this part; recorded.' };

    case RULE.LOGIC_ONLY:
      if (intent === INTENT.PRODUCE) {
        return {
          decision: DECISION.BLOCK,
          reason: 'This part allows help with reasoning and approach, not with producing the code or text itself.',
        };
      }
      if (intent === INTENT.CONCEPT || intent === INTENT.REVIEW) {
        return { decision: DECISION.ALLOW_FLAGGED, reason: 'Reasoning-level help allowed; recorded and flagged.' };
      }
      return { decision: DECISION.ALLOW_FLAGGED, reason: 'Scoped to reasoning help; recorded.' };

    case RULE.JUSTIFY_TO_EXCEED:
      // The student is not walled off. They may proceed past the bound, but the
      // record captures why. This is the "understand and stand behind it" model:
      // accountability with a release valve, not an impassable wall.
      if (intent === INTENT.CONCEPT) {
        return { decision: DECISION.ALLOW_FLAGGED, reason: 'Understanding a concept is within bounds; recorded.' };
      }
      return {
        decision: DECISION.NEEDS_JUSTIFICATION,
        reason: 'This part is meant to be your own work. You can proceed, but you must record why you needed AI here.',
      };

    case RULE.PROHIBITED:
      return {
        decision: DECISION.BLOCK,
        reason: 'AI is turned off for this part. Its purpose is defeated by assistance.',
      };

    default:
      // Fail closed. An unknown rule blocks rather than allows.
      return { decision: DECISION.BLOCK, reason: 'No rule set for this part; assistance withheld pending instructor policy.' };
  }
}

/**
 * The brief mode the assistant is given for a request, derived from the
 * classified intent and the part's rule. Pure function, extracted from the
 * engine so the rule × intent mapping is testable without a browser.
 *
 * Concept and review intents keep their scoped briefs on any part. Anything
 * else takes the part's floor: a reasoning-only part must never brief the
 * model as unscoped 'assist', even when the classifier can't name the intent.
 *
 * @param {string} intent one of INTENT
 * @param {string} rule   one of RULE
 * @returns {string} 'concept' | 'review' | 'assist'
 */
export function briefMode(intent, rule) {
  if (intent === INTENT.CONCEPT) return 'concept';
  if (intent === INTENT.REVIEW) return 'review';
  return rule === RULE.LOGIC_ONLY ? 'concept' : 'assist';
}
