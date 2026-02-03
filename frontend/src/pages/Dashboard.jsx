import { useMemo } from "react";
import { ActivityChart } from "../components/ActivityChart";
import { PageLayout } from "../components/PageLayout";
import { StatsCard } from "../components/StatsCard";
import styles from "./Dashboard.module.css";

const DEFAULT_TARGETS = {
	weekly: 10,
	monthly: 50,
};

function resolvePostDate(post) {
	return post.created_at || post.scheduled_time || post.scheduledTime || null;
}

function computeEngagements(posts, days) {
	const now = new Date();
	const start = new Date();
	start.setDate(now.getDate() - (days - 1));
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

function calculateProgress(value, target) {
	if (!target) return 0;
	const percent = Math.round((value / target) * 100);
	return Math.min(100, Math.max(0, percent));
}

export function Dashboard({ posts, targets = DEFAULT_TARGETS }) {
	const monthlyEngagements = useMemo(() => computeEngagements(posts, 30), [posts]);
	const weeklyEngagements = useMemo(() => computeEngagements(posts, 7), [posts]);
	const weeklyTotal =
		weeklyEngagements.favorites +
		weeklyEngagements.replies +
		weeklyEngagements.reposts;
	const monthlyTotal =
		monthlyEngagements.favorites +
		monthlyEngagements.replies +
		monthlyEngagements.reposts;
	const weeklyTarget = Number(targets.weekly ?? DEFAULT_TARGETS.weekly);
	const monthlyTarget = Number(targets.monthly ?? DEFAULT_TARGETS.monthly);
	const weeklyProgress = calculateProgress(weeklyTotal, weeklyTarget);
	const monthlyProgress = calculateProgress(monthlyTotal, monthlyTarget);

	const kpiData = [
		{
			label: "Favorites",
			value: monthlyEngagements.favorites,
			variant: "primary",
		},
		{
			label: "Replies",
			value: monthlyEngagements.replies,
			variant: "secondary",
		},
		{
			label: "Reposts",
			value: monthlyEngagements.reposts,
			variant: "teal",
		},
	];

	const variantClasses = {
		primary: styles.kpiPrimary,
		secondary: styles.kpiSecondary,
		teal: styles.kpiTeal,
	};

	return (
		<PageLayout>
			<p className={styles.eyebrow}>Social Media Analytics Dashboard</p>

			<section className={styles.section}>
				<div className={styles.sectionHeader}>
					<h2 className={styles.sectionTitle}>30 Days Performance</h2>
				</div>
				<div className={styles.kpiGrid}>
					{kpiData.map((item) => (
						<StatsCard
							key={item.label}
							variant="kpi"
							className={variantClasses[item.variant]}
							styles={styles}
						>
							<span className={styles.kpiLabel}>
								{item.label.toUpperCase()}
							</span>
							<span className={styles.kpiValue}>
								{item.value.toLocaleString()}
							</span>
						</StatsCard>
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
					<StatsCard variant="progress" styles={styles}>
						<div className={styles.statInfo}>
							<p className={styles.statTitle}>Weekly Target</p>
							<p className={styles.statSubtitle}>{weeklyProgress}% achieved</p>
						</div>
						<div className={styles.statDivider} />
						<div
							className={styles.progressRing}
							style={{
								"--progress": weeklyProgress,
								"--ring-accent": "var(--color-primary)",
								"--ring-base": "#eef0f6",
								"--ring-center": "#ffffff",
							}}
						>
							<span>{weeklyProgress}%</span>
						</div>
					</StatsCard>
					<StatsCard
						variant="progress"
						className={styles.statCardPrimary}
						styles={styles}
					>
						<div className={styles.statInfo}>
							<p className={styles.statTitleLight}>Montly Target</p>
							<p className={styles.statSubtitleLight}>
								{monthlyProgress}% achieved
							</p>
						</div>
						<div
							className={`${styles.statDivider} ${styles.statDividerLight}`}
						/>
						<div
							className={`${styles.progressRing} ${styles.progressRingLight}`}
							style={{
								"--progress": monthlyProgress,
								"--ring-accent": "#f9896b",
								"--ring-base": "rgba(255, 255, 255, 0.35)",
								"--ring-center": "#4f46ba",
							}}
						>
							<span>{monthlyProgress}%</span>
						</div>
					</StatsCard>
				</div>
			</section>
		</PageLayout>
	);
}
