import styles from "./RightPanel.module.css";

export function RightPanel({
	user,
	stats,
	onLogout,
	onReplayToasts,
	isOpen,
	className = "",
}) {
	const displayName = user?.username || "User";
	const roleValue = user?.role ? user.role.replace(/_/g, " ") : "user";
	const roleLabel = `${roleValue
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ")} of Posty`;
	const totalPosts = stats?.totalPosts ?? 0;
	const sentPosts = stats?.sentPosts ?? 0;
	const scheduledPosts = stats?.pendingPosts ?? 0;
	const showStats = user?.role !== "admin";

	return (
		<aside
			className={`${styles.panel} ${className} ${isOpen ? styles.open : ""}`}
		>
			<div className={styles.topRow}>
				<div>
					<p className={styles.greeting}>Hi {displayName}</p>
					<p className={styles.subGreeting}>Good Morning!</p>
				</div>
				<div className={styles.iconGroup}>
					<button
						type="button"
						className={styles.iconButton}
						aria-label="Notifications"
						onClick={onReplayToasts}
					>
						<span
							className={styles.notificationIcon}
							style={{
								WebkitMaskImage: "url(/vectors/notification_bell.svg)",
								maskImage: "url(/vectors/notification_bell.svg)",
							}}
						/>
					</button>
				</div>
			</div>

			<div className={styles.profileCard}>
				<img
					src="/images/default_user_image.jpg"
					alt="Profile"
					className={styles.avatar}
				/>
				<h3 className={styles.profileName}>{displayName}</h3>
				<p className={styles.profileRole}>{roleLabel}</p>

				{showStats && (
					<div className={styles.statsRow}>
						<div className={styles.statBlock}>
							<span className={styles.statValue}>
								{totalPosts.toLocaleString()}
							</span>
							<span className={styles.statLabel}>Total Posts</span>
						</div>
						<div className={styles.statBlock}>
							<span className={styles.statValue}>
								{sentPosts.toLocaleString()}
							</span>
							<span className={styles.statLabel}>Sent Posts</span>
						</div>
						<div className={styles.statBlock}>
							<span className={styles.statValue}>
								{scheduledPosts.toLocaleString()}
							</span>
							<span className={styles.statLabel}>Scheduled Posts</span>
						</div>
					</div>
				)}

				<button type="button" className={styles.signOut} onClick={onLogout}>
					Sign Out
				</button>
			</div>

		</aside>
	);
}
