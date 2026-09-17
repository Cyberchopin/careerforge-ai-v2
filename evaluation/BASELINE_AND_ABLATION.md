# Baseline and ablation preregistration — no results yet

Status: preregistered comparison framework dated 2026-09-17; the exact model version and executable claim-level adapter are **not yet frozen**, and no live model run or test-set score has occurred. The production auditor is Gemini, so a “GPT baseline using the same underlying model” would be a contradiction. The defensible comparator is **raw Gemini with the identical pinned Gemini model**. Do not label it GPT.

## Shared task and controls

Each unit is one synthetic `candidate_claim` with the evidence items from its own resume, in the same order and with the same IDs. Ask whether the claim is fully supported by the supplied evidence. Use the same pinned Gemini model/version, temperature, API endpoint, input text, and time window for every arm. Save raw responses, response IDs, token usage, wall-clock timing, model identifier, prompt hash, and code commit before scoring. Do not log real resume text. The synthetic corpus is safe to store for reproducibility.

The raw baseline receives those same factual inputs and a minimal verification instruction. It has **no response schema**, citation requirement, runtime schema rejection, citation-ID/entailment gate, or provenance receipt. A plain verdict is parsed by a frozen evaluator; an unparseable response counts as an abstention, never silently corrected. Any additional baseline prompt guidance must be disclosed as a changed comparator.

CareerForge receives the same factual inputs through a structured claim-verdict prompt, requests a response schema, applies runtime Zod validation, checks cited IDs against the exact input, and performs a second-pass support check using the same Gemini model. The production route currently audits positive strengths rather than this dataset's individual claims, so a claim-level adapter must be implemented and contract-tested before running the sealed test. No dataset metric should be reported from the production route as-is.

## Four post-generation gate arms

For a given structured generator response, reuse the **same raw response bytes** across the four arms to isolate post-generation behavior. Do not regenerate to obtain a more favorable output. The second-pass result, when needed, is also recorded once and reused.

| Arm | Runtime schema gate | Citation ID + second-pass support gate |
| --- | --- | --- |
| Full CareerForge | On | On |
| No citation enforcement | On | Off |
| No schema validation | Off | On |
| Neither gate | Off | Off |

“Schema off” means malformed content is processed by a separately specified permissive parser; it must not silently inherit Zod checks. “Citation off” means no citation rejection, not a different prompt or model. The two-gate-off arm is an ablation, **not** the raw Gemini baseline, because its generation prompt still requests structured output. Keep these comparisons distinct.

Before touching the held-out split, add contract tests from `dataset/challenge-cases.jsonl` that flip each targeted gate while holding the other fixed. The current production code does **not** expose these switches; never ship an evaluation bypass in the public API. If the arm outputs do not differ, report zero delta rather than inferring benefit. For each arm, report model calls, token use, per-resume latency and estimated API cost using the contemporaneous published price with retrieval date; no cost estimate is a measured bill.

## Metrics and uncertainty (held-out set only)

- Treat `partial` and `fabricated` as unsupported for binary precision/recall. Also publish the three-class confusion matrix.
- `unsupported caught` = unsupported claims blocked or flagged / all unsupported claims.
- `citation coverage` = positive claims displayed with at least one resolvable cited source / positive claims displayed. A citation that exists but does not support the claim does not count as evidence coverage.
- `evidence coverage` = positive claims displayed whose cited excerpts fully support all material facets / positive claims displayed, judged against controlled ground truth and source text. Do not use the same-model second pass as ground truth.
- Show precision and recall denominators; undefined values (zero predicted positives) are `NA`, not 100%.
- Use a fixed-seed cluster bootstrap that resamples whole resumes, not claims, for 95% intervals. With only six held-out resumes, show raw numerators/denominators and emphasize the wide uncertainty. Use paired resume-level differences for arm comparisons.
- Cost and latency are per resume, including all generation and second-pass calls. Report median and a resume-cluster bootstrap interval; include cache-hit policy and timeout failures.

Failure analysis must attach concrete synthetic claim IDs and cited excerpts to categories such as fabricated soft-skill miss, unsupported metric accepted, supported quantified claim over-flagged, nonexistent citation, and malformed response. Counts alone are insufficient. No honest resume bullet can contain performance deltas until predictions, locked scoring, uncertainty, and the external review status are recorded.
