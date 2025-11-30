import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../auth/utils.js";
import UserRepository from "../user/repository.js";
import PostRepository from "./repository.js";
import PostParser from "./schemas.js";
import { enrichPost } from "./utils.js";

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

router.post("/schedule", authMiddleware, async (req, res) => {
	const { value: parsedBody, error } = PostParser.postSchema.validate(req.body);

	if (error) {
		return res.status(400).json(error);
	}

	const { content, scheduledTime, visibility, mediaIds } = parsedBody;

	const post = await PostRepository.create(
		req.user.id,
		content,
		scheduledTime,
		visibility,
		mediaIds,
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

		const form = new FormData();
		const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
		form.append("file", blob, req.file.originalname);

		const accessToken = await UserRepository.getMastodonKey(req.user.id);

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
	// Getting the user from DB as JWT payload may not have the current info
	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	const posts =
		user.role === "admin"
			? await PostRepository.getPosts()
			: await PostRepository.getOwnedPosts(user.id);

	// Enrich sent posts with Mastodon data (replies, favorites)
	const enrichedPosts = await Promise.all(
		posts.map((post) =>
			post.status === "sent" && post.mastodon_id ? enrichPost(post) : post,
		),
	);

	return res.status(200).json(enrichedPosts);
});

router.patch("/:id", authMiddleware, async (req, res) => {
	const { id } = req.params;
	const { value: parsedBody, error } = PostParser.postSchema.validate(req.body);

	if (error) {
		return res.status(400).json(error);
	}

	const { content, scheduledTime, visibility, mediaIds, status } = parsedBody;

	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	const post =
		user.role === "admin"
			? await PostRepository.updatePost(
					id,
					content,
					scheduledTime,
					visibility,
					mediaIds,
					status,
				)
			: await PostRepository.updateOwnPost(
					id,
					content,
					scheduledTime,
					visibility,
					mediaIds,
					status,
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
