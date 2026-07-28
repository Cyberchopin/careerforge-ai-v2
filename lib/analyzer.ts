export type EvidenceItem = {
  id: string;
  title: string;
  source: string;
  signal: string;
  strength: "Strong" | "Verified" | "Supporting";
  skills: string[];
  excerpt: string;
};

export type Gap = {
  skill: string;
  severity: "High" | "Medium" | "Low";
  recommendation: string;
};

export type ProofNode = {
  id: string;
  title: string;
  claim: string;
  status: "Verified" | "Partial" | "Unsupported";
  confidence: number;
  dimensions: { label: string; covered: boolean }[];
};

export type SimulationAction = {
  id: string;
  title: string;
  detail: string;
  skill: string;
  impact: number;
  hours: number;
  credibility: "Safe" | "Review" | "Risky";
  kind: "Build" | "Verify" | "Rewrite";
};

export type ReviewerTwin = {
  id: "ats" | "recruiter" | "engineer" | "skeptic";
  name: string;
  lens: string;
  score: number;
  verdict: string;
  concern: string;
  challenge: string;
};

export type Analysis = {
  match: number;
  ats: number;
  coverage: number;
  matchedSkills: string[];
  missingSkills: string[];
  evidence: EvidenceItem[];
  gaps: Gap[];
  tailoredBullets: { text: string; source: string }[];
  interviewQuestions: string[];
  proofGraph: ProofNode[];
  simulations: SimulationAction[];
  reviewers: ReviewerTwin[];
};

const TAXONOMY: Record<string, string[]> = {
  Python: ["python", "pandas", "numpy"],
  TypeScript: ["typescript", "javascript", "react", "next.js", "nextjs"],
  "LLM / RAG": ["llm", "rag", "retrieval augmented", "langchain", "openai", "embedding"],
  "Machine Learning": ["machine learning", "ml model", "classification", "regression", "scikit"],
  "Data Engineering": ["etl", "pipeline", "airflow", "spark", "data engineering"],
  SQL: ["sql", "postgres", "postgresql", "sqlite", "database"],
  FastAPI: ["fastapi", "rest api", "api service"],
  Docker: ["docker", "container", "containerized"],
  "CI/CD": ["ci/cd", "github actions", "continuous integration", "deployment pipeline"],
  Monitoring: ["monitoring", "observability", "model drift", "telemetry", "audit"],
  AWS: ["aws", "s3", "lambda", "sagemaker", "ec2"],
  "GPU / CUDA": ["cuda", "gpu optimization", "triton", "tensor cores"],
  Experimentation: ["a/b test", "experimentation", "hypothesis test", "offline evaluation"],
  Statistics: ["statistics", "statistical", "probability", "bayesian"],
  NLP: ["nlp", "natural language", "text classification", "tokenization"],
  Git: ["git", "github", "version control"],
};

const METRIC_PATTERN = /\b\d+(?:\.\d+)?(?:%|x|k|m|\+)?\b/i;

export const SAMPLE_RESUME = `Shiyue Wang
UCLA Mathematics of Computation student | AI / ML builder

BruinAI — AI Academic Intelligence Platform
Built a syllabus-grounded RAG assistant with React, TypeScript, FastAPI, LangChain, vector retrieval, and structured study planning.

AlphaLens AI — Financial Intelligence Platform
Built portfolio analysis, delayed market data, watchlists, and personalized holdings intelligence with React, TypeScript, Python, and SQL.

CarePath AI — Clinical ML Governance Platform
Built a healthcare readmission risk and model monitoring product with policy gates, model registry, audit trails, Docker, and GitHub Actions.

Rainverse Studio — Interactive Generative System
Engineered an interactive TypeScript, p5.js, and Web Audio experience with independent Verlet thread physics, adaptive rendering, and accessible controls.

Crystar — Co-founder & Head of Strategy
Led a bilingual nonprofit supporting families of autistic children and developed an AI initiative to personalize resources.

Education: UCLA, B.S. Mathematics of Computation
Skills: Python, TypeScript, React, FastAPI, SQL, RAG, NLP, Docker, GitHub Actions, statistics, machine learning.`;

export const SAMPLE_JOB = `AI/ML Engineering Intern — Applied Intelligence

Build production-facing AI features with Python and TypeScript. Design and evaluate retrieval-augmented generation systems, develop FastAPI services, work with SQL data pipelines, and ship containerized services with Docker and CI/CD. Collaborate on offline evaluation, model monitoring, and responsible AI guardrails. Strong candidates demonstrate machine learning fundamentals, statistics, Git, experimentation, and clear technical communication. Bonus: AWS deployment, GPU or CUDA optimization, and production observability.`;

const normalize = (text: string) =>
  text.toLowerCase().replace(/[^\p{L}\p{N}+#./%-]+/gu, " ");

export function extractSkills(text: string) {
  const normalized = normalize(text);
  return Object.entries(TAXONOMY)
    .filter(([, aliases]) => aliases.some((alias) => normalized.includes(alias)))
    .map(([skill]) => skill);
}

function buildEvidence(resume: string): EvidenceItem[] {
  const sections = resume
    .split(/\n\s*\n/)
    .map((section) => section.trim())
    .filter((section) => section.length > 20);

  return sections
    .map((section, index) => {
      const lines = section.split("\n").map((line) => line.trim()).filter(Boolean);
      const title = lines[0].replace(/[—|-].*$/, "").trim();
      const skills = extractSkills(section);
      const hasMetric = METRIC_PATTERN.test(section);
      const source = title || `Resume section ${index + 1}`;
      return {
        id: `evidence-${index + 1}`,
        title: title || `Evidence ${index + 1}`,
        source,
        signal: skills.slice(0, 2).join(" + ") || "Experience",
        strength: skills.length >= 3 ? "Strong" as const : hasMetric ? "Verified" as const : "Supporting" as const,
        skills,
        excerpt: lines.slice(1).join(" ") || section,
      };
    })
    .filter((item) => item.skills.length > 0)
    .slice(0, 8);
}

function sentenceForEvidence(item: EvidenceItem, targetSkills: string[]) {
  const aligned = item.skills.filter((skill) => targetSkills.includes(skill));
  const original = item.excerpt.replace(/\s+/g, " ").replace(/[.。]$/, "");
  if (!aligned.length) return original;
  return `${original}, applying ${aligned.slice(0, 3).join(", ")} to role-relevant product delivery`;
}

function buildProofGraph(evidence: EvidenceItem[], jobSkills: string[]): ProofNode[] {
  return evidence.map((item) => {
    const hasMetric = METRIC_PATTERN.test(item.excerpt);
    const roleAligned = item.skills.some((skill) => jobSkills.includes(skill));
    const hasImplementation = /\b(built|engineered|developed|implemented|deployed|designed)\b/i.test(item.excerpt);
    const dimensions = [
      { label: "Resume source", covered: true },
      { label: "Technical detail", covered: item.skills.length >= 2 },
      { label: "Measured result", covered: hasMetric },
      { label: "Role relevance", covered: roleAligned },
    ];
    const confidence = Math.round(dimensions.filter((dimension) => dimension.covered).length * 21 + (hasImplementation ? 14 : 0));
    return {
      id: item.id,
      title: item.title,
      claim: item.excerpt,
      status: confidence >= 78 ? "Verified" as const : confidence >= 52 ? "Partial" as const : "Unsupported" as const,
      confidence: Math.min(98, confidence),
      dimensions,
    };
  });
}

function buildSimulations(gaps: Gap[], evidence: EvidenceItem[]): SimulationAction[] {
  const gapActions = gaps.slice(0, 4).map((gap, index) => ({
    id: `gap-${index}`,
    title: gap.skill === "AWS" ? "Deploy an existing service to AWS" : `Build a verifiable ${gap.skill} artifact`,
    detail: gap.recommendation,
    skill: gap.skill,
    impact: Math.max(3, 8 - index),
    hours: gap.skill === "GPU / CUDA" ? 8 : gap.skill === "AWS" ? 5 : 4 + index,
    credibility: "Safe" as const,
    kind: "Build" as const,
  }));
  const weakEvidence = evidence.find((item) => !METRIC_PATTERN.test(item.excerpt));
  const verification: SimulationAction[] = weakEvidence ? [{
    id: "verify-portfolio",
    title: `Attach proof to ${weakEvidence.title}`,
    detail: "Connect a repository, deployment, benchmark, or design artifact to convert an unverified claim into inspectable evidence.",
    skill: weakEvidence.signal,
    impact: 4,
    hours: 0.5,
    credibility: "Safe",
    kind: "Verify",
  }] : [];
  return [
    ...verification,
    {
      id: "rewrite-evidence",
      title: "Rewrite the highest-value verified bullet",
      detail: "Reframe an existing claim for this role without adding a new capability or metric.",
      skill: "Communication",
      impact: 3,
      hours: 0.25,
      credibility: "Safe",
      kind: "Rewrite",
    },
    ...gapActions,
    {
      id: "keyword-only",
      title: "Add missing keywords without proof",
      detail: "Fast ATS lift, but the claim is unsupported and likely to fail technical review.",
      skill: gaps[0]?.skill || "Missing skill",
      impact: 2,
      hours: 0.1,
      credibility: "Risky",
      kind: "Rewrite",
    },
  ].sort((a, b) => (b.impact / b.hours) - (a.impact / a.hours));
}

function buildReviewers(
  ats: number,
  match: number,
  coverage: number,
  evidence: EvidenceItem[],
  missingSkills: string[],
): ReviewerTwin[] {
  const quantified = evidence.filter((item) => METRIC_PATTERN.test(item.excerpt)).length;
  const engineerScore = Math.round(Math.min(94, coverage * .72 + Math.min(22, evidence.length * 4)));
  const recruiterScore = Math.round(Math.min(94, match * .68 + (quantified ? 18 : 8)));
  return [
    {
      id: "ats",
      name: "ATS Parser",
      lens: "Structure + terminology",
      score: ats,
      verdict: ats >= 80 ? "Likely readable and well aligned." : "Readable, but signal coverage is thin.",
      concern: missingSkills.length ? `${missingSkills.length} role terms lack resume evidence.` : "No critical keyword gaps detected.",
      challenge: "Which required capability is expressed with the employer’s terminology but still remains completely truthful?",
    },
    {
      id: "recruiter",
      name: "8-Second Recruiter",
      lens: "Clarity + differentiation",
      score: recruiterScore,
      verdict: recruiterScore >= 76 ? "The technical narrative is easy to scan." : "The value proposition takes too long to locate.",
      concern: quantified ? "Impact is visible, but the strongest metric should move earlier." : "Strong projects lack measurable outcomes.",
      challenge: "In one sentence, why should this candidate advance over another student with the same tools?",
    },
    {
      id: "engineer",
      name: "Engineering Manager",
      lens: "Depth + production judgment",
      score: engineerScore,
      verdict: engineerScore >= 76 ? "Implementation breadth appears credible." : "Claims need more architecture-level proof.",
      concern: missingSkills[0] ? `${missingSkills[0]} is required but has no inspectable implementation.` : "Trade-offs and failure handling are not explicit.",
      challenge: "Choose one system: describe its architecture, hardest trade-off, failure mode, and how you verified it.",
    },
    {
      id: "skeptic",
      name: "Skeptical Interviewer",
      lens: "Claim resistance",
      score: Math.max(42, Math.round((coverage + engineerScore) / 2 - 8)),
      verdict: "Several claims survive a first challenge; others need artifacts.",
      concern: "Words such as enterprise, real-time, or production require operational evidence.",
      challenge: "Show the exact evidence behind your strongest claim. What part did you personally build, and what remains incomplete?",
    },
  ];
}

export function analyzeResume(resume: string, job: string): Analysis {
  const resumeSkills = extractSkills(resume);
  const jobSkills = extractSkills(job);
  const matchedSkills = jobSkills.filter((skill) => resumeSkills.includes(skill));
  const missingSkills = jobSkills.filter((skill) => !resumeSkills.includes(skill));
  const evidence = buildEvidence(resume);
  const skillRatio = jobSkills.length ? matchedSkills.length / jobSkills.length : 0;
  const evidenceRatio = Math.min(1, evidence.length / 5);
  const quantifiedRatio = Math.min(
    1,
    evidence.filter((item) => METRIC_PATTERN.test(item.excerpt)).length / 3,
  );
  const structureSignals = [
    /skills?/i.test(resume),
    /education/i.test(resume),
    resume.split("\n").length >= 8,
    resume.length >= 450,
  ].filter(Boolean).length / 4;
  const match = Math.round(42 + skillRatio * 48 + evidenceRatio * 10);
  const ats = Math.round(
    Math.min(98, 44 + skillRatio * 34 + structureSignals * 14 + quantifiedRatio * 6),
  );
  const coverage = Math.round(Math.min(98, evidenceRatio * 70 + skillRatio * 28));

  const gaps: Gap[] = missingSkills.slice(0, 5).map((skill, index) => ({
    skill,
    severity: index === 0 ? "High" : index < 3 ? "Medium" : "Low",
    recommendation:
      skill === "GPU / CUDA"
        ? "Add a small profiling study comparing CPU and GPU inference."
        : skill === "AWS"
          ? "Deploy one existing service and document the architecture and operating cost."
          : skill === "Experimentation"
            ? "Add an offline evaluation set with a clear hypothesis and significance criteria."
            : `Add a verifiable project artifact that demonstrates ${skill} in practice.`,
  }));

  const tailoredBullets = evidence.slice(0, 5).map((item) => ({
    text: sentenceForEvidence(item, jobSkills),
    source: item.source,
  }));

  const interviewQuestions = [
    ...matchedSkills.slice(0, 3).map(
      (skill) => `Walk me through a project where you used ${skill}. What trade-off did you make?`,
    ),
    ...missingSkills.slice(0, 2).map(
      (skill) => `This role mentions ${skill}. How would you ramp up and validate your first implementation?`,
    ),
    "Choose one claim from your resume. What evidence would you show an engineer who challenges it?",
  ].slice(0, 6);
  const proofGraph = buildProofGraph(evidence, jobSkills);
  const simulations = buildSimulations(gaps, evidence);
  const reviewers = buildReviewers(ats, match, coverage, evidence, missingSkills);

  return {
    match: Math.min(98, match),
    ats,
    coverage,
    matchedSkills,
    missingSkills,
    evidence,
    gaps,
    tailoredBullets,
    interviewQuestions,
    proofGraph,
    simulations,
    reviewers,
  };
}

export function stressTestAnswer(answer: string) {
  const checks = [
    { label: "Personal ownership", pass: /\b(i|my|personally|owned|implemented)\b/i.test(answer) },
    { label: "Architecture detail", pass: /\b(api|database|pipeline|service|frontend|backend|model|retrieval|architecture)\b/i.test(answer) },
    { label: "Trade-off", pass: /\b(trade-?off|because|instead|chose|constraint)\b/i.test(answer) },
    { label: "Verification", pass: /\b(test|metric|benchmark|monitor|evaluate|validated|accuracy|latency)\b/i.test(answer) },
    { label: "Failure awareness", pass: /\b(fail|risk|limit|error|fallback|incomplete)\b/i.test(answer) },
  ];
  const passed = checks.filter((check) => check.pass).length;
  const lengthSignal = Math.min(18, Math.round(answer.trim().length / 20));
  return {
    score: Math.min(96, 22 + passed * 12 + lengthSignal),
    checks,
    feedback: passed >= 4
      ? "This answer is defensible. Tighten it with one concrete number or artifact."
      : "The answer sounds plausible, but an interviewer can still break the claim. Add the missing dimensions below.",
  };
}
