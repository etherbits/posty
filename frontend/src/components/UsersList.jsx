import { RefreshCw, UserX } from "lucide-react";
import { UserCard } from "./UserCard";
import styles from "./UsersList.module.css";

export function UsersList({ users, isLoading, onRefresh = () => {} }) {
	return (
		<div className={styles.card}>
			<div className={styles.header}>
				<div>
					<h3 className={styles.title}>All Users</h3>
					<p className={styles.subtitle}>
						{users.length} total {users.length === 1 ? "user" : "users"}
					</p>
				</div>
				<button
					className={styles.refresh}
					type="button"
					onClick={onRefresh}
					disabled={isLoading}
				>
					<RefreshCw size={16} />
					Refresh
				</button>
			</div>

			{isLoading ? (
				<div className={styles.emptyState}>
					<div className={styles.loading}>Loading users...</div>
				</div>
			) : users.length === 0 ? (
				<div className={styles.emptyState}>
					<UserX size={40} className={styles.emptyIcon} />
					<h4>No users found</h4>
					<p>New accounts will appear here once created.</p>
				</div>
			) : (
				<div className={styles.grid}>
					{users.map((user) => (
						<UserCard key={user.id} user={user} />
					))}
				</div>
			)}
		</div>
	);
}
