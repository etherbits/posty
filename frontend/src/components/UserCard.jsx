import styles from "./UserCard.module.css";

function getInitials(username) {
	if (!username) return "U";
	return username.slice(0, 1).toUpperCase();
}

export function UserCard({ user }) {
	const roleLabel = user.role ? user.role.replace(/_/g, " ") : "user";
	const postsCount = Number(user.postsCount || 0).toLocaleString();
	const isMastodonConnected = Boolean(user.hasMastodonConnected);

	return (
		<div className={styles.card}>
			<div className={styles.header}>
				<div className={styles.profile}>
					<div className={styles.avatar}>{getInitials(user.username)}</div>
					<div>
						<p className={styles.name}>{user.username}</p>
						<p className={styles.role}>{roleLabel}</p>
					</div>
				</div>
				<span
					className={`${styles.badge} ${
						user.role === "admin" ? styles.badgeAdmin : styles.badgeUser
					}`}
				>
					{roleLabel}
				</span>
			</div>
			<div className={styles.meta}>
				<div className={styles.metaItem}>
					<span className={styles.metaLabel}>Posts</span>
					<span className={styles.metaValue}>{postsCount}</span>
				</div>
				<div className={styles.metaItem}>
					<span className={styles.metaLabel}>Mastodon</span>
					<span
						className={`${styles.status} ${
							isMastodonConnected ? styles.statusActive : styles.statusInactive
						}`}
					>
						<span className={styles.statusDot} />
						{isMastodonConnected ? "Connected" : "Not connected"}
					</span>
				</div>
			</div>
		</div>
	);
}
