import { RefreshCw, UserX } from "lucide-react";
import { UserCard } from "./UserCard";
import { ListCardShell, ListEmptyState } from "./ListCardShell";
import styles from "./UsersList.module.css";

export function UsersList({
	users,
	isLoading,
	onRefresh = () => {},
	onUpdateRole = async () => false,
	onDelete = async () => false,
}) {
	return (
		<ListCardShell
			styles={styles}
			title="All Users"
			subtitle={`${users.length} total ${users.length === 1 ? "user" : "users"}`}
			actions={
				<button
					className={styles.refresh}
					type="button"
					onClick={onRefresh}
					disabled={isLoading}
				>
					<RefreshCw size={16} />
					Refresh
				</button>
			}
		>
			{isLoading ? (
				<div className={styles.emptyState}>
					<div className={styles.loading}>Loading users...</div>
				</div>
			) : users.length === 0 ? (
				<ListEmptyState
					styles={styles}
					icon={UserX}
					title="No users found"
					description="New accounts will appear here once created."
				/>
			) : (
				<div className={styles.grid}>
					{users.map((user) => (
						<UserCard
							key={user.id}
							user={user}
							onUpdateRole={onUpdateRole}
							onDelete={onDelete}
						/>
					))}
				</div>
			)}
		</ListCardShell>
	);
}
