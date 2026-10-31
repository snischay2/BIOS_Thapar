
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Crosshair,
  History,
  Play,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap
} from "lucide-react";
import "./App.css";

async function apiRequest(url, options = {}) {
  const response = await fetch(url, options);

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Invalid server response (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data.message || `Request failed (${response.status})`);
  }

  return data;
}

function formatTime(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function displayReason(reason) {
  if (typeof reason !== "string") return String(reason);

  try {
    const parsed = JSON.parse(reason);
    return parsed.message || parsed.code || reason;
  } catch {
    return reason;
  }
}

function MetricCard({ icon: Icon, label, value, note, tone = "" }) {
  return (
    <div className="metric-card">
      <div className={`metric-icon ${tone}`}>
        <Icon size={19} />
      </div>
      <div className="metric-label">{label}</div>
      <div className="metric-value">{value ?? "—"}</div>
      <div className="metric-note">{note}</div>
    </div>
  );
}

export default function App() {
  const [report, setReport] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");

  const summary = report?.summary;
  const results = report?.results || [];

  const loadDashboard = useCallback(async () => {
    setError("");

    try {
      const latestPromise = apiRequest("/api/red-blue/runs/latest");
      const historyPromise = apiRequest("/api/red-blue/runs?limit=8");

      const [latestResult, historyResult] = await Promise.allSettled([
        latestPromise,
        historyPromise
      ]);

      if (latestResult.status === "fulfilled") {
        setReport(latestResult.value.report);
      } else if (latestResult.reason?.message?.includes("No simulation runs")) {
        setReport(null);
      } else {
        throw latestResult.reason;
      }

      if (historyResult.status === "fulfilled") {
        setHistory(historyResult.value.runs || []);
      }
    } catch (err) {
      setError(err.message || "Could not connect to the backend.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  async function runSimulation() {
    if (running) return;

    setRunning(true);
    setError("");

    try {
      const data = await apiRequest("/api/red-blue/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({})
      });

      setReport(data.report);

      const historyData = await apiRequest("/api/red-blue/runs?limit=8");
      setHistory(historyData.runs || []);
    } catch (err) {
      setError(err.message || "Simulation failed.");
    } finally {
      setRunning(false);
    }
  }

  const filteredResults = useMemo(() => {
    if (filter === "ALL") return results;
    return results.filter(item => item.category === filter);
  }, [results, filter]);

  const score = summary?.securityScore ?? 0;
  const scoreClass = score >= 90 ? "good" : score >= 60 ? "medium" : "bad";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-symbol"><ShieldCheck size={24} /></div>
          <div>
            <div className="brand-name">SENTINEL<span>402</span></div>
            <div className="brand-caption">AI WALLET SECURITY</div>
          </div>
        </div>

        <div className="side-section">PLATFORM</div>

        <div className="side-link active">
          <Activity size={17} /> Security Overview
        </div>
        <div className="side-link">
          <Crosshair size={17} /> Red Team Simulator
        </div>
        <div className="side-link">
          <Shield size={17} /> Blue Team Guard
        </div>
        <div className="side-link">
          <History size={17} /> Attack History
        </div>

        <div className="sidebar-bottom">
          <div className="connection-dot" />
          <div>
            <strong>Local Engine</strong>
            <span>Backend connection</span>
          </div>
          <span className="online-label">READY</span>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <div className="eyebrow">SECURITY COMMAND CENTER</div>
            <h1>Red / Blue Operations</h1>
            <p>Monitor AI wallet threats and enforce payment security.</p>
          </div>

          <button
            className="refresh-button"
            onClick={loadDashboard}
            disabled={loading || running}
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </header>

        {error && (
          <div className="error-banner">
            <AlertTriangle size={18} />
            <span>{error}</span>
            <button onClick={() => setError("")}>Dismiss</button>
          </div>
        )}

        <section className="hero-panel">
          <div className="hero-copy">
            <div className="live-label">
              <span className="pulse-dot" /> RED TEAM VS BLUE TEAM
            </div>
            <h2>Protecting autonomous payments.</h2>
            <p>
              Attack simulation against x402 payment challenges.
              Sentinel evaluates each request before wallet authorization.
            </p>

            <button
              className="run-button"
              onClick={runSimulation}
              disabled={running || loading}
            >
              {running ? (
                <><RefreshCw className="spin" size={18} /> Running simulation...</>
              ) : (
                <><Play size={18} fill="currentColor" /> Run Attack Simulation</>
              )}
            </button>
          </div>

          <div className="hero-score">
            <div className="score-ring">
              <div className="score-inner">
                <span>SECURITY SCORE</span>
                <strong>{summary ? score : "—"}</strong>
                <small>/ 100</small>
              </div>
            </div>
            <span className={`score-status ${scoreClass}`}>
              {report?.status || "AWAITING FIRST RUN"}
            </span>
          </div>

          <div className="hero-decoration"><Shield size={190} /></div>
        </section>

        <section className="section-heading">
          <div>
            <div className="eyebrow">SYSTEM PERFORMANCE</div>
            <h2>Security metrics</h2>
          </div>
          <span className="section-subtitle">
            {report ? `Latest run · ${formatTime(report.createdAt)}` : "No simulation yet"}
          </span>
        </section>

        <section className="metrics-grid">
          <MetricCard
            icon={ShieldCheck}
            label="Attacks blocked"
            value={summary ? `${summary.attacksBlocked}/${summary.attacksTotal}` : "—"}
            note="Malicious challenges rejected"
            tone="green"
          />
          <MetricCard
            icon={Crosshair}
            label="Detection rate"
            value={summary ? `${summary.detectionRate}%` : "—"}
            note="Attack blocking effectiveness"
            tone="blue"
          />
          <MetricCard
            icon={ShieldAlert}
            label="Attacks allowed"
            value={summary?.attacksAllowed ?? "—"}
            note="Malicious challenges accepted"
            tone="red"
          />
          <MetricCard
            icon={Zap}
            label="Average latency"
            value={summary ? `${summary.averageLatencyMs} ms` : "—"}
            note="Guard evaluation time"
            tone="yellow"
          />
          <MetricCard
            icon={AlertTriangle}
            label="False positives"
            value={summary ? `${summary.falsePositiveRate ?? "N/A"}%` : "—"}
            note="Legitimate payments blocked"
            tone="purple"
          />
          <MetricCard
            icon={CheckCircle2}
            label="Legitimate payment"
            value={
              summary
                ? summary.legitimatePaymentAllowed ? "ALLOWED" : "BLOCKED"
                : "—"
            }
            note="Valid payment control test"
            tone="green"
          />
        </section>

        <section className="content-grid">
          <div className="panel attack-panel">
            <div className="panel-header">
              <div>
                <div className="eyebrow">THREAT INTELLIGENCE</div>
                <h2>Attack results</h2>
              </div>
              <div className="filter-group">
                {["ALL", "ATTACK", "CONTROL"].map(item => (
                  <button
                    key={item}
                    className={filter === item ? "filter active-filter" : "filter"}
                    onClick={() => setFilter(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {!report && !loading && (
              <div className="empty-state">
                <Shield size={32} />
                <strong>No attack data yet</strong>
                <span>Run your first simulation to see the results.</span>
              </div>
            )}

            {loading && !report && (
              <div className="empty-state">Loading security data...</div>
            )}

            {report && (
              <div className="table-wrap">
                <table className="attack-table">
                  <thead>
                    <tr>
                      <th>ATTACK / TEST</th>
                      <th>EXPECTED</th>
                      <th>ACTUAL</th>
                      <th>RESULT</th>
                      <th>LATENCY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredResults.map((item, index) => (
                      <tr key={`${item.attackId}-${index}`}>
                        <td>
                          <div className="attack-name">{item.attackName}</div>
                          <div className="attack-id">{item.attackId}</div>
                          {item.reasons?.length > 0 && (
                            <div className="reason-text">
                              {item.reasons.map(displayReason).join(" · ")}
                            </div>
                          )}
                        </td>
                        <td>
                          <span className={`decision ${item.expectedDecision.toLowerCase()}`}>
                            {item.expectedDecision}
                          </span>
                        </td>
                        <td>
                          <span className={`decision ${item.actualDecision.toLowerCase()}`}>
                            {item.actualDecision}
                          </span>
                        </td>
                        <td>
                          {item.passed ? (
                            <span className="result-pass">
                              <CheckCircle2 size={15} /> PASS
                            </span>
                          ) : (
                            <span className="result-fail">
                              <AlertTriangle size={15} /> FAIL
                            </span>
                          )}
                        </td>
                        <td className="latency-cell">{item.latencyMs} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="panel history-panel">
            <div className="panel-header">
              <div>
                <div className="eyebrow">DATABASE</div>
                <h2>Recent runs</h2>
              </div>
              <History size={18} className="muted-icon" />
            </div>

            {history.length === 0 ? (
              <div className="empty-state small-empty">No saved runs yet.</div>
            ) : (
              <div className="history-list">
                {history.map(run => (
                  <div className="history-item" key={run._id}>
                    <div className={`history-icon ${run.status === "PASS" ? "history-good" : "history-bad"}`}>
                      {run.status === "PASS"
                        ? <ShieldCheck size={18} />
                        : <AlertTriangle size={18} />}
                    </div>
                    <div className="history-info">
                      <strong>Red/Blue simulation</strong>
                      <span>{formatTime(run.createdAt)}</span>
                      <small>
                        {run.summary?.attacksBlocked ?? 0}/
                        {run.summary?.attacksTotal ?? 0} attacks blocked
                      </small>
                    </div>
                    <span className={`history-status ${run.status === "PASS" ? "good" : "bad"}`}>
                      {run.status}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="history-footer">
              <Clock3 size={14} />
              <span>History stored in MongoDB</span>
            </div>
          </div>
        </section>

        <footer className="footer">
          <div><ShieldCheck size={15} /> SENTINEL 402</div>
          <span>x402 AI Wallet Protection · Base Sepolia demo environment</span>
          <span>SDG 16.4</span>
        </footer>
      </main>
    </div>
  );
}
