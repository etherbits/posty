import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../auth/utils.js";
import UserRepository from "../user/repository.js";
import PostRepository from "./repository.js";
import PostParser from "./schemas.js";
import { enrichPosts } from "./utils.js";
import SettingsRepository from "../settings/repository.js";
import { blueskyProvider, mastodonProvider } from "../lib/providers/index.js";

const MASTODON_MEDIA_MAX_BYTES = 8 * 1024 * 1024;
const BLUESKY_MEDIA_MAX_BYTES = 1 * 1024 * 1024;
const MAX_MEDIA_BYTES = Math.min(
	MASTODON_MEDIA_MAX_BYTES,
	BLUESKY_MEDIA_MAX_BYTES,
);
const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post("/schedule", authMiddleware, async (req, res) => {
	const { value: parsedBody, error } = PostParser.postSchema.validate(req.body);

	if (error) {
		return res.status(400).json(error);
	}

	const {
		content,
		scheduledTime,
		visibility,
		mediaIds,
		blueskyMedia,
		status,
		platforms,
	} = parsedBody;

	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	if (user.role === "admin") {
		return res.status(403).json({ error: "Admins cannot create posts" });
	}
	const hasSchedule = Boolean(scheduledTime);
	const normalizedSchedule = hasSchedule ? scheduledTime : null;
	const normalizedPlatforms =
		Array.isArray(platforms) && platforms.length ? platforms : ["mastodon"];
	const integrations = await SettingsRepository.ensureIntegrations();
	const platformEnabled = {
		mastodon: integrations.mastodonEnabled,
		bluesky: integrations.blueskyEnabled,
	};
	const disabledPlatforms = normalizedPlatforms.filter(
		(platform) => !platformEnabled[platform],
	);

	if (disabledPlatforms.length > 0) {
		return res.status(400).json({
			error: "Requested platforms are disabled",
			disabledPlatforms,
		});
	}
	const nextStatus = hasSchedule
		? status && status !== "draft"
			? status
			: "pending"
		: "draft";

	const post = await PostRepository.create(
		user.id,
		content,
		normalizedSchedule,
		visibility,
		mediaIds,
		blueskyMedia,
		nextStatus,
		normalizedPlatforms,
	);

	return res.status(201).json({ postId: post.id });
});

// Mastodon requires media to be uploaded first, before attaching to post
router.post(
"/upload-media",
	upload.single("file"),
	authMiddleware,
	async (req, res) => {
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" });
		}

		if (req.file.size > MAX_MEDIA_BYTES) {
			return res.status(413).json({ error: "File exceeds max upload size" });
		}

		const user = await UserRepository.getByUsername(req.user.username);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (user.role === "admin") {
			return res.status(403).json({ error: "Admins cannot upload media" });
		}

		const integrations = await SettingsRepository.ensureIntegrations();
		if (!integrations.mastodonEnabled) {
			return res
				.status(400)
				.json({ error: "Mastodon integration is disabled" });
		}

		const media = await mastodonProvider.uploadMedia({
			userId: user.id,
			fileBuffer: req.file.buffer,
			fileName: req.file.originalname,
			mimeType: req.file.mimetype,
		});

		if (!media) {
			return res.status(500).json({ error: "Failed to upload media" });
		}

		return res.status(201).json(media);
	},
);

router.post(
	"/upload-media/bluesky",
	upload.single("file"),
	authMiddleware,
	async (req, res) => {
		if (!req.file) {
			return res.status(400).json({ message: "No file uploaded" });
		}

		if (req.file.size > MAX_MEDIA_BYTES) {
			return res.status(413).json({ error: "File exceeds max upload size" });
		}

		if (!req.file.mimetype?.startsWith("image/")) {
			return res.status(400).json({ error: "Bluesky supports images only" });
		}

		const user = await UserRepository.getByUsername(req.user.username);

		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}

		if (user.role === "admin") {
			return res.status(403).json({ error: "Admins cannot upload media" });
		}

		const integrations = await SettingsRepository.ensureIntegrations();
		if (!integrations.blueskyEnabled) {
			return res
				.status(400)
				.json({ error: "Bluesky integration is disabled" });
		}

		const blob = await blueskyProvider.uploadMedia({
			userId: user.id,
			fileBuffer: req.file.buffer,
			mimeType: req.file.mimetype,
		});

		if (!blob) {
			return res.status(500).json({ error: "Failed to upload media" });
		}

		return res.status(201).json({ blob });
	},
);

router.get("/analytics", authMiddleware, async (req, res) => {
	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	const posts =
		user.role === "admin"
			? await PostRepository.getPosts()
			: await PostRepository.getOwnedPosts(user.id);
	const enrichedPosts = await enrichPosts(posts);

	return res.status(200).json({ posts: enrichedPosts });
});

router.get("/all", authMiddleware, async (req, res) => {
	// Pagination parameters
	const page = Math.max(1, parseInt(req.query.page) || 1);
	const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
	const offset = (page - 1) * limit;

	// Getting the user from DB as JWT payload may not have the current info
	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	// Get total count, paginated posts, and stats
	const [{ posts, total }, stats] = await Promise.all([
		user.role === "admin"
			? PostRepository.getPostsPaginated(limit, offset)
			: PostRepository.getOwnedPostsPaginated(user.id, limit, offset),
		user.role === "admin"
			? PostRepository.getStats()
			: PostRepository.getStats(user.id),
	]);

	// Batch enrich sent posts with Mastodon data (replies, favorites)
	const enrichedPosts = await enrichPosts(posts);

	return res.status(200).json({
		posts: enrichedPosts,
		pagination: {
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		},
		stats,
	});
});

router.patch("/:id", authMiddleware, async (req, res) => {
	const { id } = req.params;
	const { value: parsedBody, error } = PostParser.postSchema.validate(req.body);

	if (error) {
		return res.status(400).json(error);
	}

	const {
		content,
		scheduledTime,
		visibility,
		mediaIds,
		blueskyMedia,
		status,
		platforms,
	} = parsedBody;
	const hasSchedule = Boolean(scheduledTime);
	const normalizedSchedule = hasSchedule ? scheduledTime : null;
	const normalizedPlatforms =
		Array.isArray(platforms) && platforms.length ? platforms : null;
	const nextStatus = hasSchedule
		? status && status !== "draft"
			? status
			: "pending"
		: "draft";

	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	const post =
		user.role === "admin"
			? await PostRepository.updatePost(
					id,
					content,
					normalizedSchedule,
					visibility,
					mediaIds,
					blueskyMedia,
					normalizedPlatforms,
					nextStatus,
				)
			: await PostRepository.updateOwnPost(
					id,
					content,
					normalizedSchedule,
					visibility,
					mediaIds,
					blueskyMedia,
					normalizedPlatforms,
					nextStatus,
					user.id,
				);

	return res.status(200).json(post);
});

// Does NOT delete the post on mastodon, but could be easily added
router.delete("/:id", authMiddleware, async (req, res) => {
	const { id } = req.params;

	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	const post =
		user.role === "admin"
			? await PostRepository.deletePost(id)
			: await PostRepository.deleteOwnPost(id, user.id);

	return res.status(200).json(post);
});

export default router;
