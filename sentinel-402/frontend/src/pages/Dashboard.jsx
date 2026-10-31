
import { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Crosshair,
  LoaderCircle,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from "lucide-react";

import api from "../lib/api";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function MetricCard({ icon: Icon, label, value, note, tone }) {
  return (
    <article className="dash-metric-card">
      <div className={`dash-metric-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <div className="dash-metric-label">{label}</div>
      <div className="dash-metric-value">{value ?? "—"}</div>
      <div className="dash-metric-note">{note}</div>
    </article>
  );
}

function SecurityVisual({ score }) {
  const numericScore = Number(score);
  const hasScore = Number.isFinite(numericScore);
  const safeScore = hasScore ? Math.min(100, Math.max(0, numericScore)) : 0;

  return (
    <div className="dash-visual">
      <div className="dash-visual-glow" />
      <div className="dash-visual-ring ring-one" />
      <div className="dash-visual-ring ring-two" />

      <div className="dash-visual-shield">
        <ShieldCheck size={65} strokeWidth={1.5} />
      </div>

      <div className="dash-visual-float float-left">
        <ShieldAlert size={16} />
        <span>THREAT MONITOR</span>
      </div>

      <div className="dash-visual-float float-right">
        <CheckCircle2 size={16} />
        <span>GUARD ACTIVE</span>
      </div>

      <div className="dash-visual-score">
        <small>SECURITY SCORE</small>
        <strong>
          {hasScore ? numericScore : "—"}
          <span>/100</span>
        </strong>
        <div className="dash-score-track">
          <span style={{ width: `${safeScore}%` }} />
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onRun, running }) {
  return (
    <div className="dash-empty-state">
      <div className="dash-empty-icon"><ShieldCheck size={30} /></div>
      <h3>No simulation data</h3>
      <p>
        Run the Red Team simulation to test your payment guard.
        Results will appear here after the backend saves the run.
      </p>
      <button className="dash-primary-button" onClick={onRun} disabled={running}>
        {running
          ? <LoaderCircle size={17} className="loading-spin" />
          : <Play size={16} />}
        {running ? "Running..." : "Run first simulation"}
      </button>
    </div>
  );
}

function AttackResults({ results }) {
  if (!results.length) {
    return (
      <div className="dash-empty-inline">
        The latest report contains no individual test results.
      </div>
    );
  }

  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            <th>ATTACK / TEST</th>
            <th>EXPECTED</th>
            <th>ACTUAL</th>
            <th>RESULT</th>
          </tr>
        </thead>

        <tbody>
          {results.slice(0, 7).map((item, index) => (
            <tr key={item.attackId || item._id || index}>
              <td>
                <strong>{item.attackName || item.attackId || "Security test"}</strong>
                <small>{item.category || "TEST"}</small>
              </td>

              <td>
                <span className={`dash-decision ${String(item.expectedDecision || "").toLowerCase()}`}>
                  {item.expectedDecision || "—"}
                </span>
              </td>

              <td>
                <span className={`dash-decision ${String(item.actualDecision || "").toLowerCase()}`}>
                  {item.actualDecision || "—"}
                </span>
              </td>

              <td>
                <span className={`dash-result ${item.passed ? "result-good" : "result-bad"}`}>
                  {item.passed
                    ? <CheckCircle2 size={14} />
                    : <AlertTriangle size={14} />}
                  {item.passed ? "PASS" : "FAIL"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentRuns({ runs }) {
  if (!runs.length) {
    return (
      <div className="dash-history-empty">
        <Clock3 size={24} />
        <p>No saved simulations found.</p>
      </div>
    );
  }

  return (
    <div className="dash-history-list">
      {runs.slice(0, 6).map((run) => {
        const passed = run.status === "PASS";

        return (
          <div className="dash-history-item" key={run._id}>
            <div className="history-run-icon">
              {passed
                ? <CheckCircle2 size={17} />
                : <AlertTriangle size={17} />}
            </div>

            <div className="history-run-info">
              <strong>Red / Blue simulation</strong>
              <small>{formatDate(run.createdAt)}</small>
              <small>
                {run.summary?.attacksBlocked ?? 0}/
                {run.summary?.attacksTotal ?? 0} attacks blocked
              </small>
            </div>

            <span className={`dash-status ${passed ? "status-pass" : "status-fail"}`}>
              <span />
              {run.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function Dashboard() {
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async () => {
    setError("");

    const [latestResponse, historyResponse] = await Promise.allSettled([
      api.get("/red-blue/runs/latest"),
      api.get("/red-blue/runs?limit=8"),
    ]);

    if (latestResponse.status === "fulfilled") {
      // IMPORTANT: backend sends the latest run under `report`.
      const latestReport = latestResponse.value.data?.report ?? null;
      setReport(latestReport);
    } else {
      const status = latestResponse.reason?.response?.status;
      const message = latestResponse.reason?.response?.data?.message || "";

      if (status === 404 || message.toLowerCase().includes("no simulation")) {
        setReport(null);
      } else {
        setError(message || "Could not load latest simulation.");
      }
    }

    if (historyResponse.status === "fulfilled") {
      // Existing history endpoint returns { success, runs }.
      const savedRuns = historyResponse.value.data?.runs;
      setHistory(Array.isArray(savedRuns) ? savedRuns : []);
    } else {
      setError((current) =>
        current || "Could not load saved simulation history."
      );
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function runSimulation() {
    if (running) return;

    setRunning(true);
    setError("");
    setNotice("");

    try {
      const response = await api.post("/red-blue/run", {});

      // The run endpoint also returns the report.
      const newReport = response.data?.report;

      if (!newReport) {
        throw new Error("Simulation completed, but the backend did not return a report.");
      }

      setReport(newReport);
      setNotice("Simulation completed. Saved results have been refreshed.");

      await loadDashboard();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Could not execute the simulation."
      );
    } finally {
      setRunning(false);
    }
  }

  const summary = report?.summary || {};
  const results = Array.isArray(report?.results) ? report.results : [];

  return (
    <div className="dash-content">

      <section className="dash-welcome">
        <div>
          <div className="dashboard-eyebrow">
            <span className="orange-dot" />
            SECURITY COMMAND CENTER
          </div>

          <h2>
            Good to see you. <span>Stay protected.</span>
          </h2>

          <p>
            Here's what's happening with your agent's payment security.
          </p>
        </div>

        <button
          className="dash-outline-button"
          onClick={loadDashboard}
          disabled={loading || running}
        >
          <RefreshCw size={15} className={loading ? "loading-spin" : ""} />
          Refresh data
        </button>
      </section>

      {error && (
        <div className="dash-alert dash-alert-error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      {notice && (
        <div className="dash-alert dash-alert-success">
          <CheckCircle2 size={18} />
          {notice}
        </div>
      )}

      <section className="dash-hero">
        <div className="dash-hero-copy">
          <div className="dash-hero-kicker">
            <span className="hero-live-dot" />
            RED TEAM <b>×</b> BLUE TEAM
          </div>

          <h2>
            Let your agent move.
            <br />
            <span>We'll guard the money.</span>
          </h2>

          <p>
            Challenge your x402 payment guard with malicious payment requests.
            Evaluate the defense before authorization.
          </p>

          <button
            className="dash-run-button"
            onClick={runSimulation}
            disabled={running}
          >
            {running
              ? <LoaderCircle size={18} className="loading-spin" />
              : <Play size={17} fill="currentColor" />}

            {running ? "Running simulation..." : "Run attack simulation"}
            {!running && <ArrowUpRight size={17} />}
          </button>

          <div className="dash-hero-footnote">
            <ShieldCheck size={14} />
            Local guard simulation · No real funds transferred
          </div>
        </div>

        <SecurityVisual score={summary.securityScore} />
      </section>

      <section className="dash-section">
        <div className="dash-section-heading">
          <div>
            <div className="dashboard-eyebrow">LIVE PERFORMANCE</div>
            <h3>Security metrics</h3>
          </div>

          <span className="dash-live-label">
            <span className="workspace-dot" />
            {report ? `LATEST RUN · ${formatDate(report.createdAt)}` : "NO RUN DATA"}
          </span>
        </div>

        <div className="dash-metrics-grid">
          <MetricCard
            icon={ShieldCheck}
            label="Attacks blocked"
            value={
              loading && !report
                ? "Loading..."
                : summary.attacksBlocked == null
                  ? "—"
                  : `${summary.attacksBlocked}/${summary.attacksTotal ?? "—"}`
            }
            note="Malicious requests rejected"
            tone="orange"
          />

          <MetricCard
            icon={Crosshair}
            label="Detection rate"
            value={summary.detectionRate == null ? "—" : `${summary.detectionRate}%`}
            note="Attack blocking effectiveness"
            tone="yellow"
          />

          <MetricCard
            icon={ShieldAlert}
            label="Attacks allowed"
            value={summary.attacksAllowed ?? "—"}
            note="Malicious requests accepted"
            tone="coral"
          />

          <MetricCard
            icon={Zap}
            label="Average latency"
            value={
              summary.averageLatencyMs == null
                ? "—"
                : `${summary.averageLatencyMs} ms`
            }
            note="Guard evaluation time"
            tone="brown"
          />
        </div>
      </section>

      <section className="dash-bottom-grid">
        <article className="dash-panel">
          <div className="dash-panel-heading">
            <div>
              <div className="dashboard-eyebrow">THREAT INTELLIGENCE</div>
              <h3>Latest attack results</h3>
            </div>
            <span className="dash-count">{results.length} tests</span>
          </div>

          {loading && !report ? (
            <div className="dash-loading">
              <LoaderCircle size={22} className="loading-spin" />
              Loading simulation data...
            </div>
          ) : report ? (
            <AttackResults results={results} />
          ) : (
            <EmptyState onRun={runSimulation} running={running} />
          )}

          {report && (
            <div className="dash-card-link">
              <NavLink to="/red-team">
                Explore attack results <ArrowRight size={15} />
              </NavLink>
            </div>
          )}
        </article>

        <article className="dash-panel">
          <div className="dash-panel-heading">
            <div>
              <div className="dashboard-eyebrow">AUDIT TRAIL</div>
              <h3>Recent simulations</h3>
            </div>
            <Activity size={20} className="dash-muted-icon" />
          </div>

          <RecentRuns runs={history} />

          <div className="dash-card-link">
            <NavLink to="/activity">
              View complete history <ArrowRight size={15} />
            </NavLink>
          </div>
        </article>
      </section>

      <div className="dash-bottom-note">
        <ShieldCheck size={15} />
        Values displayed here come from saved backend simulation reports.
      </div>
    </div>
  );
}
