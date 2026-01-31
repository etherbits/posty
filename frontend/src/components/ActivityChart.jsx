import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
	CartesianGrid,
} from "recharts";
import styles from "./ActivityChart.module.css";

function CustomTooltip({ active, payload, label }) {
	if (active && payload && payload.length) {
		return (
			<div className={styles.tooltip}>
				<p className={styles.tooltipLabel}>{label}</p>
				<p className={styles.tooltipValue}>
					{payload[0].value.toLocaleString()} engagements
				</p>
			</div>
		);
	}
	return null;
}

function resolvePostDate(post) {
	return post.created_at || post.scheduled_time || post.scheduledTime || null;
}

export function ActivityChart({ posts = [] }) {
	const today = new Date();

	const data = Array.from({ length: 30 }).map((_, index) => {
		const date = new Date(today);
		date.setDate(date.getDate() - (29 - index));
		const dateLabel = date.toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		});

		const dayPosts = posts.filter((post) => {
			const postDateValue = resolvePostDate(post);
			if (!postDateValue) return false;
			const postDate = new Date(postDateValue);
			return postDate.toDateString() === date.toDateString();
		});

		const engagements = dayPosts.reduce((sum, post) => {
			const replies = post.replies_count || 0;
			const favorites = post.favorites_count || 0;
			const reposts = post.reposts_count ?? post.reblogs_count ?? 0;
			return sum + replies + favorites + reposts;
		}, 0);

		return {
			date: dateLabel,
			engagements,
		};
	});

	return (
		<div className={styles.card}>
			<div className={styles.header}>
				<span className={styles.title}>Daily Engagements</span>
			</div>
			<div className={styles.chart}>
				<ResponsiveContainer width="100%" height="100%">
					<LineChart data={data} margin={{ top: 10, right: 12, left: 6, bottom: 8 }}>
						<CartesianGrid stroke="#EEF0F6" strokeDasharray="3 3" vertical={false} />
						<XAxis
							dataKey="date"
							axisLine={false}
							tickLine={false}
							tick={{ fill: "#707A89", fontSize: 11 }}
							tickMargin={8}
							padding={{ left: 6, right: 6 }}
							interval={4}
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fill: "#707A89", fontSize: 11 }}
							width={38}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Line
							type="monotone"
							dataKey="engagements"
							stroke="#4F46BA"
							strokeWidth={2.5}
							dot={false}
							activeDot={{ r: 4, strokeWidth: 2, stroke: "#4F46BA", fill: "#ffffff" }}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
