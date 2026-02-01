import { useState, useCallback, useRef } from "react";
import { notifyError, notifySuccess } from "../utils/toastHistory";

const API_URL = "http://localhost:3000";
const POSTS_PER_PAGE = 10;

export function usePosts() {
	const [posts, setPosts] = useState([]);
	const [pagination, setPagination] = useState({
		page: 1,
		limit: POSTS_PER_PAGE,
		total: 0,
		totalPages: 0,
	});
	const [stats, setStats] = useState({
		total: 0,
		sent: 0,
		pending: 0,
		canceled: 0,
	});
	const [editingPostId, setEditingPostId] = useState(null);
	const [editForm, setEditForm] = useState({
		content: "",
		visibility: "",
		scheduledTime: "",
		mediaIds: [],
		status: "",
		platforms: ["mastodon"],
	});

	// Lock to prevent duplicate concurrent fetches
	const isFetchingRef = useRef(false);

	const fetchPosts = useCallback(async (page = 1) => {
		// Skip if already fetching
		if (isFetchingRef.current) {
			return;
		}

		isFetchingRef.current = true;

		try {
			const response = await fetch(
				`${API_URL}/post/all?page=${page}&limit=${POSTS_PER_PAGE}`,
				{
					credentials: "include",
				},
			);

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Failed to fetch posts:", errorText);
				throw new Error("Failed to fetch posts");
			}

			const data = await response.json();
			setPosts(data.posts);
			setPagination(data.pagination);
			if (data.stats) {
				setStats(data.stats);
			}
		} catch (error) {
			console.error("Error fetching posts:", error);
			notifyError("Error fetching posts. Make sure you're signed in.");
		} finally {
			isFetchingRef.current = false;
		}
	}, []);

	const goToPage = useCallback(
		(page) => {
			if (page >= 1 && page <= pagination.totalPages) {
				fetchPosts(page);
			}
		},
		[fetchPosts, pagination.totalPages],
	);

	const nextPage = useCallback(() => {
		if (pagination.page < pagination.totalPages) {
			goToPage(pagination.page + 1);
		}
	}, [pagination.page, pagination.totalPages, goToPage]);

	const prevPage = useCallback(() => {
		if (pagination.page > 1) {
			goToPage(pagination.page - 1);
		}
	}, [pagination.page, goToPage]);

	const refreshCurrentPage = useCallback(() => {
		fetchPosts(pagination.page);
	}, [fetchPosts, pagination.page]);

	const schedulePost = async (
		content,
		visibility,
		scheduledTime,
		mediaIds,
		platforms,
	) => {
		try {
			const hasSchedule = Boolean(scheduledTime);
			const isoScheduledTime = hasSchedule
				? new Date(scheduledTime).toISOString()
				: null;
			const status = hasSchedule ? "pending" : "draft";
			const normalizedPlatforms = platforms?.length ? platforms : undefined;

			const response = await fetch(`${API_URL}/post/schedule`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					content,
					visibility,
					scheduledTime: isoScheduledTime,
					mediaIds,
					status,
					platforms: normalizedPlatforms,
				}),
			});

			if (!response.ok) {
				const errorMessage = await response.text();
				throw new Error(`Scheduling post failed: ${errorMessage}`);
			}

			notifySuccess("Post scheduled successfully!");
			// Go to first page to see the new post
			fetchPosts(1);
			return true;
		} catch (error) {
			console.error(error);
			notifyError("Failed to schedule post");
			return false;
		}
	};

	const uploadMedia = async (file) => {
		try {
			const formData = new FormData();
			formData.append("file", file);

			const response = await fetch(`${API_URL}/post/upload-media`, {
				method: "POST",
				credentials: "include",
				body: formData,
			});

			if (!response.ok) throw new Error("Image upload failed");

			const data = await response.json();
			notifySuccess("Media uploaded successfully!");
			return data.id;
		} catch (error) {
			console.error(error);
			notifyError("Failed to upload media");
			return null;
		}
	};

	const startEdit = (post) => {
		setEditingPostId(post.id);

		let localScheduledTime = "";
		if (post.scheduled_time) {
			const date = new Date(post.scheduled_time);
			const year = date.getFullYear();
			const month = String(date.getMonth() + 1).padStart(2, "0");
			const day = String(date.getDate()).padStart(2, "0");
			const hours = String(date.getHours()).padStart(2, "0");
			const minutes = String(date.getMinutes()).padStart(2, "0");
			localScheduledTime = `${year}-${month}-${day}T${hours}:${minutes}`;
		}

		const derivedStatus =
			post.status === "draft" || !post.scheduled_time
				? "draft"
				: post.status || "pending";
		const derivedPlatforms = post.platforms?.length
			? post.platforms
			: ["mastodon"];

		setEditForm({
			content: post.content,
			visibility: post.visibility,
			scheduledTime: localScheduledTime,
			mediaIds: post.media_ids || [],
			status: derivedStatus,
			platforms: derivedPlatforms,
		});
	};

	const saveEdit = async (postId) => {
		try {
			const hasSchedule = Boolean(editForm.scheduledTime);
			const isoScheduledTime = hasSchedule
				? new Date(editForm.scheduledTime).toISOString()
				: null;
			let status = editForm.status;
			if (!hasSchedule) {
				status = "draft";
			} else if (!status || status === "draft") {
				status = "pending";
			}
			const normalizedPlatforms = editForm.platforms?.length
				? editForm.platforms
				: undefined;

			const response = await fetch(`${API_URL}/post/${postId}`, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				credentials: "include",
				body: JSON.stringify({
					content: editForm.content,
					visibility: editForm.visibility,
					scheduledTime: isoScheduledTime,
					mediaIds: editForm.mediaIds,
					status,
					platforms: normalizedPlatforms,
				}),
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Failed to update post:", errorText);
				throw new Error("Failed to update post");
			}

			notifySuccess("Post updated successfully!");
			setEditingPostId(null);
			refreshCurrentPage();
			return true;
		} catch (error) {
			console.error("Error updating post:", error);
			notifyError("Failed to update post");
			return false;
		}
	};

	const cancelEdit = () => {
		setEditingPostId(null);
		setEditForm({
			content: "",
			visibility: "",
			scheduledTime: "",
			mediaIds: [],
			status: "",
			platforms: ["mastodon"],
		});
	};

	const toggleEditStatus = () => {
		setEditForm((prev) => {
			if (prev.status === "draft") {
				return { ...prev, status: "pending" };
			}
			return {
				...prev,
				status: prev.status === "pending" ? "canceled" : "pending",
			};
		});
	};

	const deletePost = async (postId) => {
		if (!confirm("Are you sure you want to delete this post?")) return false;

		try {
			const response = await fetch(`${API_URL}/post/${postId}`, {
				method: "DELETE",
				credentials: "include",
			});

			if (!response.ok) {
				const errorText = await response.text();
				console.error("Failed to delete post:", errorText);
				throw new Error("Failed to delete post");
			}

			notifySuccess("Post deleted successfully!");
			refreshCurrentPage();
			return true;
		} catch (error) {
			console.error("Error deleting post:", error);
			notifyError("Failed to delete post");
			return false;
		}
	};

	const calculateStats = () => {
		// Use stats from API for accurate totals
		// Replies and favorites are only available for posts on the current page
		const totalReplies = posts.reduce(
			(sum, p) => sum + (p.replies_count || 0),
			0,
		);
		const totalFavorites = posts.reduce(
			(sum, p) => sum + (p.favorites_count || 0),
			0,
		);
		const totalReposts = posts.reduce(
			(sum, p) => sum + (p.reposts_count ?? p.reblogs_count ?? 0),
			0,
		);

		return {
			totalPosts: stats.total,
			sentPosts: stats.sent,
			pendingPosts: stats.pending,
			canceledPosts: stats.canceled,
			totalReplies,
			totalFavorites,
			totalReposts,
		};
	};

	const clearPosts = () => {
		setPosts([]);
		setPagination({
			page: 1,
			limit: POSTS_PER_PAGE,
			total: 0,
			totalPages: 0,
		});
		setStats({
			total: 0,
			sent: 0,
			pending: 0,
			canceled: 0,
		});
	};

	return {
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
	};
}
