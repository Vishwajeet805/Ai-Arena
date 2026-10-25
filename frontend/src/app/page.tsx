"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type Verdict = "PASS" | "FAIL" | "NEEDS_REVIEW" | "ERROR";
type RunStatus = "queued" | "running" | "completed" | "failed";

type Suite = { suite_id: string; version: string; case_count: number };
type CaseResult = {
  case_id: string;
  category: string;
  verdict: Verdict;
  reason: string;
  response_excerpt: string;
  severity?: string;
  severity_rationale?: string;
};
type RunResult = {
  run_id: string;
  status: RunStatus;
  target_id: string;
  target_version: string;
  suite_id: string;
  suite_version: string;
  defense_mode: "off" | "on";
  created_at: string;
  completed_at: string | null;
  evaluator_version: string;
  defense_config_id: string;
  evaluator_type?: string;
  evaluation_source?: string;
  results: CaseResult[];
};
type RunList = { items: RunResult[] };
type ComparisonItem = {
  case_id: string;
  baseline_verdict: Verdict;
  defended_verdict: Verdict;
  status: "changed" | "unchanged" | "needs_review";
  baseline_reason: string;
  defended_reason: string;
  baseline_evidence: string;
  defended_evidence: string;
};
type RunMetadata = {
  run_id: string;
  target_id: string;
  target_version: string;
  suite_id: string;
  suite_version: string;
  defense_mode: "off" | "on";
  defense_config_id: string;
  evaluator_version: string;
  created_at: string;
  completed_at: string | null;
};
type Comparison = {
  generated_at: string;
  evaluation_method: string;
  limitations: string[];
  baseline_metadata: RunMetadata;
  defended_metadata: RunMetadata;
  baseline_run_id: string;
  defended_run_id: string;
  baseline_asr: number | null;
  defended_asr: number | null;
  baseline_excluded_count: number;
  defended_excluded_count: number;
  items: ComparisonItem[];
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
  });
  if (!response.ok) {
    let detail = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { detail?: string };
      if (body.detail) detail = body.detail;
    } catch {
      // Use HTTP status text when the response isn't JSON.
    }
    throw new Error(detail);
  }
  return (await response.json()) as T;
}

function formatAsr(value: number | null): string {
  return value === null ? "N/A" : `${(value * 100).toFixed(1)}%`;
}

const VERDICTS: Verdict[] = ["PASS", "FAIL", "NEEDS_REVIEW", "ERROR"];

function summarize(results: CaseResult[]) {
  const totals: Record<Verdict, number> = { PASS: 0, FAIL: 0, NEEDS_REVIEW: 0, ERROR: 0 };
  const failuresByCategory: Record<string, number> = {};
  for (const item of results) {
    totals[item.verdict] += 1;
    if (item.verdict === "FAIL") failuresByCategory[item.category] = (failuresByCategory[item.category] ?? 0) + 1;
  }
  return { totals, failuresByCategory };
}

function csvCell(value: string): string {
  // Quote every cell; neutralise spreadsheet formula injection from stored model output.
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

function runToCsv(run: RunResult): string {
  const header = ["run_id", "defense_mode", "suite_version", "evaluator_version", "case_id", "category", "verdict", "reason", "response_excerpt"];
  const rows = run.results.map((r) => [run.run_id, run.defense_mode, run.suite_version, run.evaluator_version, r.case_id, r.category, r.verdict, r.reason, r.response_excerpt]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

function verdictClass(verdict: Verdict): string {
  return `verdict verdict-${verdict.toLowerCase()}`;
}

function RunSummary({ results }: { results: CaseResult[] }) {
  const { totals, failuresByCategory } = summarize(results);
  const categories = Object.entries(failuresByCategory);
  return (
    <div className="run-summary" aria-label="Run totals">
      <ul className="totals-list">
        <li><strong>{results.length}</strong> cases</li>
        {VERDICTS.map((v) => <li key={v}><span className={verdictClass(v)}>{v}</span> <strong>{totals[v]}</strong></li>)}
      </ul>
      <p className="muted-copy">
        {categories.length === 0
          ? "No FAIL verdicts, so no failures by category."
          : `Failures by category: ${categories.map(([c, n]) => `${c} (${n})`).join(", ")}.`}
        {" "}NEEDS_REVIEW and ERROR are shown separately and excluded from ASR.
      </p>
    </div>
  );
}

export default function Home() {
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "unavailable">("checking");
  const [suites, setSuites] = useState<Suite[]>([]);
  const [suiteId, setSuiteId] = useState("baseline");
  const [targetId, setTargetId] = useState("demo_assistant");
  const [defenseMode, setDefenseMode] = useState<"off" | "on">("off");
  const [latestRun, setLatestRun] = useState<RunResult | null>(null);
  const [baseline, setBaseline] = useState<RunResult | null>(null);
  const [defended, setDefended] = useState<RunResult | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [runStatus, setRunStatus] = useState<"idle" | "running" | "completed" | "failed">("idle");
  const [error, setError] = useState("");
  const [history, setHistory] = useState<RunResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [exportNotice, setExportNotice] = useState("");

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError("");
    try {
      const data = await api<RunList>("/api/v1/runs?limit=10");
      setHistory(data.items);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : "Could not load run history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function initialize() {
      try {
        await api<{ status: string }>("/api/v1/health");
        const suiteData = await api<{ items: Suite[] }>("/api/v1/suites");
        if (!active) return;
        setSuites(suiteData.items);
        if (suiteData.items.length > 0) setSuiteId(suiteData.items[0].suite_id);
        setApiStatus("connected");
        await loadHistory();
      } catch {
        if (active) setApiStatus("unavailable");
      }
    }
    void initialize();
    return () => { active = false; };
  }, [loadHistory]);

  const busyLabel = useMemo(() => {
    if (runStatus === "running") return "Submitting run…";
    if (runStatus === "completed") return "Last run completed";
    if (runStatus === "failed") return "Last run failed";
    return "Ready to evaluate";
  }, [runStatus]);

  async function startRun() {
    setBusy(true);
    setRunStatus("running");
    setError("");
    setExportNotice("");
    setLatestRun(null);
    setComparison(null);
    try {
      const result = await api<RunResult>("/api/v1/runs", {
        method: "POST",
        body: JSON.stringify({
          target_id: targetId,
          suite_id: suiteId,
          defense_mode: defenseMode,
        }),
      });
      setLatestRun(result);
      if (result.status === "failed") {
        setRunStatus("failed");
        setError("The API reported that this run failed.");
      } else {
        setRunStatus("completed");
        if (defenseMode === "off") {
          setBaseline(result);
          setDefended(null);
        } else {
          setDefended(result);
        }
      }
      await loadHistory();
    } catch (err) {
      setRunStatus("failed");
      setError(err instanceof Error ? err.message : "Run request failed");
    } finally {
      setBusy(false);
    }
  }

  async function compareRuns() {
    if (!baseline || !defended) return;
    setBusy(true);
    setError("");
    setExportNotice("");
    try {
      const result = await api<Comparison>("/api/v1/comparisons", {
        method: "POST",
        body: JSON.stringify({
          baseline_run_id: baseline.run_id,
          defended_run_id: defended.run_id,
        }),
      });
      setComparison(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Comparison failed");
      setComparison(null);
    } finally {
      setBusy(false);
    }
  }

  async function exportRunReport(run: RunResult) {
    setError("");
    setExportNotice("");
    try {
      const report = await api<RunResult>(`/api/v1/runs/${encodeURIComponent(run.run_id)}/report`);
      downloadJson(report, `ai-arena-run-${run.run_id.slice(0, 8)}.json`);
      setExportNotice("Run report exported from the API response.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Report export failed");
    }
  }

  async function exportRunCsv(run: RunResult) {
    setError("");
    setExportNotice("");
    try {
      const report = await api<RunResult>(`/api/v1/runs/${encodeURIComponent(run.run_id)}/report`);
      downloadBlob(runToCsv(report), "text/csv", `ai-arena-run-${run.run_id.slice(0, 8)}.csv`);
      setExportNotice("Run report CSV exported from the API response.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "CSV export failed");
    }
  }

  function exportComparison() {
    if (!comparison) return;
    downloadJson(comparison, `ai-arena-comparison-${comparison.baseline_run_id.slice(0, 8)}.json`);
    setExportNotice("Comparison JSON exported from the API response.");
  }

  function downloadJson(value: unknown, filename: string) {
    downloadBlob(JSON.stringify(value, null, 2), "application/json", filename);
  }

  function downloadBlob(content: string, type: string, filename: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const statusText = apiStatus === "checking" ? "Checking API…" : apiStatus === "connected" ? "API connected" : "API unavailable";

  return (
    <main className="shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <nav className="nav" aria-label="Main">
        <a className="brand-lockup" href="#top" aria-label="AI Arena home">
        <div className="brand-mark" aria-hidden="true">A/</div>
        <div>
          <div className="brand-name">ARENA / AI SECURITY</div>
          <div className="brand-sub">LOGUNIFYERS · RESEARCH WORKSPACE</div>
        </div>
        </a>
        <div className="nav-links" aria-label="Page sections">
          <a href="#configure">Configure</a><a href="#workflow">Workflow</a><a href="#evidence">Evidence</a><a href="#history">History</a>
        </div>
        <span className={`status status-${apiStatus}`} role="status" aria-live="polite">
          <span className="dot" aria-hidden="true" />{statusText}
        </span>
      </nav>

      <div id="main-content">
        <div id="top" className="workspace-meta">
          <div className="workspace-breadcrumb"><span className="breadcrumb-mark" /> SECURITY LAB <span aria-hidden="true">/</span> EXPERIMENT WORKSPACE</div>
          <div className="meta-tags"><span>PROTOTYPE 01</span><span>FIXTURE-BASED</span><span>V1.0</span></div>
        </div>
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow">AI APPLICATION SECURITY / WORKSPACE 01</p>
            <h1>Find the weak spots.<br /><span>Harden what matters.</span></h1>
            <p className="intro">A focused red-team workspace for running controlled security scenarios, reviewing model behavior, and comparing defenses with traceable evidence.</p>
          </div>
          <aside className="hero-aside" aria-label="Workspace summary">
            <div className="protocol-topline"><span className="protocol-index">01</span><span className="aside-label">Evaluation protocol</span></div>
            <strong>Controlled.<br />Repeatable.<br />Auditable.</strong>
            <p>Curated synthetic fixtures, case-matched comparisons, and exportable evidence.</p>
            <div className="protocol-stats"><span><b>04</b><small>Verdict states</small></span><span><b>02</b><small>Run modes</small></span></div>
          </aside>
        </section>
        <div className="safety-strip" role="note">
          <span className="safety-icon" aria-hidden="true">!</span>
          <div><strong>Scope &amp; safety boundaries</strong><p>The synthetic assistant is deterministic. Configured model runs execute in-process and are not sandboxed. Use only authorized targets and synthetic fixtures; these results are not a production security certification.</p></div>
          <a href="#methodology" className="safety-link">Read methodology <span aria-hidden="true">↗</span></a>
        </div>

        <section id="configure" className="card controls section-block" aria-labelledby="run-config-title">
          <div className="section-heading">
            <div><p className="eyebrow">01 / SETUP</p><h2 id="run-config-title">Configure an evaluation</h2><p className="section-kicker">Choose a target, suite, and defense posture before launching your test.</p></div>
            <span className={`pill ${runStatus === "failed" ? "pill-error" : ""}`} role="status" aria-live="polite">{busyLabel}</span>
          </div>
          <div className="form-grid">
            <label htmlFor="target-select">Demo target
              <select id="target-select" value={targetId} onChange={(event) => setTargetId(event.target.value)} disabled={busy || apiStatus !== "connected"}>
                <option value="demo_assistant">Synthetic demo assistant</option><option value="openai_compatible">Configured OpenAI-compatible model</option>
              </select>
              <small>Real-model option requires backend-only ARENA_LLM_* settings; provider credentials never belong in the browser.</small>
            </label>
            <label htmlFor="suite-select">Test suite
              <select id="suite-select" value={suiteId} onChange={(event) => setSuiteId(event.target.value)} disabled={busy || apiStatus !== "connected" || suites.length === 0}>
                {suites.map((suite) => <option key={suite.suite_id} value={suite.suite_id}>{suite.suite_id} · {suite.case_count} cases · v{suite.version}</option>)}
              </select>
              <small>Suites are populated from GET /api/v1/suites.</small>
            </label>
            <label htmlFor="defense-select">Defense mode
              <select id="defense-select" value={defenseMode} onChange={(event) => setDefenseMode(event.target.value as "off" | "on")} disabled={busy || apiStatus !== "connected"}>
                <option value="off">Off — baseline</option>
                <option value="on">On — defended</option>
              </select>
              <small>Runs are saved using the selected mode.</small>
            </label>
          </div>
          <div className="button-row">
            <button onClick={startRun} disabled={busy || apiStatus !== "connected" || suites.length === 0}> {busy ? "Running…" : "Start run"} </button>
            <button className="button-secondary" onClick={compareRuns} disabled={busy || !baseline || !defended}>Compare baseline + defended</button>
            <button className="button-secondary" onClick={loadHistory} disabled={historyLoading || apiStatus !== "connected"}>{historyLoading ? "Loading history…" : "Refresh history"}</button>
          </div>
          {busy && <div className="progress-wrap" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" />Submitting request; the current API evaluates fixtures synchronously in-process.</div>}
          {error && <div className="notice error-notice" role="alert"><strong>Request failed</strong><p>{error}</p><div className="button-row"><button className="button-secondary" onClick={() => void startRun()} disabled={busy || apiStatus !== "connected"}>Retry run</button><button className="button-secondary" onClick={() => void loadHistory()} disabled={historyLoading || apiStatus !== "connected"}>Retry history</button></div></div>}
          {exportNotice && <p className="success-message" role="status">{exportNotice}</p>}
        </section>

        <section id="workflow" className="workflow-section section-block" aria-label="Run workflow">
          <div className="section-heading"><div><p className="eyebrow">02 / THE EXPERIMENT</p><h2>One suite. Two postures. Clear evidence.</h2><p className="section-kicker">Run the same curated cases with the defense off and on, then compare matching case IDs.</p></div><span className="section-index">WORKFLOW / 03 STEPS</span></div>
          <div className="grid summary-grid">
          <article className={`card workflow-card ${baseline ? "is-complete" : ""}`}><div className="workflow-card-top"><div className="number">01</div><span className="workflow-state">{baseline ? "CAPTURED" : "AWAITING RUN"}</span></div><h2>Baseline run</h2><p>Establish the unprotected behavior of your selected synthetic suite.</p>{baseline ? <><p className="pill">{baseline.status} · {baseline.results.length} cases</p><small>RUN / {baseline.run_id.slice(0, 8)}…</small></> : <p className="muted-copy">Choose defense mode Off, then start a run.</p>}</article>
          <article className={`card workflow-card ${defended ? "is-complete" : ""}`}><div className="workflow-card-top"><div className="number">02</div><span className="workflow-state">{defended ? "CAPTURED" : "AWAITING RUN"}</span></div><h2>Defended run</h2><p>Repeat the identical suite with the demo authorization defense enabled.</p>{defended ? <><p className="pill">{defended.status} · {defended.results.length} cases</p><small>RUN / {defended.run_id.slice(0, 8)}…</small></> : <p className="muted-copy">Choose defense mode On, then start a second run.</p>}</article>
          <article className={`card workflow-card ${comparison ? "is-complete" : ""}`}><div className="workflow-card-top"><div className="number">03</div><span className="workflow-state">{comparison ? "READY" : "NEXT STEP"}</span></div><h2>Compare results</h2><p>Line up outcomes by case ID and inspect verdict changes and evidence.</p>{comparison ? <p className="pill">Comparison ready · {comparison.items.length} cases</p> : <p className="muted-copy">Comparison unlocks once both run modes are captured.</p>}</article>
          </div>
        </section>

        {comparison && <section className="card results comparison-section section-block" aria-labelledby="comparison-title">
          <div className="section-heading"><div><p className="eyebrow">03 / OUTCOME ANALYSIS</p><h2 id="comparison-title">Baseline vs. defended</h2><p className="section-kicker">Observed outcomes from two compatible runs; inspect case evidence before drawing conclusions.</p></div><button onClick={exportComparison}>Export comparison JSON <span aria-hidden="true">↗</span></button></div>
          <div className="metrics-grid">
            <div><strong>Baseline attack success rate</strong><p className="metric-value">{formatAsr(comparison.baseline_asr)}</p><small>Excluded verdicts: {comparison.baseline_excluded_count}</small></div>
            <div><strong>Defended attack success rate</strong><p className="metric-value">{formatAsr(comparison.defended_asr)}</p><small>Excluded verdicts: {comparison.defended_excluded_count}</small></div>
          </div>
          <p className="muted-copy">ASR is computed by the API from decisive PASS/FAIL outcomes only. N/A means no decisive outcomes were available.</p>
          <div className="notice" role="note">
            <strong>Audit context</strong>
            <p>Generated {new Date(comparison.generated_at).toLocaleString()} · Method: {comparison.evaluation_method}</p>
            <p>Baseline: {comparison.baseline_metadata.target_id} v{comparison.baseline_metadata.target_version} · suite {comparison.baseline_metadata.suite_id} v{comparison.baseline_metadata.suite_version} · config {comparison.baseline_metadata.defense_config_id} · evaluator {comparison.baseline_metadata.evaluator_version}</p>
            <p>Defended: {comparison.defended_metadata.target_id} v{comparison.defended_metadata.target_version} · suite {comparison.defended_metadata.suite_id} v{comparison.defended_metadata.suite_version} · config {comparison.defended_metadata.defense_config_id} · evaluator {comparison.defended_metadata.evaluator_version}</p>
            <ul>{comparison.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
          </div>
          <div className="table-scroll"><table><caption>Verdicts, outcome status, and evidence aligned by exact case ID</caption><thead><tr><th scope="col">Case ID</th><th scope="col">Baseline</th><th scope="col">Defended</th><th scope="col">Change</th><th scope="col">Evidence / evaluator notes</th></tr></thead><tbody>{comparison.items.map((item) => <tr key={item.case_id}><th scope="row">{item.case_id}</th><td><span className={verdictClass(item.baseline_verdict)}>{item.baseline_verdict}</span><small>{item.baseline_reason}<br />Evidence: {item.baseline_evidence || "—"}</small></td><td><span className={verdictClass(item.defended_verdict)}>{item.defended_verdict}</span><small>{item.defended_reason}<br />Evidence: {item.defended_evidence || "—"}</small></td><td>{item.status}</td><td>{item.status === "needs_review" ? "At least one outcome is indeterminate/technical error; review manually." : item.status === "changed" ? "Verdict changed between runs." : "Verdict unchanged between runs."}</td></tr>)}</tbody></table></div>
        </section>}

        <section id="evidence" className="card results evidence-section section-block" aria-labelledby="evidence-title">
          <div className="section-heading"><div><p className="eyebrow">04 / TRACE &amp; INSPECT</p><h2 id="evidence-title">Case-level evidence</h2><p className="section-kicker">Open any case to inspect its verdict, evaluator rationale, severity, and response excerpt.</p></div><span className="section-index">EVIDENCE / PER CASE</span></div>
          {!latestRun && <p className="empty-state">No run evidence yet. Configure a run above and select <strong>Start run</strong>.</p>}
          {latestRun && <div className="evidence-run">
            <div className="evidence-run-header"><div><h3>{latestRun.defense_mode === "off" ? "Baseline" : "Defended"} result</h3><small>Run ID: {latestRun.run_id}</small></div><div className="button-row"><button className="button-secondary" onClick={() => void exportRunReport(latestRun)}>Export run report JSON</button><button className="button-secondary" onClick={() => void exportRunCsv(latestRun)}>Export run report CSV</button></div></div>
            <p className="muted-copy">Status: {latestRun.status} · target {latestRun.target_id} v{latestRun.target_version} · suite {latestRun.suite_id} v{latestRun.suite_version} · evaluator {latestRun.evaluator_version} ({latestRun.evaluation_source ?? "source not reported"})</p>
            <RunSummary results={latestRun.results} />
            {latestRun.results.map((item) => <details className="evidence-item" key={item.case_id}><summary><span>{item.case_id}</span><span className="category-tag">{item.category}</span><span className={verdictClass(item.verdict)}>{item.verdict}</span></summary><div className="evidence-body"><p><strong>Evaluator reason</strong>{item.reason}</p>{item.severity && <p><strong>Severity</strong> {item.severity}{item.severity_rationale ? ` — ${item.severity_rationale}` : ""}</p>}<p><strong>Response evidence</strong></p><blockquote>{item.response_excerpt || "(Empty response excerpt returned by API.)"}</blockquote></div></details>)}
          </div>}
        </section>

        <section id="history" className="card results history-section section-block" aria-labelledby="history-title">
          <div className="section-heading"><div><p className="eyebrow">05 / RUN LEDGER</p><h2 id="history-title">Recent runs</h2><p className="section-kicker">A traceable record of your latest 10 API-persisted experiments.</p></div><button className="button-secondary" onClick={loadHistory} disabled={historyLoading || apiStatus !== "connected"}>{historyLoading ? "Loading…" : "Refresh history"}</button></div>
          {historyError && <div role="alert" className="error-text">Could not load history: {historyError}</div>}
          {historyLoading && <p className="muted-copy" role="status">Loading saved runs…</p>}
          {!historyLoading && !historyError && history.length === 0 && <p className="empty-state">No saved runs found yet. Start a run to populate history.</p>}
          <div className="table-scroll"><table><caption>Most recent API-persisted runs</caption><thead><tr><th scope="col">Mode</th><th scope="col">Status</th><th scope="col">Suite</th><th scope="col">Created</th><th scope="col">Run ID</th></tr></thead><tbody>{history.map((run) => <tr key={run.run_id}><th scope="row">{run.defense_mode === "off" ? "Baseline" : "Defended"}</th><td>{run.status}</td><td>{run.suite_id} v{run.suite_version}</td><td>{run.created_at ? new Date(run.created_at).toLocaleString() : "Not provided"}</td><td><button className="link-button" onClick={() => setLatestRun(run)} title="Show this run's evidence">{run.run_id.slice(0, 8)}…</button></td></tr>)}</tbody></table></div>
        </section>

        <section id="methodology" className="methodology-strip" aria-labelledby="methodology-title">
          <div><p className="eyebrow">METHOD NOTES</p><h2 id="methodology-title">Evidence over assumptions.</h2><p>AI Arena is a hackathon prototype using synthetic fixtures and a deterministic rule-based evaluator. PASS / FAIL outcomes feed the current ASR calculation; NEEDS_REVIEW and ERROR remain visible but are excluded. Results do not establish real-world model robustness or production-grade isolation.</p></div>
          <a href="https://github.com/Vishwajeet805/Ai-Arena/blob/feat/editorial-arena-redesign/docs/04_DATA_AND_EVALUATION.md" target="_blank" rel="noreferrer">Evaluation notes <span aria-hidden="true">↗</span></a>
        </section>
      </div>

      <footer><span>AI ARENA / Build AI. Break AI. Harden AI.</span><a href={`${apiBase}/api/v1/health`} target="_blank" rel="noreferrer">Check API health ↗</a></footer>
    </main>
  );
}
