import {
	AreaChart,
	Area,
	XAxis,
	YAxis,
	Tooltip,
	ResponsiveContainer,
} from "recharts";
import "./ActivityChart.css";

function CustomTooltip({ active, payload, label }) {
	if (active && payload && payload.length) {
		return (
			<div className="chart-tooltip">
				<p className="tooltip-label">{label}</p>
				<p className="tooltip-value">{payload[0].value} posts</p>
			</div>
		);
	}
	return null;
}

export function ActivityChart({ posts }) {
	// Group posts by date for the chart
	const getChartData = () => {
		const last30Days = [];
		const today = new Date();

		for (let i = 29; i >= 0; i--) {
			const date = new Date(today);
			date.setDate(date.getDate() - i);
			const dateStr = date.toLocaleDateString("en-US", {
				month: "short",
				day: "numeric",
			});

			const dayPosts = posts.filter((post) => {
				const postDate = new Date(post.scheduled_time);
				return postDate.toDateString() === date.toDateString();
			});

			last30Days.push({
				date: dateStr,
				posts: dayPosts.length,
				sent: dayPosts.filter((p) => p.status === "sent").length,
				pending: dayPosts.filter((p) => p.status === "pending").length,
			});
		}

		return last30Days;
	};

	const data = getChartData();
	const totalPosts = data.reduce((sum, d) => sum + d.posts, 0);

	return (
		<div className="activity-chart">
			<div className="chart-header">
				<div>
					<h3 className="chart-title">Post Activity</h3>
				</div>
				<div className="chart-stats">
					<span className="chart-total">
						Total this month: {totalPosts.toLocaleString()}
					</span>
				</div>
			</div>

			<div className="chart-container">
				<ResponsiveContainer width="100%" height={200}>
					<AreaChart
						data={data}
						margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
					>
						<defs>
							<linearGradient id="colorPosts" x1="0" y1="0" x2="0" y2="1">
								<stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
								<stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
							</linearGradient>
						</defs>
						<XAxis
							dataKey="date"
							axisLine={false}
							tickLine={false}
							tick={{ fill: "#71717a", fontSize: 11 }}
							interval="preserveStartEnd"
						/>
						<YAxis
							axisLine={false}
							tickLine={false}
							tick={{ fill: "#71717a", fontSize: 11 }}
						/>
						<Tooltip content={<CustomTooltip />} />
						<Area
							type="monotone"
							dataKey="posts"
							stroke="#8b5cf6"
							strokeWidth={2}
							fill="url(#colorPosts)"
						/>
					</AreaChart>
				</ResponsiveContainer>
			</div>
		</div>
	);
}
