import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("renders development preview metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  assert.match(await response.text(), developmentPreviewMeta);
});

test("renders the Gemini evidence auditor", async () => {
  const source = await readFile(new URL("../components/CareerForge.tsx", import.meta.url), "utf8");
  assert.match(source, /Gemini evidence auditor/i);
  assert.match(source, /cannot invent a first/i);
  assert.match(source, /\/api\/gemini-audit/);
});

test("renders the Gemini Launch Operator as a distinct business workflow", async () => {
  const source = await readFile(new URL("../components/CareerForge.tsx", import.meta.url), "utf8");
  assert.match(source, /AI-native business operations/i);
  assert.match(source, /Real numbers, including zero/i);
  assert.match(source, /\/api\/launch-operator/);
  assert.match(source, /decisionDigest/);
});

test("health endpoint reports Gemini configuration without exposing a key", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `health-${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/healthz"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.service, "careerforge-ai");
  assert.equal(typeof body.geminiConfigured, "boolean");
  assert.equal(JSON.stringify(body).includes("AIza"), false);
});

test("Gemini audit accepts only cited, structured output", async () => {
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "unit-test-key";
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://generativelanguage.googleapis.com/")) {
      assert.equal(init.headers["x-goog-api-key"], "unit-test-key");
      return Response.json({
        candidates: [{ content: { parts: [{ text: JSON.stringify({
          verdict: "Credible evidence with one material gap.",
          verifiedStrengths: [{ claim: "Built a typed product interface.", evidenceIds: [1] }],
          criticalGap: "No production metric is supplied.",
          nextAction: "Measure one real workflow outcome.",
          interviewChallenge: "Explain the hardest implementation trade-off.",
        }) }] } }],
      });
    }
    return originalFetch(input, init);
  };

  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `audit-success-${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const response = await worker.fetch(
      new Request("http://localhost/api/gemini-audit", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.10" },
        body: JSON.stringify({ targetRole: "AI engineer", evidence: [{ title: "Project", excerpt: "Built a TypeScript interface.", skills: ["TypeScript"] }], gaps: [] }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body.audit.verifiedStrengths[0].evidenceIds, [1]);
    assert.equal(body.provenance.evidenceCount, 1);
    assert.equal(body.provenance.cacheHit, false);
    assert.match(body.provenance.evidenceDigest, /^[a-f0-9]{64}$/);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY;
  }
});

test("Gemini audit rejects out-of-range citations", async () => {
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "unit-test-key";
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://generativelanguage.googleapis.com/")) {
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        verdict: "Looks strong.",
        verifiedStrengths: [{ claim: "Invented citation.", evidenceIds: [99] }],
        criticalGap: "Unknown.",
        nextAction: "Verify it.",
        interviewChallenge: "Prove it.",
      }) }] } }] });
    }
    return originalFetch(input, init);
  };

  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `audit-invalid-${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const response = await worker.fetch(
      new Request("http://localhost/api/gemini-audit", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.11" },
        body: JSON.stringify({ targetRole: "ML engineer", evidence: [{ title: "Different project", excerpt: "Built a Python model.", skills: ["Python"] }], gaps: [] }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY;
  }
});

test("Launch Operator returns a cited decision and privacy-preserving receipt", async () => {
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "operator-test-key";
  globalThis.fetch = async (input, init) => {
    if (String(input).startsWith("https://generativelanguage.googleapis.com/")) {
      assert.equal(init.headers["x-goog-api-key"], "operator-test-key");
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        decision: "Interview five external job seekers.",
        rationale: "The current ledger has too little external evidence.",
        sourceIds: ["M1", "F1"],
        experiment: {
          hypothesis: "A shorter proof walkthrough increases completion.",
          action: "Run five observed sessions with the same script.",
          successMetric: "At least four of five complete one report.",
          stopCondition: "Stop if two participants cannot identify claim evidence.",
        },
        risk: "Participants may not represent the target market.",
      }) }] } }] });
    }
    return originalFetch(input, init);
  };

  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `operator-success-${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const response = await worker.fetch(
      new Request("http://localhost/api/launch-operator", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.20" },
        body: JSON.stringify({
          metrics: [{ label: "Unique external users", value: 1, unit: "people", evidence: "Session ledger" }],
          feedback: ["The proof trail was useful but took too long to find."],
        }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.deepEqual(body.decision.sourceIds, ["M1", "F1"]);
    assert.match(body.receipt.inputDigest, /^[a-f0-9]{64}$/);
    assert.match(body.receipt.decisionDigest, /^[a-f0-9]{64}$/);
    assert.equal(body.receipt.sourceCount, 2);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY;
  }
});

test("Launch Operator rejects invented or out-of-range source citations", async () => {
  const originalFetch = globalThis.fetch;
  process.env.GEMINI_API_KEY = "operator-test-key";
  globalThis.fetch = async (input) => {
    if (String(input).startsWith("https://generativelanguage.googleapis.com/")) {
      return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({
        decision: "Scale immediately.",
        rationale: "Unsupported growth claim.",
        sourceIds: ["M99"],
        experiment: { hypothesis: "Unknown", action: "Spend", successMetric: "Growth", stopCondition: "Never" },
        risk: "Fabrication",
      }) }] } }] });
    }
    return originalFetch(input);
  };

  try {
    const workerUrl = new URL("../dist/server/index.js", import.meta.url);
    workerUrl.searchParams.set("test", `operator-invalid-${process.pid}-${Date.now()}`);
    const { default: worker } = await import(workerUrl.href);
    const response = await worker.fetch(
      new Request("http://localhost/api/launch-operator", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": "203.0.113.21" },
        body: JSON.stringify({ metrics: [{ label: "Revenue", value: 0, unit: "USD" }] }),
      }),
      { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 502);
  } finally {
    globalThis.fetch = originalFetch;
    delete process.env.GEMINI_API_KEY;
  }
});
