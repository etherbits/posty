export function ListCardShell({ styles, title, subtitle, actions, children }) {
	return (
		<div className={styles.card}>
			<div className={styles.header}>
				<div>
					<h3 className={styles.title}>{title}</h3>
					{subtitle ? (
						<p className={styles.subtitle}>{subtitle}</p>
					) : null}
				</div>
				{actions ? (
					<div className={styles.actions || undefined}>{actions}</div>
				) : null}
			</div>
			{children}
		</div>
	);
}

export function ListEmptyState({ styles, icon: Icon, title, description }) {
	return (
		<div className={styles.emptyState}>
			{Icon ? <Icon size={40} className={styles.emptyIcon} /> : null}
			<h4>{title}</h4>
			<p>{description}</p>
		</div>
	);
}
