import { Router } from "express";
import { authMiddleware } from "../auth/utils.js";
import UserRepository from "./repository.js";
import UserParser from "./schemas.js";

const router = Router();

router.get("/all", authMiddleware, async (req, res) => {
	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	if (user.role !== "admin") {
		return res.status(403).json({ error: "Forbidden" });
	}

	const users = await UserRepository.getAllUsers();
	return res.status(200).json({
		users: users.map((entry) => ({
			id: entry.id,
			username: entry.username,
			role: entry.role,
			postsCount: Number(entry.posts_count || 0),
			hasMastodonConnected: Boolean(entry.has_mastodon_connected),
			hasBlueskyConnected: Boolean(entry.has_bluesky_connected),
		})),
	});
});

router.patch("/:id/role", authMiddleware, async (req, res) => {
	const { value, error } = UserParser.roleSchema.validate(req.body);
	if (error) {
		return res.status(400).json({ error });
	}

	const adminUser = await UserRepository.getByUsername(req.user.username);

	if (!adminUser) {
		return res.status(404).json({ error: "User not found" });
	}

	if (adminUser.role !== "admin") {
		return res.status(403).json({ error: "Forbidden" });
	}

	const targetUser = await UserRepository.getById(req.params.id);
	if (!targetUser) {
		return res.status(404).json({ error: "User not found" });
	}

	const updated = await UserRepository.updateRole(targetUser.id, value.role);
	return res.status(200).json({
		id: updated.id,
		role: updated.role,
	});
});

router.delete("/:id", authMiddleware, async (req, res) => {
	const adminUser = await UserRepository.getByUsername(req.user.username);

	if (!adminUser) {
		return res.status(404).json({ error: "User not found" });
	}

	if (adminUser.role !== "admin") {
		return res.status(403).json({ error: "Forbidden" });
	}

	const targetUser = await UserRepository.getById(req.params.id);
	if (!targetUser) {
		return res.status(404).json({ error: "User not found" });
	}

	if (targetUser.role === "admin") {
		return res.status(403).json({ error: "Cannot delete admin user" });
	}

	await UserRepository.deleteUser(targetUser.id);
	return res.status(200).json({ success: true });
});

router.get("/targets", authMiddleware, async (req, res) => {
	const targets = await UserRepository.ensureTargets(req.user.id);
	return res.status(200).json({
		weeklyTarget: targets.weekly_target,
		monthlyTarget: targets.monthly_target,
	});
});

router.put("/targets", authMiddleware, async (req, res) => {
	const { value, error } = UserParser.targetsSchema.validate(req.body);
	if (error) {
		return res.status(400).json({ error });
	}

	const updated = await UserRepository.upsertTargets(
		req.user.id,
		value.weeklyTarget,
		value.monthlyTarget,
	);

	return res.status(200).json({
		weeklyTarget: updated.weekly_target,
		monthlyTarget: updated.monthly_target,
	});
});

export default router;
