# CareerForge controlled resume-claims dataset

This directory is **Stage 1: Dataset Design** for the CareerForge evaluation
project. It intentionally contains no CareerForge scores, no baseline scores,
and no LLM-generated labels.

## What this benchmark measures

Each record defines a **closed synthetic evidence universe** for one candidate.
The candidate resume contains six claims, while the evidence packet contains
the complete authoritative facts available for that synthetic candidate.

Because the evidence universe is complete by construction, a claim can be
assigned controlled ground truth instead of asking a reviewer to guess whether
an omitted fact might exist elsewhere.

Every resume contains exactly:

- 2 `supported` claims copied faithfully from evidence,
- 2 `partial` claims based on real evidence but with a material exaggeration,
- 2 `fabricated` claims whose asserted fact is absent from the complete evidence
  universe.

The two partial-claim constructions are metric inflation and ownership/scope
inflation. The two fabricated-claim constructions are an invented technology
and invented mentoring/leadership. This makes the dataset useful for later
failure analysis without inventing post-hoc categories.

**Important limitation:** this is a controlled claim-evidence consistency
benchmark. It does not estimate how often real applicants fabricate claims, and
it does not prove that absence of evidence in an ordinary real resume is
evidence of fabrication. That inference is valid here only because
`evidence_universe_complete=true` is part of the synthetic construction.

## Size and balance

`build_dataset.py` deterministically creates 40 synthetic resumes across eight
role families:

- software engineering
- backend engineering
- frontend engineering
- data engineering
- machine learning
- computer vision
- cloud infrastructure
- research engineering

There are 240 claim-level examples total: 80 supported, 80 partial, and 80
fabricated.

## Frozen split

The split is fixed before any evaluator tuning:

- seed: `20260916`
- train/dev/test ratio: `60/20/20`
- stratification: role family
- counts: 24 train / 8 dev / 8 test resumes
- per role family: 3 train / 1 dev / 1 test

The exact IDs and dataset SHA-256 are recorded in `data/splits.json`.

### Holdout rule

Do **not** inspect CareerForge or GPT-baseline outputs on test IDs while changing
prompts, output schemas, thresholds, validation rules, citation rules, or
evidence logic. Use train/dev only. The test set is opened only after the
evaluation design is frozen.

The split manifest is the audit trail: if the dataset or split changes, its hash
changes and the benchmark version must be bumped.

## Ground-truth independence

Ground truth is assigned by deterministic construction, before CareerForge or
the baseline is run. `build_dataset.py` has no network/model dependency and does
not import application code. This prevents CareerForge's own answer from
influencing the labels.

Each claim stores:

- `ground_truth_label`
- `supporting_evidence_ids`
- `mutation_type`
- `construction_note`

Stage 2 will formalize the written labeling protocol used by scorers. Stage 1
only freezes the controlled examples and their construction provenance.

## Regenerate

From the repository root:

```bash
python evaluation/dataset/build_dataset.py
```

Expected invariant summary:

```text
40 resumes
240 claims
train/dev/test = 24/8/8 resumes
supported/partial/fabricated = 80/80/80 claims
```

The script validates these invariants before writing files.

## Files

- `build_dataset.py` — deterministic generator, split, validation, and hash
- `schema.json` — machine-readable record schema
- `data/resume_claims.jsonl` — canonical generated dataset
- `data/splits.json` — frozen split IDs, distributions, seed, and hash
