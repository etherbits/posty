import db from "../lib/db/index.js";

async function create(
	userId,
	content,
	scheduledTime,
	visibility,
	mediaIds,
	blueskyMedia,
	status,
	platforms,
) {
	const normalizedBlueskyMedia =
		blueskyMedia === undefined || blueskyMedia === null
			? null
			: JSON.stringify(blueskyMedia);
	const result = await db.query(
		"INSERT INTO posts(user_id, content, scheduled_time, visibility, media_ids, bluesky_media, status, platforms) VALUES($1, $2, $3, $4, $5, $6::jsonb, $7, $8) RETURNING *",
		[
			userId,
			content,
			scheduledTime,
			visibility,
			mediaIds,
			normalizedBlueskyMedia,
			status,
			platforms,
		],
	);

	const post = result.rows[0];

	return post;
}

async function getDue() {
	const posts = await db.query(
		"SELECT * FROM posts WHERE scheduled_time <= NOW() AND status = 'pending'",
	);

	return posts.rows;
}

async function updateDelivery(
	postId,
	{ mastodonId, mastodonUrl, blueskyUri, blueskyCid, blueskyUrl, status },
) {
	const fields = [];
	const values = [];
	let idx = 1;

	if (mastodonUrl !== undefined) {
		fields.push(`url = $${idx++}`);
		values.push(mastodonUrl);
	}
	if (mastodonId !== undefined) {
		fields.push(`mastodon_id = $${idx++}`);
		values.push(mastodonId);
	}
	if (blueskyUri !== undefined) {
		fields.push(`bluesky_uri = $${idx++}`);
		values.push(blueskyUri);
	}
	if (blueskyCid !== undefined) {
		fields.push(`bluesky_cid = $${idx++}`);
		values.push(blueskyCid);
	}
	if (blueskyUrl !== undefined) {
		fields.push(`bluesky_url = $${idx++}`);
		values.push(blueskyUrl);
	}
	if (status !== undefined) {
		fields.push(`status = $${idx++}`);
		values.push(status);
	}

	if (!fields.length) return;

	values.push(postId);
	await db.query(
		`UPDATE posts SET ${fields.join(", ")} WHERE id = $${idx}`,
		values,
	);
}

async function getOwnedPosts(userId) {
	const result = await db.query("SELECT * FROM posts WHERE user_id = $1", [
		userId,
	]);

	return result.rows;
}

async function getPosts() {
	const result = await db.query(
		"SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id",
	);

	return result.rows;
}

async function getOwnedPostsPaginated(userId, limit, offset) {
	const [postsResult, countResult] = await Promise.all([
		db.query(
			"SELECT * FROM posts WHERE user_id = $1 ORDER BY scheduled_time DESC LIMIT $2 OFFSET $3",
			[userId, limit, offset],
		),
		db.query("SELECT COUNT(*) FROM posts WHERE user_id = $1", [userId]),
	]);

	return {
		posts: postsResult.rows,
		total: parseInt(countResult.rows[0].count, 10),
	};
}

async function getPostsPaginated(limit, offset) {
	const [postsResult, countResult] = await Promise.all([
		db.query(
			"SELECT posts.*, users.username FROM posts JOIN users ON posts.user_id = users.id ORDER BY scheduled_time DESC LIMIT $1 OFFSET $2",
			[limit, offset],
		),
		db.query("SELECT COUNT(*) FROM posts"),
	]);

	return {
		posts: postsResult.rows,
		total: parseInt(countResult.rows[0].count, 10),
	};
}

async function getStats(userId = null) {
	const whereClause = userId ? "WHERE user_id = $1" : "";
	const params = userId ? [userId] : [];

	const result = await db.query(
		`SELECT
			COUNT(*) as total,
			COUNT(*) FILTER (WHERE status = 'sent') as sent,
			COUNT(*) FILTER (WHERE status = 'pending') as pending,
			COUNT(*) FILTER (WHERE status = 'canceled') as canceled
		FROM posts ${whereClause}`,
		params,
	);

	const row = result.rows[0];
	return {
		total: parseInt(row.total, 10),
		sent: parseInt(row.sent, 10),
		pending: parseInt(row.pending, 10),
		canceled: parseInt(row.canceled, 10),
	};
}

async function updateOwnPost(
	postId,
	content,
	scheduledTime,
	visibility,
	mediaIds,
	blueskyMedia,
	platforms,
	status,
	userId,
) {
	const normalizedBlueskyMedia =
		blueskyMedia === undefined || blueskyMedia === null
			? null
			: JSON.stringify(blueskyMedia);
	const result = await db.query(
		"UPDATE posts SET content = $1, scheduled_time = $2, visibility = $3, media_ids = $4, bluesky_media = COALESCE($5::jsonb, bluesky_media), platforms = COALESCE($6, platforms), status = COALESCE($7, status) WHERE id = $8 AND status != 'sent' AND user_id = $9 RETURNING *",
		[
			content,
			scheduledTime,
			visibility,
			mediaIds,
			normalizedBlueskyMedia,
			platforms,
			status,
			postId,
			userId,
		],
	);
	return result.rows[0];
}

async function updatePost(
	postId,
	content,
	scheduledTime,
	visibility,
	mediaIds,
	blueskyMedia,
	platforms,
	status,
) {
	const normalizedBlueskyMedia =
		blueskyMedia === undefined || blueskyMedia === null
			? null
			: JSON.stringify(blueskyMedia);
	const result = await db.query(
		"UPDATE posts SET content = $1, scheduled_time = $2, visibility = $3, media_ids = $4, bluesky_media = COALESCE($5::jsonb, bluesky_media), platforms = COALESCE($6, platforms), status = COALESCE($7, status) WHERE id = $8 AND status != 'sent' RETURNING *",
		[
			content,
			scheduledTime,
			visibility,
			mediaIds,
			normalizedBlueskyMedia,
			platforms,
			status,
			postId,
		],
	);
	return result.rows[0];
}

async function deleteOwnPost(postId, userId) {
	await db.query("DELETE FROM posts WHERE id = $1 AND user_id = $2", [
		postId,
		userId,
	]);
}

async function deletePost(postId) {
	await db.query("DELETE FROM posts WHERE id = $1", [postId]);
}

export default {
	create,
	getDue,
	updateDelivery,
	getOwnedPosts,
	getPosts,
	getOwnedPostsPaginated,
	getPostsPaginated,
	getStats,
	updateOwnPost,
	updatePost,
	deleteOwnPost,
	deletePost,
};
