import { useEffect, useRef } from "react";
import { Toaster } from "react-hot-toast";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./hooks/useAuth";
import { usePosts } from "./hooks/usePosts";

import { AuthForm } from "./components/AuthForm";
import { AppShell } from "./layouts/AppShell";
import { Dashboard } from "./pages/Dashboard";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { replayToasts } from "./utils/toastHistory";
import styles from "./App.module.css";

const POLL_INTERVAL_SECONDS = 10;

function App() {
	const {
		isLoading,
		isAuthenticated,
		user,
		signIn,
		signUp,
		logout,
		canViewPosts,
	} = useAuth();

	const { posts, fetchPosts, refreshCurrentPage, calculateStats, clearPosts } =
		usePosts();

	const didFetchRef = useRef(false);

	useEffect(() => {
		if (!isAuthenticated || !canViewPosts) {
			didFetchRef.current = false;
			return;
		}

		if (didFetchRef.current) return;

		didFetchRef.current = true;
		fetchPosts(1);

		const pollInterval = setInterval(() => {
			refreshCurrentPage();
		}, POLL_INTERVAL_SECONDS * 1000);

		return () => clearInterval(pollInterval);
	}, [isAuthenticated, canViewPosts, fetchPosts, refreshCurrentPage]);

	const handleLogout = async () => {
		const success = await logout();
		if (success) clearPosts();
	};

	if (isLoading) {
		return (
			<div className={styles.loadingScreen}>
				<div className={styles.spinner} />
				<p>Loading...</p>
			</div>
		);
	}

	if (!isAuthenticated) {
		return (
			<>
				<Toaster position="top-right" toastOptions={{ className: "toast" }} />
				<AuthForm onSignIn={signIn} onSignUp={signUp} />
			</>
		);
	}

	const stats = calculateStats();

	return (
		<>
			<Toaster position="top-right" toastOptions={{ className: "toast" }} />
			<AppShell
				user={user}
				stats={stats}
				onLogout={handleLogout}
				onReplayToasts={replayToasts}
			>
				<Routes>
					<Route
						path="/"
						element={<Dashboard posts={canViewPosts ? posts : []} />}
					/>
					<Route
						path="/posts"
						element={<PlaceholderPage title="Posts" />}
					/>
					<Route
						path="/settings"
						element={<PlaceholderPage title="Settings" />}
					/>
					<Route path="/create" element={<Navigate to="/posts" replace />} />
					<Route path="/profile" element={<Navigate to="/" replace />} />
					<Route path="*" element={<Navigate to="/" replace />} />
				</Routes>
			</AppShell>
		</>
	);
}

export default App;
