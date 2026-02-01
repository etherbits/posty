import { useState } from "react";
import { Plus } from "lucide-react";
import { CreatePostModal } from "../components/CreatePostModal";
import { PostsList } from "../components/PostsList";
import styles from "./Posts.module.css";

export function Posts({
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
	onSchedule,
	onUploadMedia,
	isAdmin,
	user,
	pollInterval,
}) {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [timerKey, setTimerKey] = useState(0);

	const platformOptions = [
		{ id: "mastodon", label: "Mastodon", shortLabel: "M" },
		{ id: "bluesky", label: "Bluesky", shortLabel: "B" },
	];

	const linkedPlatforms = {
		mastodon: Boolean(user?.hasMastodonConnected),
		bluesky: Boolean(user?.hasBlueskyConnected),
	};

	const handleRefresh = () => {
		onRefresh();
		setTimerKey((prev) => prev + 1);
	};

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h2 className={styles.title}>Posts</h2>
					<p className={styles.subtitle}>
						Manage your drafts, scheduled, and sent posts.
					</p>
				</div>
				<button
					type="button"
					className={styles.newButton}
					onClick={() => setIsModalOpen(true)}
				>
					<Plus size={16} />
					New Post
				</button>
			</div>

			<PostsList
				posts={posts}
				pagination={pagination}
				editingPostId={editingPostId}
				editForm={editForm}
				setEditForm={setEditForm}
				onStartEdit={onStartEdit}
				onSaveEdit={onSaveEdit}
				onCancelEdit={onCancelEdit}
				onToggleStatus={onToggleStatus}
				onDelete={onDelete}
				onRefresh={handleRefresh}
				onGoToPage={onGoToPage}
				onNextPage={onNextPage}
				onPrevPage={onPrevPage}
				isAdmin={isAdmin}
				pollInterval={pollInterval}
				timerKey={timerKey}
				platformOptions={platformOptions}
				linkedPlatforms={linkedPlatforms}
			/>

			<CreatePostModal
				isOpen={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				onSchedule={onSchedule}
				onUploadMedia={onUploadMedia}
				platformOptions={platformOptions}
				linkedPlatforms={linkedPlatforms}
			/>
		</div>
	);
}
