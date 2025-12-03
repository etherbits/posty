import { useState, useEffect, useRef } from "react";
import {
	RefreshCw,
	FileText,
	Clock,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { PostCard } from "./PostCard";
import "./PostsList.css";

export function PostsList({
	posts,
	pagination,
	editingPostId,
	editForm,
	setEditForm,
	onStartEdit,
	onSaveEdit,
	onCancelEdit,
	onToggleStatus,
	onDelete,
	onRefresh,
	onGoToPage,
	onNextPage,
	onPrevPage,
	isAdmin,
	pollInterval = 10,
	timerKey = 0,
}) {
	const [filter, setFilter] = useState("all");
	const [countdown, setCountdown] = useState(pollInterval);
	const timerKeyRef = useRef(timerKey);
	const prevTimerKeyRef = useRef(timerKey);

	// Keep timerKeyRef in sync with prop
	useEffect(() => {
		timerKeyRef.current = timerKey;
	}, [timerKey]);

	// Countdown timer effect
	useEffect(() => {
		const interval = setInterval(() => {
			setCountdown((prev) => {
				// Reset if timerKey changed (poll happened)
				if (prevTimerKeyRef.current !== timerKeyRef.current) {
					prevTimerKeyRef.current = timerKeyRef.current;
					return pollInterval;
				}
				if (prev <= 1) {
					return pollInterval;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [pollInterval]);

	const handleRefresh = () => {
		onRefresh();
	};

	const filteredPosts = posts.filter((post) => {
		const matchesFilter = filter === "all" || post.status === filter;
		return matchesFilter;
	});

	const filterOptions = [
		{ value: "all", label: "All" },
		{ value: "pending", label: "Pending" },
		{ value: "sent", label: "Sent" },
		{ value: "canceled", label: "Canceled" },
	];

	// Generate page numbers to display
	const getPageNumbers = () => {
		const { page, totalPages } = pagination;
		const pages = [];
		const maxVisible = 5;

		if (totalPages <= maxVisible) {
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			if (page <= 3) {
				for (let i = 1; i <= 4; i++) pages.push(i);
				pages.push("...");
				pages.push(totalPages);
			} else if (page >= totalPages - 2) {
				pages.push(1);
				pages.push("...");
				for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
			} else {
				pages.push(1);
				pages.push("...");
				for (let i = page - 1; i <= page + 1; i++) pages.push(i);
				pages.push("...");
				pages.push(totalPages);
			}
		}

		return pages;
	};

	return (
		<div className="posts-list">
			<div className="posts-header">
				<div className="posts-title-section">
					<h3 className="posts-title">Recent Posts</h3>
					<p className="posts-subtitle">
						{filteredPosts.length} of {posts.length} on this page •{" "}
						{pagination.total} total
					</p>
				</div>

				<div className="posts-actions">
					<div className="refresh-group">
						<button className="btn-refresh" onClick={handleRefresh}>
							<RefreshCw size={16} />
							Refresh
						</button>
						<div className="poll-timer">
							<Clock size={12} />
							<span>{countdown}s</span>
						</div>
					</div>
				</div>
			</div>

			<div className="filter-tabs">
				{filterOptions.map((option) => (
					<button
						key={option.value}
						className={`filter-tab ${filter === option.value ? "active" : ""}`}
						onClick={() => setFilter(option.value)}
					>
						{option.label}
						<span className="tab-count">
							{option.value === "all"
								? posts.length
								: posts.filter((p) => p.status === option.value).length}
						</span>
					</button>
				))}
			</div>

			<div className="posts-container">
				{filteredPosts.length === 0 ? (
					<div className="empty-state">
						<FileText size={48} className="empty-icon" />
						<h4>No posts found</h4>
						<p>
							{posts.length === 0
								? "Schedule a post to get started!"
								: "Try adjusting your filters"}
						</p>
					</div>
				) : (
					<div className="posts-grid">
						{filteredPosts.map((post) => (
							<PostCard
								key={post.id}
								post={post}
								isEditing={editingPostId === post.id}
								editForm={editForm}
								setEditForm={setEditForm}
								onStartEdit={onStartEdit}
								onSaveEdit={onSaveEdit}
								onCancelEdit={onCancelEdit}
								onToggleStatus={onToggleStatus}
								onDelete={onDelete}
								isAdmin={isAdmin}
							/>
						))}
					</div>
				)}
			</div>

			{pagination.totalPages > 1 && (
				<div className="pagination">
					<button
						className="pagination-btn"
						onClick={onPrevPage}
						disabled={pagination.page === 1}
					>
						<ChevronLeft size={16} />
						Prev
					</button>

					<div className="pagination-pages">
						{getPageNumbers().map((pageNum, index) =>
							pageNum === "..." ? (
								<span key={`ellipsis-${index}`} className="pagination-ellipsis">
									...
								</span>
							) : (
								<button
									key={pageNum}
									className={`pagination-page ${pagination.page === pageNum ? "active" : ""}`}
									onClick={() => onGoToPage(pageNum)}
								>
									{pageNum}
								</button>
							),
						)}
					</div>

					<button
						className="pagination-btn"
						onClick={onNextPage}
						disabled={pagination.page === pagination.totalPages}
					>
						Next
						<ChevronRight size={16} />
					</button>
				</div>
			)}

			{pagination.totalPages > 0 && (
				<div className="pagination-info">
					Page {pagination.page} of {pagination.totalPages} • Showing{" "}
					{(pagination.page - 1) * pagination.limit + 1} to{" "}
					{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
					{pagination.total} posts
				</div>
			)}
		</div>
	);
}
