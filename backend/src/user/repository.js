import db from "../lib/db/index.js";

async function create(username, passwordHash) {
	const result = await db.query(
		"INSERT INTO users(username, password_hash) VALUES($1, $2) RETURNING *",
		[username, passwordHash],
	);

	const user = result.rows[0];
	return user;
}

async function getByUsername(username) {
	const result = await db.query("SELECT * FROM users WHERE username = $1", [
		username,
	]);

	const user = result.rows[0];
	return user;
}

async function addMastodonKey(userId, mastodonKey) {
	// First remove if any were added in the past
	await db.query("DELETE FROM mastodon_keys WHERE user_id = $1", [userId]);

	// Add the new key
	await db.query(
		"INSERT INTO mastodon_keys(user_id, access_token) VALUES($1, $2)",
		[userId, mastodonKey],
	);
}

async function getMastodonKey(userId) {
	const result = await db.query(
		"SELECT access_token FROM mastodon_keys WHERE user_id = $1",
		[userId],
	);

	const key = result.rows[0].access_token;
	return key;
}

export default {
	create,
	getByUsername,
	addMastodonKey,
	getMastodonKey,
};
