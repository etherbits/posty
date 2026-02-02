import { Router } from "express";
import { authMiddleware } from "../auth/utils.js";
import UserRepository from "../user/repository.js";
import SettingsRepository from "./repository.js";
import SettingsParser from "./schemas.js";

const router = Router();

router.get("/integrations", authMiddleware, async (req, res) => {
	const integrations = await SettingsRepository.ensureIntegrations();
	return res.status(200).json(integrations);
});

router.put("/integrations", authMiddleware, async (req, res) => {
	const { value, error } = SettingsParser.integrationsSchema.validate(req.body);
	if (error) {
		return res.status(400).json({ error });
	}

	const user = await UserRepository.getByUsername(req.user.username);
	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	if (user.role !== "admin") {
		return res.status(403).json({ error: "Forbidden" });
	}

	const updated = await SettingsRepository.updateIntegrations(value);
	return res.status(200).json(updated);
});

export default router;
