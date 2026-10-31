import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Copy,
  Crosshair,
  ExternalLink,
  Globe2,
  LoaderCircle,
  Play,
  RefreshCw,
  Server,
  ShieldAlert,
  ShieldCheck,
  Target,
  Trophy,
  Users,
  XCircle,
  Zap
} from "lucide-react";

import api from "../lib/api";
import "../styles/EvaluatorCrossTeam.css";

function Metric({ label, value, icon: Icon, tone }) {
  return (
    <article className="dash-metric-card">
      <div className={`dash-metric-icon ${tone}`}>
        <Icon size={21} />
      </div>
      <div className="dash-metric-label">{label}</div>
      <div className="dash-metric-value">{value ?? "—"}</div>
    </article>
  );
}

function DecisionPill({ decision }) {
  const normalized = String(decision || "UNKNOWN").toUpperCase();
  const isAllow = normalized === "ALLOW";
  const isBlock = normalized === "BLOCK";

  return (
    <span className={`ev-decision-pill ${isAllow ? "is-allow" : isBlock ? "is-block" : "is-unknown"}`}>
      {isAllow ? <CheckCircle2 size={13} /> : isBlock ? <ShieldAlert size={13} /> : <AlertTriangle size={13} />}
      {normalized}
    </span>
  );
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString("en-IN");
}

function getEndpointValidationError(value) {
  try {
    const url = new URL(value.trim());
    const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);

    if (url.username || url.password || url.search || url.hash) {
      return "Endpoint URL must not contain credentials, query parameters or fragments.";
    }

    if (url.protocol !== "https:" && !(url.protocol === "http:" && local)) {
      return "Use an HTTPS URL. HTTP is permitted only for localhost development.";
    }

    return null;
  } catch {
    return "Enter a valid endpoint URL.";
  }
}

export default function Evaluator() {
  const [teamName, setTeamName] = useState("");
  const [endpointUrl, setEndpointUrl] = useState("");
  const [filter, setFilter] = useState("ALL");

  const [running, setRunning] = useState(false);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [refreshingIncoming, setRefreshingIncoming] = useState(false);
  const [copyState, setCopyState] = useState("");
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [publicInfo, setPublicInfo] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [incomingError, setIncomingError] = useState("");
  const [publicInfoError, setPublicInfoError] = useState("");

  const results = Array.isArray(report?.results) ? report.results : [];
  const summary = report?.summary || {};

  const filteredResults = useMemo(() => {
    if (filter === "ATTACKS") return results.filter(item => item.category === "ATTACK");
    if (filter === "CONTROL") return results.filter(item => item.category === "CONTROL");
    if (filter === "FAILED") return results.filter(item => item.passed === false);
    return results;
  }, [results, filter]);

  const loadPublicInfo = useCallback(async () => {
    setLoadingInfo(true);
    try {
      const response = await api.get("/evaluator/info");
      setPublicInfo(response.data || null);
      setPublicInfoError("");
    } catch (err) {
      setPublicInfo(null);
      setPublicInfoError(
        err.response?.data?.message ||
        "Could not load the public evaluator endpoint. Check that the backend is running."
      );
    } finally {
      setLoadingInfo(false);
    }
  }, []);

  const loadIncoming = useCallback(async () => {
    setRefreshingIncoming(true);
    try {
      const response = await api.get("/evaluator/incoming?limit=12");
      setIncoming(Array.isArray(response.data?.requests) ? response.data.requests : []);
      setIncomingError("");
    } catch (err) {
      setIncomingError(
        err.response?.data?.message ||
        "Incoming evaluation history is unavailable until the evaluator backend is connected."
      );
    } finally {
      setRefreshingIncoming(false);
    }
  }, []);

  useEffect(() => {
    loadPublicInfo();
    loadIncoming();
  }, [loadPublicInfo, loadIncoming]);

  async function copyValue(value, key) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(key);
      window.setTimeout(() => setCopyState(""), 1800);
    } catch {
      setCopyState("copy-failed");
    }
  }

  async function runEvaluation(event) {
    event.preventDefault();
    setError("");
    setReport(null);
    setFilter("ALL");

    const validationError = getEndpointValidationError(endpointUrl);
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!teamName.trim()) {
      setError("Enter the team or project name before starting an evaluation.");
      return;
    }

    setRunning(true);
    try {
      const response = await api.post("/evaluator/run", {
        teamName: teamName.trim(),
        endpointUrl: endpointUrl.trim(),
        suiteId: "X402_RED_BLUE_V1"
      }, { timeout: 90000 });

      const evaluation = response.data?.report || response.data?.evaluation;
      if (!evaluation) {
        throw new Error("The evaluator backend did not return an assessment report.");
      }
      setReport(evaluation);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to evaluate the external guard."
      );
    } finally {
      setRunning(false);
    }
  }

  const publicEndpoint = publicInfo?.publicEndpoint || "";
  const fixtureUrl = publicInfo?.fixtureUrl || "";
  const suiteUrl = publicInfo?.suiteUrl || "";
  const isLocalEndpoint = publicEndpoint.includes("localhost") || publicEndpoint.includes("127.0.0.1");

  return (
    <div className="team-page evaluator-page">
      <section className="team-page-heading">
        <div className="team-heading-copy">
          <div className="team-eyebrow">
            <span className="team-eyebrow-dot" />
            INTER-TEAM SECURITY EVALUATION
          </div>
          <h2>Guard <span>Evaluator</span></h2>
          <p>
            Run SENTINEL's adversarial suite against another team's guard, and expose
            our own evaluator API so other teams can test SENTINEL.
          </p>
        </div>
        <div className="evaluator-title-icon"><Crosshair size={29} /></div>
      </section>

      <section className="evaluator-suite-banner">
        <div className="evaluator-suite-icon"><Target size={25} /></div>
        <div className="evaluator-suite-copy">
          <div className="team-eyebrow">SHARED INTEROPERABILITY PROTOCOL</div>
          <h3>X402 RED / BLUE V1</h3>
          <p>
            One compatible protocol for both directions: SENTINEL sends each challenge
            to a remote guard, and our public endpoint evaluates challenges sent to us.
          </p>
        </div>
        <div className="evaluator-suite-count">
          <strong>{publicInfo?.suite?.totalCases ?? 29}</strong>
          <small>TEST CASES</small>
        </div>
      </section>

      <section className="ev-public-card">
        <div className="ev-card-topline">
          <div className="ev-public-icon"><Server size={21} /></div>
          <div className="ev-card-title">
            <div className="team-eyebrow">INBOUND · LET OTHER TEAMS TEST US</div>
            <h3>Our public evaluator endpoint</h3>
            <p>Share this URL with other teams. They can POST x402 challenges and receive SENTINEL's ALLOW/BLOCK decision.</p>
          </div>
          <span className="ev-live-state"><span /> {loadingInfo ? "CONNECTING" : publicEndpoint ? "API AVAILABLE" : "UNAVAILABLE"}</span>
        </div>

        <div className="ev-endpoint-line">
          <code>{loadingInfo ? "Loading evaluator URL…" : publicEndpoint || "Backend endpoint unavailable"}</code>
          <button
            type="button"
            className="ev-copy-button"
            disabled={!publicEndpoint}
            onClick={() => copyValue(publicEndpoint, "endpoint")}
          >
            <Copy size={15} /> {copyState === "endpoint" ? "Copied" : "Copy endpoint"}
          </button>
        </div>

        <div className="ev-public-actions">
          <span><strong>Protocol:</strong> {publicInfo?.protocol || "X402_RED_BLUE_V1"}</span>
          <span><strong>Method:</strong> POST</span>
          {suiteUrl && (
            <button type="button" className="ev-text-action" onClick={() => copyValue(suiteUrl, "suite")}>
              <Copy size={13} /> {copyState === "suite" ? "Suite URL copied" : "Copy 29-case challenge suite"}
            </button>
          )}
          {fixtureUrl && (
            <button type="button" className="ev-text-action" onClick={() => copyValue(fixtureUrl, "fixture")}>
              <Copy size={13} /> {copyState === "fixture" ? "Fixture URL copied" : "Copy control fixture URL"}
            </button>
          )}
          {publicInfo?.healthUrl && (
            <a className="ev-text-action" href={publicInfo.healthUrl} target="_blank" rel="noreferrer">
              <ExternalLink size={13} /> API health
            </a>
          )}
        </div>

        {isLocalEndpoint && (
          <div className="ev-local-warning">
            <AlertTriangle size={15} />
            This is a localhost URL. Other teams cannot reach it. Deploy the backend publicly and set <code>PUBLIC_API_BASE_URL</code> to your HTTPS backend origin.
          </div>
        )}
        {!publicInfo?.publicBaseUrlConfigured && publicEndpoint && !isLocalEndpoint && (
          <div className="ev-local-warning">
            <AlertTriangle size={15} />
            Configure <code>PUBLIC_API_BASE_URL</code> in production so the shared link always uses your canonical backend URL.
          </div>
        )}
      </section>

      <div className="ev-two-column">
        <section className="evaluator-form-card ev-outbound-card">
          <div className="evaluator-form-heading">
            <div>
              <div className="team-eyebrow">OUTBOUND · WE TEST THEM</div>
              <h3>Test another team's guard</h3>
              <p>Enter the compatible endpoint provided by the other team. SENTINEL will send the 29-case suite.</p>
            </div>
            <Globe2 size={25} />
          </div>

          <form onSubmit={runEvaluation}>
            <div className="ev-form-stack">
              <label className="evaluator-field">
                <span>Team / project name</span>
                <input
                  type="text"
                  value={teamName}
                  onChange={event => setTeamName(event.target.value)}
                  placeholder="Enter team name"
                  maxLength={80}
                  required
                />
              </label>

              <label className="evaluator-field">
                <span>Guard evaluation endpoint</span>
                <input
                  type="url"
                  value={endpointUrl}
                  onChange={event => setEndpointUrl(event.target.value)}
                  placeholder="https://their-backend.com/api/evaluator/v1/assess"
                  maxLength={2048}
                  required
                />
                <small>The endpoint must implement X402_RED_BLUE_V1 and return decision: ALLOW or BLOCK.</small>
              </label>
            </div>

            <div className="evaluator-protocol-card">
              <div className="evaluator-protocol-icon"><ShieldCheck size={19} /></div>
              <div>
                <strong>Evaluation protocol</strong>
                <small>X402_RED_BLUE_V1 · x402 V2 challenge assessment</small>
              </div>
              <span className="evaluator-readonly">29 CASES</span>
            </div>

            {error && (
              <div className="team-alert team-alert-error"><AlertTriangle size={17} />{error}</div>
            )}

            <div className="evaluator-form-footer">
              <div className="evaluator-consent">
                <ShieldAlert size={16} />
                <span>No wallet private keys are sent. The evaluator sends challenge data only; it does not make payments.</span>
              </div>
              <button type="submit" className="team-primary-button" disabled={running}>
                {running ? <LoaderCircle size={17} className="team-spin" /> : <Play size={16} />}
                {running ? "Evaluating guard…" : "Start evaluation"}
                {!running && <ArrowRight size={16} />}
              </button>
            </div>
          </form>
        </section>

        <section className="ev-incoming-card">
          <div className="ev-incoming-heading">
            <div>
              <div className="team-eyebrow">INBOUND ACTIVITY</div>
              <h3>Teams testing SENTINEL</h3>
              <p>Every challenge received by our public endpoint appears here.</p>
            </div>
            <button
              type="button"
              className="ev-refresh-button"
              onClick={loadIncoming}
              disabled={refreshingIncoming}
              aria-label="Refresh incoming evaluations"
            >
              <RefreshCw size={16} className={refreshingIncoming ? "team-spin" : ""} />
            </button>
          </div>

          {incomingError ? (
            <div className="ev-empty-inline"><AlertTriangle size={17} />{incomingError}</div>
          ) : incoming.length ? (
            <div className="ev-incoming-list">
              {incoming.map(item => {
                const result = item.results?.[0] || {};
                return (
                  <article className="ev-incoming-item" key={item._id}>
                    <div className="ev-incoming-item-main">
                      <strong>{item.teamName || "External team"}</strong>
                      <span>{result.attackName || item.caseId || "Incoming challenge"}</span>
                      <small>{formatDate(item.createdAt)}</small>
                    </div>
                    <DecisionPill decision={result.actualDecision} />
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="ev-empty-inline">
              <Users size={19} />
              <span>No external evaluation requests received yet. Share the public endpoint to invite teams.</span>
            </div>
          )}
          <div className="ev-incoming-footer"><Activity size={14} /> Stored from incoming requests to SENTINEL's evaluator API</div>
        </section>
      </div>

      <section className="evaluator-results-card">
        <div className="evaluator-results-heading">
          <div>
            <div className="team-eyebrow">OUTBOUND ASSESSMENT REPORT</div>
            <h3>{report ? "Evaluation report" : "Waiting for evaluation"}</h3>
            <p>{report ? `Assessment for ${report.teamName || teamName}` : "Run an outbound assessment to see the remote guard's decisions and score."}</p>
          </div>
          {report?.status && (
            <span className={`team-run-status ${report.status === "PASS" ? "run-status-pass" : "run-status-fail"}`}>
              <span />{report.status}
            </span>
          )}
        </div>

        {report ? (
          <>
            <div className="evaluator-result-metrics">
              <Metric icon={Crosshair} label="TESTS EXECUTED" value={summary.totalTests ?? results.length} tone="orange" />
              <Metric icon={ShieldCheck} label="ATTACKS BLOCKED" value={summary.attacksBlocked ?? "—"} tone="amber" />
              <Metric icon={ShieldAlert} label="ATTACKS ALLOWED" value={summary.attacksAllowed ?? "—"} tone="coral" />
              <Metric icon={Trophy} label="SECURITY SCORE" value={summary.securityScore == null ? "—" : `${summary.securityScore}/100`} tone="brown" />
            </div>

            <div className="ev-secondary-metrics">
              <span>Detection rate <strong>{summary.detectionRate == null ? "—" : `${summary.detectionRate}%`}</strong></span>
              <span>False positive rate <strong>{summary.falsePositiveRate == null ? "—" : `${summary.falsePositiveRate}%`}</strong></span>
              <span>Avg. latency <strong>{summary.averageLatencyMs == null ? "—" : `${summary.averageLatencyMs} ms`}</strong></span>
              <span>Errors <strong>{summary.attackErrors ?? "—"}</strong></span>
            </div>

            <div className="team-filter-row">
              {[["ALL", "All tests"], ["ATTACKS", "Attacks"], ["CONTROL", "Legitimate control"], ["FAILED", "Failed tests"]].map(([value, label]) => (
                <button type="button" key={value} className={filter === value ? "team-filter-active" : ""} onClick={() => setFilter(value)}>
                  {label}
                </button>
              ))}
            </div>

            {filteredResults.length ? (
              <div className="team-table-scroll">
                <table className="team-table">
                  <thead><tr><th>TEST SCENARIO</th><th>EXPECTED</th><th>GUARD DECISION</th><th>RESULT</th><th>LATENCY</th></tr></thead>
                  <tbody>
                    {filteredResults.map((item, index) => (
                      <tr key={item.attackId || index}>
                        <td className="scenario-cell"><strong>{item.attackName || item.attackId}</strong><small>{item.attackId || item.category}</small>{item.error && <small className="ev-row-error">{item.error}</small>}</td>
                        <td>{item.expectedDecision || "—"}</td>
                        <td><DecisionPill decision={item.actualDecision} /></td>
                        <td>{item.passed ? <span className="team-result result-passed"><CheckCircle2 size={14} /> PASS</span> : <span className="team-result result-failed"><XCircle size={14} /> FAIL</span>}</td>
                        <td>{item.latencyMs == null ? "—" : `${item.latencyMs} ms`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="team-empty">No test results returned for this filter.</div>
            )}

            {report.createdAt && <div className="evaluator-report-footer">Assessment saved at {formatDate(report.createdAt)} · Run ID: {report.runId || "—"}</div>}
          </>
        ) : (
          <div className="evaluator-empty-state">
            <div className="evaluator-empty-orb"><Crosshair size={35} /></div>
            <h3>No assessment report yet</h3>
            <p>Connect a compatible external guard and run the standard x402 Red/Blue assessment.</p>
            <div className="evaluator-empty-note"><Clock3 size={15} /> Reports appear here after the remote team responds.</div>
          </div>
        )}
      </section>

      <section className="evaluator-score-guide">
        <div className="team-eyebrow">EVALUATION CRITERIA</div>
        <h3>What will be measured?</h3>
        <div className="evaluator-guide-grid">
          <div><ShieldCheck size={20} /><strong>Attack detection</strong><p>Does the guard block unauthorized or malicious challenges?</p></div>
          <div><CheckCircle2 size={20} /><strong>Legitimate controls</strong><p>Does it correctly allow a valid payment scenario?</p></div>
          <div><Zap size={20} /><strong>Evaluation latency</strong><p>How quickly does the external guard respond to each case?</p></div>
        </div>
      </section>
    </div>
  );
}
