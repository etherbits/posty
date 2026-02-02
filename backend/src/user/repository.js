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

	const key = result.rows[0]?.access_token;
	return key;
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
	addMastodonKey,
	getMastodonKey,
	hasMastodonConnected,
	ensureTargets,
	upsertTargets,
	getAllUsers,
};
