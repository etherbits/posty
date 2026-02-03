import "./StatsCard.css";

export function StatsCard({
	icon: Icon,
	label,
	value,
	trend,
	className = "",
	variant = "default",
	styles,
	children,
}) {
	if (styles) {
		const baseClass = variant === "kpi" ? styles.kpiCard : styles.statCard;
		return <div className={`${baseClass} ${className}`}>{children}</div>;
	}

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
				{trend ? (
					<span
						className={`stats-trend ${trend > 0 ? "positive" : "negative"}`}
					>
						{trend > 0 ? "+" : ""}
						{trend}%
					</span>
				) : null}
			</div>
		</div>
	);
}
