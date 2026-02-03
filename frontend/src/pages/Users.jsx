import { PageHeader, PageLayout } from "../components/PageLayout";
import { UsersList } from "../components/UsersList";

export function Users({ users, isLoading, onRefresh, onUpdateRole, onDelete }) {
	return (
		<PageLayout>
			<PageHeader
				title="Users"
				subtitle="Manage user access and social connections."
			/>
			<UsersList
				users={users}
				isLoading={isLoading}
				onRefresh={onRefresh}
				onUpdateRole={onUpdateRole}
				onDelete={onDelete}
			/>
		</PageLayout>
	);
}
