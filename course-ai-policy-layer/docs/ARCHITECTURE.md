# Architecture

Four moving parts, and the order they run in is the design.

```
  student request
        │
        ▼
  ┌───────────────┐   1. classify intent        (policy/rules.js)
  │ policy engine │   2. evaluate vs part rule   (policy/rules.js)  ← the decision
  └───────┬───────┘
          │ allowed?
     no ──┴── yes
     │         │
     │         ▼
     │   ┌──────────────┐  3. produce the answer  (integrations/assistant.js)
     │   │  bounded     │     — only ever called after the policy allowed it
     │   │  assistant   │
     │   └──────┬───────┘
     │          │
     ▼          ▼
  ┌───────────────────┐  4. record everything, allowed or not
  │ interaction record│     syncs to the LMS  (integrations/canvas.js)
  └───────────────────┘
```

The single invariant: **the model is step 3, and it never sees steps 1–2.** The policy owns the decision; the model only generates an allowed response. This is what keeps the tool auditable and stops a capable model from widening its own bounds.

## The integration seam

Both external dependencies — the LMS and the bounded assistant — are written as real client interfaces with mock implementations and a `LIVE` flag. Callers depend on the interface, never the mock, so going live changes no orchestration code.

### Canvas (LMS)

`src/integrations/canvas.js` is an LTI 1.3 tool client. At UW–Madison, Canvas is the single centrally-supported LMS (DoIT / Learn@UW), and external tools attach through LTI on a per-course basis — the same path Turnitin, Top Hat, and Gradescope use.

Going live:
1. Register the tool as an LTI 1.3 developer key with DoIT (issuer, client ID, deployment ID, keyset + token URLs).
2. Request the AGS (Assignment & Grade Services) and NRPS (Names & Roles) scopes — these let the tool read the assignment and roster and write the record back beside the submission.
3. Set the credentials in config and flip `LIVE = true`.

Note on why this clears review: UW's CIO office reviews any integration touching student data or the gradebook for privacy, security, and **records retention** before it goes live. The interaction record isn't overhead — it's the thing that clears that review. A bounded tool that keeps an auditable record is deployable in a university where a raw "students may use ChatGPT" tool is not. The compliance gate and the product are the same object.

### Bounded assistant

`src/integrations/assistant.js` is the client for the thing that actually answers the student once the policy allows it. The intended backend is a hosted bounded assistant (the Obvious model provides the bounded workspace and interaction-trail primitives this builds on). It's briefed on the active part's rule every call, but — again — the hard gate stays in the policy engine, not in the model's system prompt.

Going live: set the endpoint and key, flip `LIVE = true`.

## Why the responses are stubbed

The mock assistant returns deterministic, in-bounds responses. That's deliberate: what this project demonstrates is the *boundary* and the *record*, not the quality of a generated answer. Wiring a real model in changes one file and zero decisions — the enforcement logic, the scoping, the justification flow, and the record are all real and running without it.
