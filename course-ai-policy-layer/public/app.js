import { ASSIGNMENT } from '../src/policy/assignment.js';
import { RULE } from '../src/policy/rules.js';
import { Engine } from '../src/engine.js';

const engine = new Engine();
let activePart = ASSIGNMENT.parts[0];
let pendingJustification = null; // holds the request awaiting a justification

const RULE_META = {
  [RULE.ALLOWED]:            { label: 'AI allowed',        cls: 'open',   band: 'AI is a tool here. Everything is recorded.' },
  [RULE.LOGIC_ONLY]:        { label: 'Reasoning only',    cls: 'scoped', band: 'Ask about the approach. The AI will not produce the artifact itself.' },
  [RULE.JUSTIFY_TO_EXCEED]: { label: 'Your own work',     cls: 'justify',band: 'You can proceed past this bound, but you must record why. Your instructor sees it.' },
  [RULE.PROHIBITED]:        { label: 'AI off',            cls: 'block',  band: 'AI is turned off for this part. The point is to do it yourself.' },
};

const el = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));

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
  if (!text.trim()) return;
  addBubble('me', esc(text));

  // If we're mid-justification, this message IS the justification.
  if (pendingJustification) {
    const req = pendingJustification;
    pendingJustification = null;
    el('input').placeholder = 'Ask the course assistant…';
    const { reply } = await engine.handle(activePart, req, text);
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
}

function renderRecord() {
  const rec = engine.getRecord();
  el('recCount').textContent = rec.length + (rec.length === 1 ? ' entry' : ' entries');
  const body = el('recBody');
  if (!rec.length) {
    body.innerHTML = `<div class="rec-empty">Nothing logged yet. Ask the assistant something above.</div>`;
    return;
  }
  const verdictCls = (v) =>
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
        ${rec.map((e) => `
          <tr>
            <td class="t-time">${new Date(e.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'})}</td>
            <td>${esc(e.partTitle)}</td>
            <td>${esc(e.request)}${e.justification ? `<div class="just">reason: ${esc(e.justification)}</div>` : ''}</td>
            <td><span class="verdict ${verdictCls(e.verdict)}">${esc(e.verdict)}</span></td>
            <td class="rec-note">${esc(e.reason)}</td>
          </tr>`).join('')}
      </tbody>
    </table>`;
}

// wire up
el('sendBtn').onclick = () => { const v = el('input').value; el('input').value=''; send(v); };
el('input').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const v = el('input').value; el('input').value=''; send(v); } });

renderAssignmentHeader();
renderActivePart();
renderChat(true);
renderRecord();
