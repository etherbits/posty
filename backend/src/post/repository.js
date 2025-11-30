import db from "../lib/db/index.js";

async function create(userId, content, scheduledTime, visibility, mediaIds) {
	const result = await db.query(
		"INSERT INTO posts(user_id, content, scheduled_time, visibility, media_ids) VALUES($1, $2, $3, $4, $5) RETURNING *",
		[userId, content, scheduledTime, visibility, mediaIds],
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

async function updateAsSent(postId, mastodonId, url) {
	await db.query(
		"UPDATE posts SET status = 'sent', url = $1, mastodon_id = $2 WHERE id = $3",
		[url, mastodonId, postId],
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

async function updateOwnPost(
	postId,
	content,
	scheduledTime,
	visibility,
	mediaIds,
	status,
	userId,
) {
	const result = await db.query(
		"UPDATE posts SET content = $1, scheduled_time = $2, visibility = $3, media_ids = $4, status = COALESCE($5, status) WHERE id = $6 AND status != 'sent' AND user_id = $7 RETURNING *",
		[content, scheduledTime, visibility, mediaIds, status, postId, userId],
	);
	return result.rows[0];
}

async function updatePost(
	postId,
	content,
	scheduledTime,
	visibility,
	mediaIds,
	status,
) {
	const result = await db.query(
		"UPDATE posts SET content = $1, scheduled_time = $2, visibility = $3, media_ids = $4, status = COALESCE($5, status) WHERE id = $6 AND status != 'sent' RETURNING *",
		[content, scheduledTime, visibility, mediaIds, status, postId],
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
	updateAsSent,
	getOwnedPosts,
	getPosts,
	updateOwnPost,
	updatePost,
	deleteOwnPost,
	deletePost,
};
