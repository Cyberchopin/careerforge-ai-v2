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
- **ATS diagnostics** — inspect keyword coverage, structure, evidence density,
  and role alignment.
- **Evidence ledger** — trace every generated bullet back to a resume project
  or experience.
- **ProofGraph** — attach repositories, deployments, benchmarks, and case
  studies to individual claims, then inspect confidence dimension by dimension.
- **Counterfactual simulator** — compare potential match lift, time cost, and
  credibility risk before choosing the next portfolio or resume action.
- **Recruiter Digital Twin** — review the same application through ATS,
  recruiter, engineering-manager, and skeptical-interviewer lenses.
- **Gemini evidence auditor** — ask Gemini 3.5 Flash for a constrained second
  opinion. The model sees only the structured evidence ledger, must cite
  supplied evidence IDs, and cannot convert a gap into a resume claim.
- **Adversarial answer lab** — pressure-test interview answers for ownership,
  architecture, trade-offs, verification, and failure awareness.
- **No-fabrication guardrail** — missing skills are never silently inserted
  into the resume.
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
```

The core analysis runs locally and deterministically, so the product stays
fast, inspectable, and usable without an API key. An optional server-side
Gemini audit adds qualitative review without becoming the source of truth.
Cloud Run logs only the model, request ID, evidence count, and SHA-256 digest;
they do not log resume content.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system boundaries,
scoring rules, trade-offs, and the production roadmap.

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
sends the derived evidence ledger and gaps—not the uploaded file—to the Gemini
API. The score is an explainable product heuristic, not a promise that an
employer’s ATS will produce the same result.

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
See [docs/XPRIZE_EVIDENCE.md](docs/XPRIZE_EVIDENCE.md) for proof and disclosure
requirements.

## Build with Gemini XPRIZE disclosure

CareerForge AI v2 and its deterministic evidence engine were created during
the competition submission period. The XPRIZE upgrade adds the Gemini evidence
auditor, Cloud Run production path, privacy-preserving invocation receipts, and
business-validation workflow. Any generic framework and AI-assistant use must
be disclosed in the final submission. Do not report users, revenue, or expenses
that cannot be supported by real records.

## 中文简介

CareerForge AI 是一个“有证据链”的求职智能系统：上传简历并粘贴职位描述后，
它会分析岗位匹配度、ATS 结构、技能缺口、可验证经历，并生成能够追溯到原始
项目的定制 bullet 和面试问题。系统不会为了提高匹配度而编造不存在的经历。

## License

MIT
