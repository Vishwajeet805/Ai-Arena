"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeft,
  CircleAlert,
  FileJson,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import {
  api,
  runToCsv,
  type RunReport,
  type RunResult,
  type Verdict,
} from "@/lib/arena-api";

const verdicts: Verdict[] = ["PASS", "FAIL", "NEEDS_REVIEW", "ERROR"];
type ApiStatus = "checking" | "connected" | "unavailable";

function download(content: string, type: string, filename: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function RunTotals({ results }: { results: RunResult["results"] }) {
  const totals: Record<Verdict, number> = { PASS: 0, FAIL: 0, NEEDS_REVIEW: 0, ERROR: 0 };
  for (const result of results) totals[result.verdict] += 1;

  return (
    <div className="detail-totals" aria-label="Run verdict totals">
      <span className="detail-total-cases"><strong>{results.length}</strong> cases</span>
      {verdicts.map((verdict) => (
        <span className={`verdict verdict-${verdict.toLowerCase()}`} key={verdict}>
          {verdict} <strong>{totals[verdict]}</strong>
        </span>
      ))}
    </div>
  );
}

export default function RunDetailInspector({ runId }: { runId: string }) {
  const [run, setRun] = useState<RunResult | null>(null);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportError, setExportError] = useState("");
  const [exportNotice, setExportNotice] = useState("");

  const loadRun = useCallback(async () => {
    setLoading(true);
    setError("");
    setApiStatus("checking");
    const [healthResult, runResult] = await Promise.allSettled([
      api<{ status: string }>("/api/v1/health"),
      api<RunResult>(`/api/v1/runs/${encodeURIComponent(runId)}`),
    ]);
    setApiStatus(healthResult.status === "fulfilled" ? "connected" : "unavailable");
    if (runResult.status === "fulfilled") {
      setRun(runResult.value);
    } else {
      setRun(null);
      setError(runResult.reason instanceof Error ? runResult.reason.message : "Could not load run details.");
    }
    setLoading(false);
  }, [runId]);

  useEffect(() => {
    void loadRun();
  }, [loadRun]);

  async function exportReport(format: "json" | "csv") {
    setExportError("");
    setExportNotice("");
    try {
      const report = await api<RunReport>(`/api/v1/runs/${encodeURIComponent(runId)}/report`);
      if (format === "json") {
        download(JSON.stringify(report, null, 2), "application/json", `ai-arena-run-${runId.slice(0, 8)}.json`);
        setExportNotice("Run report JSON downloaded from the API response.");
      } else {
        download(runToCsv(report), "text/csv", `ai-arena-run-${runId.slice(0, 8)}.csv`);
        setExportNotice("Run report CSV downloaded from the API response.");
      }
    } catch (exportFailure) {
      setExportError(exportFailure instanceof Error ? exportFailure.message : "Could not export this run report.");
    }
  }

  const statusText = apiStatus === "checking" ? "Checking API…" : apiStatus === "connected" ? "API connected" : "API unavailable";

  return (
    <main className="shell arena-shell history-page">
      <a className="skip-link" href="#run-detail-main">Skip to main content</a>
      <header className="nav arena-nav history-nav">
        <a className="brand-lockup" href="/" aria-label="AI Arena overview">
          <span className="brand-mark" aria-hidden="true">A/</span>
          <span><span className="brand-name">AI ARENA</span><span className="brand-sub">SECURITY LAB</span></span>
        </a>
        <div className="arena-context"><span>RUN INSPECTOR</span><strong>Persisted evaluation</strong></div>
        <nav className="nav-links" aria-label="Workspace navigation">
          <a href="/arena#overview">Overview</a>
          <a href="/arena#configure">New Evaluation</a>
          <a href="/history" aria-current="page">History</a>
          <a href="/methodology">Methodology</a>
        </nav>
        <div className="arena-header-actions">
          <span className={`status status-${apiStatus}`} role="status" aria-live="polite"><span className="dot" aria-hidden="true" />{statusText}</span>
          <a className="arena-home-link" href="/arena"><ArrowLeft size={14} aria-hidden="true" /> Workspace</a>
        </div>
      </header>

      <div id="run-detail-main" className="history-content">
        <nav className="history-breadcrumb" aria-label="Breadcrumb">
          <a href="/history">Run history</a><span aria-hidden="true">/</span><span>Run detail</span>
        </nav>
        <header className="history-page-heading">
          <div>
            <p className="eyebrow">PERSISTED RUN / DETAIL INSPECTOR</p>
            <h1>Run detail</h1>
            <p className="history-lede">Authoritative run data and case evidence fetched by run ID.</p>
          </div>
          <a className="history-back-link" href="/history"><ArrowLeft size={15} aria-hidden="true" /> All recent runs</a>
        </header>

        {loading && <div className="history-state" role="status"><span className="spinner" />Loading run details from the API…</div>}
        {!loading && error && (
          <section className="history-state history-error-state" role="alert">
            <CircleAlert size={20} aria-hidden="true" />
            <div><h2>Run details unavailable</h2><p>{error}</p><button className="button-secondary" onClick={() => void loadRun()}><RefreshCw size={14} aria-hidden="true" />Retry</button></div>
          </section>
        )}

        {!loading && run && (
          <>
            <section className="card run-detail-card" aria-labelledby="run-detail-title">
              <div className="run-detail-heading">
                <div>
                  <p className="eyebrow">{run.defense_mode === "off" ? "BASELINE RUN" : "DEFENDED RUN"}</p>
                  <h2 id="run-detail-title">{run.target_id}</h2>
                  <p className="run-detail-id">RUN ID / {run.run_id}</p>
                </div>
                <span className={`history-status history-status-${run.status}`}>{run.status}</span>
              </div>
              <div className="run-detail-metadata">
                <div><span>Target version</span><strong>{run.target_version}</strong></div>
                <div><span>Test suite</span><strong>{run.suite_id} · v{run.suite_version}</strong></div>
                <div><span>Defense mode</span><strong>{run.defense_mode === "off" ? "Off · baseline" : "On · defended"}</strong></div>
                <div><span>Defense config</span><strong>{run.defense_config_id}</strong></div>
                <div><span>Evaluator</span><strong>{run.evaluator_type ?? "Not reported"}</strong></div>
                <div><span>Evaluator version</span><strong>{run.evaluator_version}</strong></div>
                <div><span>Evaluation source</span><strong>{run.evaluation_source ?? "Not reported"}</strong></div>
                <div><span>Created</span><strong>{run.created_at ? new Date(run.created_at).toLocaleString() : "Not provided"}</strong></div>
                <div><span>Completed</span><strong>{run.completed_at ? new Date(run.completed_at).toLocaleString() : "Not provided"}</strong></div>
              </div>
              <div className="run-detail-actions" aria-label="Run report exports">
                <button className="button-secondary" onClick={() => void exportReport("json")}><FileJson size={15} aria-hidden="true" />Export JSON</button>
                <button className="button-secondary" onClick={() => void exportReport("csv")}><ArrowDownToLine size={15} aria-hidden="true" />Export CSV</button>
              </div>
              {exportError && <p className="history-inline-error" role="alert">{exportError}</p>}
              {exportNotice && <p className="history-inline-success" role="status">{exportNotice}</p>}
            </section>

            <section className="card run-evidence-card" aria-labelledby="run-evidence-title">
              <div className="section-heading">
                <div><p className="eyebrow">CASE-LEVEL INSPECTION</p><h2 id="run-evidence-title">Evaluation evidence</h2><p className="section-kicker">Case data returned by the persisted run endpoint.</p></div>
                <span className="evidence-count"><ShieldCheck size={14} aria-hidden="true" />{run.results.length} cases</span>
              </div>
              <RunTotals results={run.results} />
              {run.results.length === 0 && <p className="empty-state">This run contains no case results.</p>}
              {run.results.map((result) => (
                <details className="evidence-item detail-evidence-item" key={result.case_id}>
                  <summary><span>{result.case_id}</span><span className="category-tag">{result.category}</span><span className={`verdict verdict-${result.verdict.toLowerCase()}`}>{result.verdict}</span></summary>
                  <div className="evidence-body">
                    <p><strong>Evaluator reason</strong>{result.reason}</p>
                    {result.severity && <p><strong>Severity</strong>{result.severity}</p>}
                    {result.severity_rationale && <p><strong>Severity rationale</strong>{result.severity_rationale}</p>}
                    <p><strong>Response excerpt</strong></p>
                    <blockquote>{result.response_excerpt || "(Empty response excerpt returned by API.)"}</blockquote>
                  </div>
                </details>
              ))}
              <p className="run-report-note"><ShieldCheck size={14} aria-hidden="true" /> JSON and CSV exports are fetched from the API report endpoint.</p>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
