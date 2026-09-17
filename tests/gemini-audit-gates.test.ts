import assert from "node:assert/strict";
import test from "node:test";
import { auditSchema, enforceCitationSupport, validateAudit, type EvidenceItem } from "../lib/gemini-audit/validation";

const evidence: EvidenceItem[] = [{ id: 1, title: "Project", excerpt: "Built a dashboard in React and deployed it to Cloud Run.", skills: ["React"] }];
const audit = {
  verdict: "One strength found.",
  verifiedStrengths: [{ claim: "Built a dashboard in React", evidenceIds: [1] }],
  criticalGap: "No benchmark.",
  nextAction: "Measure latency.",
  interviewChallenge: "Explain deployment.",
};

test("runtime schema rejects malformed output instead of passing it through", () => {
  assert.equal(auditSchema.safeParse({ ...audit, verifiedStrengths: "yes" }).success, false);
  assert.equal(auditSchema.safeParse({ ...audit, extra: "surprise" }).success, false);
  assert.throws(() => validateAudit({ ...audit, verifiedStrengths: [{ claim: "x", evidenceIds: [2] }] }, 1));
  assert.throws(() => validateAudit({ ...audit, verifiedStrengths: [{ claim: "x", evidenceIds: [1, 1] }] }, 1));
});

test("an independently supported claim survives", async () => {
  const result = await enforceCitationSupport(audit, evidence, async (_claim, cited) => {
    assert.equal(cited[0].excerpt, evidence[0].excerpt);
    return { support: "supported", reason: "The cited sentence states the claim." };
  });
  assert.equal(result.rejectedCount, 0);
  assert.equal(result.audit.verifiedStrengths.length, 1);
});

test("non-entailing citation is withheld from displayed strengths", async () => {
  const result = await enforceCitationSupport(
    { ...audit, verifiedStrengths: [{ claim: "Led a team of 12 engineers", evidenceIds: [1] }] },
    evidence,
    async () => ({ support: "unsupported", reason: "No leadership evidence." }),
  );
  assert.equal(result.rejectedCount, 1);
  assert.deepEqual(result.audit.verifiedStrengths, []);
  assert.match(result.audit.verdict, /withheld/);
});

test("unknown citation, malformed judge output, and judge outage fail closed", async () => {
  const cases: Array<[{ claim: string; evidenceIds: number[] }, () => Promise<unknown>]> = [
    [{ claim: "Claim", evidenceIds: [99] }, async () => ({ support: "supported", reason: "yes" })],
    [audit.verifiedStrengths[0], async () => ({ support: "maybe", reason: "unknown" })],
    [audit.verifiedStrengths[0], async () => { throw new Error("offline"); }],
  ];
  for (const [strength, judge] of cases) {
    const result = await enforceCitationSupport({ ...audit, verifiedStrengths: [{ claim: strength.claim, evidenceIds: [...strength.evidenceIds] }] }, evidence, judge);
    assert.equal(result.audit.verifiedStrengths.length, 0);
    assert.equal(result.rejectedCount, 1);
  }
});
