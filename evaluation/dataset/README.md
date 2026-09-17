# Controlled resume-claims dataset

This directory is step 1 of the CareerForge evaluation. It contains only synthetic records, so the ground truth is controlled rather than inferred from real resumes. The test data are committed for reproducibility; "sealed" means a documented no-tuning rule, not access control or secrecy from people who read the repository.

## Dataset unit

Each record represents one fictional resume and contains:

- five atomic evidence items with stable IDs;
- six candidate claims;
- exactly two `supported`, two `partial`, and two `fabricated` claims;
- explicit evidence links for supported and partial claims;
- no evidence links for fabricated claims;
- a human-authored ground-truth rationale for every claim.

The 24 resumes span frontend, data analysis, ML, backend, UX research, DevOps, product engineering, and research-assistant profiles. Names and facts are fictional. Templates are deliberately balanced so later results cannot be attributed to class imbalance.

The operational definitions and blind-scoring procedure are frozen in [../LABELING_PROTOCOL.md](../LABELING_PROTOCOL.md). Independent outside review has not occurred.

## Fixed split

- Seed: `20260916`
- Split unit: complete `resume_id`, never individual claims
- Development: 75% / 18 resumes / 108 claims
- Held-out test: 25% / 6 resumes / 36 claims

Splitting by resume prevents claims and evidence from one fictional candidate appearing in both sets. `development.jsonl` is the only split allowed during prompt, taxonomy, or schema tuning. `test.jsonl` is reserved for the final locked evaluation.

## Generate and verify

From the repository root:

```bash
node evaluation/dataset/build-dataset.mjs
node evaluation/dataset/verify-dataset.mjs
```

`generated/manifest.json` records the exact test IDs and SHA-256 hashes of every generated file. Re-running with unchanged source must reproduce the same hashes.

## Files

- `build-dataset.mjs`: controlled source cases, deterministic splitter, validation, hashes.
- `verify-dataset.mjs`: invariants, counts, and leakage check.
- `generated/all.jsonl`: all controlled records.
- `generated/development.jsonl`: tuning/development records.
- `generated/test.jsonl`: sealed evaluation records; do not inspect while tuning.
- `generated/manifest.json`: seed, ratios, counts, test IDs, and hashes.

## Known design limitation

This first dataset is synthetic and template-balanced. It enables exact ground truth and controlled comparisons, but cannot establish performance on naturally occurring resumes. Any later result must state that limitation.

The held-out set contains only six resumes and 36 claims. Claim-level observations are clustered within resumes, so eventual confidence intervals must resample or model at the resume level; treating all 36 claims as independent would overstate precision. Any final comparison must show the wide uncertainty and avoid sweeping population claims.

The original 144 claims were **not** designed to isolate citation-enforcement and schema-validation branches. Separate development-only probes are documented in [CHALLENGE_CASES.md](CHALLENGE_CASES.md). They do not alter the sealed split and cannot substitute for actual ablation results. No test-set metric has been reported.
