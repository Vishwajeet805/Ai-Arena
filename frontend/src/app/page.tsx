"use client";

import { useEffect, useState } from "react";

const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

type CaseResult = {
  case_id: string;
  category: string;
  verdict: string;
  reason: string;
  response_excerpt: string;
};

type RunResult = {
  run_id: string;
  status: string;
  defense_mode: "off" | "on";
  created_at?: string;
  results: CaseResult[];
};

type Comparison = {
  baseline_run_id: string;
  defended_run_id: string;
  baseline_asr: number | null;
  defended_asr: number | null;
  baseline_excluded_count: number;
  defended_excluded_count: number;
  items: {
    case_id: string;
    baseline_verdict: string;
    defended_verdict: string;
  }[];
};

export default function Home() {
  const [apiStatus, setApiStatus] = useState("Checking API…");
  const [baseline, setBaseline] = useState<RunResult | null>(null);
  const [defended, setDefended] = useState<RunResult | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<RunResult[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  useEffect(() => {
    fetch(`${apiBase}/api/v1/health`)
      .then((response) => {
        if (!response.ok) throw new Error("Health check failed");
        return response.json();
      })
      .then(() => setApiStatus("API connected"))
      .catch(() => setApiStatus("API unavailable"));
      loadHistory();
  }, []);

  async function createRun(defenseMode: "off" | "on") {
    const response = await fetch(`${apiBase}/api/v1/runs`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target_id: "demo_assistant",
        suite_id: "baseline",
        defense_mode: defenseMode,
      }),
    });

    if (!response.ok) {
      throw new Error(`Run request failed (${response.status})`);
    }

    return (await response.json()) as RunResult;
  }
  async function loadHistory() {
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const response = await fetch(`${apiBase}/api/v1/runs?limit=10`);
      if (!response.ok) {
        throw new Error(`History request failed (${response.status})`);
      }

      const data = (await response.json()) as { items: RunResult[] };
      setHistory(data.items);
    } catch (err) {
      setHistoryError(
        err instanceof Error ? err.message : "Could not load run history",
      );
    } finally {
      setHistoryLoading(false);
    }
  }
  async function runBaseline() {
    setBusy(true);
    setError("");
    setComparison(null);
    setBaseline(null);
    setDefended(null);

    try {
      const result = await createRun("off");
      setBaseline(result);await loadHistory();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Baseline run failed");
    } finally {
      setBusy(false);
    }
  }

  async function runDefended() {
    setBusy(true);
    setError("");
    setComparison(null);
    setDefended(null);

    try {
      const result = await createRun("on");
      setDefended(result);await loadHistory();

      if (baseline) {
        const response = await fetch(`${apiBase}/api/v1/comparisons`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseline_run_id: baseline.run_id,
            defended_run_id: result.run_id,
          }),
        });

        if (!response.ok) {
          throw new Error(`Comparison failed (${response.status})`);
        }

        setComparison((await response.json()) as Comparison);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Defended run failed");
    } finally {
      setBusy(false);
    }
  }

  function formatAsr(value: number | null) {
    return value === null ? "N/A" : `${(value * 100).toFixed(1)}%`;
  }
  function exportComparison() {
    if (!comparison) return;

    const report = {
      generated_at: new Date().toISOString(),
      ...comparison,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `ai-arena-comparison-${comparison.baseline_run_id.slice(0, 8)}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }
  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand-mark">LA</div>
        <div>
          <div className="brand-name">AI RED-TEAM ARENA</div>
          <div className="brand-sub">LOGUNIFYERS / SECURITY LAB</div>
        </div>
        <span className="status">
          <span className="dot" />
          {apiStatus}
        </span>
      </nav>

      <section className="hero">
        <p className="eyebrow">CONTROLLED · REPEATABLE · AUDITABLE</p>
        <h1>
          Test AI security
          <br />
          <span>before production.</span>
        </h1>
        <p className="intro">
          Run the curated synthetic security suite against the demo assistant,
          inspect case evidence, and compare baseline with defenses enabled.
        </p>

        <div className="notice">
          <strong>Prototype safety note</strong>
          <p>
            This MVP uses a deterministic synthetic assistant. Execution is not
            sandboxed and it does not test a real external model.
          </p>
        </div>
      </section>

      <section className="grid" aria-label="Red-team workflow">
        <article className="card">
          <div className="number">01</div>
          <h2>Baseline run</h2>
          <p>Run the fixed test suite with defenses disabled.</p>
          <button
            disabled={busy || apiStatus !== "API connected"}
            onClick={runBaseline}
          >
            {busy ? "Running…" : "Run baseline"}
          </button>
          {baseline && (
            <p className="pill">
              {baseline.status} · {baseline.results.length} cases
            </p>
          )}
        </article>

        <article className="card">
          <div className="number">02</div>
          <h2>Defended run</h2>
          <p>Run the same suite with demo defenses enabled.</p>
          <button
            disabled={busy || !baseline || apiStatus !== "API connected"}
            onClick={runDefended}
          >
            {busy ? "Running…" : "Run defended"}
          </button>
          {defended && (
            <p className="pill">
              {defended.status} · {defended.results.length} cases
            </p>
          )}
        </article>

        <article className="card">
          <div className="number">03</div>
          <h2>Compare results</h2>
          <p>Review attack-success rate and verdicts side by side.</p>
          {comparison ? (
            <p className="pill">Comparison ready</p>
          ) : (
            <p className="pill planned">Run both tests to compare</p>
          )}
        </article>
      </section>

      {error && (
        <div className="notice" role="alert">
          <strong>Request error</strong>
          <p>{error}</p>
        </div>
      )}

      {comparison && (
        <section className="card results">
          <h2>Baseline vs. defended</h2>
          <button onClick={exportComparison}>Export comparison JSON</button>
          <div className="grid">
            <div>
              <strong>Baseline ASR</strong>
              <p>{formatAsr(comparison.baseline_asr)}</p>
              <small>
                Excluded verdicts: {comparison.baseline_excluded_count}
              </small>
            </div>
            <div>
              <strong>Defended ASR</strong>
              <p>{formatAsr(comparison.defended_asr)}</p>
              <small>
                Excluded verdicts: {comparison.defended_excluded_count}
              </small>
            </div>
          </div>

          <h3>Case-by-case verdicts</h3>
          <div className="case-list">
            {comparison.items.map((item) => (
              <div className="case-row" key={item.case_id}>
                <strong>{item.case_id}</strong>
                <span>Baseline: {item.baseline_verdict}</span>
                <span>Defended: {item.defended_verdict}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {(baseline || defended) && (
        <section className="card results">
          <h2>Run evidence</h2>
          {[baseline, defended].filter(Boolean).map((run) => (
            <div key={run!.run_id}>
              <h3>
                {run!.defense_mode === "off" ? "Baseline" : "Defended"} run
              </h3>
              <small>Run ID: {run!.run_id}</small>
              {run!.results.map((item) => (
                <details key={item.case_id}>
                  <summary>
                    {item.case_id} — {item.verdict}
                  </summary>
                  <p>{item.reason}</p>
                  <p>
                    <strong>Response:</strong>{" "}
                    {item.response_excerpt || "(empty)"}
                  </p>
                </details>
              ))}
            </div>
          ))}
        </section>
      )}
      <section className="card results">
        <div className="history-header">
          <div>
            <h2>Run History</h2>
            <p>Latest 10 saved runs</p>
          </div>
          <button
            onClick={loadHistory}
            disabled={historyLoading || apiStatus !== "API connected"}
          >
            {historyLoading ? "Loading…" : "Refresh history"}
          </button>
        </div>

        {historyError && <p role="alert">{historyError}</p>}

        {!historyLoading && history.length === 0 && !historyError && (
          <p>No saved runs found yet. Run a test, then refresh.</p>
        )}

        <div className="case-list">
          {history.map((run) => (
            <div className="case-row" key={run.run_id}>
              <strong>
                {run.defense_mode === "off" ? "Baseline" : "Defended"}
              </strong>
              <span>{run.status}</span>
              <span>
                {run.created_at
                  ? new Date(run.created_at).toLocaleString()
                  : "Time unavailable"}
              </span>
              <small title={run.run_id}>ID: {run.run_id.slice(0, 8)}…</small>
            </div>
          ))}
        </div>
      </section>
      <footer>
        <span>Build AI. Break AI. Harden AI.</span>
        <a href={`${apiBase}/api/v1/health`} target="_blank" rel="noreferrer">
          Check API health ↗
        </a>
      </footer>
    </main>
  );
}
