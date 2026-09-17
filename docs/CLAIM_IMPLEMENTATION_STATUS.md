# Claim-to-implementation status — 2026-09-17

This table distinguishes current public deployment from code on `codex/claim-grounding-current`. A local test cannot establish that a new behavior is live. It also cannot establish accuracy on unseen resumes.

| Claim | Current evidence | Accurate wording / boundary |
| --- | --- | --- |
| Build with Gemini XPRIZE Top 100 of 1,400+ | [Official Top 100 list](https://gxp.moonshots.com/) names CareerForge AI and Shiori Wang; [organizer update](https://xprize.devpost.com/updates) reports over 1,400 submissions. | Top 100 selection is substantiated. |
| Gemini / Cloud Run / Secret Manager | Existing `app/api/gemini-audit/route.ts` invokes Gemini; `infra/gcp/deploy.sh` binds `GEMINI_API_KEY` from Secret Manager. The public `/api/healthz` responded `ok: true` and `geminiConfigured: true` on 2026-09-17. | Existing service is live. This does **not** show that this branch's new gate is deployed, nor independently inspect the live secret binding. |
| Next.js | Next.js is a dependency; the deployed-compatible build uses Vinext. | Say “Next.js-compatible Vinext runtime” if runtime precision matters; do not imply the native Next server is deployed. |
| Claim provenance / ProofGraph | `lib/analyzer.ts` prioritizes original resume excerpts by role relevance and constructs a deterministic graph; candidate-supplied URLs are stored by `components/CareerForge.tsx`. External URLs are not checked for content or ownership. | “Source-linked excerpts and candidate-supplied artifact visualization,” not “ProofGraph verifies claims.” |
| Runtime schema validation | `lib/gemini-audit/validation.ts` uses Zod after Gemini generation; malformed outputs fail closed. New tests cover this. | Implemented and locally tested for the Gemini audit path; not yet deployed from this branch. |
| Citation-enforced auditing | `app/api/gemini-audit/route.ts` resolves cited IDs and invokes a second pass of the **same** Gemini model; partial/unsupported/invalid results are withheld. New and worker-route tests cover behavior. | “Second-pass model-based citation consistency check,” not independent/human factual verification. Not yet deployed from this branch. |
| SHA-256 receipts | Audit route hashes normalized input and displayed output; Launch Operator has input/output digests. | Digests support reproducibility, not tamper-proof signatures or truth guarantees. New audit output digest is not yet deployed. |
| GPT claim verification | No OpenAI/GPT verification path. The separate auditor uses Gemini; the core analyzer is deterministic. | Do not claim GPT claim verification. |
| No-fabrication guardrail | Core analyzer keeps job skills absent from the resume as gaps. It cannot establish whether the original resume is truthful. | “Keeps absent role skills as gaps,” not “prevents fabricated resume claims.” |
| ATS / Digital Twin / counterfactual | `lib/analyzer.ts` computes designer-authored deterministic scores and simulations; no external validity study. | Explicitly label heuristic or simulated. Never claim real ATS/recruiter outcome prediction. |

## Resume wording that is supportable today

“Selected to the Build with Gemini XPRIZE Top 100 (from 1,400+ submissions) for CareerForge AI, an evidence-first career tool with source-linked resume recommendations and a Gemini auditor deployed on Cloud Run; built and locally tested runtime schema validation and a second-pass, same-model citation consistency gate, with SHA-256 input/output digests, pending production rollout.”

This wording is intentionally longer than an ideal resume bullet because the deployed and branch-only features have different statuses. It may be split into two bullets. After deployment, replace “pending production rollout” only when a recorded live call demonstrates both support and rejection behavior. No accuracy or improvement percentage belongs in the resume until the held-out evaluation is complete.
