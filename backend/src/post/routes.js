import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../auth/utils.js";
import UserRepository from "../user/repository.js";
import PostRepository from "./repository.js";
import PostParser from "./schemas.js";
import { enrichPosts } from "./utils.js";
import SettingsRepository from "../settings/repository.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post("/schedule", authMiddleware, async (req, res) => {
	const { value: parsedBody, error } = PostParser.postSchema.validate(req.body);

	if (error) {
		return res.status(400).json(error);
	}

	const { content, scheduledTime, visibility, mediaIds, status, platforms } =
		parsedBody;

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

		const form = new FormData();
		const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
		form.append("file", blob, req.file.originalname);

		const accessToken = await UserRepository.getMastodonKey(user.id);

		if (!accessToken) {
			return res.status(400).json({ error: "Mastodon account not connected" });
		}

		const mediaResponse = await fetch(
			`${process.env.MASTODON_BASE_URL}/api/v2/media`,
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
				body: form,
			},
		);

		if (!mediaResponse.ok) {
			const error = await mediaResponse.text();
			console.error("Mastodon media upload error:", error);
			return res.status(500).json({ error: "Failed to upload media" });
		}

		const media = await mediaResponse.json();

		return res.status(201).json(media);
	},
);

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

	const { content, scheduledTime, visibility, mediaIds, status, platforms } =
		parsedBody;
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
					normalizedPlatforms,
					nextStatus,
				)
			: await PostRepository.updateOwnPost(
					id,
					content,
					normalizedSchedule,
					visibility,
					mediaIds,
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
