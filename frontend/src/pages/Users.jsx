import { UsersList } from "../components/UsersList";
import styles from "./Users.module.css";

export function Users({ users, isLoading, onRefresh, onUpdateRole, onDelete }) {
	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h2 className={styles.title}>Users</h2>
					<p className={styles.subtitle}>
						Manage user access and social connections.
					</p>
				</div>
			</div>
			<UsersList
				users={users}
				isLoading={isLoading}
				onRefresh={onRefresh}
				onUpdateRole={onUpdateRole}
				onDelete={onDelete}
			/>
		</div>
	);
}
