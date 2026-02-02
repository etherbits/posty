import { useEffect, useState } from "react";
import styles from "./UserCard.module.css";

function getInitials(username) {
	if (!username) return "U";
	return username.slice(0, 1).toUpperCase();
}

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
			<div className={styles.header}>
				<div className={styles.profile}>
					<div className={styles.avatar}>{getInitials(user.username)}</div>
					<div>
						<p className={styles.name}>{user.username}</p>
						<p className={styles.role}>{roleLabel}</p>
					</div>
				</div>
				<div className={styles.roleControls}>
					<select
						value={role}
						onChange={handleRoleChange}
						className={styles.roleSelect}
						disabled={isUpdating || isDeleting}
					>
						<option value="user">User</option>
						<option value="admin">Admin</option>
					</select>
					<span
						className={`${styles.badge} ${
							role === "admin" ? styles.badgeAdmin : styles.badgeUser
						}`}
					>
						{roleLabel}
					</span>
				</div>
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
			<div className={styles.actions}>
				<button
					type="button"
					className={styles.deleteButton}
					onClick={handleDelete}
					disabled={isDeleting || isUpdating || user.role === "admin"}
				>
					{user.role === "admin" ? "Admin" : "Delete user"}
				</button>
			</div>
		</div>
	);
}
