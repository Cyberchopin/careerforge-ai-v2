# CareerForge AI Architecture

## 1. Product boundary

CareerForge separates candidate facts from generated recommendations:

1. **Input layer** accepts resume text, PDF, TXT, or Markdown plus a target job
   description.
2. **Extraction layer** maps text to a normalized skill taxonomy.
3. **Evidence layer** creates local references to resume sections.
4. **Scoring layer** evaluates overlap, resume structure, evidence density, and
   quantified impact.
5. **Recommendation layer** identifies gaps, prioritizes recorded excerpts, and creates interview
   questions.
6. **Decision layer** builds a claim proof graph, counterfactual action model,
   reviewer simulations, and adversarial answer checks.
7. **Presentation layer** exposes the result as an interactive workspace and
   exportable report.

The main invariant is:

> Generated recommendations may reframe extracted resume evidence, but must
> not silently introduce a role skill absent from the input. This is not a
> factual verification of the original resume.

## 2. Current runtime

The MVP is browser-first:

- `components/CareerForge.tsx` owns interaction and view state.
- `lib/analyzer.ts` is a pure, deterministic analysis module.
- PDF.js extracts uploaded PDF text in the browser.
- `localStorage` persists the last resume, role, and report version.
- External proof links are candidate-controlled and persisted locally.
- Resume files and full resume text stay in the browser. If the user explicitly
  invokes a Gemini feature, the server receives only bounded evidence excerpts,
  gaps, or aggregate launch metrics required for that request.

This architecture keeps the public demo private, reproducible, and inexpensive
while maintaining a clean seam for production services.

The server logs request IDs, model versions, counts, and SHA-256 digests. It
does not log resume excerpts, feedback text, or API keys.

## 2.1 AI-native operations

CareerForge uses Gemini in two distinct roles:

1. **Evidence Auditor** reviews candidate evidence but cannot create the source
   of truth. Every positive strength must cite a supplied evidence ID and pass
   a second-pass check by the same Gemini model. This check is not blind or
   independent human adjudication.
2. **Launch Operator** reviews only aggregate business metrics and anonymized
   feedback, chooses one falsifiable 48-hour experiment, and cites the metric
   or feedback IDs that justified the decision.

The Launch Operator returns both an input digest and a decision digest. This
creates a privacy-preserving consistency receipt: a digest can be recomputed
from the same input and output, but it is not a signature or independent proof
that a live model made a particular decision. It does not invent users, revenue, conversion, testimonials, or
expenses; zero remains a valid and visible value.

## 3. Scoring model

The role-match score combines:

- normalized skill overlap;
- number of evidence-bearing resume sections.

The ATS score combines:

- normalized skill overlap;
- basic resume structure signals;
- quantified evidence density.

Scores are capped below 100 because the system cannot observe an employer’s
actual ranking model, recruiter preferences, or applicant pool. The UI labels
the result as guidance rather than a hiring prediction. Neither ATS-style
scores nor simulated reviewer outputs have external validity measurements.

## 4. No-fabrication mechanism

`analyzeResume` first computes the intersection and difference between resume
skills and job skills.

- Skills in the intersection may be used to reframe an existing evidence item.
- Skills in the difference become explicit gaps and recommended next actions.
- Every tailored bullet carries its source section.

This produces a visible provenance trail from input text to recommendation,
not proof that the candidate's input is truthful. Candidate-supplied external
links in ProofGraph are displayed but not automatically verified or used as a
separate claim-verdict engine.

## 5. Decision intelligence

The counterfactual engine assigns each action:

- heuristic modeled match impact;
- time cost;
- credibility classification;
- action type (`Build`, `Verify`, or `Rewrite`).

The interface recomputes the selected plan in real time and blocks commitment
when a keyword-only action would introduce unsupported claims.

The Reviewer Digital Twin intentionally avoids pretending to reproduce a real
employer's proprietary model. Instead, four deterministic simulated lenses expose
different and explainable failure modes. The adversarial answer checker tests
for ownership, architecture, trade-offs, verification, and failure awareness.

## 6. Production evolution

The next production stages fit behind the existing analyzer boundary:

### Stage A — durable accounts

- authenticated candidate profiles;
- encrypted object storage for source documents;
- Postgres-backed roles, evidence, and report versions;
- retention and deletion controls.

### Stage B — semantic intelligence

- embeddings for skill and responsibility similarity;
- broader structured LLM extraction with runtime schema validation beyond the
  bounded Gemini audit;
- groundedness checks covering every generated recommendation, not only the
  audit's positive strengths;
- prompt and model version tracking.

### Stage C — market intelligence

- licensed job feeds and canonical company/role entities;
- role-change and closing-date monitoring;
- candidate-controlled alerts;
- skill-demand trend analytics.

### Stage D — enterprise governance

- tenant isolation and role-based access;
- audit events and data lineage;
- PII redaction;
- evaluation datasets, drift checks, and release gates;
- observability for latency, cost, extraction errors, and groundedness.

## 7. Suggested service decomposition

```text
web client
  ├─ document ingestion service
  ├─ career intelligence API
  │    ├─ taxonomy / extraction
  │    ├─ evidence graph
  │    ├─ scoring
  │    └─ generation + verification
  ├─ application workspace service
  └─ notification service

shared infrastructure
  ├─ PostgreSQL + vector index
  ├─ encrypted object storage
  ├─ queue / scheduled jobs
  └─ metrics, traces, and audit log
```

## 8. Engineering decisions

- **Deterministic first:** users can inspect why a score changed.
- **Evidence before generation:** provenance is a data model, not a disclaimer.
- **Progressive enhancement:** the product remains useful if an AI provider is
  unavailable.
- **Local-first core:** real resumes can be analyzed without an external API
  key; explicit Gemini actions send only the bounded derived data disclosed in
  the interface.
- **Accessible interaction:** keyboard focus, reduced-motion support, and
  responsive layouts are part of the design system.
