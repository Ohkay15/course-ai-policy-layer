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
 */

import { classifyIntent, evaluate, DECISION, RULE } from './policy/rules.js';
import { respond as assistantRespond } from './integrations/assistant.js';
import { postInteractionRecord } from './integrations/canvas.js';

export class Engine {
  constructor() {
    this.record = []; // the interaction record; in LIVE this syncs to Canvas
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
    const intent = classifyIntent(request);
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
    } else if (decision === DECISION.NEEDS_JUSTIFICATION && justification) {
      // Student chose to proceed past the bound and gave a reason. Allowed,
      // but flagged, and the justification is part of the permanent record.
      verdict = 'Exceeded (justified)';
      mode = 'assist';
      const r = await assistantRespond({ request, part, mode });
      reply = r.text;
    } else if (decision === DECISION.ALLOW || decision === DECISION.ALLOW_FLAGGED) {
      verdict = decision === DECISION.ALLOW_FLAGGED ? 'Allowed (flagged)' : 'Allowed';
      mode = intent === 'CONCEPT' ? 'concept' : intent === 'REVIEW' ? 'review' : 'assist';
      const r = await assistantRespond({ request, part, mode });
      reply = r.text;
    }

    const entry = {
      time: new Date().toISOString(),
      partId: part.id,
      partTitle: part.title,
      rule: part.rule,
      request,
      intent,
      verdict,
      reason,
      justification: justification || null,
    };
    this.record.unshift(entry);

    // Sync to Canvas. Mock resolves instantly; LIVE posts to AGS.
    await postInteractionRecord(this.record);

    return { outcome: 'handled', reply, entry };
  }

  getRecord() {
    return this.record;
  }
}
