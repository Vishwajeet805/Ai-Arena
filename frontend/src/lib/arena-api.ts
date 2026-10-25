const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export type Verdict = "PASS" | "FAIL" | "NEEDS_REVIEW" | "ERROR";
export type RunStatus = "queued" | "running" | "completed" | "failed";

export type Suite = { suite_id: string; version: string; case_count: number };
export type CaseResult = {
  case_id: string;
  category: string;
  verdict: Verdict;
  reason: string;
  response_excerpt: string;
  severity?: string;
  severity_rationale?: string;
};
export type RunResult = {
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
export type RunList = { items: RunResult[] };
export type RunReport = RunResult & {
  report_generated_at: string;
  evaluation_method: string;
  limitations: string[];
  defense_config: { config_id: string; mode: "off" | "on"; description: string };
};
export type ComparisonItem = {
  case_id: string;
  baseline_verdict: Verdict;
  defended_verdict: Verdict;
  status: "changed" | "unchanged" | "needs_review";
  baseline_reason: string;
  defended_reason: string;
  baseline_evidence: string;
  defended_evidence: string;
};
export type RunMetadata = {
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
export type Comparison = {
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

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
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

function csvCell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function runToCsv(run: RunResult): string {
  const header = ["run_id", "defense_mode", "suite_version", "evaluator_version", "case_id", "category", "verdict", "reason", "response_excerpt"];
  const rows = run.results.map((result) => [run.run_id, run.defense_mode, run.suite_version, run.evaluator_version, result.case_id, result.category, result.verdict, result.reason, result.response_excerpt]);
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}
