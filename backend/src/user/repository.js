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

async function getById(userId) {
	const result = await db.query("SELECT * FROM users WHERE id = $1", [userId]);
	return result.rows[0];
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

	const key = result.rows[0]?.access_token;
	return key;
}

async function removeMastodonKey(userId) {
	await db.query("DELETE FROM mastodon_keys WHERE user_id = $1", [userId]);
}

async function addBlueskyKey(userId, { did, handle, accessJwt, refreshJwt, expiresAt }) {
	await db.query("DELETE FROM bluesky_keys WHERE user_id = $1", [userId]);
	await db.query(
		"INSERT INTO bluesky_keys(user_id, did, handle, access_jwt, refresh_jwt, expires_at) VALUES($1, $2, $3, $4, $5, $6)",
		[userId, did, handle, accessJwt, refreshJwt, expiresAt],
	);
}

async function updateBlueskyKey(userId, { accessJwt, refreshJwt, expiresAt }) {
	await db.query(
		"UPDATE bluesky_keys SET access_jwt = $1, refresh_jwt = $2, expires_at = $3, updated_at = NOW() WHERE user_id = $4",
		[accessJwt, refreshJwt, expiresAt, userId],
	);
}

async function getBlueskyKey(userId) {
	const result = await db.query(
		"SELECT did, handle, access_jwt, refresh_jwt, expires_at FROM bluesky_keys WHERE user_id = $1",
		[userId],
	);
	return result.rows[0];
}

async function removeBlueskyKey(userId) {
	await db.query("DELETE FROM bluesky_keys WHERE user_id = $1", [userId]);
}

async function hasBlueskyConnected(userId) {
	const result = await db.query(
		"SELECT 1 FROM bluesky_keys WHERE user_id = $1",
		[userId],
	);

	return result.rows.length > 0;
}

async function updateRole(userId, role) {
	const result = await db.query(
		"UPDATE users SET role = $1 WHERE id = $2 RETURNING *",
		[role, userId],
	);
	return result.rows[0];
}

async function deleteUser(userId) {
	await db.query("DELETE FROM users WHERE id = $1", [userId]);
}

async function hasMastodonConnected(userId) {
	const result = await db.query(
		"SELECT 1 FROM mastodon_keys WHERE user_id = $1",
		[userId],
	);

	return result.rows.length > 0;
}

async function ensureTargets(userId) {
	await db.query(
		"INSERT INTO user_targets(user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING",
		[userId],
	);
	const result = await db.query(
		"SELECT weekly_target, monthly_target FROM user_targets WHERE user_id = $1",
		[userId],
	);
	return result.rows[0];
}

async function upsertTargets(userId, weeklyTarget, monthlyTarget) {
	const result = await db.query(
		"INSERT INTO user_targets(user_id, weekly_target, monthly_target) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET weekly_target = EXCLUDED.weekly_target, monthly_target = EXCLUDED.monthly_target, updated_at = NOW() RETURNING weekly_target, monthly_target",
		[userId, weeklyTarget, monthlyTarget],
	);
	return result.rows[0];
}

async function getAllUsers() {
	const result = await db.query(
		`SELECT
			users.id,
			users.username,
			users.role,
			COUNT(posts.id) AS posts_count,
			EXISTS(
				SELECT 1 FROM mastodon_keys WHERE mastodon_keys.user_id = users.id
			) AS has_mastodon_connected
		FROM users
		LEFT JOIN posts ON posts.user_id = users.id
		GROUP BY users.id
		ORDER BY users.username ASC`,
	);
	return result.rows;
}

export default {
	create,
	getByUsername,
	getById,
	addMastodonKey,
	getMastodonKey,
	removeMastodonKey,
	addBlueskyKey,
	updateBlueskyKey,
	getBlueskyKey,
	removeBlueskyKey,
	hasMastodonConnected,
	hasBlueskyConnected,
	ensureTargets,
	upsertTargets,
	getAllUsers,
	updateRole,
	deleteUser,
};
