export function decodeJwtExpiry(token) {
	if (!token) return null;
	const payload = token.split(".")[1];
	if (!payload) return null;
	const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
	const padded = normalized.padEnd(
		normalized.length + ((4 - (normalized.length % 4)) % 4),
		"=",
	);
	try {
		const json = Buffer.from(padded, "base64").toString("utf8");
		const data = JSON.parse(json);
		if (!data.exp) return null;
		return new Date(data.exp * 1000);
	} catch {
		return null;
	}
}
