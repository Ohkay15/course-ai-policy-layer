/**
 * The engine — orchestration.
 *
 * This is the one place the pieces meet, and the order is the whole design:
 *
 *   1. classify the student's request           (policy)
 *   2. evaluate it against the active part's rule (policy)  ← the decision
 *   3. only if allowed, ask the bounded assistant (integration)
 *   4. record everything, allowed or not         (record → Canvas)
 *
 * The model is step 3. It never sees steps 1–2. That is deliberate: the policy
 * decides, the model produces. A student who tries to exceed a bound is handled
 * by the policy and the record, not by hoping the model refuses.
 *
 * Failure contracts (hardening spec art_PLtgfwq3 §1):
 *   - a null/malformed part is a programmer error and throws loudly
 *   - student input is coerced and bounded, never a type crash
 *   - an assistant failure is still recorded — the attempt is a fact
 *   - a sync failure marks the entry (synced: false) and never erases it
 */

import { classifyIntent, evaluate, briefMode, DECISION, RULE } from './policy/rules.js';
import { respond as assistantRespond } from './integrations/assistant.js';
import { postInteractionRecord } from './integrations/canvas.js';

// The longest student request the engine accepts; longer input is rejected
// before classification rather than passed downstream.
export const MAX_REQUEST_LENGTH = 2000;

// What the student sees when the bounded assistant fails. The attempt is
// still recorded — see the catch in handle().
const ASSISTANT_ERROR_REPLY = 'The assistant is unavailable right now. This attempt is recorded.';

export class Engine {
  // DI seam: postRecord defaults to the real Canvas client, respond to the
  // bounded assistant. Tests inject stubs; production changes nothing.
  constructor({ postRecord, respond } = {}) {
    this.record = []; // the interaction record; in LIVE this syncs to Canvas
    this.postRecord = postRecord ?? postInteractionRecord;
    this.respond = respond ?? assistantRespond;
  }

  /**
   * Handle one student request against one part.
   * @param {object} part   the active assignment part (carries .rule)
   * @param {string} request the student's message
   * @param {string|null} justification present only when the student is
   *        proceeding past a JUSTIFY_TO_EXCEED bound
   * @returns {Promise<{outcome, reply, entry}>}
   */
  async handle(part, request, justification = null) {
    // Programmer-error contract: fail loud.
    if (!part || typeof part.id !== 'string') {
      throw new TypeError('engine.handle: a part with an id is required');
    }

    // User-input contract: coerce, bound, never throw on type.
    const req = String(request ?? '').trim();
    if (!req) throw new RangeError('engine.handle: request must not be empty');
    if (req.length > MAX_REQUEST_LENGTH) {
      throw new RangeError(`engine.handle: request exceeds ${MAX_REQUEST_LENGTH} characters`);
    }

    const intent = classifyIntent(req);
    const { decision, reason } = evaluate(part.rule, intent);

    // A JUSTIFY_TO_EXCEED part that needs a justification the student hasn't
    // given yet: return the gate, don't call the model, don't record a result
    // until they either justify or back off.
    if (decision === DECISION.NEEDS_JUSTIFICATION && !justification) {
      return {
        outcome: 'gate',
        reply: reason,
        entry: null,
      };
    }

    let reply = null;
    let verdict = null;
    let mode = null;

    if (decision === DECISION.BLOCK) {
      verdict = 'Blocked';
      reply = reason;
    } else {
      // Everything past the gate that is not BLOCK proceeds: a justified
      // exceed, ALLOW, or ALLOW_FLAGGED. All three go to the assistant.
      verdict = decision === DECISION.NEEDS_JUSTIFICATION
        ? 'Exceeded (justified)' // justified exceed is allowed, but flagged
        : (decision === DECISION.ALLOW_FLAGGED ? 'Allowed (flagged)' : 'Allowed');
      mode = briefMode(intent, part.rule);
      try {
        reply = (await this.respond({ request: req, part, mode })).text;
      } catch {
        // Policy allowed this request; the model failed. The attempt is a
        // fact the instructor must see — record it, never swallow it.
        verdict = 'Assistant error';
        reply = ASSISTANT_ERROR_REPLY;
      }
    }

    const entry = {
      time: new Date().toISOString(),
      partId: part.id,
      partTitle: part.title,
      rule: part.rule,
      request: req,
      intent,
      verdict,
      reason,
      justification: justification || null,
      synced: true,
    };
    this.record.unshift(entry);

    // Sync to Canvas. Mock resolves instantly; LIVE posts to AGS. A failed
    // sync is marked on the entry, never erased: the record is the system of
    // record, and a Canvas outage must not lose an attempt.
    try {
      await this.postRecord(this.record);
    } catch {
      entry.synced = false; // surfaced to the instructor via the record panel
    }

    return { outcome: 'handled', reply, entry };
  }

  getRecord() {
    return this.record;
  }
}
