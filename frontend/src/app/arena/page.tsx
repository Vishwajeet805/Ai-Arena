"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDownToLine,
  ArrowLeft,
  BookOpen,
  Check,
  CircleAlert,
  FileJson,
  GitCompareArrows,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { MotionConfig, motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  api,
  runToCsv,
  type CaseResult,
  type Comparison,
  type RunList,
  type RunResult,
  type Suite,
  type Verdict,
} from "@/lib/arena-api";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

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

function RunStateCard({ number, title, run, empty }: { number: string; title: string; run: RunResult | null; empty: string }) {
  return (
    <article className={`card workflow-card ${run ? "is-complete" : ""}`}>
      <div className="workflow-card-top">
        <div className="number">{number}</div>
        <span className="workflow-state">{run ? "CAPTURED" : "AWAITING RUN"}</span>
      </div>
      <h2>{title}</h2>
      {run ? (
        <>
          <p className="run-card-meta">{run.target_id} · {run.suite_id} v{run.suite_version}</p>
          <p className={`pill run-state-${run.status}`}>{run.status} · {run.results.length} cases</p>
          <small>RUN / {run.run_id}</small>
        </>
      ) : <p className="muted-copy">{empty}</p>}
    </article>
  );
}

export default function ArenaWorkspace() {
  const [apiStatus, setApiStatus] = useState<"checking" | "connected" | "unavailable">("checking");
  const [apiError, setApiError] = useState("");
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

  const initialize = useCallback(async (isActive: () => boolean = () => true) => {
    setApiStatus("checking");
    setApiError("");
    try {
      await api<{ status: string }>("/api/v1/health");
      const suiteData = await api<{ items: Suite[] }>("/api/v1/suites");
      if (!isActive()) return;
      setSuites(suiteData.items);
      if (suiteData.items.length > 0) setSuiteId(suiteData.items[0].suite_id);
      setApiStatus("connected");
      await loadHistory();
    } catch (err) {
      if (!isActive()) return;
      setSuites([]);
      setApiStatus("unavailable");
      setApiError(err instanceof Error ? err.message : "Could not connect to the API or load suites.");
    }
  }, [loadHistory]);

  useEffect(() => {
    let active = true;
    void initialize(() => active);
    return () => { active = false; };
  }, [initialize]);

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
      const runPayload = {
        target_id: targetId,
        suite_id: suiteId,
        defense_mode: defenseMode,
      };
      let result: RunResult;
      if (targetId === "openai_compatible") {
        const accessPassword = window.prompt(
          "Enter the configured-model access password supplied by the project owner. This is not your provider API key.",
        );
        if (!accessPassword) throw new Error("Configured-model access cancelled.");
        const sessionResponse = await fetch("/api/configured-target/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify({ password: accessPassword }),
        });
        const sessionBody = await sessionResponse.json().catch(() => ({})) as { detail?: string };
        if (!sessionResponse.ok) {
          throw new Error(sessionBody.detail ?? `Configured-model access failed (${sessionResponse.status}).`);
        }
        const runResponse = await fetch("/api/configured-target/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          cache: "no-store",
          body: JSON.stringify(runPayload),
        });
        const runBody = await runResponse.json().catch(() => ({}));
        if (!runResponse.ok) {
          throw new Error(
            (runBody as { detail?: string }).detail ?? `Run request failed (${runResponse.status}).`,
          );
        }
        result = runBody as RunResult;
      } else {
        result = await api<RunResult>("/api/v1/runs", {
          method: "POST",
          body: JSON.stringify(runPayload),
        });
      }
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
    <main className="shell arena-shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="nav arena-nav">
        <a className="brand-lockup" href="/" aria-label="AI Arena overview">
          <div className="brand-mark" aria-hidden="true">A/</div>
          <div>
            <div className="brand-name">AI ARENA</div>
            <div className="brand-sub">SECURITY LAB</div>
          </div>
        </a>
        <div className="arena-context"><span>WORKSPACE</span><strong>Evaluation console</strong></div>
        <nav className="nav-links" aria-label="Workspace navigation">
          <a href="#overview">Overview</a>
          <a href="#configure">New Evaluation</a>
          <a href="/history">History</a>
          <a href="#evidence">Evidence</a>
          <a href="/methodology">Methodology</a>
        </nav>
        <div className="arena-header-actions">
          <span className={`status status-${apiStatus}`} role="status" aria-live="polite">
            <span className="dot" aria-hidden="true" />{statusText}
          </span>
          <a className="arena-home-link" href="/"><ArrowLeft size={14} aria-hidden="true" /> Landing page</a>
        </div>
      </header>

      <div id="main-content" className="arena-content">
        <div id="top" className="workspace-meta">
          <div className="workspace-breadcrumb"><span className="breadcrumb-mark" /> AI SECURITY <span aria-hidden="true">/</span> EVALUATION WORKSPACE</div>
          <div className="meta-tags"><span>CONTROLLED TESTING</span><span>API-DRIVEN RESULTS</span></div>
        </div>
        <MotionConfig reducedMotion="user">
          <motion.section
            id="overview"
            className="hero"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, ease: "easeOut" }}
          >
          <div className="hero-copy">
            <p className="eyebrow"><Activity size={13} aria-hidden="true" /> EVALUATION WORKSPACE</p>
            <h1>Run controlled tests.<br /><span>Inspect every outcome.</span></h1>
            <p className="intro">Configure a target, evaluate it against an API-provided test suite, then compare baseline and defended runs with case-level evidence.</p>
            <a className="workspace-hero-action" href="#configure"><Play size={15} aria-hidden="true" /> Configure evaluation</a>
          </div>
          <aside className="hero-aside" aria-label="Workspace summary">
            <div className="protocol-topline"><span className="protocol-index"><ShieldCheck size={14} aria-hidden="true" /></span><span className="aside-label">Workspace state</span></div>
            <strong>{apiStatus === "checking" ? "Connecting to API" : apiStatus === "connected" ? "Ready to evaluate" : "API unavailable"}</strong>
            <p>{apiStatus === "connected" ? "Suite catalog and saved runs are loaded from the configured API." : apiStatus === "checking" ? "Checking API health before loading suites and history." : "Reconnect to the API to load suites and submit evaluations."}</p>
            <div className="protocol-stats"><span><b>{apiStatus === "connected" ? suites.length : "—"}</b><small>Available suites</small></span><span><b>{history.length}</b><small>Recent saved runs</small></span></div>
          </aside>
          </motion.section>
        </MotionConfig>
        <div className="safety-strip" role="note">
          <span className="safety-icon" aria-hidden="true"><ShieldAlert size={16} /></span>
          <div><strong>Scope &amp; safety boundaries</strong><p>The synthetic assistant is deterministic. Configured model runs execute in-process and are not sandboxed. Use only authorized targets and synthetic fixtures; these results are not a production security certification.</p></div>
          <a href="/methodology" className="safety-link">Read methodology <span aria-hidden="true">↗</span></a>
        </div>
        {apiStatus === "unavailable" && (
          <div className="notice error-notice" role="alert">
            <strong><CircleAlert size={15} aria-hidden="true" /> API connection unavailable</strong>
            <p>{apiError || "The API health check or suite catalog could not be loaded. Check the configured API URL and service, then retry."}</p>
            <button className="button-secondary" onClick={() => void initialize()}>
              <RefreshCw size={14} aria-hidden="true" /> Retry API connection
            </button>
          </div>
        )}

        <section id="configure" className="card controls section-block" aria-labelledby="run-config-title">
          <div className="section-heading">
            <div><p className="eyebrow">01 / NEW EVALUATION</p><h2 id="run-config-title">Configure an evaluation</h2><p className="section-kicker">Choose a target, API-provided suite, and defense posture before launching your test.</p></div>
            <span className={`pill ${runStatus === "failed" ? "pill-error" : ""}`} role="status" aria-live="polite">{busyLabel}</span>
          </div>
          <div className="form-grid">
            <label htmlFor="target-select"><span className="field-label">Target</span>
              <select id="target-select" value={targetId} onChange={(event) => setTargetId(event.target.value)} disabled={busy || apiStatus !== "connected"}>
                <option value="demo_assistant">Synthetic demo assistant</option><option value="openai_compatible">Configured model · trusted API client only</option>
              </select>
              <small>{targetId === "openai_compatible" ? "Requires backend enablement, server-side proxy secrets, and a separate access password. Provider credentials remain backend-only; configured execution is not sandboxed." : "Deterministic synthetic fixtures; no provider credentials are required."}</small>
            </label>
            <label htmlFor="suite-select"><span className="field-label">Test suite</span>
              <select id="suite-select" value={suiteId} onChange={(event) => setSuiteId(event.target.value)} disabled={busy || apiStatus !== "connected" || suites.length === 0}>
                {suites.map((suite) => <option key={suite.suite_id} value={suite.suite_id}>{suite.suite_id} · {suite.case_count} cases · v{suite.version}</option>)}
              </select>
              <small>{apiStatus === "checking" ? "Loading available suites…" : apiStatus === "unavailable" ? "Suites unavailable until the API connects." : suites.length === 0 ? "The API returned no available suites." : `${suites.length} suite${suites.length === 1 ? "" : "s"} loaded from the API.`}</small>
            </label>
            <label htmlFor="defense-select"><span className="field-label">Defense posture</span>
              <select id="defense-select" value={defenseMode} onChange={(event) => setDefenseMode(event.target.value as "off" | "on")} disabled={busy || apiStatus !== "connected"}>
                <option value="off">Off — baseline</option>
                <option value="on">On — defended</option>
              </select>
              <small>Runs are saved using the selected mode.</small>
            </label>
          </div>
          <div className="button-row">
            <Button className="ui-button run-evaluation-button" onClick={startRun} disabled={busy || apiStatus !== "connected" || suites.length === 0}><Play size={15} aria-hidden="true" />{busy ? "Running evaluation…" : "Run Evaluation"}</Button>
            <button className="button-secondary" onClick={compareRuns} disabled={busy || !baseline || !defended}><GitCompareArrows size={15} aria-hidden="true" />Compare runs</button>
            <button className="button-secondary" onClick={loadHistory} disabled={historyLoading || apiStatus !== "connected"}><RefreshCw size={15} aria-hidden="true" className={historyLoading ? "refreshing-icon" : undefined} />{historyLoading ? "Loading history…" : "Refresh history"}</button>
          </div>
          {busy && <div className="progress-wrap" role="status" aria-live="polite"><span className="spinner" aria-hidden="true" />Submitting evaluation request. The API evaluates fixtures synchronously.</div>}
          {error && <div className="notice error-notice" role="alert"><strong><CircleAlert size={15} aria-hidden="true" /> Request failed</strong><p>{error}</p><div className="button-row"><button className="button-secondary" onClick={() => void startRun()} disabled={busy || apiStatus !== "connected"}>Retry run</button><button className="button-secondary" onClick={() => void loadHistory()} disabled={historyLoading || apiStatus !== "connected"}>Retry history</button></div></div>}
          {exportNotice && <p className="success-message" role="status">{exportNotice}</p>}
        </section>

        <section id="workflow" className="workflow-section section-block" aria-label="Run workflow">
          <div className="section-heading"><div><p className="eyebrow">02 / RUN STATUS</p><h2>Baseline, defended, compare.</h2><p className="section-kicker">Capture both postures, then compare API results aligned by case ID.</p></div><span className="section-index">WORKFLOW / 03 STEPS</span></div>
          <div className="grid summary-grid">
            <RunStateCard number="01" title="Baseline run" run={baseline} empty="Select defense Off and run an evaluation to capture baseline behavior." />
            <RunStateCard number="02" title="Defended run" run={defended} empty="Select defense On and run an evaluation to capture defended behavior." />
            <article className={`card workflow-card ${comparison ? "is-complete" : ""}`}>
              <div className="workflow-card-top"><div className="number">03</div><span className="workflow-state">{comparison ? "READY" : "AWAITING BOTH RUNS"}</span></div>
              <h2>Compare results</h2>
              <p>Review API-computed ASR, case-matched verdicts, and reported limitations.</p>
              {comparison ? <p className="pill"><Check size={12} aria-hidden="true" /> Comparison · {comparison.items.length} matched cases</p> : <p className="muted-copy">Capture both run postures, then select Compare runs.</p>}
            </article>
          </div>
        </section>

        {comparison && <section className="card results comparison-section section-block" aria-labelledby="comparison-title">
          <div className="section-heading"><div><p className="eyebrow">03 / COMPARISON</p><h2 id="comparison-title">Baseline vs. defended</h2><p className="section-kicker">API-returned metrics and outcomes from the submitted runs.</p></div><button className="button-secondary export-button" onClick={exportComparison}><FileJson size={15} aria-hidden="true" />Export comparison JSON</button></div>
          <div className="metrics-grid">
            <div><strong>Baseline attack success rate</strong><p className="metric-value">{formatAsr(comparison.baseline_asr)}</p><small>{comparison.baseline_run_id}</small><small>Excluded outcomes: {comparison.baseline_excluded_count}</small></div>
            <div><strong>Defended attack success rate</strong><p className="metric-value">{formatAsr(comparison.defended_asr)}</p><small>{comparison.defended_run_id}</small><small>Excluded outcomes: {comparison.defended_excluded_count}</small></div>
          </div>
          <p className="muted-copy comparison-explanation">ASR is computed by the API from decisive PASS/FAIL outcomes only. NEEDS_REVIEW and ERROR remain separate and are excluded. N/A means no decisive outcomes were available.</p>
          <div className="notice" role="note">
            <strong><ShieldCheck size={15} aria-hidden="true" /> Audit context</strong>
            <p>Generated {new Date(comparison.generated_at).toLocaleString()} · Method: {comparison.evaluation_method}</p>
            <p>Baseline: {comparison.baseline_metadata.target_id} v{comparison.baseline_metadata.target_version} · suite {comparison.baseline_metadata.suite_id} v{comparison.baseline_metadata.suite_version} · config {comparison.baseline_metadata.defense_config_id} · evaluator {comparison.baseline_metadata.evaluator_version}</p>
            <p>Defended: {comparison.defended_metadata.target_id} v{comparison.defended_metadata.target_version} · suite {comparison.defended_metadata.suite_id} v{comparison.defended_metadata.suite_version} · config {comparison.defended_metadata.defense_config_id} · evaluator {comparison.defended_metadata.evaluator_version}</p>
            <ul>{comparison.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
          </div>
          <div className="table-scroll"><table><caption>Verdicts, outcome status, and evidence aligned by exact case ID</caption><thead><tr><th scope="col">Case ID</th><th scope="col">Baseline</th><th scope="col">Defended</th><th scope="col">Change</th><th scope="col">Evidence / evaluator notes</th></tr></thead><tbody>{comparison.items.map((item) => <tr key={item.case_id}><th scope="row">{item.case_id}</th><td><span className={verdictClass(item.baseline_verdict)}>{item.baseline_verdict}</span><small>{item.baseline_reason}<br />Evidence: {item.baseline_evidence || "—"}</small></td><td><span className={verdictClass(item.defended_verdict)}>{item.defended_verdict}</span><small>{item.defended_reason}<br />Evidence: {item.defended_evidence || "—"}</small></td><td>{item.status}</td><td>{item.status === "needs_review" ? "At least one outcome is indeterminate/technical error; review manually." : item.status === "changed" ? "Verdict changed between runs." : "Verdict unchanged between runs."}</td></tr>)}</tbody></table></div>
        </section>}

        <section id="evidence" className="card results evidence-section section-block" aria-labelledby="evidence-title">
          <div className="section-heading"><div><p className="eyebrow">04 / EVIDENCE</p><h2 id="evidence-title">Case-level evidence</h2><p className="section-kicker">Inspect evaluator reasons, severity where returned, and response excerpts.</p></div><span className="section-index">EVIDENCE / PER CASE</span></div>
          {!latestRun && <p className="empty-state">No run evidence yet. Configure a run above and select <strong>Start run</strong>.</p>}
          {latestRun && <div className="evidence-run">
            <div className="evidence-run-header"><div><h3>{latestRun.defense_mode === "off" ? "Baseline" : "Defended"} result</h3><small>Run ID: {latestRun.run_id}</small></div><div className="button-row"><button className="button-secondary export-button" onClick={() => void exportRunReport(latestRun)}><FileJson size={15} aria-hidden="true" />Run JSON</button><button className="button-secondary export-button" onClick={() => void exportRunCsv(latestRun)}><ArrowDownToLine size={15} aria-hidden="true" />Run CSV</button></div></div>
            <p className="muted-copy">Status: {latestRun.status} · target {latestRun.target_id} v{latestRun.target_version} · suite {latestRun.suite_id} v{latestRun.suite_version} · evaluator {latestRun.evaluator_version} ({latestRun.evaluation_source ?? "source not reported"})</p>
            <RunSummary results={latestRun.results} />
            {latestRun.results.map((item) => <details className="evidence-item" key={item.case_id}><summary><span>{item.case_id}</span><span className="category-tag">{item.category}</span><span className={verdictClass(item.verdict)}>{item.verdict}</span></summary><div className="evidence-body"><p><strong>Evaluator reason</strong>{item.reason}</p>{item.severity && <p><strong>Severity</strong><span>{item.severity}</span></p>}{item.severity_rationale && <p><strong>Severity rationale</strong>{item.severity_rationale}</p>}<p><strong>Response excerpt</strong></p><blockquote>{item.response_excerpt || "(Empty response excerpt returned by API.)"}</blockquote></div></details>)}
          </div>}
        </section>

        <section id="history" className="card results history-section section-block" aria-labelledby="history-title">
          <div className="section-heading"><div><p className="eyebrow">05 / RUN HISTORY</p><h2 id="history-title">Recent runs</h2><p className="section-kicker">The latest 10 API-persisted evaluations.</p></div><button className="button-secondary" onClick={loadHistory} disabled={historyLoading || apiStatus !== "connected"}><RefreshCw size={15} aria-hidden="true" className={historyLoading ? "refreshing-icon" : undefined} />{historyLoading ? "Loading…" : "Refresh history"}</button></div>
          {historyError && <div role="alert" className="error-text">Could not load history: {historyError}</div>}
          {historyLoading && <p className="muted-copy" role="status">Loading saved runs…</p>}
          {!historyLoading && !historyError && history.length === 0 && <p className="empty-state">No saved runs found yet. Start a run to populate history.</p>}
          <div className="table-scroll"><table><caption>Most recent API-persisted runs. Select a run ID to inspect its evidence.</caption><thead><tr><th scope="col">Mode</th><th scope="col">Status</th><th scope="col">Suite</th><th scope="col">Created</th><th scope="col">Run ID</th></tr></thead><tbody>{history.map((run) => <tr key={run.run_id}><th scope="row">{run.defense_mode === "off" ? "Baseline" : "Defended"}</th><td><span className={`history-status history-status-${run.status}`}>{run.status}</span></td><td>{run.suite_id} v{run.suite_version}</td><td>{run.created_at ? new Date(run.created_at).toLocaleString() : "Not provided"}</td><td><button className="link-button" onClick={() => { setLatestRun(run); document.getElementById("evidence")?.scrollIntoView(); }} title="Show this run's evidence">{run.run_id.slice(0, 8)}…</button></td></tr>)}</tbody></table></div>
        </section>

        <section id="methodology" className="methodology-strip" aria-labelledby="methodology-title">
          <div><p className="eyebrow">METHOD NOTES</p><h2 id="methodology-title">Evidence over assumptions.</h2><p>AI Arena is a hackathon prototype using synthetic fixtures and a deterministic rule-based evaluator. PASS / FAIL outcomes feed the current ASR calculation; NEEDS_REVIEW and ERROR remain visible but are excluded. Results do not establish real-world model robustness or production-grade isolation.</p></div>
          <a href="https://github.com/Vishwajeet805/Ai-Arena/blob/feat/editorial-arena-redesign/docs/04_DATA_AND_EVALUATION.md" target="_blank" rel="noreferrer"><BookOpen size={14} aria-hidden="true" />Evaluation notes <span aria-hidden="true">↗</span></a>
        </section>

      </div>

      <footer><span>AI ARENA / CONTROLLED EVALUATIONS</span><a href={`${apiBase}/api/v1/health`} target="_blank" rel="noreferrer">Check API health ↗</a><a href="/">Back to landing page</a></footer>
    </main>
  );
}
