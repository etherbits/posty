import "./StatsCard.css";

export function StatsCard({ icon: Icon, label, value, trend, className = "" }) {
  return (
    <div className={`stats-card ${className}`}>
      {Icon && (
        <div className="stats-icon">
          <Icon size={20} />
        </div>
      )}
      <div className="stats-content">
        <span className="stats-value">{value}</span>
        <span className="stats-label">{label}</span>
        {trend && (
          <span className={`stats-trend ${trend > 0 ? "positive" : "negative"}`}>
            {trend > 0 ? "+" : ""}{trend}%
          </span>
        )}
      </div>
    </div>
  );
}
