# Obvious for Education

**By: Omkar Kapade**

*Note: This document outlines a proposed Education vertical for Obvious, combining a phased product roadmap, product requirements, and go-to-market strategy. It builds on Obvious's existing agent workspace and its bounded-execution and record primitives to open a new persona-driven vertical, establish a defensible governance layer for AI-in-coursework, and validate a growth wedge with measured investment.*

---

## 1. Overview

Obvious has established itself as the workspace where non-trivial work gets built with agents — a place where a person sets a goal, a bounded agent loop does the work, and the whole trail is recorded and returned. The factory pattern that makes this work for engineers (a spec, a bounded loop, a record) is the company's real asset. It generalizes.

Education is where it generalizes first, and most cleanly.

As AI moves into coursework, every institution is confronting the same unsolved problem, and it is not that students use AI. It is that course policies already say *how* AI may be used — prohibited on the work whose point is the student's own thinking, allowed as a tool where using it well is the skill, scoped tightly in between — and nothing enforces those policies at the moment of use. The rule lives in a syllabus. It is checked, if at all, after submission, by a plagiarism tool that can only answer the wrong question: did AI touch this.

Obvious already owns the two primitives this problem needs: a bounded agent workspace and an interaction record. Pointed at the education persona, with a policy layer on top, that becomes the governance layer institutions are currently reaching for bans and detectors to approximate. This proposal outlines a phased approach to build that layer, prove it at one institution, and expand it into a horizontal governance product for any regulated persona.

## 2. Problem statement

Obvious has built a workspace that removes the hard part of getting real work out of agents: bounding what the agent does, keeping the work in one place, and recording the trail. For engineers, that trail is a stream of reviewable PRs. The primitive is general; the engineering framing is one instance of it.

Education presents immediate, large demand for exactly that primitive, applied to a different persona.

A real course AI policy is graduated. It prohibits assistance on the reflective work whose purpose is to load ideas into the student's head. It holds AI to reasoning-only where writing the code yourself is the skill. It requires AI in the units that teach it as a tool. That nuance is real, it is already written down, and today it is enforced by trust plus after-the-fact plagiarism detection. The result is a false choice: instructors either ban AI (losing the teaching value, and getting ignored) or allow it wholesale (losing any ability to know it was used within bounds).

There is no middle, because nothing applies the rule while the work happens. That is the gap. It is a bounded-workspace-plus-record problem, which is precisely what Obvious already does for engineers.

## 3. Product goals

The objective of Obvious for Education is to establish Obvious as the governance layer for AI use in coursework, built directly on the company's existing bounded-execution and record primitives.

The product is guided by the following goals:

- Extend Obvious's bounded workspace and interaction record to the education persona, with a policy layer that enforces course AI rules at the moment of use.
- Give instructors a way to scope AI part-by-part on an assignment and trust the outcome without policing anyone.
- Give institutions a tool that clears privacy, security, and records-retention review — the real gate on any AI tool touching student data.
- Establish a repeatable adoption motion: instructors first, institution through the compliance door, campus by campus.
- Prove a generalizable pattern (bounded AI for a persona whose mistakes have consequences) that extends beyond education into any regulated vertical.

### Out of scope

This initiative does not build:

- A Learning Management System. It integrates with the one the institution already runs (Canvas).
- A plagiarism or AI detector. The tool records and enforces; it does not accuse.
- An automated grader.
- A student productivity app or a general chatbot.
- A separate product line. This is Obvious's existing primitives, pointed at a new persona.

## 4. The product

Obvious for Education packages Obvious's existing bounded-workspace and record infrastructure into an offering for instructors, students, and institutions. Rather than a separate platform, it is a policy-and-integration layer on top of what Obvious already runs.

The product consists of five pillars:

**Policy engine.** The core. An instructor scopes AI part-by-part on an assignment using four rule types: allowed, reasoning-only, your-own-work (proceed past the bound only with a recorded justification), and off. The engine classifies each student request and rules on it against the active part's policy before any model is called. The policy decides; the model produces.

**Bounded student workspace.** The student works under the active rule inside Obvious's existing bounded environment. Where AI is allowed, it assists; where it is scoped or off, the boundary holds. This is Obvious's bounded loop, briefed by the instructor's rule.

**Interaction record.** Every request, decision, and justification is recorded — Obvious's existing trail primitive, surfaced for the instructor. The instructor reads the flagged exceptions, not every interaction. This is the artifact that makes trust scale and the artifact that clears institutional review.

**LMS integration.** An LTI 1.3 tool that reads assignment and roster context from the institution's LMS (Canvas at the beachhead) and writes the record back where the instructor already looks. The same integration path Turnitin, Top Hat, and Gradescope use.

**Campus program.** A builder-led adoption channel through student developers, AI clubs, and hackathons that seeds Obvious on campus and creates a long-term relationship with the next generation of founders and engineers.

## 5. Phase 1: Education foundation

### Objective

Validate the wedge at one institution by making Obvious the tool that turns a course's existing AI policy into something enforceable, with a record that clears compliance review. V1 packages Obvious's existing primitives into an education-ready governance layer for a single LMS and a single beachhead institution.

### Deliverables

- **Policy authoring.** Instructor-facing per-part rule authoring on a real assignment, in plain terms that mirror how a syllabus already reads.
- **Live enforcement.** The four rule types enforced at the moment of use, including the justify-to-exceed flow.
- **Interaction record.** The full trail, synced to Canvas via LTI, surfaced to the instructor with exceptions flagged.
- **Canvas LTI integration.** A registered LTI 1.3 tool with the gradebook and roster scopes, deployable in a single course.
- **Design-partner instructors.** A small pilot with instructors who already run scoped AI policies (the archetype: a course that already writes graduated AI rules), to validate adoption and prioritize the roadmap. The beachhead is UW–Madison, whose newly launched College of Computing and Artificial Intelligence (see §9) makes it an unusually receptive first institution.

### Success criteria

- Instructors set non-trivial (scoped, not all-on/all-off) policies and keep them across assignments.
- Instructor review time per student drops toward "read the flagged exceptions only."
- The tool clears the institution's privacy, security, and records-retention review.
- Reduced student ambiguity about where the line is.

## 6. Phase 2: Platform expansion

### Objective

Expand from a single-course tool into a platform an institution can adopt at scale, and deepen the scoping model. V2 reduces integration effort across LMS ecosystems and moves scoping from per-part to within-part.

### Deliverables

- **Finer scoping.** Rules move from per-part to within-part: AI for the logic of a function but not its syntax, allowed for the test harness but not the implementation under test. The instructor draws the line exactly where the skill is. This is the most-requested depth.
- **Multi-LMS integrations.** Supported LTI integrations and implementation guides beyond Canvas — Moodle, Blackboard, and the Microsoft/Google education stacks — for interoperability, not replacement.
- **The record as the product.** Instructor-facing review tooling built around the flagged-exception workflow: a 30-second review of the cases that matter instead of a forensic audit of everything.
- **Institution-level deployment.** Course-by-course enablement becomes a campus-wide LTI deployment through the CIO/central-IT relationship.

### Success criteria

- Increased instructor adoption of scoped policies across departments.
- Within-part scoping validated with design partners.
- A campus-level deployment cleared and live at the beachhead institution.
- Clear requirements identified for the horizontal (non-education) expansion.

## 7. Phase 3: Horizontal governance

### Objective

Generalize the proven education pattern into a governance layer for any regulated persona. Education proves the shape; the enterprise version is the same engine pointed at a different rulebook.

### Direction

The pattern under the education product is not about students. It is: someone sets the rule, a bounded agent works inside it, everything is on the record — for any non-engineer persona whose mistakes have consequences and whose AI use must be bounded and recorded. Every regulated field writes its AI-use rules the same way education does. Some things the human must own, some the AI can assist, all of it auditable.

The rule changes per field — FERPA in education, HIPAA in health, classification in defense, audit trails in finance — but the engine is identical. This is where Obvious's education vertical becomes a horizontal governance product, and where the bounded-workspace-plus-record primitive pays off beyond the original engineering use case.

*(This tier is the long-range strategic bet. It is strongest introduced in conversation, once the concrete education product has earned the room, rather than led with.)*

## 8. Execution plan

The Education initiative builds on Obvious's existing platform rather than introducing a separate product line. The majority of effort concentrates on the policy layer, the LMS integration, and market validation, not on foundational infrastructure — the bounded workspace and the record already exist.

### Ownership model

Ownership stays function-based rather than requiring a dedicated Education org, so the initiative folds into existing planning:

- **Product** defines the roadmap, the scoping model, and pilot validation.
- **Engineering** delivers the policy engine and the LTI integration on top of existing primitives.
- **GTM & Marketing** lead instructor recruitment, the compliance conversation with institutions, and the campus program.
- **Design** owns the instructor and student surfaces.

### Sequencing

V1 validates demand at one institution with low engineering effort (it is mostly a policy layer plus one integration). V2 expands the platform and the scoping depth based on partner feedback. V3 generalizes only after the education pattern has proven itself. Each phase de-risks the next.

## 9. Go-to-market strategy

Success depends less on new infrastructure and more on establishing Obvious as the default governance layer for AI in coursework. The motion is bottom-up: instructors first, institution through compliance, expansion by campus.

The strategy runs on four reinforcing channels.

**1. Instructor adoption.** The primary wedge. Land with instructors who already write scoped AI policies and have no way to enforce them — they are pre-qualified, because they have signaled they want nuance over a ban. Low friction: an LTI tool enabled in one course that makes their existing policy real. The objective is to reduce the time from "I have a policy" to "my policy holds, and I only read the exceptions."

**2. Institutional adoption through compliance.** The expansion door is not the feature door. The institution's real anxiety is that any AI tool touching student data and the gradebook survives privacy, security, and records-retention review. The interaction record is the thing that clears that review. Sell governance to the CIO/central-IT office, not a feature to a department. That turns a handful of instructors into a campus license.

**3. Campus program.** A builder-led channel through student developers, AI clubs, and hackathons that seeds Obvious on campus and builds long-term familiarity with the next generation of founders and engineers. Evaluated on technical engagement, not social reach.

**4. Institutional partnerships.** Guest lectures, workshops, research labs, capstone support, hackathon sponsorships — introducing Obvious in the environments where students and faculty are already building with AI.

### Why this GTM

The sequence is deliberate: **instructors enforce policies → enforced policies clear compliance → compliance creates institutional demand → institutions create campus-wide deployment.** It leverages Obvious's existing strengths (the bounded workspace and record) while building a durable, defensible presence in education around the one thing detectors and bans cannot do.

### Beachhead → expansion

**Why UW–Madison.** The beachhead is not arbitrary. In July 2026, UW–Madison launched the College of Computing and Artificial Intelligence — its first new college in more than 40 years, backed by $100M in philanthropic commitments and over $50M in annual institutional investment, housing computer sciences, statistics, and the Information School. Its founding charter is explicitly about how AI should be developed, *governed*, and used, naming trust, fairness, and privacy as central questions. That is this product's thesis in the institution's own founding language: a governance layer for AI in coursework is not a hard sell to a college that was created, in part, to answer exactly that question.

Two things make UW the right first move specifically for this author. First, alum standing — the relationships and the credibility to get a pilot heard rather than cold-pitched. Second, a relationship with the college's founding dean, Remzi Arpaci-Dusseau, the person shaping the new college's academic direction and partnerships in its earliest, most formative window. A governance tool that lands during a new AI college's founding year, through its founding dean, is positioned to become part of how that college does AI-in-coursework from the start, rather than something retrofitted later.

**Expansion.** From UW, to peer R1 institutions with the same central-IT-plus-CIO-review structure, then the broader Canvas install base — Canvas dominates US higher ed, so the LTI build is reusable across most of the market.

## 10. Success metrics

Measured through adoption and trust, not revenue, in the early phases:

- % of instructors who set and keep scoped (non-blanket) policies.
- Median instructor review time per student (target: exceptions-only).
- Student-reported clarity on where the line is.
- Exception rate at the justify-to-exceed gate (a tuning signal, not a vanity number).
- The binary gate that actually matters: does it clear institutional privacy/security/records-retention review.

---

*Modeled on the AI-use policy of the LIS 875 final project at UW–Madison, a course the author took, used with the instructor's permission. Not affiliated with or endorsed by the instructor or the university. A working prototype of the policy engine, the per-part scoping, the justification flow, and the record accompanies this document.*
