import { useMemo } from "react";
import { ActivityChart } from "../components/ActivityChart";
import styles from "./Dashboard.module.css";

const DAYS_WINDOW = 30;

function resolvePostDate(post) {
	return post.created_at || post.scheduled_time || post.scheduledTime || null;
}

function computeEngagements(posts) {
	const now = new Date();
	const start = new Date();
	start.setDate(now.getDate() - (DAYS_WINDOW - 1));
	start.setHours(0, 0, 0, 0);

	return posts.reduce(
		(acc, post) => {
			const dateValue = resolvePostDate(post);
			if (!dateValue) return acc;
			const date = new Date(dateValue);
			if (date < start || date > now) return acc;
			acc.favorites += post.favorites_count || 0;
			acc.replies += post.replies_count || 0;
			acc.reposts += post.reposts_count ?? post.reblogs_count ?? 0;
			return acc;
		},
		{ favorites: 0, replies: 0, reposts: 0 },
	);
}

export function Dashboard({ posts }) {
	const engagements = useMemo(() => computeEngagements(posts), [posts]);

	const kpiData = [
		{
			label: "Favorites",
			value: engagements.favorites,
			variant: "primary",
		},
		{
			label: "Replies",
			value: engagements.replies,
			variant: "secondary",
		},
		{
			label: "Reposts",
			value: engagements.reposts,
			variant: "teal",
		},
	];

	const variantClasses = {
		primary: styles.kpiPrimary,
		secondary: styles.kpiSecondary,
		teal: styles.kpiTeal,
	};

	return (
		<div className={styles.dashboard}>
			<p className={styles.eyebrow}>Social Media Analytics Dashboard</p>

			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<h2 className={styles.sectionTitle}>30 Days Performance</h2>
				</div>
				<div className={styles.kpiGrid}>
					{kpiData.map((item) => (
						<div
							key={item.label}
							className={`${styles.kpiCard} ${variantClasses[item.variant]}`}
						>
							<span className={styles.kpiLabel}>
								{item.label.toUpperCase()}
							</span>
							<span className={styles.kpiValue}>
								{item.value.toLocaleString()}
							</span>
						</div>
					))}
				</div>
			</section>

			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<h3 className={styles.sectionTitle}>Analytics</h3>
				</div>
				<ActivityChart posts={posts} />
			</section>

			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<h3 className={styles.sectionTitle}>Statistics</h3>
				</div>
				<div className={styles.statsGrid}>
					<div className={styles.statCard}>
						<div className={styles.statInfo}>
							<p className={styles.statTitle}>Weekly Target</p>
							<p className={styles.statSubtitle}>25% achieved</p>
						</div>
						<div className={styles.statDivider} />
						<div
							className={styles.progressRing}
							style={{
								"--progress": 25,
								"--ring-accent": "var(--color-primary)",
								"--ring-base": "#eef0f6",
								"--ring-center": "#ffffff",
							}}
						>
							<span>
								<span>25%</span>
							</span>
						</div>
					</div>
					<div className={`${styles.statCard} ${styles.statCardPrimary}`}>
						<div className={styles.statInfo}>
							<p className={styles.statTitleLight}>Montly Target</p>
							<p className={styles.statSubtitleLight}>50% achieved</p>
						</div>
						<div
							className={`${styles.statDivider} ${styles.statDividerLight}`}
						/>
						<div
							className={`${styles.progressRing} ${styles.progressRingLight}`}
							style={{
								"--progress": 50,
								"--ring-accent": "#f9896b",
								"--ring-base": "rgba(255, 255, 255, 0.35)",
								"--ring-center": "#4f46ba",
							}}
						>
							<span>
								<span>50%</span>
							</span>
						</div>
					</div>
				</div>
			</section>
		</div>
	);
}
