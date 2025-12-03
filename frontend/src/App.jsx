import { useEffect, useRef, useState, useCallback } from "react";
import { Toaster } from "react-hot-toast";
import { useAuth } from "./hooks/useAuth";
import { usePosts } from "./hooks/usePosts";
import {
	Header,
	StatsCard,
	ActivityChart,
	CreatePostForm,
	AuthForm,
	PostsList,
	ConnectMastodon,
} from "./components";
import {
	Send,
	Clock,
	CheckCircle,
	XCircle,
	Heart,
	MessageCircle,
} from "lucide-react";
import "./styles/theme.css";
import "./App.css";

const POLL_INTERVAL_SECONDS = 10;

function App() {
	const {
		isLoading,
		isAuthenticated,
		user,
		signIn,
		signUp,
		logout,
		connectMastodon,
		canViewPosts,
		canSchedulePosts,
	} = useAuth();

	const {
		posts,
		pagination,
		editingPostId,
		editForm,
		setEditForm,
		fetchPosts,
		goToPage,
		nextPage,
		prevPage,
		refreshCurrentPage,
		schedulePost,
		uploadMedia,
		startEdit,
		saveEdit,
		cancelEdit,
		toggleEditStatus,
		deletePost,
		calculateStats,
		clearPosts,
	} = usePosts();

	const didFetchRef = useRef(false);
	const [timerKey, setTimerKey] = useState(0);

	const resetTimer = useCallback(() => {
		setTimerKey((prev) => prev + 1);
	}, []);

	const handleRefresh = useCallback(() => {
		refreshCurrentPage();
		resetTimer();
	}, [refreshCurrentPage, resetTimer]);

	useEffect(() => {
		if (!isAuthenticated || !canViewPosts) {
			didFetchRef.current = false;
			return;
		}

		if (didFetchRef.current) {
			return;
		}

		didFetchRef.current = true;
		fetchPosts(1);

		const pollInterval = setInterval(() => {
			refreshCurrentPage();
			resetTimer();
		}, POLL_INTERVAL_SECONDS * 1000);

		return () => clearInterval(pollInterval);
	}, [
		isAuthenticated,
		canViewPosts,
		fetchPosts,
		refreshCurrentPage,
		resetTimer,
	]);

	const handleLogout = async () => {
		const success = await logout();
		if (success) {
			clearPosts();
		}
	};

	if (isLoading) {
		return (
			<div className="loading-screen">
				<div className="loading-spinner" />
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
	const isAdmin = user?.role === "admin";
	const showCreateForm = canSchedulePosts && !isAdmin;
	const needsMastodon = !user?.hasMastodonConnected && !isAdmin;

	return (
		<div className="app-layout">
			<Toaster position="top-right" toastOptions={{ className: "toast" }} />

			<div className="main-content">
				<Header user={user} onLogout={handleLogout} />

				<main className="dashboard">
					{needsMastodon && <ConnectMastodon onConnect={connectMastodon} />}

					{canViewPosts && (
						<>
							<div className="stats-grid">
								<StatsCard
									icon={Send}
									label="Total Posts"
									value={stats.totalPosts}
									className="total"
								/>
								<StatsCard
									icon={CheckCircle}
									label="Sent"
									value={stats.sentPosts}
									className="sent"
								/>
								<StatsCard
									icon={Clock}
									label="Pending"
									value={stats.pendingPosts}
									className="pending"
								/>
								<StatsCard
									icon={XCircle}
									label="Canceled"
									value={stats.canceledPosts}
									className="canceled"
								/>
								<StatsCard
									icon={MessageCircle}
									label="Total Replies"
									value={stats.totalReplies}
								/>
								<StatsCard
									icon={Heart}
									label="Total Favorites"
									value={stats.totalFavorites}
								/>
							</div>

							<div className="dashboard-grid">
								<div className="dashboard-left">
									<ActivityChart posts={posts} />

									{showCreateForm && (
										<CreatePostForm
											onSchedule={schedulePost}
											onUploadMedia={uploadMedia}
										/>
									)}
								</div>

								<div className="dashboard-right">
									<PostsList
										posts={posts}
										pagination={pagination}
										editingPostId={editingPostId}
										editForm={editForm}
										setEditForm={setEditForm}
										onStartEdit={startEdit}
										onSaveEdit={saveEdit}
										onCancelEdit={cancelEdit}
										onToggleStatus={toggleEditStatus}
										onDelete={deletePost}
										onRefresh={handleRefresh}
										onGoToPage={goToPage}
										onNextPage={nextPage}
										onPrevPage={prevPage}
										isAdmin={isAdmin}
										pollInterval={POLL_INTERVAL_SECONDS}
										timerKey={timerKey}
									/>
								</div>
							</div>
						</>
					)}
				</main>
			</div>
		</div>
	);
}

export default App;
