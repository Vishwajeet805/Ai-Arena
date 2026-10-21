const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function Home() {
  return (
    <main className="shell">
      <nav className="nav">
        <div className="brand-mark">LA</div>
        <div>
          <div className="brand-name">AI RED-TEAM ARENA</div>
          <div className="brand-sub">LOGUNIFYERS / SECURITY LAB</div>
        </div>
        <span className="status"><span className="dot" /> LOCAL MVP SCAFFOLD</span>
      </nav>

      <section className="hero">
        <p className="eyebrow">CONTROLLED · REPEATABLE · AUDITABLE</p>
        <h1>Test AI security<br /><span>before production.</span></h1>
        <p className="intro">
          Run authorized adversarial scenarios against a synthetic demo assistant,
          inspect evidence, enable defenses and compare repeatable test runs.
        </p>
        <div className="notice">
          <strong>Foundation build</strong>
          <p>The dashboard shell and API health endpoint are in place. Test execution, sandbox isolation, and reporting are not implemented yet.</p>
        </div>
      </section>

      <section className="grid" aria-label="Prototype workflow">
        <article className="card">
          <div className="number">01</div><h2>Choose a target</h2>
          <p>Start with a local demo assistant and synthetic company data.</p>
          <span className="pill planned">NEXT: TARGET ADAPTER</span>
        </article>
        <article className="card">
          <div className="number">02</div><h2>Run security tests</h2>
          <p>Execute curated prompt-injection and unauthorized-access test cases.</p>
          <span className="pill planned">NEXT: EVALUATION ENGINE</span>
        </article>
        <article className="card">
          <div className="number">03</div><h2>Compare defenses</h2>
          <p>Rerun the same cases, review case-level evidence and export a report.</p>
          <span className="pill planned">NEXT: RESULTS PIPELINE</span>
        </article>
      </section>

      <footer>
        <span>Build AI. Break AI. Harden AI.</span>
        <a href={apiBase + "/api/v1/health"} target="_blank" rel="noreferrer">Check API health ↗</a>
      </footer>
    </main>
  );
}
