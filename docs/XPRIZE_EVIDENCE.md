# Build with Gemini XPRIZE evidence checklist

## Honest business ledger

Fill this with real totals before submission. Zero is valid; invented traction
is not.

| Metric | Value | Evidence |
|---|---:|---|
| Unique external users | TBD | anonymized session log or consented interview notes |
| Paying customers | 0 unless payment is received | receipt / payment export |
| Total revenue | $0 unless payment is received | receipt / payment export |
| Monthly revenue | $0 unless payment is received | receipt / payment export |
| Operating expenses | TBD | Google Cloud billing export and other receipts |
| Marketing spend | $0 unless money is spent | receipt |
| Related-party revenue | $0 unless applicable | disclosure |

## Minimum validation before judging

1. Deploy the public Cloud Run service with the Gemini secret configured.
2. Open `/api/healthz` and save a screenshot showing `ok: true` and
   `geminiConfigured: true`.
3. Run at least three Gemini audits with consented test inputs.
4. Save the visible provenance lines and matching privacy-preserving Cloud Run
   log entries.
5. Ask at least five external job seekers to complete one real role analysis.
6. Record the repeated pain point, the product change it caused, and whether
   each person would use it again.
7. Report revenue and expenses exactly, including zeros.

## Demo proof sequence

1. Import a resume and paste a real job description.
2. Show deterministic match, ATS score, evidence ledger, and honest gaps.
3. Open ProofGraph and show that a claim can link to an external artifact.
4. Open Decision Lab and compare a safe improvement with the risky
   keyword-only shortcut.
5. Run the Gemini evidence audit.
6. Point to cited evidence IDs, the critical gap, the request ID, and evidence
   digest.
7. Open Launch Operator and enter the honest business ledger, including zeros.
8. Run one live operating decision and show its cited source IDs, measurable
   success metric, stop condition, input digest, and decision digest.
9. Show the matching privacy-preserving Cloud Run logs.

## AI-native operations proof

The product feature and the business operator are intentionally separate.

- **Evidence Auditor:** improves the candidate experience while remaining
  constrained by candidate evidence.
- **Launch Operator:** participates in operating the business by selecting the
  next validation experiment from real aggregate metrics and anonymized user
  feedback.

Before submission, save one complete operator receipt and document whether the
experiment was executed. Do not describe a proposed experiment as completed.

## Kill switch

After judging, remove all billable Google Cloud resources by deleting the
dedicated project. Keep the repository, screenshots, exported logs, and demo
video as durable evidence.
