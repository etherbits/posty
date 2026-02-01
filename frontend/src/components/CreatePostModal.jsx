import { X } from "lucide-react";
import { CreatePostForm } from "./CreatePostForm";
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
		<div
			className={`${styles.overlay} ${isOpen ? styles.open : ""}`}
			aria-hidden={!isOpen}
			onClick={onClose}
		>
			<div
				className={`${styles.modal} ${isOpen ? styles.open : ""}`}
				onClick={(event) => event.stopPropagation()}
				role="dialog"
				aria-modal="true"
			>
				<div className={styles.header}>
					<div>
						<h3 className={styles.title}>New Post</h3>
						<p className={styles.subtitle}>Create a draft or schedule it later.</p>
					</div>
					<button
						type="button"
						className={styles.close}
						onClick={onClose}
					>
						<X size={18} />
					</button>
				</div>

				<CreatePostForm
					onSchedule={onSchedule}
					onUploadMedia={onUploadMedia}
					onSuccess={onClose}
					platformOptions={platformOptions}
					linkedPlatforms={linkedPlatforms}
				/>
			</div>
		</div>
	);
}
