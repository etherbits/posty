import { Router } from "express";
import argon2 from "argon2";
import AuthParser from "./schemas.js";
import { signJwt } from "./utils.js";
import UserRepository from "../user/repository.js";
import { extractProfileData } from "../user/utils.js";

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

	const token = signJwt(user);

	res.cookie("token", token, { httpOnly: true });
	res.json({ user: extractProfileData(user) });
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

	const token = signJwt(user);

	res.cookie("token", token, { httpOnly: true });
	res.json({ user: extractProfileData(user) });
});

export default router;
