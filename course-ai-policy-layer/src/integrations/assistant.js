/**
 * Bounded assistant integration.
 *
 * The policy engine (src/policy/) owns the decision: given the active part's
 * rule and the student's intent, what is allowed. This module is the thing that
 * actually answers the student once the policy has allowed it — the bounded
 * assistant. In a live deployment that is a hosted agent (the Obvious model is
 * the intended backend; its own product already provides the bounded workspace
 * and the interaction trail primitive this builds on).
 *
 * The key architectural point, and the thing worth saying out loud: the model
 * never decides what is permitted. The policy decides; the model only produces
 * the allowed response. That separation is what makes the tool auditable and
 * what keeps a capable model from quietly widening its own bounds.
 *
 * The seam works exactly like the Canvas client: real interface, mock impl,
 * one flag to go live.
 */

const LIVE = false; // flip to true once the assistant endpoint + key are set

export const ASSISTANT_CONFIG = {
  endpoint: env('ASSISTANT_ENDPOINT'), // hosted bounded-assistant endpoint
  apiKey: env('ASSISTANT_API_KEY'),    // set via environment, never committed
  // System framing is generated from the part rule so the model is briefed on
  // its bound every call — but the hard gate stays in the policy engine.
  boundedByPolicy: true,
};

/**
 * Config preflight: a pure read of the environment that reports exactly which
 * required keys are absent — misconfiguration is named, never silently ''.
 *
 * @returns {{ok: boolean, missing: string[]}}
 */
export function validateConfig() {
  const missing = ['ASSISTANT_ENDPOINT', 'ASSISTANT_API_KEY'].filter((k) => !env(k));
  return missing.length ? { ok: false, missing } : { ok: true, missing: [] };
}

// Fail at load, not at first request: a LIVE module with incomplete config
// should never survive import.
if (LIVE) {
  const v = validateConfig();
  if (!v.ok) throw new Error(`Assistant LIVE misconfigured — missing env: ${v.missing.join(', ')}`);
}

function env(key) {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || '';
  } catch (_) {
    return '';
  }
}

/**
 * Produce an allowed response. Only ever called AFTER the policy engine has
 * returned ALLOW or ALLOW_FLAGGED for this request — see src/engine.js.
 *
 * @param {object} args
 * @param {string} args.request  the student's message
 * @param {object} args.part     the active assignment part (carries the rule)
 * @param {string} args.mode     'concept' | 'review' | 'assist' — how the policy scoped it
 * @returns {Promise<{text: string, source: string}>}
 */
export async function respond({ request, part, mode }) {
  if (LIVE) {
    const v = validateConfig();
    if (!v.ok) throw new Error(`Assistant LIVE misconfigured — missing env: ${v.missing.join(', ')}`);
    // return await callBoundedAssistant({ request, part, mode }, ASSISTANT_CONFIG);
    throw new Error('LIVE assistant not configured. Set ASSISTANT_CONFIG and flip LIVE.');
  }
  // Mock responses. Deterministic, so the repo reads clearly without a model.
  // These stand in for real generation; the point on display is the boundary,
  // not the eloquence of the answer.
  if (mode === 'concept') {
    return {
      source: 'mock',
      text:
        `Here's the idea in plain terms so you can put it in your own words and code: ` +
        `[a real deployment returns a genuine explanation here, scoped to understanding — ` +
        `it explains the concept behind "${truncate(request)}" without producing your artifact].`,
    };
  }
  if (mode === 'review') {
    return {
      source: 'mock',
      text:
        `Looking at what you wrote: [a real deployment gives targeted feedback on your own work here — ` +
        `it points at what to reconsider without rewriting it for you].`,
    };
  }
  return {
    source: 'mock',
    text:
      `[a real deployment returns a genuine, in-bounds response here]. Everything we do on this part ` +
      `is in your instructor's record.`,
  };
}

function truncate(s, n = 60) {
  s = String(s || '');
  return s.length > n ? s.slice(0, n) + '…' : s;
}
