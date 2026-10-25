"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, CircleAlert, Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { api, type RunList, type RunResult } from "@/lib/arena-api";

type ApiStatus = "checking" | "connected" | "unavailable";

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Not provided" : date.toLocaleString();
}

export default function RunHistoryPage() {
  const [runs, setRuns] = useState<RunResult[]>([]);
  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    setApiStatus("checking");

    const [healthResult, historyResult] = await Promise.allSettled([
      api<{ status: string }>("/api/v1/health"),
      api<RunList>("/api/v1/runs?limit=10"),
    ]);

    setApiStatus(healthResult.status === "fulfilled" ? "connected" : "unavailable");
    if (historyResult.status === "fulfilled") {
      setRuns(historyResult.value.items);
    } else {
      setRuns([]);
      setError(historyResult.reason instanceof Error ? historyResult.reason.message : "Could not load run history.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const statusText = apiStatus === "checking" ? "Checking API…" : apiStatus === "connected" ? "API connected" : "API unavailable";

  return (
    <main className="shell arena-shell history-page">
      <a className="skip-link" href="#history-main">Skip to main content</a>
      <header className="nav arena-nav history-nav">
        <a className="brand-lockup" href="/" aria-label="AI Arena overview">
          <span className="brand-mark" aria-hidden="true">A/</span>
          <span><span className="brand-name">AI ARENA</span><span className="brand-sub">SECURITY LAB</span></span>
        </a>
        <div className="arena-context"><span>RUN LEDGER</span><strong>Recent evaluations</strong></div>
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

      <div id="history-main" className="history-content">
        <nav className="history-breadcrumb" aria-label="Breadcrumb">
          <a href="/arena">Evaluation workspace</a><span aria-hidden="true">/</span><span>Run history</span>
        </nav>
        <header className="history-page-heading">
          <div>
            <p className="eyebrow">PERSISTED EVALUATIONS / LATEST 10</p>
            <h1>Run history</h1>
            <p className="history-lede">Reopen saved runs to inspect their authoritative metadata and case-level evidence.</p>
          </div>
          <button className="button-secondary history-refresh" onClick={() => void refresh()} disabled={loading} aria-label="Refresh run history">
            <RefreshCw size={15} aria-hidden="true" className={loading ? "refreshing-icon" : undefined} />{loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {!loading && apiStatus === "unavailable" && !error && (
          <p className="history-api-note" role="status"><CircleAlert size={15} aria-hidden="true" /> Health check is unavailable, but the run list was returned.</p>
        )}
        {loading && <div className="history-state" role="status"><span className="spinner" />Loading recent runs from the API…</div>}
        {!loading && error && (
          <section className="history-state history-error-state" role="alert">
            <CircleAlert size={20} aria-hidden="true" />
            <div><h2>Run history unavailable</h2><p>{error}</p><button className="button-secondary" onClick={() => void refresh()}><RefreshCw size={14} aria-hidden="true" />Retry loading history</button></div>
          </section>
        )}
        {!loading && !error && runs.length === 0 && (
          <section className="history-state history-empty-state">
            <Clock3 size={22} aria-hidden="true" />
            <div><h2>No saved runs yet</h2><p>Runs are stored by the API and appear here after an evaluation completes.</p><a className="workspace-hero-action" href="/arena#configure">Start an evaluation <ArrowUpRight size={14} aria-hidden="true" /></a></div>
          </section>
        )}
        {!loading && !error && runs.length > 0 && (
          <section className="history-list-section" aria-labelledby="history-list-title">
            <div className="history-list-heading">
              <div><h2 id="history-list-title">Recent evaluations</h2><p>Showing {runs.length} API-persisted {runs.length === 1 ? "run" : "runs"} · maximum 10</p></div>
              <span><ShieldCheck size={14} aria-hidden="true" /> Loaded from API</span>
            </div>
            <div className="history-run-list">
              {runs.map((run) => (
                <a className="history-run-card" href={`/history/${encodeURIComponent(run.run_id)}`} key={run.run_id}>
                  <span className="history-run-main">
                    <span className="history-run-id">{run.run_id}<ArrowUpRight size={14} aria-hidden="true" /></span>
                    <span className="history-run-target">{run.target_id} · v{run.target_version}</span>
                  </span>
                  <span className="history-run-field"><span>Suite</span><strong>{run.suite_id} · v{run.suite_version}</strong></span>
                  <span className="history-run-field"><span>Defense mode</span><strong>{run.defense_mode === "off" ? "Off · baseline" : "On · defended"}</strong></span>
                  <span className="history-run-field"><span>Status</span><strong><span className={`history-status history-status-${run.status}`}>{run.status}</span></strong></span>
                  <span className="history-run-field history-run-created"><span>Created</span><strong>{formatDate(run.created_at)}</strong></span>
                </a>
              ))}
            </div>
          </section>
        )}

        <p className="history-scope-note">History is limited to the latest 10 runs returned by the API. No additional pagination or filters are implied.</p>
      </div>
      <footer className="history-footer"><span>AI ARENA / PERSISTED RUN HISTORY</span><a href="/arena"><ArrowLeft size={14} aria-hidden="true" /> Back to workspace</a></footer>
    </main>
  );
}
