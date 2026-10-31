
import { ShieldAlert, ShieldCheck } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";

  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RunHistory({ history = [] }) {
  if (!history.length) {
    return <div className="empty-mini">No saved simulation runs yet.</div>;
  }

  return (
    <div className="run-history">
      {history.map((run) => {
        const passed = run.status === "PASS";

        return (
          <div className="history-row" key={run._id}>
            <div className={`history-icon ${passed ? "history-success" : "history-fail"}`}>
              {passed ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
            </div>
            <div className="min-w-0 flex-1">
              <strong>Red / Blue simulation</strong>
              <small>{formatDate(run.createdAt)}</small>
              <small>
                {run.summary?.attacksBlocked ?? 0}/
                {run.summary?.attacksTotal ?? 0} attacks blocked
              </small>
            </div>
            <span className={`history-badge ${passed ? "badge-pass" : "badge-fail"}`}>
              {run.status}
            </span>
          </div>
        );
      })}
    </div>
  );
}
