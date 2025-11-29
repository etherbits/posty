import jwt from "jsonwebtoken";

const EXPIRES_IN = "1h";

export function signJwt(user) {
	return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
		expiresIn: EXPIRES_IN,
	});
}

export function authMiddleware(req, res, next) {
	const header = req.headers.authorization;
	if (!header) return res.status(401).send("Missing Authorization header");

	const token = header.replace("Bearer ", "");

	try {
		req.user = jwt.verify(token, process.env.JWT_SECRET);
		next();
	} catch {
		res.status(401).send("Invalid token");
	}
}
