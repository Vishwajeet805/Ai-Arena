"use client";

import { motion, MotionConfig } from "motion/react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  FileSearch,
  ScanLine,
  ShieldCheck,
  Waypoints,
} from "lucide-react";

const workflow = [
  { number: "01", title: "Configure", detail: "Choose a target, test suite, and defense posture.", icon: ScanLine },
  { number: "02", title: "Evaluate", detail: "Run the same adversarial cases against an AI system.", icon: ShieldCheck },
  { number: "03", title: "Compare", detail: "Review baseline and defended outcomes side by side.", icon: Waypoints },
  { number: "04", title: "Inspect evidence", detail: "Trace verdicts to case-level reasons and responses.", icon: FileSearch },
];

const capabilities = [
  "Synthetic test fixtures",
  "Case-matched comparisons",
  "Inspectable evidence",
  "Exportable reports",
];

function ThreatScanVisual() {
  return (
    <div className="landing-visual" aria-label="Illustration of a controlled security evaluation" role="img">
      <div className="landing-visual-topline">
        <span><span className="landing-signal" /> SECURITY LAB / SYSTEM MAP</span>
        <span>DECORATIVE · NOT LIVE TELEMETRY</span>
      </div>
      <div className="landing-visual-canvas">
        <svg className="landing-scan-svg" viewBox="0 0 620 440" fill="none" aria-hidden="true">
          <defs>
            <pattern id="landing-grid" width="28" height="28" patternUnits="userSpaceOnUse">
              <path d="M 28 0 L 0 0 0 28" stroke="currentColor" strokeOpacity=".12" strokeWidth="1" />
            </pattern>
            <radialGradient id="landing-radar-fill">
              <stop stopColor="#FF7047" stopOpacity=".13" />
              <stop offset="1" stopColor="#FF7047" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="landing-scan-line" x1="0" y1="0" x2="1" y2="1">
              <stop stopColor="#FF7047" stopOpacity="0" />
              <stop offset=".55" stopColor="#FF7047" stopOpacity=".5" />
              <stop offset="1" stopColor="#FF7047" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect width="620" height="440" fill="url(#landing-grid)" />
          <circle cx="313" cy="218" r="170" fill="url(#landing-radar-fill)" />
          <circle cx="313" cy="218" r="151" stroke="#59636E" strokeOpacity=".38" />
          <circle cx="313" cy="218" r="106" stroke="#59636E" strokeOpacity=".34" strokeDasharray="3 7" />
          <circle cx="313" cy="218" r="61" stroke="#59636E" strokeOpacity=".28" />
          <path d="M313 42v352M137 218h352M189 94l248 248m0-248L189 342" stroke="#59636E" strokeOpacity=".2" />
          <path className="landing-sweep" d="M313 218 426 116" stroke="url(#landing-scan-line)" strokeWidth="2" />
          <path d="M313 218 420 122" stroke="#FF7047" strokeOpacity=".45" strokeWidth="1" />
          <path d="M183 151 228 174 313 218 419 273 465 296" stroke="#9AA6B2" strokeOpacity=".48" strokeDasharray="4 7" />
          <path d="M228 174 257 310 313 218 406 178" stroke="#9AA6B2" strokeOpacity=".35" strokeDasharray="4 7" />
          <circle cx="183" cy="151" r="6" fill="#0B0D10" stroke="#FF7047" strokeWidth="2" />
          <circle cx="228" cy="174" r="5" fill="#0B0D10" stroke="#9AA6B2" strokeWidth="1.5" />
          <circle cx="257" cy="310" r="5" fill="#0B0D10" stroke="#9AA6B2" strokeWidth="1.5" />
          <circle cx="406" cy="178" r="5" fill="#0B0D10" stroke="#9AA6B2" strokeWidth="1.5" />
          <circle cx="465" cy="296" r="6" fill="#0B0D10" stroke="#FF7047" strokeWidth="2" />
          <circle cx="313" cy="218" r="12" fill="#0B0D10" stroke="#FF7047" strokeWidth="1.5" />
          <circle cx="313" cy="218" r="3" fill="#FF7047" />
          <path d="M298 218h30M313 203v30" stroke="#FF7047" strokeOpacity=".55" />
          <path d="M183 151h-34m34 0v-24m282 169h34m-34 0v24" stroke="#FF7047" strokeOpacity=".8" />
        </svg>
        <div className="landing-visual-label landing-visual-label-left"><span>TEST CASES</span><b>Adversarial inputs</b></div>
        <div className="landing-visual-label landing-visual-label-right"><span>OBSERVED</span><b>Model responses</b></div>
        <div className="landing-visual-center-label"><span className="landing-center-dot" /> EVALUATION CORE</div>
      </div>
      <div className="landing-visual-legend">
        <span><i className="landing-legend-ember" /> Test input</span>
        <span><i className="landing-legend-neutral" /> Case relationship</span>
        <span>CONTROLLED SCENARIO / 01</span>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <main className="landing-page">
        <a className="landing-skip-link" href="#main-content">Skip to main content</a>
        <header className="landing-header">
          <a className="landing-brand" href="/" aria-label="AI Arena overview">
            <span className="landing-brand-mark" aria-hidden="true">A<span>/</span></span>
            <span className="landing-brand-copy"><strong>AI ARENA</strong><small>SECURITY LAB</small></span>
          </a>
          <nav className="landing-nav" aria-label="Main navigation">
            <a href="#overview" aria-current="page">Overview</a>
            <a href="/arena#configure">New evaluation</a>
            <a href="/arena#history">History</a>
            <a href="/methodology">Methodology</a>
          </nav>
          <a className="landing-nav-cta" href="/arena">Enter the Lab <ArrowUpRight size={15} aria-hidden="true" /></a>
        </header>

        <div id="main-content">
          <motion.section
            id="overview"
            className="landing-hero"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, ease: "easeOut" }}
            aria-labelledby="landing-title"
          >
            <div className="landing-hero-copy">
              <p className="landing-eyebrow"><span /> CONTROLLED AI SECURITY EVALUATION</p>
              <h1 id="landing-title">Break it.<br />Measure it.<br /><em>Defend it.</em></h1>
              <p className="landing-intro">AI Arena evaluates AI systems against adversarial test cases, then compares baseline and defended outcomes with evidence you can inspect.</p>
              <div className="landing-actions">
                <a className="landing-primary-action" href="/arena">Enter the Lab <ArrowRight size={17} aria-hidden="true" /></a>
                <a className="landing-secondary-action" href="/methodology">Explore the Methodology <ArrowDown size={15} aria-hidden="true" /></a>
              </div>
              <p className="landing-hero-note"><Check size={14} aria-hidden="true" /> Repeatable scenarios <span /> Results from the API</p>
            </div>
            <ThreatScanVisual />
          </motion.section>

          <section className="landing-workflow" aria-labelledby="workflow-title">
            <div className="landing-section-heading">
              <div><p className="landing-overline">A CLEAR PATH FROM TEST TO EVIDENCE</p><h2 id="workflow-title">One lab. Four deliberate steps.</h2></div>
              <p>Follow each evaluation from configuration through case-level inspection.</p>
            </div>
            <div className="landing-workflow-grid">
              {workflow.map(({ number, title, detail, icon: Icon }, index) => (
                <motion.article
                  className="landing-step"
                  key={number}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.35 }}
                  transition={{ duration: 0.32, delay: index * 0.045 }}
                >
                  <div className="landing-step-top"><span>{number}</span><Icon size={18} strokeWidth={1.6} aria-hidden="true" /></div>
                  <h3>{title}</h3>
                  <p>{detail}</p>
                </motion.article>
              ))}
            </div>
            <ul className="landing-capabilities" aria-label="Evaluation capabilities">
              {capabilities.map((capability) => <li key={capability}><Check size={14} aria-hidden="true" />{capability}</li>)}
            </ul>
          </section>

          <section className="landing-methodology" id="methodology" aria-labelledby="methodology-title">
            <div className="landing-method-icon"><BookOpen size={20} strokeWidth={1.6} aria-hidden="true" /></div>
            <div className="landing-method-copy">
              <p className="landing-overline">SCOPE &amp; SAFETY</p>
              <h2 id="methodology-title">Measure behavior. Don’t mistake it for a certification.</h2>
              <p>The synthetic demo uses deterministic fixtures. Configured model runs depend on backend settings and are not sandboxed. Results describe the tested cases; they do not establish real-world robustness or production security. Only evaluate targets you are authorized to test.</p>
            </div>
            <a className="landing-method-link" href="/methodology">Read evaluation notes <ArrowUpRight size={15} aria-hidden="true" /></a>
          </section>
        </div>

        <footer className="landing-footer">
          <a className="landing-footer-brand" href="/">AI ARENA <span>/</span> SECURITY LAB</a>
          <span>Controlled evaluations. Inspectable outcomes.</span>
          <a href="/arena">Open the workspace <ArrowRight size={14} aria-hidden="true" /></a>
        </footer>
      </main>
    </MotionConfig>
  );
}
