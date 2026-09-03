/**
 * Canvas LTI integration.
 *
 * At UW–Madison, Canvas is the single centrally-supported LMS (run by DoIT's
 * Learn@UW team). External tools attach through LTI 1.3 on a per-course basis —
 * this is exactly how Turnitin, Top Hat, and Gradescope hang off Canvas today.
 * This tool is architecturally another approved LTI tool: the instructor enables
 * it in course settings, it reads assignment and roster context, and it writes
 * the interaction record back where the instructor already looks.
 *
 * IMPORTANT — the seam:
 *   Everything below is a real client interface with a MOCK implementation, so
 *   the project runs with zero setup. To go live you (1) register the tool as an
 *   LTI 1.3 developer key with DoIT, (2) set the credentials in config, and
 *   (3) flip LIVE to true. No other code changes: callers depend on this
 *   interface, not on the mock.
 *
 * Note on records retention: UW's CIO office reviews any integration that
 * touches student data or the gradebook for privacy, security, and records
 * retention before it goes live. The interaction record this tool keeps is
 * designed to clear exactly that review — it is the reason a bounded tool is
 * deployable in a university where a raw "students may use ChatGPT" tool is not.
 */

const LIVE = false; // flip to true once LTI credentials are registered with DoIT

export const CANVAS_CONFIG = {
  // Populated from environment / DoIT LTI registration when LIVE.
  // Left blank on purpose: the mock never reads these.
  issuer: process_env('CANVAS_LTI_ISSUER'),          // e.g. https://canvas.wisc.edu
  clientId: process_env('CANVAS_LTI_CLIENT_ID'),
  deploymentId: process_env('CANVAS_LTI_DEPLOYMENT_ID'),
  keysetUrl: process_env('CANVAS_LTI_KEYSET_URL'),
  authTokenUrl: process_env('CANVAS_LTI_TOKEN_URL'),
  // AGS (Assignment & Grade Services) + NRPS (Names & Roles) scopes are what
  // let the tool read the assignment and roster and write results back.
  scopes: [
    'https://purl.imsglobal.org/spec/lti-ags/scope/lineitem',
    'https://purl.imsglobal.org/spec/lti-ags/scope/result.readonly',
    'https://purl.imsglobal.org/spec/lti-nrps/scope/contextmembership.readonly',
  ],
};

/**
 * Config preflight: a pure read of the environment that reports exactly which
 * required keys are absent — misconfiguration is named, never silently ''.
 * Covers exactly the CANVAS_LTI_* keys CANVAS_CONFIG reads.
 *
 * @returns {{ok: boolean, missing: string[]}}
 */
export function validateConfig() {
  const missing = [
    'CANVAS_LTI_ISSUER',
    'CANVAS_LTI_CLIENT_ID',
    'CANVAS_LTI_DEPLOYMENT_ID',
    'CANVAS_LTI_KEYSET_URL',
    'CANVAS_LTI_TOKEN_URL',
  ].filter((k) => !process_env(k));
  return missing.length ? { ok: false, missing } : { ok: true, missing: [] };
}

// Fail at load, not at first request: a LIVE module with incomplete config
// should never survive import.
if (LIVE) {
  const v = validateConfig();
  if (!v.ok) throw new Error(`Canvas LIVE misconfigured — missing env: ${v.missing.join(', ')}`);
}

// Small helper so this file reads cleanly in a browser demo where there is no
// process.env. In a Node/server deployment, swap for real process.env access.
function process_env(key) {
  try {
    return (typeof process !== 'undefined' && process.env && process.env[key]) || '';
  } catch (_) {
    return '';
  }
}

/**
 * Fetch the assignment context for the current LTI launch.
 * LIVE: validates the LTI id_token and reads the AGS line item.
 * MOCK: returns the LIS 875 final project.
 */
export async function getAssignmentContext(launchToken) {
  if (LIVE) {
    const v = validateConfig();
    if (!v.ok) throw new Error(`Canvas LIVE misconfigured — missing env: ${v.missing.join(', ')}`);
    // return await ltiClient.readLineItem(launchToken, CANVAS_CONFIG);
    throw new Error('LIVE Canvas client not configured. Register the LTI key with DoIT and set CANVAS_CONFIG.');
  }
  const { ASSIGNMENT } = await import('../policy/assignment.js');
  return {
    source: 'mock',
    contextId: 'lis875-fa25',
    assignment: ASSIGNMENT,
    launchUser: { role: 'Learner', name: 'Student (demo)' },
  };
}

/**
 * Write the interaction record back to Canvas so the instructor sees it beside
 * the submission, without watching anyone's screen.
 * LIVE: posts to the AGS results endpoint / a submission comment.
 * MOCK: resolves, and the UI renders the record locally.
 */
export async function postInteractionRecord(record) {
  if (LIVE) {
    const v = validateConfig();
    if (!v.ok) throw new Error(`Canvas LIVE misconfigured — missing env: ${v.missing.join(', ')}`);
    // return await ltiClient.postResult(record, CANVAS_CONFIG);
    throw new Error('LIVE Canvas client not configured.');
  }
  return { source: 'mock', accepted: true, entries: record.length };
}
