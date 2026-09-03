# Course AI policy layer

A syllabus already says how AI can be used. It says it in different ways for different work — prohibited on the reflection, fine for brainstorming, reasoning-only where the skill is the point. Today that lives in a PDF and gets checked, if at all, after the work is submitted. Nothing applies the rule at the moment a student actually asks for help.

This is that layer. The instructor scopes AI part by part on an assignment. The student works inside the scope. Every interaction is recorded where the instructor already looks. Not a wall around AI, and not an honor-code PDF nobody enforces — the rule, applied while the work happens, with a record that makes it reviewable.

## Why this and not a plagiarism checker

Plagiarism detection runs after submission and asks one blunt question: did AI touch this. That's the wrong question. The real course policies I've read don't ban AI — they scope it. The instructor whose policy this is built on prohibits AI on the reflection (the point is to load ideas into your own head), holds it to reasoning-only where writing the code yourself is the skill, and *requires* it in the last weeks, because using AI well is itself a thing worth learning. A checker can't see any of that. It can't tell allowed use from prohibited use, and it can't tell the instructor what happened while the student worked. This can.

## What it does

An assignment is broken into parts. Each part carries one of four rules:

- **Allowed** — assistance is fine, and recorded.
- **Reasoning only** — AI can explain the approach; it won't produce the artifact. (Ask how to handle missing data; it won't write your cleaning code.)
- **Your own work** — you can proceed past the bound, but doing so requires a written reason that lands in the record. Accountability with a release valve, not an impassable wall.
- **AI off** — hard block, for the work whose whole purpose AI defeats.

The student sees the rule for the part they're on, works under it, and the interaction record — request, what was allowed, and any justification — syncs back to the LMS for the instructor. No screen-watching.

The demo is built on a real assignment: the LIS 875 final project at UW–Madison, 40% of the grade, a thesis defended with code the student has to stand behind. The parts and rules follow that course's actual policy shape.

## The one design decision that matters

**The policy decides. The model produces.**

The model never sees the rule and never decides what's permitted. The policy engine classifies the request and rules on it *first*; only if the request is allowed does the bounded assistant get called to answer. A student who tries to exceed a bound is handled by the policy and the record — not by hoping the model refuses. That separation is the whole reason this is auditable, and it's why a capable model can't quietly widen its own bounds.

## Running it

Open `public/index.html`. That's it — no build, no keys, no server. The policy engine, the per-part scoping, the justification flow, and the record are all real and running. The two external calls — the LMS and the bounded assistant — are stubbed behind real interfaces so the whole thing runs with nothing to configure.

```
src/
  policy/
    rules.js        the scoping model + the decision function (the core)
    assignment.js   the real LIS 875 final-project assignment, scoped part by part
  integrations/
    canvas.js       Canvas LTI 1.3 client — real interface, mock impl, one flag to go live
    assistant.js    bounded-assistant client (Obvious is the intended backend)
  engine.js         orchestration: classify → decide → (if allowed) answer → record
public/             the instructor/student UI, wired to the real engine
docs/
  POLICY_BASIS.md   the real course policy this is modeled on, and the permission for it
  ARCHITECTURE.md   how the pieces fit, and what "going live" actually takes
```

## Where this goes

The demo is the education instance. The pattern under it isn't about students.

**Per-part gets finer.** Rules here are per-part; the real version scopes within a part — AI for the logic of a function but not its syntax, allowed for the test harness but not the implementation it tests. The instructor draws the line where the skill is.

**The justification record is the product.** The instructor doesn't read every interaction — they read the flagged ones. "This student exceeded the bound on the model, and here's why" is a thirty-second review instead of a forensic audit. That's what makes trust scale to a real class, and it's the thing an LMS-native tool can do that a chatbot can't.

**It's the same shape for any regulated field.** Every field where AI use has to be bounded writes its rules the same way education does: some things the human must own, some the AI can assist, all of it on the record. Education is the demo because the rules are already written down and I took the course. The generalizable thing is: give a capable model only as much room as the worst-case mistake on that task can survive, and keep the record that proves you did. That line doesn't only apply to a classroom.

## What this is and isn't

The enforcement logic and the record are real. The assistant's responses are stubbed — the point on display is the boundary and the trail, not the eloquence of a generated answer. The LMS and assistant integrations are structured exactly as they'd really connect (LTI 1.3 with AGS/NRPS scopes for the gradebook and roster; a hosted bounded-assistant endpoint) and mocked so the repo runs on open. Going live is registering the LTI key with the university and flipping one flag — see `docs/ARCHITECTURE.md`.

---

*Modeled on the AI-use policy of the LIS 875 final project at UW–Madison, a course I took, used with the instructor's permission. It's not affiliated with or endorsed by the instructor or the university.*
