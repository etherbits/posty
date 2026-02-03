import styles from "./PageLayout.module.css";

export function PageLayout({ children, className = "" }) {
	return <div className={`${styles.page} ${className}`}>{children}</div>;
}

export function PageHeader({ title, subtitle, actions }) {
	return (
		<div className={styles.header}>
			<div>
				<h2 className={styles.title}>{title}</h2>
				{subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
			</div>
			{actions ? <div className={styles.actions}>{actions}</div> : null}
		</div>
	);
}
