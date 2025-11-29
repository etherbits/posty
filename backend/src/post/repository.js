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

async function markAsSent(postIds) {
	await db.query("UPDATE posts SET status = 'sent' WHERE id = ANY($1)", [
		postIds,
	]);
}

export default {
	create,
	getDue,
	markAsSent,
};
