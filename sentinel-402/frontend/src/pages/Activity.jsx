
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowDownToLine,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Eye,
  Filter,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  X,
} from "lucide-react";

import api from "../lib/api";
import "./ActivitySettings.css";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDuration(value) {
  if (value == null) return "—";
  return `${Number(value).toFixed(2)} ms`;
}

function getRunResults(run) {
  return Array.isArray(run?.results) ? run.results : [];
}

function getStatus(run) {
  return String(run?.status || "UNKNOWN").toUpperCase();
}

function StatusBadge({ status }) {
  const normalized = String(status || "UNKNOWN").toUpperCase();
  const passed = normalized === "PASS";

  return (
    <span className={`activity-status ${passed ? "activity-pass" : "activity-fail"}`}>
      <span />
      {normalized}
    </span>
  );
}

function RunDetails({ run, onClose }) {
  const results = getRunResults(run);
  const summary = run?.summary || {};

  return (
    <div className="activity-modal-backdrop" onMouseDown={onClose}>
      <section
        className="activity-detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Simulation run details"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="activity-detail-header">
          <div>
            <div className="activity-eyebrow">SAVED SIMULATION REPORT</div>
            <h2>Run details</h2>
            <p>{formatDate(run?.createdAt)}</p>
          </div>

          <button
            className="activity-close-button"
            onClick={onClose}
            aria-label="Close details"
          >
            <X size={20} />
          </button>
        </div>

        <div className="activity-detail-id">
          <span>RUN ID</span>
          <strong>{run?._id || "Not available"}</strong>
        </div>

        <div className="activity-detail-summary">
          <div>
            <small>STATUS</small>
            <StatusBadge status={run?.status} />
          </div>
          <div>
            <small>ATTACKS BLOCKED</small>
            <strong>{summary.attacksBlocked ?? "—"}</strong>
          </div>
          <div>
            <small>ATTACKS ALLOWED</small>
            <strong>{summary.attacksAllowed ?? "—"}</strong>
          </div>
          <div>
            <small>SECURITY SCORE</small>
            <strong>
              {summary.securityScore == null
                ? "—"
                : `${summary.securityScore}/100`}
            </strong>
          </div>
          <div>
            <small>DETECTION RATE</small>
            <strong>
              {summary.detectionRate == null
                ? "—"
                : `${summary.detectionRate}%`}
            </strong>
          </div>
          <div>
            <small>DURATION</small>
            <strong>{formatDuration(run?.durationMs)}</strong>
          </div>
        </div>

        <div className="activity-detail-section">
          <div className="activity-detail-section-heading">
            <div>
              <div className="activity-eyebrow">TEST EXECUTION</div>
              <h3>Individual results</h3>
            </div>
            <span>{results.length} records</span>
          </div>

          {results.length === 0 ? (
            <div className="activity-detail-empty">
              No individual results were included in this saved run.
            </div>
          ) : (
            <div className="activity-detail-results">
              {results.map((item, index) => (
                <div
                  className="activity-result-row"
                  key={item.attackId || item._id || index}
                >
                  <div className={`activity-result-icon ${item.passed ? "passed" : "failed"}`}>
                    {item.passed
                      ? <CheckCircle2 size={17} />
                      : <AlertTriangle size={17} />}
                  </div>

                  <div className="activity-result-copy">
                    <strong>
                      {item.attackName || item.attackId || "Security test"}
                    </strong>
                    <small>
                      {item.attackId || item.category || "TEST"}
                    </small>

                    {Array.isArray(item.reasons) && item.reasons.length > 0 && (
                      <div className="activity-reasons">
                        {item.reasons.map((reason, reasonIndex) => (
                          <p key={reasonIndex}>
                            {typeof reason === "string"
                              ? reason
                              : JSON.stringify(reason)}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="activity-result-decisions">
                    <small>
                      {item.expectedDecision || "—"} → {item.actualDecision || "—"}
                    </small>
                    <StatusBadge status={item.passed ? "PASS" : "FAIL"} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ActivityPage() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedRun, setSelectedRun] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");

  const loadRuns = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/red-blue/runs?limit=50");
      const data = response.data;

      const savedRuns = data?.runs;

      if (!Array.isArray(savedRuns)) {
        throw new Error("The history endpoint returned an unexpected response.");
      }

      setRuns(savedRuns);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load simulation history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRuns();
  }, [loadRuns]);

  const passedCount = runs.filter((run) => getStatus(run) === "PASS").length;
  const failedCount = runs.filter((run) => getStatus(run) !== "PASS").length;

  const filteredRuns = useMemo(() => {
    const query = search.trim().toLowerCase();

    return runs.filter((run) => {
      const matchesFilter =
        filter === "ALL" ||
        (filter === "PASS" && getStatus(run) === "PASS") ||
        (filter === "FAILED" && getStatus(run) !== "PASS");

      const matchesSearch =
        !query ||
        String(run._id || "").toLowerCase().includes(query) ||
        String(run.runType || "").toLowerCase().includes(query) ||
        String(run.status || "").toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [runs, filter, search]);

  async function openRun(run) {
    setSelectedRun(run);
    setDetailError("");

    // The list response may already contain the full result array.
    if (Array.isArray(run.results)) return;

    if (!run._id) {
      setDetailError("This run does not have an available record ID.");
      return;
    }

    setDetailLoading(true);

    try {
      const response = await api.get(`/red-blue/runs/${run._id}`);
      const data = response.data;

      const detailedRun =
        data?.run ||
        data?.report ||
        data?.data ||
        data;

      if (!detailedRun || !detailedRun._id) {
        throw new Error("The run details endpoint returned an unexpected response.");
      }

      setSelectedRun(detailedRun);
    } catch (err) {
      setDetailError(
        err.response?.data?.message ||
        err.message ||
        "Unable to load the full run details."
      );
    } finally {
      setDetailLoading(false);
    }
  }

  function exportHistory() {
    if (!runs.length) return;

    const columns = [
      "runId",
      "runType",
      "status",
      "createdAt",
      "durationMs",
      "attacksBlocked",
      "attacksAllowed",
      "securityScore",
      "detectionRate",
    ];

    const rows = runs.map((run) => [
      run._id,
      run.runType,
      run.status,
      run.createdAt,
      run.durationMs,
      run.summary?.attacksBlocked,
      run.summary?.attacksAllowed,
      run.summary?.securityScore,
      run.summary?.detectionRate,
    ]);

    const escapeCsv = (value) => {
      const text = value == null ? "" : String(value);
      return `"${text.replace(/"/g, '""')}"`;
    };

    const csv = [
      columns.map(escapeCsv).join(","),
      ...rows.map((row) => row.map(escapeCsv).join(",")),
    ].join("\r\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "sentinel-402-activity.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="activity-page">

      <section className="activity-page-heading">
        <div>
          <div className="activity-eyebrow">
            <span className="activity-orange-dot" />
            AUDIT & OBSERVABILITY
          </div>

          <h2>Security <span>activity</span></h2>

          <p>
            Review simulation runs saved by your Sentinel backend.
            Open an individual run to inspect its stored test results.
          </p>
        </div>

        <div className="activity-actions">
          <button
            className="activity-secondary-button"
            onClick={loadRuns}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? "activity-spin" : ""} />
            Refresh
          </button>

          <button
            className="activity-export-button"
            onClick={exportHistory}
            disabled={!runs.length}
          >
            <ArrowDownToLine size={16} />
            Export CSV
          </button>
        </div>
      </section>

      {error && (
        <div className="activity-error">
          <AlertTriangle size={18} />
          {error}
        </div>
      )}

      <section className="activity-summary-grid">
        <article className="activity-summary-card">
          <div className="activity-summary-icon orange">
            <Activity size={21} />
          </div>
          <span>RECENT RUNS LOADED</span>
          <strong>{loading ? "..." : runs.length}</strong>
          <small>Records returned by backend</small>
        </article>

        <article className="activity-summary-card">
          <div className="activity-summary-icon amber">
            <CheckCircle2 size={21} />
          </div>
          <span>PASSED RUNS</span>
          <strong>{loading ? "..." : passedCount}</strong>
          <small>Saved runs with PASS status</small>
        </article>

        <article className="activity-summary-card">
          <div className="activity-summary-icon coral">
            <ShieldAlert size={21} />
          </div>
          <span>OTHER STATUSES</span>
          <strong>{loading ? "..." : failedCount}</strong>
          <small>Failed or non-PASS statuses</small>
        </article>
      </section>

      <section className="activity-history-card">
        <div className="activity-history-heading">
          <div>
            <div className="activity-eyebrow">MONGODB AUDIT RECORDS</div>
            <h3>Simulation history</h3>
            <p>
              Showing the records returned by the last history request.
            </p>
          </div>

          <span className="activity-record-count">
            {filteredRuns.length} displayed
          </span>
        </div>

        <div className="activity-toolbar">
          <div className="activity-search">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by run ID, type or status..."
            />
          </div>

          <div className="activity-filters">
            <Filter size={15} />

            {["ALL", "PASS", "FAILED"].map((value) => (
              <button
                key={value}
                className={filter === value ? "activity-filter-active" : ""}
                onClick={() => setFilter(value)}
              >
                {value === "FAILED" ? "OTHER" : value}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="activity-loading">
            <LoaderCircle size={24} className="activity-spin" />
            Loading saved activity...
          </div>
        ) : filteredRuns.length === 0 ? (
          <div className="activity-empty">
            <CalendarDays size={34} />
            <h3>No matching records</h3>
            <p>
              {runs.length
                ? "Try changing the search text or status filter."
                : "No simulation records were returned by the backend."}
            </p>
          </div>
        ) : (
          <div className="activity-table-scroll">
            <table className="activity-table">
              <thead>
                <tr>
                  <th>SIMULATION</th>
                  <th>DATE & TIME</th>
                  <th>ATTACKS BLOCKED</th>
                  <th>SECURITY SCORE</th>
                  <th>DURATION</th>
                  <th>STATUS</th>
                  <th />
                </tr>
              </thead>

              <tbody>
                {filteredRuns.map((run) => (
                  <tr key={run._id}>
                    <td>
                      <div className="activity-run-name">
                        <div className="activity-run-icon">
                          <ShieldCheck size={17} />
                        </div>
                        <div>
                          <strong>{run.runType || "Red / Blue simulation"}</strong>
                          <small>{run._id}</small>
                        </div>
                      </div>
                    </td>

                    <td className="activity-date">
                      {formatDate(run.createdAt)}
                    </td>

                    <td>
                      {run.summary?.attacksBlocked == null
                        ? "—"
                        : `${run.summary.attacksBlocked}/${run.summary.attacksTotal ?? "—"}`}
                    </td>

                    <td>
                      {run.summary?.securityScore == null
                        ? "—"
                        : `${run.summary.securityScore}/100`}
                    </td>

                    <td>{formatDuration(run.durationMs)}</td>

                    <td><StatusBadge status={run.status} /></td>

                    <td>
                      <button
                        className="activity-view-button"
                        onClick={() => openRun(run)}
                        title="View run details"
                      >
                        <Eye size={16} />
                        <span>Details</span>
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="activity-table-footer">
          <span>
            <ShieldCheck size={15} />
            Data source: Sentinel Red/Blue API
          </span>
          <span>Maximum requested records: 50</span>
        </div>
      </section>

      {selectedRun && (
        <RunDetails
          run={selectedRun}
          onClose={() => {
            if (!detailLoading) {
              setSelectedRun(null);
              setDetailError("");
            }
          }}
        />
      )}

      {detailLoading && (
        <div className="activity-detail-loading">
          <LoaderCircle size={22} className="activity-spin" />
          Loading run details...
        </div>
      )}

      {detailError && (
        <div className="activity-detail-error">
          <AlertTriangle size={16} />
          {detailError}
          <button onClick={() => setDetailError("")}>Dismiss</button>
        </div>
      )}
    </div>
  );
}
