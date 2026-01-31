import styles from "./PlaceholderPage.module.css";

export function PlaceholderPage({ title }) {
	return (
		<div className={styles.wrap}>
			<div className={styles.card}>
				<h2>{title}</h2>
				<p>Coming soon.</p>
			</div>
		</div>
	);
}
