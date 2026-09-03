import { ASSIGNMENT } from '../src/policy/assignment.js';
import { RULE } from '../src/policy/rules.js';
import { Engine } from '../src/engine.js';

const engine = new Engine();
let activePart = ASSIGNMENT.parts[0];
let pendingJustification = null; // holds the request awaiting a justification
let sending = false; // in-flight guard: only one engine.handle at a time

const RULE_META = {
  [RULE.ALLOWED]:            { label: 'AI allowed',        cls: 'open',   band: 'AI is a tool here. Everything is recorded.' },
  [RULE.LOGIC_ONLY]:        { label: 'Reasoning only',    cls: 'scoped', band: 'Ask about the approach. The AI will not produce the artifact itself.' },
  [RULE.JUSTIFY_TO_EXCEED]: { label: 'Your own work',     cls: 'justify',band: 'You can proceed past this bound, but you must record why. Your instructor sees it.' },
  [RULE.PROHIBITED]:        { label: 'AI off',            cls: 'block',  band: 'AI is turned off for this part. The point is to do it yourself.' },
};

const el = (id) => document.getElementById(id);
// Single quotes are escaped too (audit low L1): an unescaped ' inside an
// attribute delimited by single quotes is an XSS sink.
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

function renderAssignmentHeader() {
  el('asgCourse').textContent = ASSIGNMENT.course;
  el('asgTitle').textContent = ASSIGNMENT.title;
  el('asgWeight').textContent = ASSIGNMENT.weight;
  el('asgSubmission').textContent = ASSIGNMENT.submission;
  el('asgSummary').textContent = ASSIGNMENT.summary;
}

function renderParts() {
  const wrap = el('parts');
  wrap.innerHTML = '';
  ASSIGNMENT.parts.forEach((p) => {
    const meta = RULE_META[p.rule];
    const tab = document.createElement('button');
    tab.className = 'part-tab' + (p.id === activePart.id ? ' active' : '');
    tab.innerHTML = `
      <span class="part-n">Part ${p.n}</span>
      <span class="part-title">${esc(p.title)}</span>
      <span class="chip ${meta.cls}">${meta.label}</span>`;
    tab.onclick = () => { activePart = p; pendingJustification = null; renderActivePart(); renderChat(true); };
    wrap.appendChild(tab);
  });
}

function renderActivePart() {
  const p = activePart;
  const meta = RULE_META[p.rule];
  el('partBrief').textContent = p.brief;
  el('partRuleNote').textContent = p.ruleNote;
  const band = el('band');
  band.className = 'band ' + meta.cls;
  band.innerHTML = `<span class="dot"></span><div><b>${meta.label}.</b> ${meta.band}</div>`;
  renderParts();
}

function addBubble(cls, html) {
  const c = el('chat');
  const b = document.createElement('div');
  b.className = 'bubble ' + cls;
  b.innerHTML = html;
  c.appendChild(b);
  c.scrollTop = c.scrollHeight;
  return b;
}

function renderChat(reset) {
  if (reset) {
    el('chat').innerHTML = '';
    addBubble('sys', `Now working on <b>Part ${activePart.n} — ${esc(activePart.title)}</b>`);
  }
}

async function send(text) {
  // Refuse a second send while one is in flight: two rapid Enters (or a
  // double-click) must never interleave engine.handle calls.
  if (sending || !text.trim()) return;
  sending = true;
  el('sendBtn').disabled = true;
  addBubble('me', esc(text));

  // A failure anywhere in the send path (assistant, Canvas sync) must not
  // vanish silently: surface it, and re-render the record panel so it matches
  // engine.record — the source of truth. Depending on where the failure hit,
  // the interaction may or may not have landed, so the copy claims neither.
  try {
    // If we're mid-justification, this message IS the justification.
    if (pendingJustification) {
      const req = pendingJustification;
      // Recovery invariant: the armed justification is cleared only after
      // engine.handle resolves. Clearing it before the await lost the gate
      // state whenever the send failed mid-justification.
      const { reply } = await engine.handle(activePart, req, text);
      pendingJustification = null;
      el('input').placeholder = 'Ask the course assistant…';
      addBubble('ai flagged', esc(reply) + `<div class="flag">Recorded as: exceeded bound, justified.</div>`);
      renderRecord();
      return;
    }

    const { outcome, reply } = await engine.handle(activePart, text);

    if (outcome === 'gate') {
      // A new gate supersedes any older one: strip older gates' action buttons
      // so a stale button can never arm a justification for this newer request.
      el('chat').querySelectorAll('.gate-actions').forEach((n) => n.remove());
      // student must justify to proceed — buttons live on THIS bubble
      const gateBubble = addBubble('gate',
        esc(reply) +
        `<div class="gate-actions">
          <button data-action="justify">Proceed and record why</button>
          <button data-action="backoff" class="ghost">I'll do it myself</button>
        </div>`);
      gateBubble.querySelector('[data-action="justify"]').onclick = () => {
        pendingJustification = text;
        el('input').placeholder = 'Why did you need AI on this part? (goes in the record)';
        el('input').focus();
        addBubble('sys', 'Type your reason below. It will be recorded for your instructor.');
      };
      gateBubble.querySelector('[data-action="backoff"]').onclick = () => {
        // Backing off disarms the gate: the next message is a fresh request,
        // never a justification. Without this, the armed request survives and
        // the next message is recorded 'Exceeded (justified)'.
        pendingJustification = null;
        el('input').placeholder = 'Ask the course assistant…';
        addBubble('sys', 'Good call — this is the part to do yourself. Nothing recorded against you.');
      };
      return;
    }

    // handled
    const cls = reply && /turned off|not permitted|withheld|reasoning and approach/i.test(reply) ? 'ai block' : 'ai';
    addBubble(cls, esc(reply));
    renderRecord();
  } catch (err) {
    console.error(err); // surfaced in the UI below; logged for debugging
    if (pendingJustification) {
      // Failure mid-justification: the armed request survived (recovery
      // invariant above), so stay in justification mode and say so.
      el('input').placeholder = 'Why did you need AI on this part? (goes in the record)';
      addBubble('sys', 'Something went wrong — your justification was kept. Send it again.');
    } else {
      addBubble('sys', 'Something went wrong. Your request may not have been completed — check the record panel.');
    }
    renderRecord();
  } finally {
    // Release the guard on every path; refocus the input so a refused or
    // failed send never strands the keyboard.
    sending = false;
    el('sendBtn').disabled = false;
    el('input').focus();
  }
}

function renderRecord() {
  const rec = engine.getRecord();
  el('recCount').textContent = rec.length + (rec.length === 1 ? ' entry' : ' entries');
  const body = el('recBody');
  if (!rec.length) {
    body.innerHTML = `<div class="rec-empty">Nothing logged yet. Ask the assistant something above.</div>`;
    return;
  }
  // A null/undefined verdict renders an em dash, never the string 'null'.
  const verdictText = (v) => (v == null ? '—' : String(v));
  const verdictCls = (v) =>
    v == null ? '' :
    /Blocked/.test(v) ? 'blocked' :
    /Exceeded/.test(v) ? 'exceeded' :
    /flagged/i.test(v) ? 'flagged' : 'allowed';

  body.innerHTML = `
    <table>
      <thead><tr>
        <th style="width:70px">Time</th><th style="width:120px">Part</th>
        <th>Request</th><th style="width:140px">Outcome</th><th>Note</th>
      </tr></thead>
      <tbody>
        ${rec.map((e) => {
          const v = verdictText(e.verdict);
          const cls = verdictCls(e.verdict);
          // The engine marks an entry synced:false when the Canvas write fails;
          // surface it to the instructor instead of showing a clean record.
          const sync = e.synced === false ? '<div class="sync-warn">not synced</div>' : '';
          return `
          <tr>
            <td class="t-time">${new Date(e.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</td>
            <td>${esc(e.partTitle)}</td>
            <td>${esc(e.request)}${e.justification ? `<div class="just">reason: ${esc(e.justification)}</div>` : ''}</td>
            <td><span class="verdict${cls ? ' ' + cls : ''}">${esc(v)}</span>${sync}</td>
            <td class="rec-note">${esc(e.reason)}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
}

// wire up
function submit() {
  // Checked synchronously, before clearing: a send refused by the in-flight
  // guard keeps its text in the input instead of being dropped silently.
  if (sending) return;
  const v = el('input').value;
  if (!v.trim()) return;
  el('input').value = '';
  send(v);
}
el('sendBtn').onclick = submit;
el('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

renderAssignmentHeader();
renderActivePart();
renderChat(true);
renderRecord();
