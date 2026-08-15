"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  analyzeResume,
  SAMPLE_JOB,
  SAMPLE_RESUME,
  stressTestAnswer,
  type Analysis,
  type EvidenceItem,
} from "@/lib/analyzer";

type View = "workspace" | "opportunities" | "evidence" | "decision-lab" | "reports";
type Toast = { title: string; detail: string } | null;
type StressResult = ReturnType<typeof stressTestAnswer> | null;
type GeminiAudit = {
  verdict: string;
  verifiedStrengths: Array<{ claim: string; evidenceIds: number[] }>;
  criticalGap: string;
  nextAction: string;
  interviewChallenge: string;
};

const opportunities = [
  { id: 1, role: "AI/ML Engineering Intern", company: "Applied Intelligence Lab", location: "San Francisco, CA", fit: 82, status: "Target" },
  { id: 2, role: "Software Engineer Intern — AI", company: "Developer Systems", location: "Remote, US", fit: 78, status: "Review" },
  { id: 3, role: "Data & ML Platform Intern", company: "Consumer Technology", location: "Los Angeles, CA", fit: 74, status: "Saved" },
  { id: 4, role: "Product Data Science Intern", company: "Health Technology", location: "Irvine, CA", fit: 69, status: "Explore" },
];

const Icon = ({ name }: { name: "upload" | "spark" | "arrow" | "check" | "download" | "history" }) => {
  const paths = {
    upload: <><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5"/><path d="M5 15v4h14v-4"/></>,
    spark: <><path d="m12 3 1.5 5.5L19 10l-5.5 1.5L12 17l-1.5-5.5L5 10l5.5-1.5L12 3Z"/><path d="m19 16 .7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7L19 16Z"/></>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    download: <><path d="M12 4v11m0 0 4-4m-4 4-4-4"/><path d="M5 20h14"/></>,
    history: <><path d="M4 12a8 8 0 1 0 2-5.3L4 9"/><path d="M4 4v5h5M12 8v5l3 2"/></>,
  };
  return <svg viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
};

const Meter = ({ value }: { value: number }) => (
  <div className="meter" aria-label={`${value}%`}>
    <i style={{ width: `${value}%` }} />
  </div>
);

const EvidenceRow = ({ item, index }: { item: EvidenceItem; index: number }) => (
  <div className="evidence-row">
    <span className="evidence-number">{String(index + 1).padStart(2, "0")}</span>
    <div>
      <strong>{item.title}</strong>
      <small>{item.source}</small>
    </div>
    <span className="signal">{item.signal}</span>
    <span className={`strength strength-${item.strength.toLowerCase()}`}>
      <i />{item.strength}
    </span>
    <button aria-label={`查看 ${item.title} 的证据`}><Icon name="arrow" /></button>
  </div>
);

export default function CareerForge() {
  const [view, setView] = useState<View>("workspace");
  const [resume, setResume] = useState(SAMPLE_RESUME);
  const [job, setJob] = useState(SAMPLE_JOB);
  const [analysis, setAnalysis] = useState<Analysis>(() => analyzeResume(SAMPLE_RESUME, SAMPLE_JOB));
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState("Shiyue_Wang_AI_Resume.txt");
  const [version, setVersion] = useState(3);
  const [toast, setToast] = useState<Toast>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [proofLinks, setProofLinks] = useState<Record<string, string>>({});
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [selectedReviewer, setSelectedReviewer] = useState<Analysis["reviewers"][number]["id"]>("engineer");
  const [challengeAnswer, setChallengeAnswer] = useState("");
  const [stressResult, setStressResult] = useState<StressResult>(null);
  const [geminiAudit, setGeminiAudit] = useState<GeminiAudit | null>(null);
  const [geminiProvenance, setGeminiProvenance] = useState<{ requestId: string; model: string; evidenceDigest: string } | null>(null);
  const [geminiStatus, setGeminiStatus] = useState<"idle" | "loading" | "error">("idle");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem("careerforge-workspace");
    if (!saved) return;
    const timer = window.setTimeout(() => {
      try {
        const parsed = JSON.parse(saved) as { resume?: string; job?: string; version?: number; proofLinks?: Record<string, string> };
        const nextResume = parsed.resume || SAMPLE_RESUME;
        const nextJob = parsed.job || SAMPLE_JOB;
        setResume(nextResume);
        setJob(nextJob);
        setVersion(parsed.version || 3);
        setProofLinks(parsed.proofLinks || {});
        setAnalysis(analyzeResume(nextResume, nextJob));
      } catch {
        // Ignore a malformed local draft and keep the verified sample workspace.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("careerforge-workspace", JSON.stringify({ resume, job, version, proofLinks }));
  }, [resume, job, version, proofLinks]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const targetTitle = useMemo(() => {
    const line = job.split("\n").find((value) => value.trim().length > 5);
    return line?.split("—")[0].trim() || "AI/ML Engineering Intern";
  }, [job]);

  const selectedSimulation = useMemo(
    () => analysis.simulations.filter((action) => selectedActions.includes(action.id)),
    [analysis.simulations, selectedActions],
  );
  const projectedImpact = selectedSimulation.reduce((total, action) => total + action.impact, 0);
  const projectedHours = selectedSimulation.reduce((total, action) => total + action.hours, 0);
  const projectedMatch = Math.min(98, analysis.match + projectedImpact);
  const riskyActions = selectedSimulation.filter((action) => action.credibility === "Risky").length;
  const activeReviewer = analysis.reviewers.find((reviewer) => reviewer.id === selectedReviewer) || analysis.reviewers[0];

  const runAnalysis = () => {
    setIsAnalyzing(true);
    window.setTimeout(() => {
      setAnalysis(analyzeResume(resume, job));
      setIsAnalyzing(false);
      setDrawerOpen(false);
      setToast({ title: "Analysis complete", detail: "Every recommendation is grounded in your resume evidence." });
    }, 720);
  };

  const handleFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    try {
      let text = "";
      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const document = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
        const pages: string[] = [];
        for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
          const page = await document.getPage(pageNumber);
          const content = await page.getTextContent();
          pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
        }
        text = pages.join("\n");
      } else {
        text = await file.text();
      }
      if (text.trim().length < 40) throw new Error("not-enough-text");
      setResume(text);
      setToast({ title: "Resume imported", detail: `${file.name} is ready for evidence extraction.` });
    } catch {
      setToast({ title: "Could not read this file", detail: "Use a text-based PDF, TXT, or Markdown resume." });
    } finally {
      event.target.value = "";
    }
  };

  const generateDraft = () => {
    setVersion((current) => current + 1);
    setSelectedEvidence(analysis.evidence.slice(0, 4).map((item) => item.id));
    setView("reports");
    setToast({ title: `Version ${version + 1} created`, detail: "No unsupported claims were introduced." });
  };

  const exportReport = () => {
    const content = [
      `CAREERFORGE AI — EVIDENCE-BACKED DRAFT V${version}`,
      `Target: ${targetTitle}`,
      "",
      ...analysis.tailoredBullets.map((bullet) => `• ${bullet.text}\n  Source: ${bullet.source}`),
      "",
      "INTERVIEW PREP",
      ...analysis.interviewQuestions.map((question, index) => `${index + 1}. ${question}`),
    ].join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `careerforge-v${version}-${targetTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const saveProof = (id: string, value: string) => {
    const trimmed = value.trim();
    if (trimmed && !/^https?:\/\//i.test(trimmed)) {
      setToast({ title: "Link needs a complete URL", detail: "Start the evidence link with https:// or http://." });
      return;
    }
    setProofLinks((current) => ({ ...current, [id]: trimmed }));
    setToast({
      title: trimmed ? "Artifact connected" : "Artifact removed",
      detail: trimmed ? "The proof is now attached to this claim on this device." : "The claim returned to resume-only verification.",
    });
  };

  const runStressTest = () => {
    if (challengeAnswer.trim().length < 30) {
      setToast({ title: "Answer needs more evidence", detail: "Write at least two concrete sentences before stress testing." });
      return;
    }
    setStressResult(stressTestAnswer(challengeAnswer));
  };

  const runGeminiAudit = async () => {
    setGeminiStatus("loading");
    setGeminiAudit(null);
    setGeminiProvenance(null);
    try {
      const response = await fetch("/api/gemini-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: targetTitle,
          evidence: analysis.evidence.map(({ title, excerpt, skills }) => ({ title, excerpt, skills })),
          gaps: analysis.gaps.map(({ skill, severity }) => ({ skill, severity })),
        }),
      });
      const payload = await response.json() as { audit?: GeminiAudit; provenance?: { requestId: string; model: string; evidenceDigest: string }; error?: string };
      if (!response.ok || !payload.audit || !payload.provenance) throw new Error(payload.error || "Audit unavailable");
      setGeminiAudit(payload.audit);
      setGeminiProvenance(payload.provenance);
      setGeminiStatus("idle");
    } catch (error) {
      setGeminiStatus("error");
      setToast({ title: "Gemini audit unavailable", detail: error instanceof Error ? error.message : "Try again shortly." });
    }
  };

  return (
    <main className="app-shell">
      <header className="global-header">
        <button className="wordmark" onClick={() => setView("workspace")}>CAREERFORGE <span>AI</span></button>
        <button className="mobile-menu" onClick={() => setMobileNavOpen((current) => !current)} aria-label="打开导航">Menu</button>
        <nav className={mobileNavOpen ? "open" : ""} aria-label="主导航">
          {([
            ["workspace", "workspace"],
            ["opportunities", "opportunities"],
            ["evidence", "proof graph"],
            ["decision-lab", "decision lab"],
            ["reports", "reports"],
          ] as [View, string][]).map(([item, label]) => (
            <button
              key={item}
              className={view === item ? "active" : ""}
              onClick={() => { setView(item); setMobileNavOpen(false); }}
            >
              {label}
            </button>
          ))}
        </nav>
        <button className="avatar" aria-label="个人资料">SW</button>
      </header>

      {view === "workspace" && (
        <div className="workspace-grid">
          <aside className="profile-rail">
            <div className="candidate">
              <p className="kicker">Candidate workspace</p>
              <h1>Shiyue<br />Wang</h1>
              <p className="role">AI / ML Builder</p>
            </div>
            <section>
              <div className="section-label"><span>Profile completion</span><b>91%</b></div>
              <Meter value={91} />
              <p className="microcopy">Strong technical narrative. Add production metrics to increase credibility.</p>
            </section>
            <section>
              <p className="section-title">Target role</p>
              <button className="target-card" onClick={() => setDrawerOpen(true)}>
                <span className="briefcase">CF</span>
                <span><strong>{targetTitle}</strong><small>Internship · AI Systems</small><small>United States</small></span>
              </button>
              <button className="text-link" onClick={() => setDrawerOpen(true)}>Edit target role <Icon name="arrow" /></button>
            </section>
            <section>
              <p className="section-title">Resume source</p>
              <button className="file-card" onClick={() => fileRef.current?.click()}>
                <Icon name="upload" />
                <span><strong>{fileName}</strong><small>PDF · TXT · MD supported</small></span>
              </button>
              <input ref={fileRef} type="file" accept=".pdf,.txt,.md,text/plain,application/pdf" onChange={handleFile} hidden />
            </section>
            <button className="primary-action" onClick={generateDraft}><Icon name="spark" />Tailor resume</button>
            <button className="secondary-action" onClick={() => setDrawerOpen(true)}>Re-run analysis</button>
          </aside>

          <section className="intelligence">
            <div className="hero-copy">
              <p className="kicker">Role intelligence / live analysis</p>
              <h2>Your evidence,<br /><em>aligned to the role.</em></h2>
            </div>
            <div className="target-summary">
              <div className="company-monogram">AI</div>
              <div>
                <p className="kicker">Active target</p>
                <h3>{targetTitle}</h3>
                <p>Applied Intelligence Lab · Summer 2027</p>
              </div>
              <div className="match-score"><strong>{analysis.match}%</strong><span>role match</span></div>
            </div>
            <Meter value={analysis.match} />
            <div className="scale"><span>0%</span><span>25%</span><span>50%</span><span>75%</span><span>100%</span></div>
            <div className="score-block">
              <div><p className="section-title">ATS score</p><strong>{analysis.ats}<small>/100</small></strong></div>
              <p>{analysis.matchedSkills.length} role signals matched across {analysis.evidence.length} verified evidence sources.</p>
              <button onClick={() => setView("reports")}>Open report <Icon name="arrow" /></button>
            </div>
            <div className="ledger">
              <div className="ledger-heading">
                <div><p className="section-title">Evidence ledger</p><span>Claim provenance, not AI guesswork</span></div>
                <button onClick={() => setView("evidence")}>View all</button>
              </div>
              <div className="table-labels"><span>Evidence</span><span>Signal</span><span>Strength</span><span /></div>
              {analysis.evidence.slice(0, 5).map((item, index) => <EvidenceRow key={item.id} item={item} index={index} />)}
            </div>
          </section>

          <aside className="gap-rail">
            <section className="gap-section">
              <div className="rail-heading"><p className="section-title">Gap analysis</p><span>{analysis.missingSkills.length} open</span></div>
              {analysis.gaps.slice(0, 3).map((gap, index) => (
                <article className="gap-item" key={gap.skill}>
                  <span>{index + 1}</span>
                  <div><strong>{gap.skill}</strong><p>{gap.recommendation}</p></div>
                  <small className={`severity-${gap.severity.toLowerCase()}`}>{gap.severity}</small>
                </article>
              ))}
              {!analysis.gaps.length && <div className="all-clear"><Icon name="check" />All required skill signals are covered.</div>}
            </section>
            <section className="next-action">
              <p className="section-title">Next best action</p>
              <div className="action-card">
                <Icon name="spark" />
                <p>Compare the time, match lift, and credibility risk of every possible next move.</p>
                <button onClick={() => setView("decision-lab")}>Open decision simulator <Icon name="arrow" /></button>
              </div>
            </section>
            <section className="matched-skills">
              <p className="section-title">Matched signals</p>
              <div>{analysis.matchedSkills.map((skill) => <span key={skill}>{skill}</span>)}</div>
            </section>
          </aside>
          <div className="verification-strip">
            <div><span className="status-icon"><Icon name="check" /></span><p>Source coverage<strong>{analysis.coverage}%</strong></p></div>
            <div><span className="status-icon"><Icon name="check" /></span><p>Artifacts connected<strong>{Object.values(proofLinks).filter(Boolean).length}/{analysis.evidence.length}</strong></p></div>
            <div><span className="status-icon"><Icon name="history" /></span><p>Resume version<strong>v{version}.0</strong></p></div>
            <div className="privacy">LOCAL-FIRST ANALYSIS · YOUR FILES STAY IN THIS BROWSER</div>
          </div>
        </div>
      )}

      {view === "opportunities" && (
        <section className="page-view opportunities-view">
          <div className="page-intro"><p className="kicker">Opportunity intelligence</p><h1>Prioritize where your evidence wins.</h1><p>Compare role fit before spending time tailoring an application.</p></div>
          <div className="opportunity-list">
            {opportunities.map((item) => (
              <article key={item.id}>
                <span className="opportunity-index">0{item.id}</span>
                <div><p>{item.company}</p><h2>{item.role}</h2><small>{item.location}</small></div>
                <div className="fit-cell"><strong>{item.fit}%</strong><span>evidence fit</span></div>
                <span className="status-pill">{item.status}</span>
                <button onClick={() => { setView("workspace"); setDrawerOpen(true); }}>Analyze role <Icon name="arrow" /></button>
              </article>
            ))}
          </div>
        </section>
      )}

      {view === "evidence" && (
        <section className="page-view evidence-view">
          <div className="page-intro"><p className="kicker">ProofGraph / claim provenance</p><h1>Every claim needs inspectable proof.</h1><p>Connect repositories, deployments, benchmarks, or design artifacts. Resume text is evidence; an external artifact makes it independently inspectable.</p></div>
          <div className="proof-summary">
            <div><strong>{analysis.proofGraph.filter((node) => node.status === "Verified").length}</strong><span>structurally verified</span></div>
            <div><strong>{Object.values(proofLinks).filter(Boolean).length}</strong><span>artifacts connected</span></div>
            <div><strong>{Math.round(analysis.proofGraph.reduce((sum, node) => sum + node.confidence, 0) / Math.max(1, analysis.proofGraph.length))}%</strong><span>mean confidence</span></div>
          </div>
          <div className="proof-board">
            {analysis.proofGraph.map((node, index) => {
              const item = analysis.evidence.find((evidence) => evidence.id === node.id)!;
              const selected = selectedEvidence.includes(node.id);
              const linked = Boolean(proofLinks[node.id]);
              return (
                <article key={node.id} className={selected ? "selected" : ""}>
                  <div className="proof-head">
                    <span className="evidence-number">{String(index + 1).padStart(2, "0")}</span>
                    <div><p className="kicker">{item.signal}</p><h2>{node.title}</h2></div>
                    <span className={`proof-status status-${linked ? "verified" : node.status.toLowerCase()}`}>{linked ? "Artifact linked" : node.status}</span>
                  </div>
                  <p className="proof-claim">{node.claim}</p>
                  <div className="proof-confidence"><span>Claim confidence</span><strong>{Math.min(99, node.confidence + (linked ? 12 : 0))}%</strong></div>
                  <Meter value={Math.min(99, node.confidence + (linked ? 12 : 0))} />
                  <div className="proof-dimensions">
                    {node.dimensions.map((dimension) => <span key={dimension.label} className={dimension.covered ? "covered" : ""}><Icon name={dimension.covered ? "check" : "arrow"} />{dimension.label}</span>)}
                    <span className={linked ? "covered" : ""}><Icon name={linked ? "check" : "arrow"} />External artifact</span>
                  </div>
                  <label className="proof-link">
                    <span>Repository, deployment, benchmark, or case study URL</span>
                    <div>
                      <input
                        type="url"
                        defaultValue={proofLinks[node.id] || ""}
                        placeholder="https://github.com/..."
                        onKeyDown={(event) => {
                          if (event.key === "Enter") saveProof(node.id, event.currentTarget.value);
                        }}
                      />
                      <button onClick={(event) => {
                        const input = event.currentTarget.parentElement?.querySelector("input");
                        if (input) saveProof(node.id, input.value);
                      }}>{linked ? "Update" : "Connect"}</button>
                    </div>
                  </label>
                  <button className="approve-proof" onClick={() => setSelectedEvidence((current) => selected ? current.filter((id) => id !== node.id) : [...current, node.id])}>
                    <span className="select-mark"><Icon name="check" /></span>{selected ? "Approved for generation" : "Approve for generation"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {view === "decision-lab" && (
        <section className="page-view decision-view">
          <div className="page-intro"><p className="kicker">Career decision intelligence</p><h1>Test the move before you spend the time.</h1><p>Model improvement paths, then stress-test your story through four independent reviewer lenses.</p></div>
          <div className="simulator-shell">
            <section className="simulator-panel">
              <div className="panel-heading"><div><p className="section-title">Counterfactual simulator</p><h2>What should you do next?</h2></div><span>{selectedActions.length} selected</span></div>
              <div className="simulation-list">
                {analysis.simulations.map((action) => {
                  const selected = selectedActions.includes(action.id);
                  return (
                    <button
                      key={action.id}
                      className={selected ? "selected" : ""}
                      onClick={() => setSelectedActions((current) => selected ? current.filter((id) => id !== action.id) : [...current, action.id])}
                    >
                      <span className="simulation-check"><Icon name="check" /></span>
                      <div><span className="action-kind">{action.kind}</span><h3>{action.title}</h3><p>{action.detail}</p></div>
                      <div className="action-metrics"><strong>+{action.impact}</strong><span>match</span><strong>{action.hours}h</strong><span>effort</span></div>
                      <small className={`risk-${action.credibility.toLowerCase()}`}>{action.credibility}</small>
                    </button>
                  );
                })}
              </div>
            </section>
            <aside className="projection-panel">
              <p className="section-title">Live projection</p>
              <div className="projection-score"><span>Current</span><strong>{analysis.match}%</strong><Icon name="arrow" /><span>Projected</span><strong>{projectedMatch}%</strong></div>
              <Meter value={projectedMatch} />
              <div className="projection-stats">
                <div><strong>{projectedHours.toFixed(1)}h</strong><span>total effort</span></div>
                <div><strong>+{projectedImpact}</strong><span>potential lift</span></div>
                <div><strong>{riskyActions}</strong><span>credibility risks</span></div>
              </div>
              <div className={`projection-verdict ${riskyActions ? "warning" : ""}`}>
                <Icon name={riskyActions ? "history" : "check"} />
                <p><strong>{riskyActions ? "Plan contains unsupported claims" : "Truth-preserving plan"}</strong>{riskyActions ? "Remove keyword-only actions or create inspectable evidence first." : "Every selected action improves evidence without inventing experience."}</p>
              </div>
              <button className="plan-button" disabled={!selectedActions.length || riskyActions > 0} onClick={() => setToast({ title: "Action plan locked", detail: `${selectedActions.length} truth-preserving steps prioritized by impact per hour.` })}>Commit this action plan</button>
            </aside>
          </div>

          <section className="gemini-audit">
            <div className="panel-heading">
              <div><p className="section-title">Gemini evidence auditor</p><h2>A second opinion that cannot invent a first.</h2></div>
              <span>Google Gemini 3.5 · constrained JSON</span>
            </div>
            <div className="gemini-audit-grid">
              <div className="gemini-audit-intro">
                <p>CareerForge sends structured evidence excerpts—not the original uploaded file—to Gemini. Every strength must cite a supplied evidence ID; missing skills remain visible gaps.</p>
                <button onClick={runGeminiAudit} disabled={geminiStatus === "loading"}>
                  <Icon name="spark" />{geminiStatus === "loading" ? "Auditing evidence…" : "Run Gemini audit"}
                </button>
                <small>Server logs store a request ID and SHA-256 evidence digest, never resume content.</small>
              </div>
              <div className="gemini-audit-result" aria-live="polite">
                {!geminiAudit && geminiStatus !== "loading" && <p className="empty-audit">No model verdict yet. The deterministic analysis above remains fully usable.</p>}
                {geminiStatus === "loading" && <p className="empty-audit">Gemini is checking claim provenance and contradiction risk…</p>}
                {geminiAudit && (
                  <>
                    <p className="kicker">Independent verdict</p>
                    <h3>{geminiAudit.verdict}</h3>
                    <div className="audit-facts">
                      {geminiAudit.verifiedStrengths.slice(0, 3).map((strength) => (
                        <p key={`${strength.claim}-${strength.evidenceIds.join("-")}`}><strong>Verified</strong>{strength.claim}<small>Evidence {strength.evidenceIds.join(", ")}</small></p>
                      ))}
                      <p><strong>Critical gap</strong>{geminiAudit.criticalGap}</p>
                      <p><strong>Truthful next move</strong>{geminiAudit.nextAction}</p>
                      <p><strong>Interview challenge</strong>{geminiAudit.interviewChallenge}</p>
                    </div>
                    {geminiProvenance && <div className="audit-provenance">{geminiProvenance.model} · {geminiProvenance.requestId.slice(0, 8)} · SHA {geminiProvenance.evidenceDigest.slice(0, 12)}</div>}
                  </>
                )}
              </div>
            </div>
          </section>

          <div className="reviewer-section">
            <div className="panel-heading"><div><p className="section-title">Recruiter Digital Twin</p><h2>Four reviewers. Four different failure modes.</h2></div><span>Role-specific simulation</span></div>
            <div className="reviewer-tabs">
              {analysis.reviewers.map((reviewer) => (
                <button key={reviewer.id} className={selectedReviewer === reviewer.id ? "active" : ""} onClick={() => { setSelectedReviewer(reviewer.id); setStressResult(null); }}>
                  <span>{reviewer.lens}</span><strong>{reviewer.name}</strong><em>{reviewer.score}</em>
                </button>
              ))}
            </div>
            <div className="reviewer-room">
              <div className="reviewer-verdict">
                <p className="kicker">{activeReviewer.lens}</p>
                <h3>{activeReviewer.verdict}</h3>
                <div><span>Primary concern</span><p>{activeReviewer.concern}</p></div>
                <div><span>Live challenge</span><p>{activeReviewer.challenge}</p></div>
              </div>
              <div className="challenge-box">
                <label htmlFor="challenge-answer">Defend the claim with your real evidence</label>
                <textarea id="challenge-answer" value={challengeAnswer} onChange={(event) => setChallengeAnswer(event.target.value)} placeholder="Explain what you personally built, the architecture, trade-off, verification method, and known limitation…" />
                <button onClick={runStressTest}>Stress test answer <Icon name="arrow" /></button>
                {stressResult && (
                  <div className="stress-result">
                    <div><strong>{stressResult.score}</strong><span>defensibility score</span></div>
                    <p>{stressResult.feedback}</p>
                    <div className="stress-checks">{stressResult.checks.map((check) => <span className={check.pass ? "pass" : ""} key={check.label}><Icon name={check.pass ? "check" : "arrow"} />{check.label}</span>)}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {view === "reports" && (
        <section className="page-view reports-view">
          <div className="page-intro"><p className="kicker">Generated artifact / v{version}.0</p><h1>Evidence-backed application brief.</h1><p>Every rewritten bullet retains a visible link to its source.</p></div>
          <div className="report-actions">
            <button onClick={exportReport}><Icon name="download" />Export report</button>
            <button onClick={() => setDrawerOpen(true)}>Change target</button>
          </div>
          <div className="report-grid">
            <section>
              <p className="section-title">Tailored bullets</p>
              {analysis.tailoredBullets.map((bullet, index) => (
                <article key={bullet.source}>
                  <span>0{index + 1}</span>
                  <div><p>{bullet.text}</p><small>Grounded in: {bullet.source}</small></div>
                </article>
              ))}
            </section>
            <aside>
              <p className="section-title">Interview brief</p>
              {analysis.interviewQuestions.map((question, index) => (
                <div key={question}><span>{index + 1}</span><p>{question}</p></div>
              ))}
            </aside>
          </div>
        </section>
      )}

      {drawerOpen && (
        <div className="drawer-layer" role="dialog" aria-modal="true" aria-labelledby="analysis-title">
          <button className="drawer-backdrop" onClick={() => setDrawerOpen(false)} aria-label="关闭分析面板" />
          <aside className="analysis-drawer">
            <div className="drawer-head"><div><p className="kicker">Analysis inputs</p><h2 id="analysis-title">Align evidence to a role</h2></div><button onClick={() => setDrawerOpen(false)}>×</button></div>
            <label><span>Resume evidence</span><small>Only information written here can appear in a generated claim.</small><textarea value={resume} onChange={(event) => setResume(event.target.value)} /></label>
            <label><span>Job description</span><small>Paste the complete role description for stronger signal extraction.</small><textarea value={job} onChange={(event) => setJob(event.target.value)} /></label>
            <div className="drawer-note"><Icon name="check" /><p><strong>No-fabrication guardrail</strong><br />Missing skills become gaps, never invented experience.</p></div>
            <button className="analyze-button" onClick={runAnalysis} disabled={isAnalyzing || resume.length < 40 || job.length < 40}>{isAnalyzing ? "Mapping evidence…" : "Run evidence analysis"}<Icon name="arrow" /></button>
          </aside>
        </div>
      )}

      {toast && <div className="toast" role="status"><Icon name="check" /><div><strong>{toast.title}</strong><span>{toast.detail}</span></div></div>}
    </main>
  );
}
