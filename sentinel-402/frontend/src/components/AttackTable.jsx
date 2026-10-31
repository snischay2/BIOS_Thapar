
import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function AttackTable({ results = [], compact = false }) {
  if (!results.length) {
    return (
      <div className="empty-mini">
        No attack results available. Run a simulation first.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="attack-table">
        <thead>
          <tr>
            <th>ATTACK / TEST</th>
            <th>EXPECTED</th>
            <th>ACTUAL</th>
            <th>RESULT</th>
            {!compact && <th>LATENCY</th>}
          </tr>
        </thead>
        <tbody>
          {results.map((item, index) => (
            <tr key={`${item.attackId}-${index}`}>
              <td>
                <strong className="attack-title">{item.attackName}</strong>
                <small className="attack-sub">{item.attackId}</small>
              </td>
              <td>
                <span className={`decision ${String(item.expectedDecision).toLowerCase()}`}>
                  {item.expectedDecision}
                </span>
              </td>
              <td>
                <span className={`decision ${String(item.actualDecision).toLowerCase()}`}>
                  {item.actualDecision}
                </span>
              </td>
              <td>
                {item.passed ? (
                  <span className="result-pass"><CheckCircle2 size={15} /> PASS</span>
                ) : (
                  <span className="result-fail"><AlertTriangle size={15} /> FAIL</span>
                )}
              </td>
              {!compact && <td>{item.latencyMs} ms</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
