import { Router } from "express";
import multer from "multer";
import { authMiddleware } from "../auth/utils.js";
import UserRepository from "../user/repository.js";
import PostRepository from "./repository.js";
import PostParser from "./schemas.js";

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

router.post("/send", authMiddleware, async (req, res) => {});

export default router;
