import { z } from "zod";

const nonEmpty = z.string().trim().min(1).max(420);

export const auditSchema = z.strictObject({
  verdict: nonEmpty,
  verifiedStrengths: z.array(z.strictObject({
    claim: nonEmpty,
    evidenceIds: z.array(z.number().int().positive()).min(1).max(4),
  })).max(4),
  criticalGap: nonEmpty,
  nextAction: nonEmpty,
  interviewChallenge: nonEmpty,
});

export const supportSchema = z.strictObject({
  support: z.enum(["supported", "partial", "unsupported"]),
  reason: z.string().trim().min(1).max(300),
});

export type GeminiAudit = z.infer<typeof auditSchema>;
export type EvidenceItem = { id: number; title: string; excerpt: string; skills: string[] };
export type SupportJudge = (claim: string, citedEvidence: EvidenceItem[]) => Promise<unknown>;

export function validateAudit(value: unknown, evidenceCount: number): GeminiAudit {
  const audit = auditSchema.parse(value);
  for (const strength of audit.verifiedStrengths) {
    if (new Set(strength.evidenceIds).size !== strength.evidenceIds.length ||
        strength.evidenceIds.some((id) => id > evidenceCount)) {
      throw new Error("Gemini returned an invalid evidence citation.");
    }
  }
  return audit;
}

export async function enforceCitationSupport(
  audit: GeminiAudit,
  evidence: EvidenceItem[],
  judge: SupportJudge,
): Promise<{ audit: GeminiAudit; rejectedCount: number }> {
  const sourceById = new Map(evidence.map((item) => [item.id, item]));
  const accepted: GeminiAudit["verifiedStrengths"] = [];
  let rejectedCount = 0;

  for (const strength of audit.verifiedStrengths) {
    const cited = strength.evidenceIds.map((id) => sourceById.get(id));
    if (!cited.length || cited.some((item) => !item)) {
      rejectedCount += 1;
      continue;
    }
    try {
      // A separate judge sees only the proposed claim and exact cited source text.
      // It never receives the generator's verdict or rationale.
      const result = supportSchema.parse(await judge(strength.claim, cited as EvidenceItem[]));
      if (result.support === "supported") accepted.push(strength);
      else rejectedCount += 1;
    } catch {
      // Judge outage or malformed output fails closed.
      rejectedCount += 1;
    }
  }

  return {
    audit: {
      ...audit,
      verifiedStrengths: accepted,
      verdict: rejectedCount
        ? `${rejectedCount} proposed strength(s) withheld: independent citation check did not confirm full support.`
        : audit.verdict,
    },
    rejectedCount,
  };
}
