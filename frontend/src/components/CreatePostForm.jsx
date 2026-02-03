import { useEffect, useState } from "react";
import { Image, Calendar, Eye, Upload, X } from "lucide-react";
import { Dropdown } from "./Dropdown";
import { notifyError } from "../utils/toastHistory";
import styles from "./CreatePostForm.module.css";

const MASTODON_MEDIA_MAX_BYTES = 8 * 1024 * 1024;
const BLUESKY_MEDIA_MAX_BYTES = 1 * 1024 * 1024;
const MAX_MEDIA_BYTES = Math.min(
	MASTODON_MEDIA_MAX_BYTES,
	BLUESKY_MEDIA_MAX_BYTES,
);
const MAX_MEDIA_MB = Math.max(1, Math.floor(MAX_MEDIA_BYTES / (1024 * 1024)));

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
	const [blueskyMedia, setBlueskyMedia] = useState([]);
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

	useEffect(() => {
		if (!platforms.includes("mastodon") && mediaIds.length > 0) {
			setMediaIds([]);
		}
		if (!platforms.includes("bluesky") && blueskyMedia.length > 0) {
			setBlueskyMedia([]);
		}
	}, [platforms, mediaIds.length, blueskyMedia.length]);

	const resetForm = () => {
		setContent("");
		setVisibility("public");
		setScheduledTime("");
		setFile(null);
		setMediaIds([]);
		setBlueskyMedia([]);
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
			blueskyMedia,
			platforms,
		);

		if (success) {
			resetForm();
			if (onSuccess) onSuccess();
		}
	};

	const handleUpload = async () => {
		if (!file) return;
		if (!platforms.length) return;

		if (file.size > MAX_MEDIA_BYTES) {
			notifyError(`File exceeds the max upload size (${MAX_MEDIA_MB}MB)`);
			return;
		}

		const isImage = file.type?.startsWith("image/");
		if (!isImage && platforms.includes("bluesky")) {
			notifyError("Bluesky supports images only");
			return;
		}

		const uploadTargets = platforms.filter((platform) => {
			if (platform === "bluesky" && blueskyMedia.length >= 4) {
				notifyError("Bluesky supports up to 4 images per post");
				return false;
			}
			return true;
		});

		if (!uploadTargets.length) return;

		setIsUploading(true);
		const uploads = await Promise.all(
			uploadTargets.map(async (platform) => ({
				platform,
				result: await onUploadMedia(file, platform),
			})),
		);
		uploads.forEach(({ platform, result }) => {
			if (!result) return;
			if (platform === "mastodon") {
				setMediaIds((ids) => [...ids, result]);
			}
			if (platform === "bluesky") {
				setBlueskyMedia((items) => [...items, { blob: result, alt: "" }]);
			}
		});
		setFile(null);
		setIsUploading(false);
	};

	const removeMedia = (platform, index) => {
		if (platform === "mastodon") {
			setMediaIds((ids) => ids.filter((_, i) => i !== index));
			return;
		}
		if (platform === "bluesky") {
			setBlueskyMedia((items) => items.filter((_, i) => i !== index));
		}
	};

	const mediaItems = [
		...mediaIds.map((id, index) => ({
			key: `mastodon-${id}-${index}`,
			label: `Mastodon media #${index + 1}`,
			platform: "mastodon",
			index,
		})),
		...blueskyMedia.map((item, index) => ({
			key: `bluesky-${index}`,
			label: `Bluesky image #${index + 1}`,
			platform: "bluesky",
			index,
		})),
	];

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
				<Dropdown
					value={visibility}
					onChange={(e) => setVisibility(e.target.value)}
					className={styles.input}
				>
					<option value="public">Public</option>
					<option value="private">Private</option>
				</Dropdown>
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
						disabled={!file || isUploading || platforms.length === 0}
						className={styles.uploadButton}
					>
						{isUploading ? "Uploading..." : "Upload"}
					</button>
				</div>

				{mediaItems.length > 0 && (
					<div className={styles.mediaList}>
						{mediaItems.map((item) => (
							<div key={item.key} className={styles.mediaItem}>
								<span>{item.label}</span>
								<button
									type="button"
									onClick={() => removeMedia(item.platform, item.index)}
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
