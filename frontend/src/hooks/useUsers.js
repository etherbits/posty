import { useCallback, useEffect, useState } from "react";
import { notifyError } from "../utils/toastHistory";

const API_URL = "http://localhost:3000";

export function useUsers(isAuthenticated, isAdmin) {
	const [users, setUsers] = useState([]);
	const [isLoadingUsers, setIsLoadingUsers] = useState(false);

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

	return {
		users,
		isLoadingUsers,
		refreshUsers: fetchUsers,
	};
}
