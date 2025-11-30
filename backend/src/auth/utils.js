import jwt from "jsonwebtoken";

const EXPIRES_IN = "1h";

export function signJwt(userProfileData) {
	return jwt.sign(userProfileData, process.env.JWT_SECRET, {
		expiresIn: EXPIRES_IN,
	});
}

export function authMiddleware(req, res, next) {
	const token = req.cookies["token"];
	if (!token) return res.status(401).send("Missing access token");

	try {
		req.user = jwt.verify(token, process.env.JWT_SECRET);
		next();
	} catch {
		res.status(401).send("Invalid token");
	}
}
