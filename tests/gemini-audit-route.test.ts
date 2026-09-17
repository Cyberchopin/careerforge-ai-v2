import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../app/api/gemini-audit/route";

const proposed = {
  verdict: "Strong fit.",
  verifiedStrengths: [{ claim: "Led 12 engineers", evidenceIds: [1] }],
  criticalGap: "No benchmark.",
  nextAction: "Benchmark the app.",
  interviewChallenge: "Explain your role.",
};

test("production route calls Gemini twice and withholds an unsupported strength", async () => {
  process.env.GEMINI_API_KEY = "test-only-secret";
  const originalFetch = globalThis.fetch;
  const calls: Array<{ url: string; init: RequestInit }> = [];
  globalThis.fetch = async (url, init) => {
    calls.push({ url: String(url), init: init || {} });
    const value = calls.length === 1
      ? proposed
      : { support: "unsupported", reason: "The cited excerpt does not mention leadership." };
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify(value) }] } }] });
  };
  try {
    const response = await POST(new Request("http://localhost/api/gemini-audit", {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": "audit-test-unique" },
      body: JSON.stringify({ targetRole: "Engineer", evidence: [{ title: "Dashboard", excerpt: "Built a dashboard in React." }], gaps: [] }),
    }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.deepEqual(body.audit.verifiedStrengths, []);
    assert.equal(body.provenance.rejectedStrengths, 1);
    assert.match(body.provenance.evidenceDigest, /^[a-f0-9]{64}$/);
    assert.match(body.provenance.outputDigest, /^[a-f0-9]{64}$/);
    assert.equal(calls.length, 2);
    assert.equal(calls[0].url, calls[1].url);
    assert.equal((calls[0].init.headers as Record<string, string>)["x-goog-api-key"], "test-only-secret");
    assert.equal(JSON.stringify(body).includes("test-only-secret"), false);
    const judgeInput = JSON.parse(String(calls[1].init.body));
    assert.match(judgeInput.contents[0].parts[0].text, /Built a dashboard in React/);
    assert.doesNotMatch(judgeInput.contents[0].parts[0].text, /Strong fit/);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY;
  }
});
