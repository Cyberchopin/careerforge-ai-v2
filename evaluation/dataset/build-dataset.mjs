import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
export const SEED = 20260916;
export const TEST_RATIO = 0.25;

const roles = [
  { role: "Frontend Engineer", skills: ["TypeScript", "React"], project: "accessibility dashboard", artifact: "GitHub repository", metric: [18, 26], collaboration: "a designer", invented: "Kubernetes" },
  { role: "Data Analyst", skills: ["Python", "SQL"], project: "retention analysis", artifact: "Jupyter notebook", metric: [12000, 18000], collaboration: "a product manager", invented: "Snowflake" },
  { role: "ML Engineer", skills: ["Python", "scikit-learn"], project: "text classifier", artifact: "evaluation report", metric: [0.81, 0.86], collaboration: "two classmates", invented: "CUDA" },
  { role: "Backend Engineer", skills: ["Python", "FastAPI"], project: "inventory API", artifact: "API test suite", metric: [42, 57], collaboration: "a three-person team", invented: "AWS Lambda" },
  { role: "UX Researcher", skills: ["interviewing", "thematic coding"], project: "onboarding study", artifact: "research brief", metric: [8, 14], collaboration: "a faculty mentor", invented: "eye tracking" },
  { role: "DevOps Intern", skills: ["Docker", "GitHub Actions"], project: "CI pipeline", artifact: "workflow configuration", metric: [9, 15], collaboration: "a repository maintainer", invented: "Terraform" },
  { role: "Product Engineer", skills: ["TypeScript", "PostgreSQL"], project: "event planning app", artifact: "deployed demo", metric: [34, 49], collaboration: "four hackathon teammates", invented: "SOC 2" },
  { role: "Research Assistant", skills: ["R", "statistics"], project: "survey analysis", artifact: "analysis script", metric: [240, 360], collaboration: "a graduate mentor", invented: "IRB administration" },
];

const variantNames = ["Avery Chen", "Jordan Rivera", "Morgan Patel"];

function makeCase(role, roleIndex, variant) {
  const serial = roleIndex * 3 + variant + 1;
  const id = `resume-${String(serial).padStart(3, "0")}`;
  const person = `${variantNames[variant]} ${roleIndex + 1}`;
  const actual = role.metric[0] + variant * (typeof role.metric[0] === "number" && role.metric[0] < 1 ? 0.01 : 1);
  const exaggerated = role.metric[1] + variant * (typeof role.metric[1] === "number" && role.metric[1] < 1 ? 0.01 : 2);
  const evidence = [
    { id: `${id}-e1`, source: "project_record", text: `Built a ${role.project} using ${role.skills[0]} and ${role.skills[1]}.` },
    { id: `${id}-e2`, source: "measurement_log", text: `Recorded project outcome: ${actual}${actual < 1 ? " macro-F1" : " measured units"}.` },
    { id: `${id}-e3`, source: "repository", text: `${role.artifact} contains implementation files and a README describing personal contributions.` },
    { id: `${id}-e4`, source: "team_note", text: `Collaborated with ${role.collaboration}; owned implementation and documented handoff notes.` },
    { id: `${id}-e5`, source: "course_record", text: `Completed one introductory course covering ${role.skills[0]}; no advanced credential was awarded.` },
  ];
  const claims = [
    { id: `${id}-c1`, text: `Built a ${role.project} with ${role.skills.join(" and ")}.`, ground_truth: "supported", evidence_ids: [`${id}-e1`, `${id}-e3`], rationale: "The project, both technologies, and implementation artifact are explicitly recorded." },
    { id: `${id}-c2`, text: `Collaborated with ${role.collaboration} and documented the implementation handoff.`, ground_truth: "supported", evidence_ids: [`${id}-e4`], rationale: "The team note directly states both collaboration and documentation." },
    { id: `${id}-c3`, text: `Improved the project's primary result to ${exaggerated}${exaggerated < 1 ? " macro-F1" : " measured units"}.`, ground_truth: "partial", evidence_ids: [`${id}-e2`], rationale: `A related measurement exists, but the claim inflates the recorded value of ${actual}.` },
    { id: `${id}-c4`, text: `Led the full ${role.project} project independently from strategy through delivery.`, ground_truth: "partial", evidence_ids: [`${id}-e1`, `${id}-e4`], rationale: "Implementation ownership is supported, but the evidence documents collaborators and does not support sole leadership or full strategy ownership." },
    { id: `${id}-c5`, text: `Deployed the system using ${role.invented} in production.`, ground_truth: "fabricated", evidence_ids: [], rationale: `No evidence mentions ${role.invented}, a production deployment, or an equivalent fact.` },
    { id: `${id}-c6`, text: `Managed a team of six engineers and received a company performance award.`, ground_truth: "fabricated", evidence_ids: [], rationale: "No management role, six-person team, employer, or award exists in the controlled evidence." },
  ];
  return { schema_version: "1.0", resume_id: id, candidate_name: person, target_role: role.role, resume_evidence: evidence, candidate_claims: claims };
}

export const cases = roles.flatMap((role, roleIndex) => [0, 1, 2].map((variant) => makeCase(role, roleIndex, variant)));

function seededShuffle(items, seed) {
  let state = seed >>> 0;
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value ^= value + Math.imul(value ^ (value >>> 7), 61 | value);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const stableJson = (value) => `${JSON.stringify(value)}\n`;
const sha256 = (content) => createHash("sha256").update(content).digest("hex");

export function validateDataset(records) {
  const errors = [];
  const ids = new Set();
  for (const record of records) {
    if (ids.has(record.resume_id)) errors.push(`duplicate resume_id: ${record.resume_id}`);
    ids.add(record.resume_id);
    const evidenceIds = new Set(record.resume_evidence.map((item) => item.id));
    const counts = { supported: 0, partial: 0, fabricated: 0 };
    for (const claim of record.candidate_claims) {
      counts[claim.ground_truth] += 1;
      for (const evidenceId of claim.evidence_ids) if (!evidenceIds.has(evidenceId)) errors.push(`${claim.id}: missing evidence ${evidenceId}`);
      if (claim.ground_truth === "fabricated" && claim.evidence_ids.length) errors.push(`${claim.id}: fabricated claim cannot cite evidence`);
      if (claim.ground_truth !== "fabricated" && !claim.evidence_ids.length) errors.push(`${claim.id}: non-fabricated claim requires evidence`);
      if (!claim.rationale.trim()) errors.push(`${claim.id}: ground-truth rationale is required`);
    }
    if (counts.supported !== 2 || counts.partial !== 2 || counts.fabricated !== 2) errors.push(`${record.resume_id}: expected 2 claims per class, got ${JSON.stringify(counts)}`);
  }
  if (errors.length) throw new Error(`Dataset validation failed:\n${errors.join("\n")}`);
  return true;
}

export async function build() {
  validateDataset(cases);
  const shuffled = seededShuffle(cases, SEED);
  const testCount = Math.round(cases.length * TEST_RATIO);
  const test = shuffled.slice(0, testCount).sort((a, b) => a.resume_id.localeCompare(b.resume_id));
  const development = shuffled.slice(testCount).sort((a, b) => a.resume_id.localeCompare(b.resume_id));
  const outputDir = resolve(ROOT, "generated");
  await mkdir(outputDir, { recursive: true });
  const allContent = cases.map(stableJson).join("");
  const devContent = development.map(stableJson).join("");
  const testContent = test.map(stableJson).join("");
  await writeFile(resolve(outputDir, "all.jsonl"), allContent);
  await writeFile(resolve(outputDir, "development.jsonl"), devContent);
  await writeFile(resolve(outputDir, "test.jsonl"), testContent);
  const manifest = {
    schema_version: "1.0", seed: SEED, split_unit: "resume_id", split_ratio: { development: 0.75, test: 0.25 },
    counts: { resumes: cases.length, claims: cases.length * 6, development_resumes: development.length, development_claims: development.length * 6, test_resumes: test.length, test_claims: test.length * 6 },
    class_counts_per_resume: { supported: 2, partial: 2, fabricated: 2 },
    test_resume_ids: test.map((record) => record.resume_id),
    sha256: { all: sha256(allContent), development: sha256(devContent), test: sha256(testContent) },
  };
  await writeFile(resolve(outputDir, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  return manifest;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const manifest = await build();
  process.stdout.write(`${JSON.stringify(manifest, null, 2)}\n`);
}
