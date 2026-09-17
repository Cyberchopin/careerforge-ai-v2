import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { build, cases, SEED, TEST_RATIO, validateDataset } from "./build-dataset.mjs";

const manifest = await build();
assert.equal(SEED, 20260916);
assert.equal(TEST_RATIO, 0.25);
assert.equal(cases.length, 24);
assert.equal(manifest.counts.development_resumes, 18);
assert.equal(manifest.counts.test_resumes, 6);
assert.equal(manifest.counts.claims, 144);
assert.equal(manifest.counts.test_claims, 36);
validateDataset(cases);

const development = (await readFile(resolve("evaluation/dataset/generated/development.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
const test = (await readFile(resolve("evaluation/dataset/generated/test.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
const devIds = new Set(development.map((record) => record.resume_id));
assert.equal(test.some((record) => devIds.has(record.resume_id)), false, "resume leakage across splits");
assert.deepEqual(test.map((record) => record.resume_id), manifest.test_resume_ids);

const challenges = (await readFile(resolve("evaluation/dataset/challenge-cases.jsonl"), "utf8")).trim().split("\n").map(JSON.parse);
assert.equal(challenges.length, 6);
assert.equal(new Set(challenges.map((probe) => probe.id)).size, challenges.length);
assert.ok(challenges.every((probe) => probe.development_only === true));
assert.ok(challenges.every((probe) => !test.some((record) => JSON.stringify(probe).includes(record.resume_id))));
assert.ok(challenges.some((probe) => probe.expected_rejectors.includes("citation") && !probe.expected_rejectors.includes("schema")));
assert.ok(challenges.some((probe) => probe.expected_rejectors.includes("schema") && !probe.expected_rejectors.includes("citation")));
assert.ok(challenges.some((probe) => probe.expected_rejectors.includes("schema") && probe.expected_rejectors.includes("citation")));

process.stdout.write(`verified ${cases.length} resumes, ${manifest.counts.claims} claims, seed ${SEED}, no split leakage; ${challenges.length} development-only gate probes\n`);
