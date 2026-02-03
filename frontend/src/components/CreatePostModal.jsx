import { CreatePostForm } from "./CreatePostForm";
import { ModalShell } from "./ModalShell";
import styles from "./CreatePostModal.module.css";

export function CreatePostModal({
	isOpen,
	onClose,
	onSchedule,
	onUploadMedia,
	platformOptions,
	linkedPlatforms,
}) {
	return (
		<ModalShell
			isOpen={isOpen}
			onClose={onClose}
			styles={styles}
			title="New Post"
			subtitle="Create a draft or schedule it later."
		>
			<CreatePostForm
				onSchedule={onSchedule}
				onUploadMedia={onUploadMedia}
				onSuccess={onClose}
				platformOptions={platformOptions}
				linkedPlatforms={linkedPlatforms}
			/>
		</ModalShell>
	);
}
