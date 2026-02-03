import { useState, useEffect, useRef } from "react";
import {
	RefreshCw,
	FileText,
	Clock,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import { PostCard } from "./PostCard";
import { ListCardShell, ListEmptyState } from "./ListCardShell";
import styles from "./PostsList.module.css";

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
	platformOptions = [],
	linkedPlatforms = {},
	canCreate = true,
}) {
	const [filter, setFilter] = useState("all");
	const [countdown, setCountdown] = useState(pollInterval);
	const timerKeyRef = useRef(timerKey);
	const prevTimerKeyRef = useRef(timerKey);

	useEffect(() => {
		timerKeyRef.current = timerKey;
	}, [timerKey]);

	useEffect(() => {
		const interval = setInterval(() => {
			setCountdown((prev) => {
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

	const resolveStatus = (post) => {
		if (post.status === "draft" || !post.scheduled_time) return "draft";
		return post.status || "pending";
	};

	const statusCounts = posts.reduce(
		(acc, post) => {
			const status = resolveStatus(post);
			acc.all += 1;
			acc[status] = (acc[status] || 0) + 1;
			return acc;
		},
		{ all: 0, draft: 0, pending: 0, sent: 0, canceled: 0 },
	);

	const filteredPosts = posts.filter((post) => {
		const status = resolveStatus(post);
		return filter === "all" ? true : status === filter;
	});

	const filterOptions = [
		{ value: "all", label: "All" },
		{ value: "draft", label: "Draft" },
		{ value: "pending", label: "Pending" },
		{ value: "sent", label: "Sent" },
		{ value: "canceled", label: "Canceled" },
	];

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
		<ListCardShell
			styles={styles}
			title="All Posts"
			subtitle={`${filteredPosts.length} of ${posts.length} on this page • ${
				pagination.total
			} total`}
			actions={
				<>
					<div className={styles.timer}>
						<Clock size={12} />
						<span>{countdown}s</span>
					</div>
					<button className={styles.refresh} onClick={handleRefresh}>
						<RefreshCw size={16} />
						Refresh
					</button>
				</>
			}
		>
			<div className={styles.filters}>
				{filterOptions.map((option) => (
					<button
						key={option.value}
						type="button"
						className={`${styles.filter} ${
							filter === option.value ? styles.filterActive : ""
						}`}
						onClick={() => setFilter(option.value)}
					>
						{option.label}
						<span className={styles.filterCount}>
							{statusCounts[option.value] ?? 0}
						</span>
					</button>
				))}
			</div>

			<div className={styles.list}>
				{filteredPosts.length === 0 ? (
					<ListEmptyState
						styles={styles}
						icon={FileText}
						title="No posts found"
						description={
							posts.length === 0
								? canCreate
									? "Create a new post to get started."
									: "Posts will appear here once your team starts publishing."
								: "Try adjusting your filters."
						}
					/>
				) : (
					<div className={styles.grid}>
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
								platformOptions={platformOptions}
								linkedPlatforms={linkedPlatforms}
							/>
						))}
					</div>
				)}
			</div>

			{pagination.totalPages > 1 && (
				<div className={styles.pagination}>
					<button
						className={styles.pageButton}
						onClick={onPrevPage}
						disabled={pagination.page === 1}
					>
						<ChevronLeft size={16} />
						Prev
					</button>
					<div className={styles.pageNumbers}>
						{getPageNumbers().map((pageNum, index) =>
							pageNum === "..." ? (
								<span key={`ellipsis-${index}`} className={styles.ellipsis}>
									...
								</span>
							) : (
								<button
									key={pageNum}
									className={`${styles.pageNumber} ${
										pagination.page === pageNum ? styles.pageNumberActive : ""
									}`}
									onClick={() => onGoToPage(pageNum)}
								>
									{pageNum}
								</button>
							),
						)}
					</div>
					<button
						className={styles.pageButton}
						onClick={onNextPage}
						disabled={pagination.page === pagination.totalPages}
					>
						Next
						<ChevronRight size={16} />
					</button>
				</div>
			)}

			{pagination.totalPages > 0 && (
				<div className={styles.pageInfo}>
					Page {pagination.page} of {pagination.totalPages} • Showing{" "}
					{(pagination.page - 1) * pagination.limit + 1} to{" "}
					{Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
					{pagination.total} posts
				</div>
			)}
		</ListCardShell>
	);
}
