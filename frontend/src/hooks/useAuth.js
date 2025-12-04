import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import toast from "react-hot-toast";

const API_URL = "http://localhost:3000";

export function useAuth() {
	const [isLoading, setIsLoading] = useState(true);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState(null);

	const isFetchingRef = useRef(false);
	const didInitRef = useRef(false);

	const fetchCurrentUser = useCallback(async () => {
		if (isFetchingRef.current) return;

		isFetchingRef.current = true;

		try {
			const response = await fetch(`${API_URL}/auth/me`, {
				credentials: "include",
			});

			if (response.ok) {
				const data = await response.json();
				setUser(data);
				setIsAuthenticated(true);
				localStorage.setItem("user", JSON.stringify(data));
			} else {
				setUser(null);
				setIsAuthenticated(false);
				localStorage.removeItem("user");
			}
		} catch (error) {
			console.error("Error fetching user:", error);
		} finally {
			isFetchingRef.current = false;
		}
	}, []);

	useEffect(() => {
		if (didInitRef.current) return;
		didInitRef.current = true;

		(async () => {
			try {
				const storedUser = localStorage.getItem("user");
				if (storedUser) {
					setUser(JSON.parse(storedUser));
					setIsAuthenticated(true);
				}
				await fetchCurrentUser();
			} finally {
				setIsLoading(false);
			}
		})();
	}, [fetchCurrentUser]);

	const signIn = async (username, password) => {
		try {
			const response = await fetch(`${API_URL}/auth/sign-in`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ username, password }),
			});

			if (!response.ok) throw new Error("Sign-in failed");

			const data = await response.json();
			localStorage.setItem("user", JSON.stringify(data.user));
			setUser(data.user);
			setIsAuthenticated(true);
			toast.success("Signed in successfully!");
			return true;
		} catch (error) {
			console.error(error);
			toast.error("Sign-in failed");
			return false;
		}
	};

	const signUp = async (username, password, confirmPassword) => {
		try {
			const response = await fetch(`${API_URL}/auth/sign-up`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({ username, password, confirmPassword }),
			});

			if (!response.ok) throw new Error("Sign-up failed");

			const data = await response.json();
			localStorage.setItem("user", JSON.stringify(data.user));
			setUser(data.user);
			setIsAuthenticated(true);
			toast.success("Account created successfully!");
			return true;
		} catch (error) {
			console.error(error);
			toast.error("Sign-up failed");
			return false;
		}
	};

	const logout = async () => {
		try {
			await fetch(`${API_URL}/auth/logout`, {
				method: "POST",
				credentials: "include",
			});

			localStorage.removeItem("user");
			setUser(null);
			setIsAuthenticated(false);
			toast.success("Logged out successfully!");
			return true;
		} catch (error) {
			console.error("Error logging out:", error);
			toast.error("Failed to logout");
			return false;
		}
	};

	const connectMastodon = () => {
		window.location.href = `${API_URL}/auth/oauth/mastodon`;
	};

	/* ============================
	   NEW: DISCONNECT FUNCTION
	============================= */
	const disconnectMastodon = async () => {
		try {
			const res = await fetch(`${API_URL}/auth/mastodon/disconnect`, {
				method: "POST",
				credentials: "include",
			});

			if (!res.ok) throw new Error();

			setUser((prev) => ({
				...prev,
				hasMastodonConnected: false,
			}));

			localStorage.setItem(
				"user",
				JSON.stringify({
					...user,
					hasMastodonConnected: false,
				})
			);

			toast.success("Disconnected Mastodon!");
			return true;
		} catch (err) {
			console.error(err);
			toast.error("Failed to disconnect Mastodon");
			return false;
		}
	};

	const canViewPosts = useMemo(() => {
		if (!user) return false;
		if (user.role === "admin") return true;
		return user.hasMastodonConnected;
	}, [user]);

	const canSchedulePosts = useMemo(() => {
		if (!user) return false;
		return user.hasMastodonConnected;
	}, [user]);

	return {
		isLoading,
		isAuthenticated,
		user,
		signIn,
		signUp,
		logout,
		connectMastodon,
		disconnectMastodon,
		canViewPosts,
		canSchedulePosts,
	};
}
