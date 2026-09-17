#!/usr/bin/env python3
"""Deterministically build the Stage-1 controlled CareerForge claim dataset."""
from __future__ import annotations

import hashlib
import json
import random
from collections import Counter, defaultdict
from pathlib import Path

SEED = 20260916
OUT = Path(__file__).resolve().parent / "data"
SPLIT_RATIOS = {"train": 0.60, "dev": 0.20, "test": 0.20}

# role, project, tools, invented tool, metric, baseline, after, unit,
# owned component, verification protocol, deployment ceiling
SPECS = [
    ("software_engineering", "TaskFlow service",
     ["Python", "FastAPI", "PostgreSQL", "Docker"], "Kubernetes",
     "p95 API latency", 240, 168, "ms", "request caching and query batching",
     "1,200 replayed requests across three fixed workloads",
     "Docker Compose staging environment"),
    ("data_engineering", "EventLake pipeline",
     ["Python", "Airflow", "PostgreSQL", "dbt"], "Apache Spark",
     "daily pipeline runtime", 52, 39, "min",
     "incremental dbt models and data-quality checks",
     "30 consecutive daily backfills with row-count reconciliation",
     "scheduled Airflow DAG in a local container stack"),
    ("machine_learning", "TicketRoute classifier",
     ["Python", "scikit-learn", "pandas", "MLflow"], "PyTorch",
     "macro F1", 0.71, 0.79, "", "feature pipeline and experiment tracking",
     "stratified five-fold cross-validation on 8,000 labeled tickets",
     "batch inference CLI used by the evaluation harness"),
    ("computer_vision", "ShelfWatch detector",
     ["Python", "OpenCV", "ONNX Runtime", "NumPy"], "CUDA",
     "median frame latency", 46, 34, "ms",
     "preprocessing and postprocessing pipeline",
     "2,400 annotated frames from six recorded scenes",
     "offline video evaluation runner"),
    ("backend_engineering", "LedgerSync API",
     ["TypeScript", "Node.js", "PostgreSQL", "Redis"], "Kafka",
     "duplicate-write rate", 3.2, 0.8, "%", "idempotency keys and retry handling",
     "10,000 fault-injected write attempts", "containerized staging API"),
    ("frontend_engineering", "InsightBoard dashboard",
     ["TypeScript", "React", "Vite", "Playwright"], "Next.js",
     "median interaction-to-render time", 180, 125, "ms",
     "virtualized table and client-side memoization",
     "20 scripted Playwright runs on a fixed 5,000-row fixture",
     "static preview build"),
    ("cloud_infrastructure", "ScaleGuard service",
     ["Python", "Terraform", "Docker", "Prometheus"], "AWS EKS",
     "recovery time after injected service failure", 95, 61, "s",
     "health checks and alerting rules", "40 repeatable fault-injection trials",
     "local multi-container test environment"),
    ("research_engineering", "RetrievalBench study",
     ["Python", "FAISS", "pandas", "Jupyter"], "Ray",
     "Recall@10", 0.62, 0.69, "", "benchmark harness and error analysis",
     "three seeded runs over a fixed 12,000-query benchmark",
     "reproducible notebook and CLI benchmark"),
]


def show(value: float, unit: str) -> str:
    if isinstance(value, float) and value < 1:
        text = f"{value:.2f}"
    elif isinstance(value, float) and not value.is_integer():
        text = f"{value:.1f}"
    else:
        text = str(int(value))
    return text + unit


def perturb(baseline: float, after: float, unit: str, variant: int) -> tuple[float, float]:
    if unit in {"ms", "min", "s"}:
        return baseline + variant * (2 if unit != "min" else 1), after + variant
    if unit == "%":
        return round(baseline + 0.1 * variant, 1), round(after + 0.05 * variant, 2)
    return round(baseline + 0.005 * variant, 3), round(after + 0.004 * variant, 3)


def inflate(after: float, unit: str, variant: int) -> float:
    if unit == "%":
        return max(0.1, round(after * 0.5, 1))
    if unit in {"ms", "min", "s"}:
        return round(after * (0.72 if variant % 2 == 0 else 0.78), 1)
    return round(min(0.99, after + 0.08 + 0.01 * (variant % 2)), 2)


def build_records() -> list[dict]:
    records = []
    for spec_index, spec in enumerate(SPECS):
        role, project, tools, invented, metric, base, after, unit, owned, verify, deployment = spec
        for variant in range(5):
            rid = f"R{spec_index * 5 + variant + 1:03d}"
            team_size = 3 + variant % 3
            b, a = perturb(base, after, unit, variant)
            exaggerated = inflate(a, unit, variant)

            evidence = [
                {"evidence_id": f"{rid}-E1", "kind": "project_record",
                 "text": f"{project} variant {variant + 1} was built by a {team_size}-person student team using {', '.join(tools)}."},
                {"evidence_id": f"{rid}-E2", "kind": "benchmark_record",
                 "text": f"Recorded {metric} changed from {show(b, unit)} to {show(a, unit)}; measurement protocol: {verify}."},
                {"evidence_id": f"{rid}-E3", "kind": "ownership_record",
                 "text": f"Candidate owned {owned}; other team members owned the remaining components."},
                {"evidence_id": f"{rid}-E4", "kind": "verification_record",
                 "text": f"Verification was limited to {verify}; no production-user or revenue claim was measured."},
                {"evidence_id": f"{rid}-E5", "kind": "deployment_record",
                 "text": f"Highest deployment level reached: {deployment}. No public production deployment is recorded."},
            ]

            def claim(number, text, label, evidence_ids, mutation, note):
                return {
                    "claim_id": f"{rid}-C{number}", "text": text,
                    "ground_truth_label": label,
                    "supporting_evidence_ids": evidence_ids,
                    "mutation_type": mutation, "construction_note": note,
                }

            claims = [
                claim(1, f"Improved {metric} from {show(b, unit)} to {show(a, unit)} on {project} variant {variant + 1}.",
                      "supported", [f"{rid}-E2"], "exact_evidence",
                      "Metric, direction, and values exactly match the benchmark record."),
                claim(2, f"Owned {owned} for {project} variant {variant + 1}.",
                      "supported", [f"{rid}-E3"], "exact_ownership",
                      "Ownership scope exactly matches the ownership record."),
                claim(3, f"Improved {metric} from {show(b, unit)} to {show(exaggerated, unit)} on {project} variant {variant + 1}.",
                      "partial", [f"{rid}-E2"], "metric_inflation",
                      "Project and metric are real, but the final value exaggerates the measured improvement."),
                claim(4, f"Independently built the complete {project} variant {variant + 1} system end to end.",
                      "partial", [f"{rid}-E1", f"{rid}-E3"], "scope_inflation",
                      "Evidence records a multi-person team and narrower candidate ownership."),
                claim(5, f"Used {invented} to optimize {project} variant {variant + 1}.",
                      "fabricated", [], "invented_technology",
                      f"{invented} is intentionally absent from the complete evidence universe."),
                claim(6, f"Mentored 6 junior engineers while leading {project} variant {variant + 1}.",
                      "fabricated", [], "invented_leadership",
                      "Mentoring and leadership are intentionally absent; recorded team size is also smaller."),
            ]
            resume = (
                f"Candidate Profile {rid}\nTarget family: {role}\nProject: {project} variant {variant + 1}\n"
                + "\n".join(f"- {c['text']}" for c in claims)
            )
            records.append({
                "resume_id": rid, "role_family": role, "synthetic": True,
                "evidence_universe_complete": True, "candidate_resume_text": resume,
                "evidence_packet": evidence, "claims": claims,
            })
    return records


def make_splits(records: list[dict]) -> dict[str, list[str]]:
    by_role = defaultdict(list)
    for record in records:
        by_role[record["role_family"]].append(record["resume_id"])
    rng = random.Random(SEED)
    splits = {"train": [], "dev": [], "test": []}
    for role in sorted(by_role):
        ids = sorted(by_role[role])
        rng.shuffle(ids)
        splits["train"] += ids[:3]
        splits["dev"] += ids[3:4]
        splits["test"] += ids[4:5]
    return {name: sorted(ids) for name, ids in splits.items()}


def jsonl(records: list[dict]) -> str:
    return "".join(
        json.dumps(r, sort_keys=True, separators=(",", ":")) + "\n"
        for r in sorted(records, key=lambda x: x["resume_id"])
    )


def validate(records: list[dict], splits: dict[str, list[str]]) -> None:
    assert len(records) == 40
    assert {k: len(v) for k, v in splits.items()} == {"train": 24, "dev": 8, "test": 8}
    split_ids = splits["train"] + splits["dev"] + splits["test"]
    assert len(split_ids) == len(set(split_ids)) == 40
    assert set(split_ids) == {r["resume_id"] for r in records}

    total = Counter()
    by_id = {r["resume_id"]: r for r in records}
    for record in records:
        counts = Counter(c["ground_truth_label"] for c in record["claims"])
        assert counts == Counter({"supported": 2, "partial": 2, "fabricated": 2})
        assert record["evidence_universe_complete"] is True
        total.update(counts)
    assert total == Counter({"supported": 80, "partial": 80, "fabricated": 80})

    for role in sorted({r["role_family"] for r in records}):
        assert sum(by_id[i]["role_family"] == role for i in splits["train"]) == 3
        assert sum(by_id[i]["role_family"] == role for i in splits["dev"]) == 1
        assert sum(by_id[i]["role_family"] == role for i in splits["test"]) == 1


def main() -> None:
    records = build_records()
    splits = make_splits(records)
    validate(records, splits)
    OUT.mkdir(parents=True, exist_ok=True)

    text = jsonl(records)
    (OUT / "resume_claims.jsonl").write_text(text, encoding="utf-8")
    by_id = {r["resume_id"]: r for r in records}

    claim_counts = {}
    role_counts = {}
    for name, ids in splits.items():
        chosen = [by_id[i] for i in ids]
        claim_counts[name] = dict(sorted(Counter(
            c["ground_truth_label"] for r in chosen for c in r["claims"]).items()))
        role_counts[name] = dict(sorted(Counter(r["role_family"] for r in chosen).items()))

    manifest = {
        "dataset_name": "careerforge-controlled-claims-v1",
        "dataset_version": 1,
        "seed": SEED,
        "split_policy": "Stratified by role_family: each family has 5 resumes; fixed-seed shuffle then 3 train, 1 dev, 1 test.",
        "ratios": SPLIT_RATIOS,
        "counts": {name: len(ids) for name, ids in splits.items()},
        "claim_counts": claim_counts,
        "role_counts": role_counts,
        "ids": splits,
        "dataset_sha256": hashlib.sha256(text.encode()).hexdigest(),
        "holdout_rule": "Use train/dev only while changing prompts, schemas, thresholds, validation, citation, or evidence logic. Open test only after the evaluation design is frozen.",
    }
    (OUT / "splits.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"dataset_sha256={manifest['dataset_sha256']}")
    print(json.dumps(manifest["counts"], sort_keys=True))
    print(json.dumps(manifest["claim_counts"], sort_keys=True))


if __name__ == "__main__":
    main()
