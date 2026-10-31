
export default function MetricCard({ icon: Icon, label, value, note, tone = "green" }) {
  return (
    <article className="metric-card group">
      <div className="flex items-center justify-between">
        <div className={`metric-icon tone-${tone}`}>
          <Icon size={21} strokeWidth={2} />
        </div>
        <span className="metric-decoration">↗</span>
      </div>

      <p className="metric-label">{label}</p>
      <h3 className="metric-number">{value ?? "—"}</h3>
      <p className="metric-note">{note}</p>
    </article>
  );
}
