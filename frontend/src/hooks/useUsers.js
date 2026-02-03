import { useCallback, useEffect, useState } from "react";
import { notifyError, notifySuccess } from "../utils/toastHistory";
import { API_URL } from "../config/api";

export function useUsers(isAuthenticated, isAdmin) {
	const [users, setUsers] = useState([]);
	const [isLoadingUsers, setIsLoadingUsers] = useState(false);
	const [isUpdatingUser, setIsUpdatingUser] = useState(false);

	const fetchUsers = useCallback(async () => {
		if (!isAuthenticated || !isAdmin) return;
		setIsLoadingUsers(true);
		try {
			const response = await fetch(`${API_URL}/user/all`, {
				credentials: "include",
			});
			if (!response.ok) throw new Error("Failed to load users");
			const data = await response.json();
			setUsers(Array.isArray(data.users) ? data.users : []);
		} catch (error) {
			console.error(error);
			notifyError("Failed to load users");
		} finally {
			setIsLoadingUsers(false);
		}
	}, [isAuthenticated, isAdmin]);

	useEffect(() => {
		if (!isAuthenticated || !isAdmin) {
			setUsers([]);
			return;
		}
		fetchUsers();
	}, [fetchUsers, isAuthenticated, isAdmin]);

	const updateUserRole = useCallback(
		async (userId, role) => {
			if (!isAuthenticated || !isAdmin || isUpdatingUser) return false;
			setIsUpdatingUser(true);
			try {
				const response = await fetch(`${API_URL}/user/${userId}/role`, {
					method: "PATCH",
					headers: { "Content-Type": "application/json" },
					credentials: "include",
					body: JSON.stringify({ role }),
				});
				if (!response.ok) throw new Error("Failed to update role");
				const data = await response.json();
				setUsers((prev) =>
					prev.map((user) =>
						user.id === userId ? { ...user, role: data.role } : user,
					),
				);
				notifySuccess("User role updated");
				return true;
			} catch (error) {
				console.error(error);
				notifyError("Failed to update user role");
				return false;
			} finally {
				setIsUpdatingUser(false);
			}
		},
		[isAuthenticated, isAdmin, isUpdatingUser],
	);

	const deleteUser = useCallback(
		async (userId) => {
			if (!isAuthenticated || !isAdmin || isUpdatingUser) return false;
			setIsUpdatingUser(true);
			try {
				const response = await fetch(`${API_URL}/user/${userId}`, {
					method: "DELETE",
					credentials: "include",
				});
				if (!response.ok) throw new Error("Failed to delete user");
				setUsers((prev) => prev.filter((user) => user.id !== userId));
				notifySuccess("User deleted");
				return true;
			} catch (error) {
				console.error(error);
				notifyError("Failed to delete user");
				return false;
			} finally {
				setIsUpdatingUser(false);
			}
		},
		[isAuthenticated, isAdmin, isUpdatingUser],
	);

	return {
		users,
		isLoadingUsers,
		refreshUsers: fetchUsers,
		updateUserRole,
		deleteUser,
	};
}
