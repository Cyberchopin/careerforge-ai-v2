import assert from "node:assert/strict";
import test from "node:test";
import { analyzeResume } from "../lib/analyzer";

test("role tailoring reorders recorded excerpts without inventing outcomes", () => {
  const resume = [
    "Dashboard project\nBuilt a React dashboard that improved loading by 20%.",
    "Data project\nBuilt a Python data pipeline for weekly reports.",
  ].join("\n\n");
  const analysis = analyzeResume(resume, "Need Python pipeline experience.");
  assert.equal(analysis.tailoredBullets.length, 2);
  assert.match(analysis.tailoredBullets[0].text, /Python data pipeline/);
  for (const bullet of analysis.tailoredBullets) {
    assert.ok(analysis.evidence.some((source) => source.excerpt.includes(bullet.text)));
    assert.doesNotMatch(bullet.text, /role-relevant product delivery/);
  }
  assert.equal(analysis.evidence[0].strength, "Quantified");
});
