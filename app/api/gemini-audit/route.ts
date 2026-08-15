import { createHash, randomUUID } from "node:crypto";

export const runtime = "nodejs";

type AuditRequest = {
  targetRole?: string;
  evidence?: Array<{ title?: string; excerpt?: string; skills?: string[] }>;
  gaps?: Array<{ skill?: string; severity?: string }>;
};

const MAX_EVIDENCE = 8;
const MODEL = process.env.GEMINI_MODEL || "gemini-3.5-flash";

function clean(value: unknown, max = 900) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function POST(request: Request) {
  const requestId = randomUUID();
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Gemini audit is not configured on this deployment.", requestId },
      { status: 503 },
    );
  }

  let body: AuditRequest;
  try {
    body = await request.json() as AuditRequest;
  } catch {
    return Response.json({ error: "Invalid JSON request.", requestId }, { status: 400 });
  }

  const evidence = Array.isArray(body.evidence)
    ? body.evidence.slice(0, MAX_EVIDENCE).map((item, index) => ({
        id: index + 1,
        title: clean(item.title, 120),
        excerpt: clean(item.excerpt),
        skills: Array.isArray(item.skills) ? item.skills.map((skill) => clean(skill, 60)).filter(Boolean).slice(0, 8) : [],
      }))
    : [];
  const gaps = Array.isArray(body.gaps)
    ? body.gaps.slice(0, 6).map((gap) => ({ skill: clean(gap.skill, 80), severity: clean(gap.severity, 20) }))
    : [];

  if (!evidence.length) {
    return Response.json({ error: "At least one evidence item is required.", requestId }, { status: 400 });
  }

  const payload = JSON.stringify({ targetRole: clean(body.targetRole, 180), evidence, gaps });
  const evidenceDigest = createHash("sha256").update(payload).digest("hex");
  const prompt = `You are CareerForge's evidence auditor. Review only the supplied structured evidence for the target role.

Hard rules:
- Never invent experience, employers, metrics, credentials, tools, or outcomes.
- A strength must cite one or more supplied evidence ids.
- Treat gaps as gaps; do not rewrite them as experience.
- Return strict JSON only, matching the requested schema.
- Recommendations must describe a truthful next action, not a fabricated resume claim.

INPUT:\n${payload}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.1,
            responseMimeType: "application/json",
            responseSchema: {
              type: "OBJECT",
              required: ["verdict", "verifiedStrengths", "criticalGap", "nextAction", "interviewChallenge"],
              properties: {
                verdict: { type: "STRING" },
                verifiedStrengths: {
                  type: "ARRAY",
                  items: {
                    type: "OBJECT",
                    required: ["claim", "evidenceIds"],
                    properties: {
                      claim: { type: "STRING" },
                      evidenceIds: { type: "ARRAY", items: { type: "INTEGER" } },
                    },
                  },
                },
                criticalGap: { type: "STRING" },
                nextAction: { type: "STRING" },
                interviewChallenge: { type: "STRING" },
              },
            },
          },
        }),
        signal: AbortSignal.timeout(20_000),
      },
    );

    if (!response.ok) {
      console.error(JSON.stringify({ event: "gemini_audit_failed", requestId, model: MODEL, evidenceDigest, status: response.status }));
      return Response.json({ error: "Gemini audit failed. Try again shortly.", requestId }, { status: 502 });
    }

    const result = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no structured output.");
    const audit = JSON.parse(text);

    console.info(JSON.stringify({ event: "gemini_audit_completed", requestId, model: MODEL, evidenceDigest, evidenceCount: evidence.length }));
    return Response.json({ audit, provenance: { requestId, model: MODEL, evidenceDigest, evidenceCount: evidence.length } });
  } catch (error) {
    console.error(JSON.stringify({ event: "gemini_audit_exception", requestId, model: MODEL, evidenceDigest, message: error instanceof Error ? error.message : "unknown" }));
    return Response.json({ error: "Gemini audit could not be completed.", requestId }, { status: 502 });
  }
}
