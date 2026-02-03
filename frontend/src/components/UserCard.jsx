import { useEffect, useState } from "react";
import { Dropdown } from "./Dropdown";
import styles from "./UserCard.module.css";

export function UserCard({
	user,
	onUpdateRole = async () => false,
	onDelete = async () => false,
}) {
	const [role, setRole] = useState(user.role || "user");
	const [isUpdating, setIsUpdating] = useState(false);
	const [isDeleting, setIsDeleting] = useState(false);
	const roleLabel = role ? role.replace(/_/g, " ") : "user";
	const postsCount = Number(user.postsCount || 0).toLocaleString();
	const isMastodonConnected = Boolean(user.hasMastodonConnected);
	const isBlueskyConnected = Boolean(user.hasBlueskyConnected);
	const isAdmin = user.role === "admin";

	useEffect(() => {
		setRole(user.role || "user");
	}, [user.role]);

	const handleRoleChange = async (event) => {
		const nextRole = event.target.value;
		if (nextRole === role) return;
		setRole(nextRole);
		setIsUpdating(true);
		const success = await onUpdateRole(user.id, nextRole);
		if (!success) {
			setRole(user.role || "user");
		}
		setIsUpdating(false);
	};

	const handleDelete = async () => {
		if (isDeleting) return;
		const confirmed = confirm(
			`Delete ${user.username}? This action cannot be undone.`,
		);
		if (!confirmed) return;
		setIsDeleting(true);
		const success = await onDelete(user.id);
		if (!success) {
			setIsDeleting(false);
		}
	};

	return (
		<div className={styles.card}>
			<div className={styles.topRow}>
				<div className={styles.profile}>
					<img
						src="/images/default_user_image.jpg"
						alt={`${user.username} avatar`}
						className={styles.avatar}
					/>
					<div>
						<p className={styles.name}>{user.username}</p>
						<p className={styles.role}>{roleLabel}</p>
					</div>
				</div>
				<div className={styles.controls}>
					{!isAdmin && (
						<button
							type="button"
							className={styles.deleteButton}
							onClick={handleDelete}
							disabled={isDeleting || isUpdating}
						>
							Delete user
						</button>
					)}
					<Dropdown
						value={role}
						onChange={handleRoleChange}
						className={styles.roleSelect}
						wrapperClassName={styles.roleSelectWrap}
						fullWidth={false}
						disabled={isUpdating || isDeleting}
					>
						<option value="user">User</option>
						<option value="admin">Admin</option>
					</Dropdown>
					<span
						className={`${styles.badge} ${
							role === "admin" ? styles.badgeAdmin : styles.badgeUser
						}`}
					>
						{roleLabel}
					</span>
				</div>
			</div>
			{!isAdmin && (
				<div className={styles.bottomRow}>
					<div className={styles.metaItem}>
						<span className={styles.metaLabel}>Posts</span>
						<span className={styles.metaValue}>{postsCount}</span>
					</div>
					<div className={styles.metaItem}>
						<span className={styles.metaLabel}>Mastodon</span>
						<span
							className={`${styles.status} ${
								isMastodonConnected
									? styles.statusActive
									: styles.statusInactive
							}`}
						>
							<span className={styles.statusDot} />
							{isMastodonConnected ? "Connected" : "Not connected"}
						</span>
					</div>
					<div className={styles.metaItem}>
						<span className={styles.metaLabel}>Bluesky</span>
						<span
							className={`${styles.status} ${
								isBlueskyConnected
									? styles.statusActive
									: styles.statusInactive
							}`}
						>
							<span className={styles.statusDot} />
							{isBlueskyConnected ? "Connected" : "Not connected"}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
