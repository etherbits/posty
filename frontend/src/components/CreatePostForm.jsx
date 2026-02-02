import { useEffect, useState } from "react";
import { Image, Calendar, Eye, Upload, X } from "lucide-react";
import styles from "./CreatePostForm.module.css";

export function CreatePostForm({
	onSchedule,
	onUploadMedia,
	onSuccess,
	platformOptions = [],
	linkedPlatforms = {},
}) {
	const [content, setContent] = useState("");
	const [visibility, setVisibility] = useState("public");
	const [scheduledTime, setScheduledTime] = useState("");
	const [file, setFile] = useState(null);
	const [mediaIds, setMediaIds] = useState([]);
	const [isUploading, setIsUploading] = useState(false);
	const [platforms, setPlatforms] = useState(() => {
		const linked = platformOptions
			.filter((platform) => linkedPlatforms[platform.id])
			.map((platform) => platform.id);
		return linked.length ? linked : [];
	});

	useEffect(() => {
		const linked = platformOptions
			.filter((platform) => linkedPlatforms[platform.id])
			.map((platform) => platform.id);
		setPlatforms((prev) => {
			const filtered = prev.filter((id) => linked.includes(id));
			const next = filtered.length ? filtered : linked;
			if (next.length === prev.length && next.every((id, i) => id === prev[i])) {
				return prev;
			}
			return next;
		});
	}, [platformOptions, linkedPlatforms]);

	const resetForm = () => {
		setContent("");
		setVisibility("public");
		setScheduledTime("");
		setFile(null);
		setMediaIds([]);
		const linked = platformOptions
			.filter((platform) => linkedPlatforms[platform.id])
			.map((platform) => platform.id);
		setPlatforms(linked.length ? linked : []);
	};

	const togglePlatform = (platformId) => {
		setPlatforms((prev) => {
			const isSelected = prev.includes(platformId);
			if (isSelected && prev.length === 1) return prev;
			return isSelected
				? prev.filter((id) => id !== platformId)
				: [...prev, platformId];
		});
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!content.trim()) return;

		const success = await onSchedule(
			content.trim(),
			visibility,
			scheduledTime || null,
			mediaIds,
			platforms,
		);

		if (success) {
			resetForm();
			if (onSuccess) onSuccess();
		}
	};

	const handleUpload = async () => {
		if (!file) return;

		setIsUploading(true);
		const mediaId = await onUploadMedia(file);
		if (mediaId) {
			setMediaIds((ids) => [...ids, mediaId]);
			setFile(null);
		}
		setIsUploading(false);
	};

	const removeMedia = (index) => {
		setMediaIds((ids) => ids.filter((_, i) => i !== index));
	};

	return (
		<form onSubmit={handleSubmit} className={styles.form}>
			<div className={styles.field}>
				<label className={styles.label}>Post Content</label>
				<textarea
					value={content}
					onChange={(e) => setContent(e.target.value)}
					placeholder="Write your post here..."
					rows={4}
					className={styles.textarea}
				/>
				<span className={styles.helper}>{content.length} characters</span>
			</div>

			<div className={styles.field}>
				<label className={styles.label}>Social Platforms</label>
				<div className={styles.platforms}>
					{platformOptions.map((platform) => {
						const isLinked = linkedPlatforms[platform.id];
						const isSelected = platforms.includes(platform.id);
						return (
								<button
									key={platform.id}
									type="button"
									className={`${styles.platformButton} ${
										isSelected ? styles.platformActive : ""
									} ${!isLinked ? styles.platformDisabled : ""}`}
									aria-pressed={isSelected}
									disabled={!isLinked}
									onClick={() => togglePlatform(platform.id)}
								>
									<span className={styles.platformIcon}>
										{platform.icon ? (
											<img src={platform.icon} alt={platform.label} />
										) : (
											platform.shortLabel
										)}
									</span>
									<span>{platform.label}</span>
								</button>
							);
						})}
					</div>
				{platforms.length === 0 && (
					<p className={styles.platformHint}>
						Connect at least one social account to post.
					</p>
				)}
			</div>

			<div className={styles.row}>
				<div className={styles.field}>
					<label className={styles.label}>
						<Eye size={14} />
						Visibility
					</label>
					<select
						value={visibility}
						onChange={(e) => setVisibility(e.target.value)}
						className={styles.input}
					>
						<option value="public">Public</option>
						<option value="private">Private</option>
					</select>
				</div>

				<div className={styles.field}>
					<label className={styles.label}>
						<Calendar size={14} />
						Schedule (optional)
					</label>
					<input
						type="datetime-local"
						value={scheduledTime}
						onChange={(e) => setScheduledTime(e.target.value)}
						className={styles.input}
					/>
				</div>
			</div>

			<div className={styles.field}>
				<label className={styles.label}>
					<Image size={14} />
					Media
				</label>
				<div className={styles.mediaRow}>
					<input
						type="file"
						id="media-file"
						onChange={(e) => setFile(e.target.files[0])}
						className={styles.fileInput}
						accept="image/*,video/*"
					/>
					<label htmlFor="media-file" className={styles.fileLabel}>
						<Upload size={16} />
						<span>{file ? file.name : "Choose file"}</span>
					</label>
					<button
						type="button"
						onClick={handleUpload}
						disabled={!file || isUploading}
						className={styles.uploadButton}
					>
						{isUploading ? "Uploading..." : "Upload"}
					</button>
				</div>

				{mediaIds.length > 0 && (
					<div className={styles.mediaList}>
						{mediaIds.map((id, index) => (
							<div key={id} className={styles.mediaItem}>
								<span>Media #{index + 1}</span>
								<button
									type="button"
									onClick={() => removeMedia(index)}
									className={styles.mediaRemove}
								>
									<X size={14} />
								</button>
							</div>
						))}
					</div>
				)}
			</div>

			<div className={styles.actions}>
				<button type="button" className={styles.resetButton} onClick={resetForm}>
					Reset
				</button>
				<button
					type="submit"
					className={styles.submitButton}
					disabled={!content.trim() || platforms.length === 0}
				>
					Create Post
				</button>
			</div>
		</form>
	);
}
