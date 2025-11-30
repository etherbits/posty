import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import "./App.css";

function App() {
	// Loading state
	const [isLoading, setIsLoading] = useState(true);

	// Auth state
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [user, setUser] = useState(null);

	// Sign in state
	const [signInUsername, setSignInUsername] = useState("");
	const [signInPassword, setSignInPassword] = useState("");

	// Sign up state
	const [signUpUsername, setSignUpUsername] = useState("");
	const [signUpPassword, setSignUpPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	// New post state
	const [content, setContent] = useState("");
	const [visibility, setVisibility] = useState("public");
	const [scheduledTime, setScheduledTime] = useState("");
	const [file, setFile] = useState(null);
	const [mediaIds, setMediaIds] = useState([]);

	// Posts list state
	const [posts, setPosts] = useState([]);
	const [editingPostId, setEditingPostId] = useState(null);
	const [editForm, setEditForm] = useState({
		content: "",
		visibility: "",
		scheduledTime: "",
		mediaIds: [],
		status: "",
	});

	// Check auth status and fetch user info on mount
	useEffect(() => {
		(async () => {
			try {
				// Using stored values first, to reduce noticable re-render
				const storedUser = localStorage.getItem("user");
				if (storedUser) {
					const parsedUser = JSON.parse(storedUser);
					if (parsedUser) {
						setUser(parsedUser);
						setIsAuthenticated(true);
					}
				}
				await fetchCurrentUser();
			} finally {
				setIsLoading(false);
			}
		})();
	}, []);

	// Fetch posts when authenticated and allowed, with 10 second polling
	useEffect(() => {
		const canViewPosts =
			user && (user.role === "admin" || user.hasMastodonConnected);
		if (isAuthenticated && canViewPosts) {
			fetchPosts();

			// Set up polling every 10 seconds
			const pollInterval = setInterval(() => {
				fetchPosts();
			}, 10000);

			// Cleanup interval on unmount or when dependencies change
			return () => clearInterval(pollInterval);
		}
	}, [isAuthenticated, user]);

	async function fetchCurrentUser() {
		try {
			const response = await fetch("http://localhost:3000/auth/me", {
				credentials: "include",
			});

			if (response.ok) {
				const data = await response.json();
				setUser(data);
				setIsAuthenticated(true);
				localStorage.setItem("user", JSON.stringify(data));
			} else {
				// Clear stale data if not authenticated
				setUser(null);
				setIsAuthenticated(false);
				localStorage.removeItem("user");
			}
		} catch (error) {
			console.error("Error fetching user:", error);
		}
	}

	function canViewPosts() {
		if (!user) return false;
		// Admins can view posts even without Mastodon connected
		if (user.role === "admin") return true;
		// Regular users need Mastodon connected
		return user.hasMastodonConnected;
	}

	function canSchedulePosts() {
		if (!user) return false;
		// All users need Mastodon connected to schedule posts
		return user.hasMastodonConnected;
	}

	async function signIn() {
		try {
			const response = await fetch("http://localhost:3000/auth/sign-in", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					username: signInUsername,
					password: signInPassword,
				}),
			});

			if (!response.ok) {
				throw new Error("Sign-in failed");
			}

			const data = await response.json();
			localStorage.setItem("user", JSON.stringify(data.user));
			setUser(data.user);
			setIsAuthenticated(true);
			toast.success("Signed in successfully!");
		} catch (error) {
			console.error(error);
			toast.error("Sign-in failed");
		}
	}

	async function signUp() {
		try {
			const response = await fetch("http://localhost:3000/auth/sign-up", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					username: signUpUsername,
					password: signUpPassword,
					confirmPassword,
				}),
			});

			if (!response.ok) {
				throw new Error("Sign-up failed");
			}

			const data = await response.json();
			localStorage.setItem("user", JSON.stringify(data.user));
			setUser(data.user);
			setIsAuthenticated(true);
			toast.success("Account created successfully!");
		} catch (error) {
			console.error(error);
			toast.error("Sign-up failed");
		}
	}

	function connectMastodon() {
		window.location.href = "http://localhost:3000/auth/oauth/mastodon";
	}

	async function logout() {
		try {
			await fetch("http://localhost:3000/auth/logout", {
				method: "POST",
				credentials: "include",
			});

			localStorage.removeItem("user");
			setUser(null);
			setIsAuthenticated(false);
			setPosts([]);
			toast.success("Logged out successfully!");
		} catch (error) {
			console.error("Error logging out:", error);
			toast.error("Failed to logout");
		}
	}

	async function schedulePost() {
		try {
			const isoScheduledTime = new Date(scheduledTime).toISOString();

			const response = await fetch("http://localhost:3000/post/schedule", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					content,
					visibility,
					scheduledTime: isoScheduledTime,
					mediaIds,
				}),
			});

			if (!response.ok) {
				const errorMessage = await response.text();
				throw new Error(`Scheduling post failed: ${errorMessage}`);
			}

			const data = await response.json();
			console.log("Post scheduled:", data);
			toast.success("Post scheduled successfully!");

			// Clear form and refresh posts
			setContent("");
			setScheduledTime("");
			setMediaIds([]);
			fetchPosts();
		} catch (error) {
			console.error(error);
			toast.error("Failed to schedule post");
		}
	}

	async function addMedia() {
		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch("http://localhost:3000/post/upload-media", {
				method: "POST",
				credentials: "include",
				body: formData,
			});

			if (!response.ok) {
				throw new Error("Image upload failed");
			}

			const data = await response.json();
			setMediaIds((ids) => [...ids, data.id]);
			toast.success("Media uploaded successfully!");
		} catch (error) {
			console.error(error);
			toast.error("Failed to upload media");
		}
	}

	// READ: Fetch all posts
	async function fetchPosts() {
		try {
			const response = await fetch("http://localhost:3000/post/all", {
				credentials: "include",
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Failed to fetch posts:", errorText);
				throw new Error("Failed to fetch posts");
			}

			const data = await response.json();
			const sortedData = data.sort((a, b) => {
				const dateA = new Date(a.scheduled_time);
				const dateB = new Date(b.scheduled_time);
				return dateB - dateA;
			});
			setPosts(sortedData);
		} catch (error) {
			console.error("Error fetching posts:", error);
			toast.error("Error fetching posts. Make sure you're signed in.");
		}
	}

	// UPDATE: Start editing a post
	function startEdit(post) {
		setEditingPostId(post.id);

		// Convert UTC time to local time for datetime-local input
		let localScheduledTime = "";
		if (post.scheduled_time) {
			const date = new Date(post.scheduled_time);
			// Format as YYYY-MM-DDTHH:MM in local time
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			const hours = String(date.getHours()).padStart(2, "0");
			const minutes = String(date.getMinutes()).padStart(2, "0");
			localScheduledTime = `${year}-${month}-${day}T${hours}:${minutes}`;
		}

		setEditForm({
			content: post.content,
			visibility: post.visibility,
			scheduledTime: localScheduledTime,
			mediaIds: post.media_ids || [],
			status: post.status,
		});
	}

	// UPDATE: Save edited post
	async function saveEdit(postId) {
		try {
			const isoScheduledTime = new Date(editForm.scheduledTime).toISOString();

			const response = await fetch(`http://localhost:3000/post/${postId}`, {
				method: "PATCH",
				headers: {
					"Content-Type": "application/json",
				},
				credentials: "include",
				body: JSON.stringify({
					content: editForm.content,
					visibility: editForm.visibility,
					scheduledTime: isoScheduledTime,
					mediaIds: editForm.mediaIds,
					status: editForm.status,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Failed to update post:", errorText);
				throw new Error("Failed to update post");
			}

			toast.success("Post updated successfully!");
			setEditingPostId(null);
			fetchPosts(); // Refresh the list
		} catch (error) {
			console.error("Error updating post:", error);
			toast.error("Failed to update post");
		}
	}

	// UPDATE: Cancel editing
	function cancelEdit() {
		setEditingPostId(null);
		setEditForm({
			content: "",
			visibility: "",
			scheduledTime: "",
			mediaIds: [],
			status: "",
		});
	}

	// Toggle status locally in edit form (no request until save)
	function toggleEditStatus() {
		setEditForm((prev) => ({
			...prev,
			status: prev.status === "pending" ? "canceled" : "pending",
		}));
	}

	// DELETE: Delete a post
	async function deletePost(postId) {
		if (!confirm("Are you sure you want to delete this post?")) {
			return;
		}

		try {
			const response = await fetch(`http://localhost:3000/post/${postId}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Failed to delete post:", errorText);
				throw new Error("Failed to delete post");
			}

			toast.success("Post deleted successfully!");
			fetchPosts(); // Refresh the list
		} catch (error) {
			console.error("Error deleting post:", error);
			toast.error("Failed to delete post");
		}
	}

	// Calculate statistics
	function calculateStats() {
		const totalPosts = posts.length;
		const sentPosts = posts.filter((p) => p.status === "sent").length;
		const pendingPosts = posts.filter((p) => p.status === "pending").length;
		const canceledPosts = posts.filter((p) => p.status === "canceled").length;
		const totalReplies = posts.reduce(
			(sum, p) => sum + (p.replies_count || 0),
			0,
		);
		const totalFavorites = posts.reduce(
			(sum, p) => sum + (p.favorites_count || 0),
			0,
		);

		return {
			totalPosts,
			sentPosts,
			pendingPosts,
			canceledPosts,
			totalReplies,
			totalFavorites,
		};
	}

	const stats = calculateStats();

	if (isLoading) {
		return (
			<div
				style={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					height: "100vh",
					fontSize: "18px",
					color: "#666",
				}}
			>
				Loading...
			</div>
		);
	}

	return (
		<div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
			<Toaster position="top-right" />
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					marginBottom: "20px",
				}}
			>
				<h1 style={{ margin: 0 }}>Posty - Post Scheduler Demo</h1>
				{isAuthenticated && user && (
					<div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
						<span style={{ color: "#666" }}>
							👤 {user.username}
							{user.role === "admin" && (
								<span
									style={{
										marginLeft: "5px",
										backgroundColor: "#dc3545",
										color: "white",
										padding: "2px 6px",
										borderRadius: "4px",
										fontSize: "12px",
									}}
								>
									Admin
								</span>
							)}
						</span>
						<button
							onClick={logout}
							style={{
								padding: "8px 16px",
								borderRadius: "4px",
								border: "none",
								backgroundColor: "#dc3545",
								color: "white",
								cursor: "pointer",
								fontWeight: "500",
							}}
						>
							Logout
						</button>
					</div>
				)}
			</div>

			{/* SIGN IN SECTION */}
			{!user && (
				<>
					<section
						style={{
							marginBottom: "20px",
							padding: "20px",
							border: "1px solid #ddd",
							borderRadius: "8px",
							backgroundColor: "#f8f9fa",
						}}
					>
						<h2 style={{ marginTop: "0" }}>Sign In</h2>
						<div
							style={{ display: "flex", flexDirection: "column", gap: "10px" }}
						>
							<input
								type="text"
								placeholder="Username"
								value={signInUsername}
								onChange={(e) => setSignInUsername(e.target.value)}
								style={{
									padding: "8px 12px",
									borderRadius: "4px",
									border: "1px solid #ccc",
								}}
							/>
							<input
								type="password"
								placeholder="Password"
								value={signInPassword}
								onChange={(e) => setSignInPassword(e.target.value)}
								style={{
									padding: "8px 12px",
									borderRadius: "4px",
									border: "1px solid #ccc",
								}}
							/>
							<button
								onClick={signIn}
								style={{
									padding: "10px 16px",
									borderRadius: "4px",
									border: "none",
									backgroundColor: "#007bff",
									color: "white",
									cursor: "pointer",
									fontWeight: "500",
								}}
							>
								Sign In
							</button>
						</div>
					</section>

					<section
						style={{
							marginBottom: "20px",
							padding: "20px",
							border: "1px solid #ddd",
							borderRadius: "8px",
							backgroundColor: "#f8f9fa",
						}}
					>
						<h2 style={{ marginTop: "0" }}>Sign Up</h2>
						<div
							style={{ display: "flex", flexDirection: "column", gap: "10px" }}
						>
							<input
								type="text"
								placeholder="Username"
								value={signUpUsername}
								onChange={(e) => setSignUpUsername(e.target.value)}
								style={{
									padding: "8px 12px",
									borderRadius: "4px",
									border: "1px solid #ccc",
								}}
							/>
							<input
								type="password"
								placeholder="Password"
								value={signUpPassword}
								onChange={(e) => setSignUpPassword(e.target.value)}
								style={{
									padding: "8px 12px",
									borderRadius: "4px",
									border: "1px solid #ccc",
								}}
							/>
							<input
								type="password"
								placeholder="Confirm Password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								style={{
									padding: "8px 12px",
									borderRadius: "4px",
									border: "1px solid #ccc",
								}}
							/>
							<button
								onClick={signUp}
								style={{
									padding: "10px 16px",
									borderRadius: "4px",
									border: "none",
									backgroundColor: "#28a745",
									color: "white",
									cursor: "pointer",
									fontWeight: "500",
								}}
							>
								Sign Up
							</button>
						</div>
					</section>
				</>
			)}

			{/* MASTODON CONNECTION SECTION - hidden for admins */}
			{isAuthenticated &&
				user &&
				!user.hasMastodonConnected &&
				user.role !== "admin" && (
					<section
						style={{
							marginBottom: "30px",
							padding: "20px",
							border: "1px solid #ddd",
							borderRadius: "8px",
							backgroundColor: "#f8f9fa",
						}}
					>
						<h2 style={{ marginTop: "0" }}>Mastodon</h2>
						<button
							onClick={connectMastodon}
							style={{
								padding: "10px 16px",
								borderRadius: "4px",
								border: "none",
								backgroundColor: "#6364FF",
								color: "white",
								cursor: "pointer",
								fontWeight: "500",
							}}
						>
							🐘 Connect to Mastodon
						</button>
					</section>
				)}

			{/* Show info message when authenticated but Mastodon not connected - hidden for admins */}
			{isAuthenticated &&
				user &&
				!user.hasMastodonConnected &&
				user.role !== "admin" && (
					<section
						style={{
							marginBottom: "20px",
							padding: "20px",
							border: "1px solid #ffc107",
							borderRadius: "8px",
							backgroundColor: "#fff8e1",
						}}
					>
						<p style={{ margin: 0, color: "#856404" }}>
							📢 Connect your Mastodon account above to schedule and manage
							posts.
							{user?.role === "admin" &&
								" As an admin, you can still view all posts below."}
						</p>
					</section>
				)}

			{/* Only show CREATE POST if authenticated, Mastodon connected, and not admin */}
			{isAuthenticated && canSchedulePosts() && user?.role !== "admin" && (
				<>
					{/* CREATE POST SECTION */}
					<section
						style={{
							marginBottom: "30px",
							padding: "20px",
							border: "1px solid #ddd",
							borderRadius: "8px",
							backgroundColor: "#f8fff8",
						}}
					>
						<h2 style={{ marginTop: "0", color: "#28a745" }}>
							Schedule New Post
						</h2>
						<div
							style={{ display: "flex", flexDirection: "column", gap: "10px" }}
						>
							<textarea
								placeholder="Post content"
								value={content}
								onChange={(e) => setContent(e.target.value)}
								rows={4}
								style={{
									width: "100%",
									padding: "8px",
									borderRadius: "4px",
									border: "1px solid #ccc",
								}}
							/>
							<div>
								<label>Visibility: </label>
								<select
									value={visibility}
									onChange={(e) => setVisibility(e.target.value)}
									style={{
										padding: "6px",
										borderRadius: "4px",
										border: "1px solid #ccc",
									}}
								>
									<option value="public">Public</option>
									<option value="private">Private</option>
								</select>
							</div>
							<div>
								<label>Scheduled Time: </label>
								<input
									type="datetime-local"
									value={scheduledTime}
									onChange={(e) => setScheduledTime(e.target.value)}
									style={{
										padding: "6px",
										borderRadius: "4px",
										border: "1px solid #ccc",
									}}
								/>
							</div>
							<div>
								<input
									type="file"
									onChange={(e) => setFile(e.target.files[0])}
								/>
								<button
									onClick={addMedia}
									disabled={!file}
									style={{
										padding: "6px 12px",
										borderRadius: "4px",
										border: "1px solid #6c757d",
										backgroundColor: file ? "white" : "#e0e0e0",
										color: file ? "#6c757d" : "#999",
										cursor: file ? "pointer" : "not-allowed",
										marginLeft: "10px",
									}}
								>
									Upload Media
								</button>
								{mediaIds.length > 0 && (
									<span style={{ marginLeft: "10px" }}>
										({mediaIds.length} media file(s) attached)
									</span>
								)}
							</div>
							<button
								onClick={schedulePost}
								style={{
									padding: "10px 20px",
									borderRadius: "4px",
									border: "none",
									backgroundColor: "#28a745",
									color: "white",
									cursor: "pointer",
									fontWeight: "500",
								}}
							>
								Schedule Post
							</button>
						</div>
					</section>
				</>
			)}

			{/* POSTS LIST SECTION - show if user can view posts */}
			{isAuthenticated && canViewPosts() && (
				<>
					{/* POSTS LIST SECTION (READ/UPDATE/DELETE) */}
					<section
						style={{
							padding: "20px",
							border: "1px solid #ddd",
							borderRadius: "8px",
							backgroundColor: "#f8f8ff",
						}}
					>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								marginBottom: "15px",
							}}
						>
							<h2 style={{ margin: "0", color: "#17a2b8" }}>Posts List</h2>
							<button
								onClick={fetchPosts}
								style={{
									padding: "8px 16px",
									borderRadius: "4px",
									border: "1px solid #17a2b8",
									backgroundColor: "white",
									color: "#17a2b8",
									cursor: "pointer",
									fontWeight: "500",
								}}
							>
								Refresh
							</button>
						</div>

						{/* STATISTICS SUMMARY */}
						{posts.length > 0 && (
							<div
								style={{
									marginBottom: "20px",
									padding: "15px",
									backgroundColor: "#f9f9f9",
									borderRadius: "5px",
									display: "grid",
									gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
									gap: "10px",
								}}
							>
								<div>
									<div style={{ fontWeight: "bold", fontSize: "24px" }}>
										{stats.totalPosts}
									</div>
									<div style={{ fontSize: "14px", color: "#666" }}>
										Total Posts
									</div>
								</div>
								<div>
									<div style={{ fontWeight: "bold", fontSize: "24px" }}>
										{stats.sentPosts}
									</div>
									<div style={{ fontSize: "14px", color: "#666" }}>Sent</div>
								</div>
								<div>
									<div style={{ fontWeight: "bold", fontSize: "24px" }}>
										{stats.pendingPosts}
									</div>
									<div style={{ fontSize: "14px", color: "#666" }}>Pending</div>
								</div>
								<div>
									<div style={{ fontWeight: "bold", fontSize: "24px" }}>
										{stats.canceledPosts}
									</div>
									<div style={{ fontSize: "14px", color: "#666" }}>
										Canceled
									</div>
								</div>
								<div>
									<div style={{ fontWeight: "bold", fontSize: "24px" }}>
										{stats.totalReplies}
									</div>
									<div style={{ fontSize: "14px", color: "#666" }}>
										Total Replies
									</div>
								</div>
								<div>
									<div style={{ fontWeight: "bold", fontSize: "24px" }}>
										{stats.totalFavorites}
									</div>
									<div style={{ fontSize: "14px", color: "#666" }}>
										Total Favorites
									</div>
								</div>
							</div>
						)}

						{posts.length === 0 ? (
							<p>No posts found. Schedule a post to get started!</p>
						) : (
							<div
								style={{
									display: "flex",
									flexDirection: "column",
									gap: "15px",
								}}
							>
								{posts.map((post) => (
									<div
										key={post.id}
										style={{
											padding: "15px",
											border: "1px solid #ddd",
											borderRadius: "5px",
											backgroundColor:
												post.status === "sent"
													? "#f0f0f0"
													: post.status === "canceled"
														? "#fff3f3"
														: "#fff",
										}}
									>
										{editingPostId === post.id ? (
											// EDIT MODE
											<div
												style={{
													display: "flex",
													flexDirection: "column",
													gap: "10px",
												}}
											>
												<textarea
													value={editForm.content}
													onChange={(e) =>
														setEditForm({
															...editForm,
															content: e.target.value,
														})
													}
													rows={3}
													style={{
														width: "100%",
														padding: "8px",
														borderRadius: "4px",
														border: "1px solid #ccc",
													}}
												/>
												<div>
													<label>Visibility: </label>
													<select
														value={editForm.visibility}
														onChange={(e) =>
															setEditForm({
																...editForm,
																visibility: e.target.value,
															})
														}
														style={{
															padding: "6px",
															borderRadius: "4px",
															border: "1px solid #ccc",
														}}
													>
														<option value="public">Public</option>
														<option value="private">Private</option>
													</select>
												</div>
												<div>
													<label>Scheduled Time: </label>
													<input
														type="datetime-local"
														value={editForm.scheduledTime}
														onChange={(e) =>
															setEditForm({
																...editForm,
																scheduledTime: e.target.value,
															})
														}
														style={{
															padding: "6px",
															borderRadius: "4px",
															border: "1px solid #ccc",
														}}
													/>
												</div>
												<div>
													<label>Status: </label>
													<button
														onClick={toggleEditStatus}
														style={{
															padding: "6px 12px",
															borderRadius: "4px",
															border: "none",
															backgroundColor:
																editForm.status === "pending"
																	? "#28a745"
																	: "#6c757d",
															color: "white",
															cursor: "pointer",
														}}
													>
														{editForm.status === "pending"
															? "Pending"
															: "Canceled"}
													</button>
												</div>
												<div style={{ display: "flex", gap: "10px" }}>
													<button
														onClick={() => saveEdit(post.id)}
														style={{
															padding: "6px 12px",
															borderRadius: "4px",
															border: "none",
															backgroundColor: "#28a745",
															color: "white",
															cursor: "pointer",
														}}
													>
														Save
													</button>
													<button
														onClick={cancelEdit}
														style={{
															padding: "6px 12px",
															borderRadius: "4px",
															border: "1px solid #6c757d",
															backgroundColor: "white",
															color: "#6c757d",
															cursor: "pointer",
														}}
													>
														Cancel
													</button>
												</div>
											</div>
										) : (
											// VIEW MODE
											<div>
												{user?.role === "admin" && post.username && (
													<div
														style={{
															marginBottom: "10px",
															padding: "4px 8px",
															backgroundColor: "#e9ecef",
															borderRadius: "4px",
															display: "inline-block",
														}}
													>
														<strong>👤 {post.username}</strong>
													</div>
												)}
												<div style={{ marginBottom: "10px" }}>
													<strong>Content:</strong> {post.content}
												</div>
												<div style={{ fontSize: "14px", color: "#666" }}>
													<div>
														<strong>Status:</strong> {post.status}
													</div>
													<div>
														<strong>Visibility:</strong> {post.visibility}
													</div>
													<div>
														<strong>Scheduled:</strong>{" "}
														{new Date(post.scheduled_time).toLocaleString()}
													</div>
													{post.replies_count !== undefined && (
														<div>
															<strong>Replies:</strong> {post.replies_count}
														</div>
													)}
													{post.favorites_count !== undefined && (
														<div>
															<strong>Favorites:</strong> {post.favorites_count}
														</div>
													)}
													{post.url && (
														<div>
															<strong>URL:</strong>{" "}
															<a
																href={post.url}
																target="_blank"
																rel="noopener noreferrer"
															>
																{post.url}
															</a>
														</div>
													)}
													{post.media_ids && post.media_ids.length > 0 && (
														<div>
															<strong>Media IDs:</strong>{" "}
															{post.media_ids.join(", ")}
														</div>
													)}
												</div>
												<div
													style={{
														marginTop: "10px",
														display: "flex",
														gap: "10px",
														flexWrap: "wrap",
													}}
												>
													<button
														onClick={() => startEdit(post)}
														disabled={post.status === "sent"}
														style={{
															padding: "6px 12px",
															borderRadius: "4px",
															border: "1px solid #ffc107",
															backgroundColor:
																post.status === "sent" ? "#e0e0e0" : "white",
															color:
																post.status === "sent" ? "#999" : "#ffc107",
															cursor:
																post.status === "sent"
																	? "not-allowed"
																	: "pointer",
														}}
													>
														Edit
													</button>
													<button
														onClick={() => deletePost(post.id)}
														style={{
															padding: "6px 12px",
															borderRadius: "4px",
															border: "none",
															backgroundColor: "#dc3545",
															color: "white",
															cursor: "pointer",
														}}
													>
														Delete
													</button>
												</div>
												{post.status === "sent" && (
													<div
														style={{
															marginTop: "5px",
															fontSize: "12px",
															color: "#999",
														}}
													>
														(Sent posts cannot be edited)
													</div>
												)}
											</div>
										)}
									</div>
								))}
							</div>
						)}
					</section>
				</>
			)}
		</div>
	);
}

export default App;
