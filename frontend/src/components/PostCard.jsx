import {
	Calendar,
	Eye,
	Heart,
	MessageCircle,
	Edit2,
	Trash2,
	X,
	Check,
	Link,
	Repeat,
} from "lucide-react";
import styles from "./PostCard.module.css";

const statusLabels = {
	draft: "Draft",
	pending: "Pending",
	sent: "Sent",
	canceled: "Canceled",
};

export function PostCard({
	post,
	isEditing,
	editForm,
	setEditForm,
	onStartEdit,
	onSaveEdit,
	onCancelEdit,
	onToggleStatus,
	onDelete,
	isAdmin,
	platformOptions = [],
	linkedPlatforms = {},
}) {
	const resolvedStatus =
		post.status === "draft" || !post.scheduled_time
			? "draft"
			: post.status || "pending";
	const scheduledLabel = post.scheduled_time
		? new Date(post.scheduled_time).toLocaleString()
		: "Not scheduled";

	const platforms = post.platforms?.length ? post.platforms : ["mastodon"];

	if (isEditing) {
		const showStatusToggle = Boolean(editForm.scheduledTime);
		const handleScheduleChange = (event) => {
			const value = event.target.value;
			setEditForm((prev) => ({
				...prev,
				scheduledTime: value,
				status: value ? (prev.status === "draft" ? "pending" : prev.status) : "draft",
			}));
		};

		const togglePlatform = (platformId) => {
			setEditForm((prev) => {
				const current = prev.platforms || [];
				const isSelected = current.includes(platformId);
				if (isSelected && current.length === 1) return prev;
				return {
					...prev,
					platforms: isSelected
						? current.filter((id) => id !== platformId)
						: [...current, platformId],
				};
			});
		};

		return (
			<div className={`${styles.card} ${styles.editing}`}>
				<div className={styles.editForm}>
					<textarea
						value={editForm.content}
						onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
						placeholder="Post content..."
						rows={3}
						className={styles.editTextarea}
					/>

					<div className={styles.editRow}>
						<label className={styles.editLabel}>
							<Eye size={14} />
							Visibility
						</label>
						<select
							value={editForm.visibility}
							onChange={(e) =>
								setEditForm({ ...editForm, visibility: e.target.value })
							}
							className={styles.editInput}
						>
							<option value="public">Public</option>
							<option value="private">Private</option>
						</select>
					</div>

					<div className={styles.editRow}>
						<label className={styles.editLabel}>
							<Calendar size={14} />
							Schedule
						</label>
						<input
							type="datetime-local"
							value={editForm.scheduledTime}
							onChange={handleScheduleChange}
							className={styles.editInput}
						/>
					</div>

					{platformOptions.length > 0 && (
						<div className={styles.editRow}>
							<label className={styles.editLabel}>Platforms</label>
							<div className={styles.platforms}>
								{platformOptions.map((platform) => {
									const isLinked = linkedPlatforms[platform.id];
									const selected = editForm.platforms?.includes(platform.id);
									return (
										<button
											key={platform.id}
											type="button"
											disabled={!isLinked}
											aria-pressed={selected}
											className={`${styles.platformButton} ${
												selected ? styles.platformActive : ""
											} ${!isLinked ? styles.platformDisabled : ""}`}
											onClick={() => togglePlatform(platform.id)}
										>
											<span className={styles.platformIcon}>
												{platform.icon ? (
													<img src={platform.icon} alt={platform.label} />
												) : (
													platform.shortLabel
												)}
											</span>
											{platform.label}
										</button>
									);
								})}
							</div>
						</div>
					)}

					{showStatusToggle && (
						<div className={styles.editRow}>
							<label className={styles.editLabel}>Status</label>
							<button
								type="button"
								onClick={onToggleStatus}
								className={`${styles.statusToggle} ${styles[editForm.status]}`}
							>
								{editForm.status === "canceled" ? "Canceled" : "Pending"}
							</button>
						</div>
					)}

					<div className={styles.editActions}>
						<button className={styles.primaryAction} onClick={() => onSaveEdit(post.id)}>
							<Check size={14} />
							Save
						</button>
						<button className={styles.secondaryAction} onClick={onCancelEdit}>
							<X size={14} />
							Cancel
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className={`${styles.card} ${styles[resolvedStatus]}`}>
			<div className={styles.header}>
				{isAdmin && post.username && (
					<span className={styles.author}>@{post.username}</span>
				)}
				<span className={`${styles.status} ${styles[resolvedStatus]}`}>
					{statusLabels[resolvedStatus]}
				</span>
			</div>

			<p className={styles.content}>{post.content}</p>

			<div className={styles.meta}>
				<div className={styles.metaItem}>
					<Calendar size={14} />
					<span>{scheduledLabel}</span>
				</div>
				<div className={styles.metaItem}>
					<Eye size={14} />
					<span>{post.visibility}</span>
				</div>
			</div>

			{platformOptions.some((platform) => platforms.includes(platform.id)) && (
				<div className={styles.platforms}>
					{platformOptions
						.filter((platform) => platforms.includes(platform.id))
						.map((platform) => (
						<button
							key={platform.id}
							type="button"
							disabled={!linkedPlatforms[platform.id]}
							className={`${styles.platformButton} ${styles.platformActive} ${
								!linkedPlatforms[platform.id] ? styles.platformDisabled : ""
							}`}
						>
							<span className={styles.platformIcon}>
								{platform.icon ? (
									<img src={platform.icon} alt={platform.label} />
								) : (
									platform.shortLabel
								)}
							</span>
							{platform.label}
						</button>
					))}
				</div>
			)}

			<div className={styles.stats}>
				<div className={styles.statItem}>
					<MessageCircle size={14} />
					<span>{post.replies_count || 0}</span>
				</div>
				<div className={styles.statItem}>
					<Heart size={14} />
					<span>{post.favorites_count || 0}</span>
				</div>
				<div className={styles.statItem}>
					<Repeat size={14} />
					<span>{post.reposts_count ?? post.reblogs_count ?? 0}</span>
				</div>
			</div>

			{post.url && (
				<a href={post.url} target="_blank" rel="noopener noreferrer" className={styles.link}>
					<Link size={14} />
					<span>View on Mastodon</span>
				</a>
			)}

			<div className={styles.actions}>
				<button
					type="button"
					className={styles.iconButton}
					onClick={() => onStartEdit(post)}
					disabled={post.status === "sent"}
					title={post.status === "sent" ? "Sent posts cannot be edited" : "Edit post"}
				>
					<Edit2 size={16} />
				</button>
				<button
					type="button"
					className={styles.iconButton}
					onClick={() => onDelete(post.id)}
					title="Delete post"
				>
					<Trash2 size={16} />
				</button>
			</div>
		</div>
	);
}
