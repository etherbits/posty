import { Router } from "express";
import argon2 from "argon2";
import mastodon from "../lib/auth/oauth/mastodon.js";
import AuthParser from "./schemas.js";
import { authMiddleware, signJwt } from "./utils.js";
import UserRepository from "../user/repository.js";
import { extractProfileData } from "../user/utils.js";
import SettingsRepository from "../settings/repository.js";
import { blueskyProvider } from "../lib/providers/index.js";
import { decodeJwtExpiry } from "../lib/utils/jwt.js";

const router = Router();

router.post("/sign-up", async (req, res) => {
	const { value: parsedBody, error } = AuthParser.signUpSchema.validate(
		req.body,
	);

	if (error) {
		return res.status(400).json({ error });
	}

	const hashedPassword = await argon2.hash(parsedBody.password);

	const user = await UserRepository.create(parsedBody.username, hashedPassword);

	const userProfileData = await extractProfileData(user, false);

	const token = signJwt(userProfileData);

	res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
	res.json({ user: userProfileData });
});

router.post("/sign-in", async (req, res) => {
	const { value: parsedBody, error } = AuthParser.signInSchema.validate(
		req.body,
	);

	const user = await UserRepository.getByUsername(parsedBody.username);

	if (!user) {
		return res.status(401).json({ error: "User not found" });
	}

	const valid = await argon2.verify(user.password_hash, parsedBody.password);

	// Best practice to not expose if user exists in DB, so sending same message
	if (!valid) {
		return res.status(401).json({ error: "User not found" });
	}

	const userProfileData = await extractProfileData(user);

	const token = signJwt(userProfileData);

	res.cookie("token", token, { httpOnly: true, sameSite: "lax" });
	res.json({ user: userProfileData });
});

router.get("/oauth/mastodon", authMiddleware, async (req, res) => {
	const integrations = await SettingsRepository.ensureIntegrations();
	if (!integrations.mastodonEnabled) {
		return res
			.status(400)
			.json({ error: "Mastodon integration is disabled" });
	}

	const state = mastodon.generateState();

	res.cookie("oauth_state", state, { httpOnly: true, sameSite: "lax" });
	res.cookie("user_id", req.user.id, { httpOnly: true, sameSite: "lax" });

	const scopes = ["read", "write"];
	const url = mastodon.createAuthorizationURL(state, scopes);

	return res.redirect(url);
});

router.get("/oauth/mastodon/callback", authMiddleware, async (req, res) => {
	const { code, state } = req.query;
	const storedState = req.cookies.oauth_state;
	const userId = req.cookies.user_id;

	const integrations = await SettingsRepository.ensureIntegrations();
	if (!integrations.mastodonEnabled) {
		return res.status(400).send("Mastodon integration is disabled");
	}

	if (!userId) return res.status(401).send("User session lost");
	if (!code || !state || state !== storedState)
		return res.status(400).send("Invalid state");

	try {
		const tokens = await mastodon.validateAuthorizationCode(code);
		const accessToken = tokens.accessToken();

		await UserRepository.addMastodonKey(userId, accessToken);

		res.clearCookie("oauth_state");
		res.clearCookie("user_id");

		return res.redirect(
			'http://localhost:5173?toastMessage="Successfully connected to Mastodon!"',
		);
	} catch (err) {
		console.error(err);
		return res
			.status(500)
			.redirect(
				'http://localhost:5173?toastMessage="Failed to connect to Mastodon"',
			);
	}
});

router.post("/mastodon/disconnect", authMiddleware, async (req, res) => {
	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	await UserRepository.removeMastodonKey(user.id);
	return res.status(200).json({ success: true });
});

router.post("/bluesky/connect", authMiddleware, async (req, res) => {
	const { value, error } = AuthParser.blueskyConnectSchema.validate(req.body);
	if (error) {
		return res.status(400).json({ error });
	}

	const integrations = await SettingsRepository.ensureIntegrations();
	if (!integrations.blueskyEnabled) {
		return res.status(400).json({ error: "Bluesky integration is disabled" });
	}

	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	try {
		const session = await blueskyProvider.createSession(
			value.handle,
			value.appPassword,
		);
		const expDate = decodeJwtExpiry(session.accessJwt);
		await UserRepository.addBlueskyKey(user.id, {
			did: session.did,
			handle: session.handle,
			accessJwt: session.accessJwt,
			refreshJwt: session.refreshJwt,
			expiresAt: expDate,
		});
		return res.status(200).json({ success: true });
	} catch (err) {
		console.error(err);
		return res.status(400).json({ error: "Failed to connect Bluesky" });
	}
});

router.post("/bluesky/disconnect", authMiddleware, async (req, res) => {
	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	await UserRepository.removeBlueskyKey(user.id);
	return res.status(200).json({ success: true });
});

router.get("/me", authMiddleware, async (req, res) => {
	const user = await UserRepository.getByUsername(req.user.username);

	if (!user) {
		return res.status(404).json({ error: "User not found" });
	}

	return res.status(200).json(await extractProfileData(user));
});

router.post("/logout", (req, res) => {
	res.clearCookie("token");
	return res.status(200).json({ message: "Logged out successfully" });
});

export default router;
