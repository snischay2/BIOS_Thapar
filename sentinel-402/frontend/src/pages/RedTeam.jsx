
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Crosshair,
  Fingerprint,
  LoaderCircle,
  Play,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Target,
  Zap,
} from "lucide-react";
import { NavLink } from "react-router-dom";

import api from "../lib/api";
import "./TeamPages.css";

function formatTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatReason(reason) {
  if (typeof reason !== "string") {
    return JSON.stringify(reason);
  }

  try {
    const parsed = JSON.parse(reason);
    return parsed.message || parsed.code || reason;
  } catch {
    return reason;
  }
}

function SummaryCard({ icon: Icon, label, value, detail, tone }) {
  return (
    <article className="team-summary-card">
      <div className={`team-summary-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <span>{label}</span>
      <strong>{value ?? "—"}</strong>
      <small>{detail}</small>
    </article>
  );
}

function DecisionBadge({ value }) {
  const decision = String(value || "").toUpperCase();
  const blocked = decision === "BLOCK" || decision === "REJECT";

  return (
    <span className={`team-decision ${blocked ? "decision-blocked" : "decision-allowed"}`}>
      {value || "—"}
    </span>
  );
}

function ResultBadge({ passed }) {
  return passed ? (
    <span className="team-result result-passed">
      <CheckCircle2 size={15} /> PASS
    </span>
  ) : (
    <span className="team-result result-failed">
      <AlertTriangle size={15} /> FAIL
    </span>
  );
}

function AttackTable({ results, loading }) {
  if (loading) {
    return (
      <div className="team-loading">
        <LoaderCircle className="team-spin" size={25} />
        <span>Loading actual attack results...</span>
      </div>
    );
  }

  if (!results.length) {
    return (
      <div className="team-empty">
        <Target size={33} />
        <h3>No results for this filter</h3>
        <p>Choose another category or execute a new simulation.</p>
      </div>
    );
  }

  return (
    <div className="team-table-scroll">
      <table className="team-table">
        <thead>
          <tr>
            <th>TEST SCENARIO</th>
            <th>EXPECTED</th>
            <th>ACTUAL</th>
            <th>RESULT</th>
            <th>LATENCY</th>
          </tr>
        </thead>

        <tbody>
          {results.map((item, index) => (
            <tr key={item.attackId || item._id || index}>
              <td className="scenario-cell">
                <strong>{item.attackName || item.attackId || "Security test"}</strong>
                <small>{item.attackId || item.category || "TEST"}</small>

                {Array.isArray(item.reasons) && item.reasons.length > 0 && (
                  <details className="team-reasons">
                    <summary>Inspect guard decision</summary>
                    <div className="reason-content">
                      {item.reasons.map((reason, reasonIndex) => (
                        <p key={reasonIndex}>
                          {formatReason(reason)}
                        </p>
                      ))}
                    </div>
                  </details>
                )}
              </td>

              <td>
                <DecisionBadge value={item.expectedDecision} />
              </td>

              <td>
                <DecisionBadge value={item.actualDecision} />
              </td>

              <td>
                <ResultBadge passed={item.passed} />
              </td>

              <td className="latency-value">
                {item.latencyMs == null ? "—" : `${item.latencyMs} ms`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RedTeam() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("ALL");

  const loadReport = useCallback(async () => {
    setError("");

    try {
      const response = await api.get("/red-blue/runs/latest");
      setReport(response.data?.report ?? null);
    } catch (err) {
      const status = err.response?.status;
      const serverMessage = err.response?.data?.message || "";

      if (
        status === 404 ||
        serverMessage.toLowerCase().includes("no simulation")
      ) {
        setReport(null);
      } else {
        setError(
          serverMessage || "Unable to load the latest attack report."
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  async function runSimulation() {
    if (running) return;

    setRunning(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/red-blue/run", {});
      const newReport = response.data?.report;

      if (!newReport) {
        throw new Error("Backend did not return the simulation report.");
      }

      setReport(newReport);
      setFilter("ALL");
      setMessage("Simulation finished. Results were saved by the backend.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to execute the simulation."
      );
    } finally {
      setRunning(false);
    }
  }

  const results = Array.isArray(report?.results) ? report.results : [];

  const attackResults = results.filter(
    (item) => item.category === "ATTACK"
  );

  const controlResults = results.filter(
    (item) => item.category === "CONTROL"
  );

  const failedResults = results.filter(
    (item) => item.passed === false
  );

  const filteredResults = useMemo(() => {
    if (filter === "ATTACKS") return attackResults;
    if (filter === "CONTROLS") return controlResults;
    if (filter === "FAILED") return failedResults;
    return results;
  }, [filter, results, attackResults, controlResults, failedResults]);

  const summary = report?.summary || {};

  return (
    <div className="team-page red-team-page">

      <section className="team-page-heading red-page-heading">
        <div className="team-heading-copy">
          <div className="team-eyebrow">
            <span className="team-eyebrow-dot" />
            ADVERSARIAL TESTING LAB
          </div>

          <h2>Red Team <span>Simulator</span></h2>

          <p>
            Challenge your payment guard with malicious x402 requests.
            Inspect each decision made by the backend security engine.
          </p>

          {report?.createdAt && (
            <div className="team-last-run">
              <Clock3 size={14} />
              Latest saved run · {formatTime(report.createdAt)}
            </div>
          )}
        </div>

        <div className="team-heading-actions">
          <button
            className="team-secondary-button"
            onClick={loadReport}
            disabled={loading || running}
          >
            <RefreshCw size={16} className={loading ? "team-spin" : ""} />
            Refresh
          </button>

          <button
            className="team-primary-button"
            onClick={runSimulation}
            disabled={running}
          >
            {running
              ? <LoaderCircle size={17} className="team-spin" />
              : <Play size={16} fill="currentColor" />}
            {running ? "Executing..." : "Run all attacks"}
            {!running && <ArrowRight size={16} />}
          </button>
        </div>
      </section>

      {error && (
        <div className="team-alert team-alert-error">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="team-alert team-alert-success">
          <CheckCircle2 size={18} />
          <span>{message}</span>
        </div>
      )}

      <section className="team-summary-grid">
        <SummaryCard
          icon={Crosshair}
          label="ATTACK SCENARIOS"
          value={summary.attacksTotal ?? "—"}
          detail="Cases evaluated in latest run"
          tone="orange"
        />

        <SummaryCard
          icon={ShieldCheck}
          label="ATTACKS BLOCKED"
          value={summary.attacksBlocked ?? "—"}
          detail="Malicious requests rejected"
          tone="amber"
        />

        <SummaryCard
          icon={ShieldAlert}
          label="ATTACKS ALLOWED"
          value={summary.attacksAllowed ?? "—"}
          detail="Malicious requests accepted"
          tone="coral"
        />

        <SummaryCard
          icon={Zap}
          label="DETECTION RATE"
          value={
            summary.detectionRate == null
              ? "—"
              : `${summary.detectionRate}%`
          }
          detail="Measured attack detection"
          tone="brown"
        />
      </section>

      <section className="team-report-card">
        <div className="team-report-header">
          <div>
            <div className="team-eyebrow">LATEST ENGINE REPORT</div>
            <h3>Adversarial test results</h3>
            <p>
              {report
                ? `Run ID: ${report._id || "Available"}`
                : "No saved simulation report yet."}
            </p>
          </div>

          {report && (
            <span className={`team-run-status ${
              report.status === "PASS" ? "run-status-pass" : "run-status-fail"
            }`}>
              <span />
              {report.status || "UNKNOWN"}
            </span>
          )}
        </div>

        <div className="team-filter-row">
          {[
            ["ALL", `All tests (${results.length})`],
            ["ATTACKS", `Attacks (${attackResults.length})`],
            ["CONTROLS", `Controls (${controlResults.length})`],
            ["FAILED", `Failed (${failedResults.length})`],
          ].map(([value, label]) => (
            <button
              key={value}
              className={filter === value ? "team-filter-active" : ""}
              onClick={() => setFilter(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {!report && !loading ? (
          <div className="team-empty">
            <ShieldCheck size={35} />
            <h3>No simulation has been saved</h3>
            <p>Run the test suite to generate real security results.</p>
            <button
              className="team-primary-button"
              onClick={runSimulation}
              disabled={running}
            >
              <Play size={16} /> Run first simulation
            </button>
          </div>
        ) : (
          <AttackTable
            results={filteredResults}
            loading={loading && !report}
          />
        )}

        {report && (
          <div className="team-report-footer">
            <div>
              <Fingerprint size={17} />
              Results stored in the TXFORT simulation database
            </div>
            <span>{formatTime(report.createdAt)}</span>
          </div>
        )}
      </section>

      <section className="team-bottom-info">
        <div className="team-info-icon"><ShieldCheck size={20} /></div>
        <div>
          <strong>Safe adversarial testing</strong>
          <p>
            These scenarios execute against your local payment guard.
            They do not broadcast malicious blockchain transactions or
            transfer real funds.
          </p>
        </div>
      </section>

      <div className="team-page-link">
        <NavLink to="/blue-team">
          Explore Blue Team protection <ArrowRight size={15} />
        </NavLink>
      </div>
    </div>
  );
}
