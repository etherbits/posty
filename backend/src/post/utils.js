import PostRepository from "./repository.js";
import UserRepository from "../user/repository.js";

export async function sendDuePosts() {
	const duePosts = await PostRepository.getDue();
	let sentIdCount = 0;

	for (const duePost of duePosts) {
		const sentPost = await sendPost(
			duePost.user_id,
			duePost.content,
			duePost.visibility,
			duePost.media_ids,
		);

		if (sentPost !== null) {
			await PostRepository.updateAsSent(duePost.id, sentPost.id, sentPost.url);
			sentIdCount++;
		}
	}

	return sentIdCount;
}

export async function sendPost(userId, content, visibility, mediaIds) {
	const mastodonToken = await UserRepository.getMastodonKey(userId);

	if (!mastodonToken) {
		console.error("Mastodon account not connected");
		return null;
	}

	const postResponse = await fetch(
		`${process.env.MASTODON_BASE_URL}/api/v1/statuses`,
		{
			method: "POST",
			headers: {
				Authorization: `Bearer ${mastodonToken}`,
				"Content-Type": "application/json",
			},
			body: JSON.stringify({
				status: content,
				visibility: visibility,
				media_ids: mediaIds,
			}),
		},
	);

	if (!postResponse.ok) {
		const err = await postResponse.json();
		console.error(err ?? "Something went wrong");
		return null;
	}

	const post = await postResponse.json();

	return post;
}

export async function enrichPost(post) {
	const mastodonToken = await UserRepository.getMastodonKey(post.user_id);

	if (!mastodonToken) {
		console.error("Mastodon account not connected");
		return post;
	}

	const postResponse = await fetch(
		`${process.env.MASTODON_BASE_URL}/api/v1/statuses/${post.mastodon_id}`,
		{
			headers: {
				Authorization: `Bearer ${mastodonToken}`,
				"Content-Type": "application/json",
			},
		},
	);

	if (!postResponse.ok) {
		const err = await postResponse.json();
		console.error(err ?? "Something went wrong");
		return post;
	}

	const mastodonPost = await postResponse.json();

	return mergeWithMastodonPost(post, mastodonPost);
}

function mergeWithMastodonPost(post, mastodonPost) {
	return {
		...post,
		replies_count: mastodonPost.replies_count,
		favorites_count: mastodonPost.favourites_count,
		created_at: mastodonPost.created_at,
	};
}
