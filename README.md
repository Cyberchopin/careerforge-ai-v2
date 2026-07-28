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
          └──► missing skills  ──► gap plan + interview prep
```

The current release runs its analysis locally and deterministically. That makes
the demo fast, private, auditable, and usable without an API key. The analysis
boundary is intentionally isolated in `lib/analyzer.ts`, so an embedding model,
LLM reranker, database, or job-data provider can be introduced without
rewriting the product UI.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system boundaries,
scoring rules, trade-offs, and the production roadmap.

## Tech stack

- React 19 + TypeScript
- Next.js-compatible Vinext runtime
- Vite + Cloudflare Workers deployment
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
`localStorage`. It does not send candidate data to a model provider. The score
is an explainable product heuristic, not a promise that an employer’s ATS will
produce the same result.

## 中文简介

CareerForge AI 是一个“有证据链”的求职智能系统：上传简历并粘贴职位描述后，
它会分析岗位匹配度、ATS 结构、技能缺口、可验证经历，并生成能够追溯到原始
项目的定制 bullet 和面试问题。系统不会为了提高匹配度而编造不存在的经历。

## License

MIT
