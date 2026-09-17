# CareerForge AI

> Evidence-driven career intelligence for serious technical candidates.

CareerForge turns a resume and job description into a traceable application
strategy. It measures role alignment, identifies skill gaps, generates
source-linked resume bullets, and prepares interview questions without
inventing experience.

The product is deliberately different from a generic “AI resume writer”:
every recommendation is attached to evidence already present in the resume,
while unsupported requirements remain visible as gaps.

## Product capabilities

- **Resume ingestion** — paste text or import PDF, TXT, and Markdown resumes.
- **Role intelligence** — analyze any job description against a normalized
  technical skill taxonomy.
- **ATS-style heuristic diagnostics** — inspect keyword coverage, structure,
  evidence density, and role alignment; not a prediction of employer ATS results.
- **Evidence ledger** — trace every generated bullet back to a resume project
  or experience.
- **ProofGraph visualization** — attach candidate-supplied repositories,
  deployments, benchmarks, and case studies to claims for inspection; links
  are not automatically verified as proof.
- **Counterfactual heuristic** — compare modeled match lift, time cost, and
  credibility risk; these are not externally validated outcome estimates.
- **Recruiter Digital Twin simulation** — inspect four deterministic,
  designer-authored reviewer lenses, not real recruiter judgments.
- **Gemini evidence auditor** — ask Gemini 3.5 Flash for a constrained second
  opinion. The proposed strengths must cite supplied evidence IDs and pass a
  second-pass check by the same model. This is model-based consistency checking,
  not independent human verification.
- **Gemini Launch Operator** — turn real aggregate launch metrics and
  anonymized feedback into one falsifiable 48-hour business experiment. The
  decision cites its inputs and produces hashed input/output receipts.
- **Adversarial answer lab** — pressure-test interview answers for ownership,
  architecture, trade-offs, verification, and failure awareness.
- **No-fabrication scope** — role skills absent from the input remain gaps,
  rather than being silently inserted as candidate experience. The system
  cannot establish whether the original resume itself is truthful.
- **Gap planning** — turn missing requirements into concrete portfolio or
  learning actions.
- **Tailored reports** — generate role-specific bullets and evidence-backed
  interview questions.
- **Local persistence** — keep the working draft and analysis in the browser.
- **Export** — download the current application brief as a text report.

## Quick start

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. Select **Re-run analysis** to replace the
included sample resume and job description with your own.

```bash
npm run lint
npm run build
```

## Architecture

```text
 Resume / job description
          │
          ▼
 deterministic extraction ──► normalized skill taxonomy
          │
          ├──► evidence ledger ──► grounded resume bullets
          ├──► coverage model  ──► match + ATS diagnostics
          ├──► missing skills  ──► gap plan + interview prep
          └──► structured evidence only
                         │
                         ▼
               Gemini 3.5 evidence audit
                         │
                         ▼
        cited strengths + honest gaps + next action

 aggregate launch ledger ──► Gemini Launch Operator
          │                         │
          └── real metrics only     └── cited experiment + signed receipt
```

The core analysis runs locally and deterministically, so the product stays
fast, inspectable, and usable without an API key. Two explicit server-side
Gemini actions add a constrained evidence audit and a business operating
decision without becoming the source of truth. Cloud Run logs only the model,
request ID, counts, and SHA-256 digests; it does not log resume excerpts,
feedback text, or API keys.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system boundaries,
scoring rules, trade-offs, and the production roadmap.
See [docs/CITATION_ENFORCEMENT.md](docs/CITATION_ENFORCEMENT.md) for the
second-pass model-based citation gate, runtime schema, tests, and limitations.
See [docs/CLAIM_IMPLEMENTATION_STATUS.md](docs/CLAIM_IMPLEMENTATION_STATUS.md)
for claim-by-claim implementation and deployment status. The synthetic
evaluation dataset and unscored protocols live under [evaluation/](evaluation/).

## Tech stack

- React 19 + TypeScript
- Next.js-compatible Vinext runtime
- Vite + Cloudflare Workers deployment
- Gemini API (`gemini-3.5-flash`) with structured JSON output
- Google Cloud Run + Secret Manager production path
- PDF.js resume extraction
- ESLint and GitHub Actions

## Repository map

```text
app/                    application shell and global design system
components/             interactive CareerForge workspace
lib/analyzer.ts         extraction, scoring, proof, simulation, and reviewer engine
docs/ARCHITECTURE.md    product architecture and production roadmap
.github/workflows/      automated quality checks
```

## Privacy and limitations

This version processes resume text in the browser and stores drafts in
`localStorage`. If the user explicitly clicks **Run Gemini audit**, the app
sends derived evidence excerpts and gaps—not the original uploaded file—to the
Gemini API. If the user runs **Launch Operator**, it sends only the aggregate
metrics and anonymized feedback they entered. The score is an explainable
product heuristic, not a promise that an employer’s ATS will produce the same
result.

## Google Cloud deployment (cost-bounded)

Create a new Google Cloud project with billing and a small spend cap. Store one
Gemini API key in Secret Manager as `careerforge-gemini-key`, then run:

```bash
export GOOGLE_CLOUD_PROJECT="your-project-id"
export GOOGLE_CLOUD_REGION="us-central1"
bash infra/gcp/deploy.sh
```

The script deploys one **public** Cloud Run service with request-based billing,
zero minimum instances, and one maximum instance. The public route avoids the
private-audience token failure mode. Verify deployment at:

```text
GET /api/healthz
```

The response reports whether Gemini is configured but never returns the key.
The APIs also enforce small request-size limits, per-caller rate limits,
short digest caches, and strict validation of Gemini's cited source IDs. Set a
daily Gemini API quota in Google Cloud before sharing the public link; Cloud
Run's one-instance limit alone does not cap model spend.
See [docs/XPRIZE_EVIDENCE.md](docs/XPRIZE_EVIDENCE.md) for proof and disclosure
requirements.

## Build with Gemini XPRIZE disclosure

CareerForge AI v2 and its deterministic evidence engine were created during
the competition submission period. The XPRIZE upgrade adds the Gemini evidence
auditor, Cloud Run production path, privacy-preserving invocation receipts, and
an AI Launch Operator that turns real business evidence into a falsifiable
experiment. Any generic framework and AI-assistant use must
be disclosed in the final submission. Do not report users, revenue, or expenses
that cannot be supported by real records.

## 中文简介

CareerForge AI 是一个“有证据链”的求职智能系统：上传简历并粘贴职位描述后，
它会分析岗位匹配度、ATS 结构、技能缺口、可验证经历，并生成能够追溯到原始
项目的定制 bullet 和面试问题。系统不会为了提高匹配度而编造不存在的经历。

## License

MIT
